/*! opstapp - v0.0.1 - 2013-05-30
* https://github.com/taenadar/opstapp
* Copyright (c) 2013 wooorm; Licensed MIT */
/*! Hammer.JS - v1.0.6dev - 2013-04-10
 * http://eightmedia.github.com/hammer.js
 *
 * Copyright (c) 2013 Jorik Tangelder <j.tangelder@gmail.com>;
 * Licensed under the MIT license */

(function(window, undefined) {
    'use strict';

/**
 * Hammer
 * use this to create instances
 * @param   {HTMLElement}   element
 * @param   {Object}        options
 * @returns {Hammer.Instance}
 * @constructor
 */
var Hammer = function(element, options) {
    return new Hammer.Instance(element, options || {});
};

// default settings
Hammer.defaults = {
    // add styles and attributes to the element to prevent the browser from doing
    // its native behavior. this doesnt prevent the scrolling, but cancels
    // the contextmenu, tap highlighting etc
    // set to false to disable this
    stop_browser_behavior: {
		// this also triggers onselectstart=false for IE
        userSelect: 'none',
		// this makes the element blocking in IE10 >, you could experiment with the value
		// see for more options this issue; https://github.com/EightMedia/hammer.js/issues/241
        touchAction: 'none',
		touchCallout: 'none',
        contentZooming: 'none',
        userDrag: 'none',
        tapHighlightColor: 'rgba(0,0,0,0)'
    }

    // more settings are defined per gesture at gestures.js
};

// detect touchevents
Hammer.HAS_POINTEREVENTS = navigator.pointerEnabled || navigator.msPointerEnabled;
Hammer.HAS_TOUCHEVENTS = ('ontouchstart' in window);

// dont use mouseevents on mobile devices
Hammer.MOBILE_REGEX = /mobile|tablet|ip(ad|hone|od)|android/i;
Hammer.NO_MOUSEEVENTS = Hammer.HAS_TOUCHEVENTS && navigator.userAgent.match(Hammer.MOBILE_REGEX);

// eventtypes per touchevent (start, move, end)
// are filled by Hammer.event.determineEventTypes on setup
Hammer.EVENT_TYPES = {};

// direction defines
Hammer.DIRECTION_DOWN = 'down';
Hammer.DIRECTION_LEFT = 'left';
Hammer.DIRECTION_UP = 'up';
Hammer.DIRECTION_RIGHT = 'right';

// pointer type
Hammer.POINTER_MOUSE = 'mouse';
Hammer.POINTER_TOUCH = 'touch';
Hammer.POINTER_PEN = 'pen';

// touch event defines
Hammer.EVENT_START = 'start';
Hammer.EVENT_MOVE = 'move';
Hammer.EVENT_END = 'end';

// hammer document where the base events are added at
Hammer.DOCUMENT = document;

// plugins namespace
Hammer.plugins = {};

// if the window events are set...
Hammer.READY = false;

/**
 * setup events to detect gestures on the document
 */
function setup() {
    if(Hammer.READY) {
        return;
    }

    // find what eventtypes we add listeners to
    Hammer.event.determineEventTypes();

    // Register all gestures inside Hammer.gestures
    for(var name in Hammer.gestures) {
        if(Hammer.gestures.hasOwnProperty(name)) {
            Hammer.detection.register(Hammer.gestures[name]);
        }
    }

    // Add touch events on the document
    Hammer.event.onTouch(Hammer.DOCUMENT, Hammer.EVENT_MOVE, Hammer.detection.detect);
    Hammer.event.onTouch(Hammer.DOCUMENT, Hammer.EVENT_END, Hammer.detection.detect);

    // Hammer is ready...!
    Hammer.READY = true;
}

/**
 * create new hammer instance
 * all methods should return the instance itself, so it is chainable.
 * @param   {HTMLElement}       element
 * @param   {Object}            [options={}]
 * @returns {Hammer.Instance}
 * @constructor
 */
Hammer.Instance = function(element, options) {
    var self = this;

    // setup HammerJS window events and register all gestures
    // this also sets up the default options
    setup();

    this.element = element;

    // start/stop detection option
    this.enabled = true;

    // merge options
    this.options = Hammer.utils.extend(
        Hammer.utils.extend({}, Hammer.defaults),
        options || {});

    // add some css to the element to prevent the browser from doing its native behavoir
    if(this.options.stop_browser_behavior) {
        Hammer.utils.stopDefaultBrowserBehavior(this.element, this.options.stop_browser_behavior);
    }

    // start detection on touchstart
    Hammer.event.onTouch(element, Hammer.EVENT_START, function(ev) {
        if(self.enabled) {
            Hammer.detection.startDetect(self, ev);
        }
    });

    // return instance
    return this;
};


Hammer.Instance.prototype = {
    /**
     * bind events to the instance
     * @param   {String}      gesture
     * @param   {Function}    handler
     * @returns {Hammer.Instance}
     */
    on: function onEvent(gesture, handler){
        var gestures = gesture.split(' ');
        for(var t=0; t<gestures.length; t++) {
            this.element.addEventListener(gestures[t], handler, false);
        }
        return this;
    },


    /**
     * unbind events to the instance
     * @param   {String}      gesture
     * @param   {Function}    handler
     * @returns {Hammer.Instance}
     */
    off: function offEvent(gesture, handler){
        var gestures = gesture.split(' ');
        for(var t=0; t<gestures.length; t++) {
            this.element.removeEventListener(gestures[t], handler, false);
        }
        return this;
    },


    /**
     * trigger gesture event
     * @param   {String}      gesture
     * @param   {Object}      eventData
     * @returns {Hammer.Instance}
     */
    trigger: function triggerEvent(gesture, eventData){
        // create DOM event
        var event = Hammer.DOCUMENT.createEvent('Event');
		event.initEvent(gesture, true, true);
		event.gesture = eventData;

        // trigger on the target if it is in the instance element,
        // this is for event delegation tricks
        var element = this.element;
        if(Hammer.utils.hasParent(eventData.target, element)) {
            element = eventData.target;
        }

        element.dispatchEvent(event);
        return this;
    },


    /**
     * enable of disable hammer.js detection
     * @param   {Boolean}   state
     * @returns {Hammer.Instance}
     */
    enable: function enable(state) {
        this.enabled = state;
        return this;
    }
};

/**
 * this holds the last move event,
 * used to fix empty touchend issue
 * see the onTouch event for an explanation
 * @type {Object}
 */
var last_move_event = null;


/**
 * when the mouse is hold down, this is true
 * @type {Boolean}
 */
var enable_detect = false;


/**
 * when touch events have been fired, this is true
 * @type {Boolean}
 */
var touch_triggered = false;


Hammer.event = {
    /**
     * simple addEventListener
     * @param   {HTMLElement}   element
     * @param   {String}        type
     * @param   {Function}      handler
     */
    bindDom: function(element, type, handler) {
        var types = type.split(' ');
        for(var t=0; t<types.length; t++) {
            element.addEventListener(types[t], handler, false);
        }
    },


    /**
     * touch events with mouse fallback
     * @param   {HTMLElement}   element
     * @param   {String}        eventType        like Hammer.EVENT_MOVE
     * @param   {Function}      handler
     */
    onTouch: function onTouch(element, eventType, handler) {
		var self = this;

        this.bindDom(element, Hammer.EVENT_TYPES[eventType], function bindDomOnTouch(ev) {
            var sourceEventType = ev.type.toLowerCase();

            // onmouseup, but when touchend has been fired we do nothing.
            // this is for touchdevices which also fire a mouseup on touchend
            if(sourceEventType.match(/mouse/) && touch_triggered) {
                return;
            }

            // mousebutton must be down or a touch event
            else if( sourceEventType.match(/touch/) ||   // touch events are always on screen
                sourceEventType.match(/pointerdown/) || // pointerevents touch
                (sourceEventType.match(/mouse/) && ev.which === 1)   // mouse is pressed
            ){
                enable_detect = true;
            }

            // mouse isn't pressed
            else if(sourceEventType.match(/mouse/) && ev.which !== 1) {
                enable_detect = false;
            }


            // we are in a touch event, set the touch triggered bool to true,
            // this for the conflicts that may occur on ios and android
            if(sourceEventType.match(/touch|pointer/)) {
                touch_triggered = true;
            }

            // count the total touches on the screen
            var count_touches = 0;

            // when touch has been triggered in this detection session
            // and we are now handling a mouse event, we stop that to prevent conflicts
            if(enable_detect) {
                // update pointerevent
                if(Hammer.HAS_POINTEREVENTS && eventType != Hammer.EVENT_END) {
                    count_touches = Hammer.PointerEvent.updatePointer(eventType, ev);
                }
                // touch
                else if(sourceEventType.match(/touch/)) {
                    count_touches = ev.touches.length;
                }
                // mouse
                else if(!touch_triggered) {
                    count_touches = sourceEventType.match(/up/) ? 0 : 1;
                }

                // if we are in a end event, but when we remove one touch and
                // we still have enough, set eventType to move
                if(count_touches > 0 && eventType == Hammer.EVENT_END) {
                    eventType = Hammer.EVENT_MOVE;
                }
                // no touches, force the end event
                else if(!count_touches) {
                    eventType = Hammer.EVENT_END;
                }

                // because touchend has no touches, and we often want to use these in our gestures,
                // we send the last move event as our eventData in touchend
                if(!count_touches && last_move_event !== null) {
                    ev = last_move_event;
                }
                // store the last move event
                else {
                    last_move_event = ev;
                }

                // trigger the handler
                handler.call(Hammer.detection, self.collectEventData(element, eventType, ev));

                // remove pointerevent from list
                if(Hammer.HAS_POINTEREVENTS && eventType == Hammer.EVENT_END) {
                    count_touches = Hammer.PointerEvent.updatePointer(eventType, ev);
                }
            }

            //debug(sourceEventType +" "+ eventType);

            // on the end we reset everything
            if(!count_touches) {
                last_move_event = null;
                enable_detect = false;
                touch_triggered = false;
                Hammer.PointerEvent.reset();
            }
        });
    },


    /**
     * we have different events for each device/browser
     * determine what we need and set them in the Hammer.EVENT_TYPES constant
     */
    determineEventTypes: function determineEventTypes() {
        // determine the eventtype we want to set
        var types;

        // pointerEvents magic
        if(Hammer.HAS_POINTEREVENTS) {
            types = Hammer.PointerEvent.getEvents();
        }
        // on Android, iOS, blackberry, windows mobile we dont want any mouseevents
        else if(Hammer.NO_MOUSEEVENTS) {
            types = [
                'touchstart',
                'touchmove',
                'touchend touchcancel'];
        }
        // for non pointer events browsers and mixed browsers,
        // like chrome on windows8 touch laptop
        else {
            types = [
                'touchstart mousedown',
                'touchmove mousemove',
                'touchend touchcancel mouseup'];
        }

        Hammer.EVENT_TYPES[Hammer.EVENT_START]  = types[0];
        Hammer.EVENT_TYPES[Hammer.EVENT_MOVE]   = types[1];
        Hammer.EVENT_TYPES[Hammer.EVENT_END]    = types[2];
    },


    /**
     * create touchlist depending on the event
     * @param   {Object}    ev
     * @param   {String}    eventType   used by the fakemultitouch plugin
     */
    getTouchList: function getTouchList(ev/*, eventType*/) {
        // get the fake pointerEvent touchlist
        if(Hammer.HAS_POINTEREVENTS) {
            return Hammer.PointerEvent.getTouchList();
        }
        // get the touchlist
        else if(ev.touches) {
            return ev.touches;
        }
        // make fake touchlist from mouse position
        else {
            return [{
                identifier: 1,
                pageX: ev.pageX,
                pageY: ev.pageY,
                target: ev.target
            }];
        }
    },


    /**
     * collect event data for Hammer js
     * @param   {HTMLElement}   element
     * @param   {String}        eventType        like Hammer.EVENT_MOVE
     * @param   {Object}        eventData
     */
    collectEventData: function collectEventData(element, eventType, ev) {
        var touches = this.getTouchList(ev, eventType);

        // find out pointerType
        var pointerType = Hammer.POINTER_TOUCH;
        if(ev.type.match(/mouse/) || Hammer.PointerEvent.matchType(Hammer.POINTER_MOUSE, ev)) {
            pointerType = Hammer.POINTER_MOUSE;
        }

        return {
            center      : Hammer.utils.getCenter(touches),
            timeStamp   : new Date().getTime(),
            target      : ev.target,
            touches     : touches,
            eventType   : eventType,
            pointerType : pointerType,
            srcEvent    : ev,

            /**
             * prevent the browser default actions
             * mostly used to disable scrolling of the browser
             */
            preventDefault: function() {
                if(this.srcEvent.preventManipulation) {
                    this.srcEvent.preventManipulation();
                }

                if(this.srcEvent.preventDefault) {
                    this.srcEvent.preventDefault();
                }
            },

            /**
             * stop bubbling the event up to its parents
             */
            stopPropagation: function() {
                this.srcEvent.stopPropagation();
            },

            /**
             * immediately stop gesture detection
             * might be useful after a swipe was detected
             * @return {*}
             */
            stopDetect: function() {
                return Hammer.detection.stopDetect();
            }
        };
    }
};

Hammer.PointerEvent = {
    /**
     * holds all pointers
     * @type {Object}
     */
    pointers: {},

    /**
     * get a list of pointers
     * @returns {Array}     touchlist
     */
    getTouchList: function() {
        var self = this;
        var touchlist = [];

        // we can use forEach since pointerEvents only is in IE10
        Object.keys(self.pointers).sort().forEach(function(id) {
            touchlist.push(self.pointers[id]);
        });
        return touchlist;
    },

    /**
     * update the position of a pointer
     * @param   {String}   type             Hammer.EVENT_END
     * @param   {Object}   pointerEvent
     */
    updatePointer: function(type, pointerEvent) {
        if(type == Hammer.EVENT_END) {
            this.pointers = {};
        }
        else {
            pointerEvent.identifier = pointerEvent.pointerId;
            this.pointers[pointerEvent.pointerId] = pointerEvent;
        }

        return Object.keys(this.pointers).length;
    },

    /**
     * check if ev matches pointertype
     * @param   {String}        pointerType     Hammer.POINTER_MOUSE
     * @param   {PointerEvent}  ev
     */
    matchType: function(pointerType, ev) {
        if(!ev.pointerType) {
            return false;
        }

        var types = {};
        types[Hammer.POINTER_MOUSE] = (ev.pointerType == ev.MSPOINTER_TYPE_MOUSE || ev.pointerType == Hammer.POINTER_MOUSE);
        types[Hammer.POINTER_TOUCH] = (ev.pointerType == ev.MSPOINTER_TYPE_TOUCH || ev.pointerType == Hammer.POINTER_TOUCH);
        types[Hammer.POINTER_PEN] = (ev.pointerType == ev.MSPOINTER_TYPE_PEN || ev.pointerType == Hammer.POINTER_PEN);
        return types[pointerType];
    },


    /**
     * get events
     */
    getEvents: function() {
        return [
            'pointerdown MSPointerDown',
            'pointermove MSPointerMove',
            'pointerup pointercancel MSPointerUp MSPointerCancel'
        ];
    },

    /**
     * reset the list
     */
    reset: function() {
        this.pointers = {};
    }
};


Hammer.utils = {
    /**
     * extend method,
     * also used for cloning when dest is an empty object
     * @param   {Object}    dest
     * @param   {Object}    src
	 * @parm	{Boolean}	merge		do a merge
     * @returns {Object}    dest
     */
    extend: function extend(dest, src, merge) {
        for (var key in src) {
			if(dest[key] !== undefined && merge) {
				continue;
			}
            dest[key] = src[key];
        }
        return dest;
    },


    /**
     * find if a node is in the given parent
     * used for event delegation tricks
     * @param   {HTMLElement}   node
     * @param   {HTMLElement}   parent
     * @returns {boolean}       has_parent
     */
    hasParent: function(node, parent) {
        while(node){
            if(node == parent) {
                return true;
            }
            node = node.parentNode;
        }
        return false;
    },


    /**
     * get the center of all the touches
     * @param   {Array}     touches
     * @returns {Object}    center
     */
    getCenter: function getCenter(touches) {
        var valuesX = [], valuesY = [];

        for(var t= 0,len=touches.length; t<len; t++) {
            valuesX.push(touches[t].pageX);
            valuesY.push(touches[t].pageY);
        }

        return {
            pageX: ((Math.min.apply(Math, valuesX) + Math.max.apply(Math, valuesX)) / 2),
            pageY: ((Math.min.apply(Math, valuesY) + Math.max.apply(Math, valuesY)) / 2)
        };
    },


    /**
     * calculate the velocity between two points
     * @param   {Number}    delta_time
     * @param   {Number}    delta_x
     * @param   {Number}    delta_y
     * @returns {Object}    velocity
     */
    getVelocity: function getVelocity(delta_time, delta_x, delta_y) {
        return {
            x: Math.abs(delta_x / delta_time) || 0,
            y: Math.abs(delta_y / delta_time) || 0
        };
    },


    /**
     * calculate the angle between two coordinates
     * @param   {Touch}     touch1
     * @param   {Touch}     touch2
     * @returns {Number}    angle
     */
    getAngle: function getAngle(touch1, touch2) {
        var y = touch2.pageY - touch1.pageY,
            x = touch2.pageX - touch1.pageX;
        return Math.atan2(y, x) * 180 / Math.PI;
    },


    /**
     * angle to direction define
     * @param   {Touch}     touch1
     * @param   {Touch}     touch2
     * @returns {String}    direction constant, like Hammer.DIRECTION_LEFT
     */
    getDirection: function getDirection(touch1, touch2) {
        var x = Math.abs(touch1.pageX - touch2.pageX),
            y = Math.abs(touch1.pageY - touch2.pageY);

        if(x >= y) {
            return touch1.pageX - touch2.pageX > 0 ? Hammer.DIRECTION_LEFT : Hammer.DIRECTION_RIGHT;
        }
        else {
            return touch1.pageY - touch2.pageY > 0 ? Hammer.DIRECTION_UP : Hammer.DIRECTION_DOWN;
        }
    },


    /**
     * calculate the distance between two touches
     * @param   {Touch}     touch1
     * @param   {Touch}     touch2
     * @returns {Number}    distance
     */
    getDistance: function getDistance(touch1, touch2) {
        var x = touch2.pageX - touch1.pageX,
            y = touch2.pageY - touch1.pageY;
        return Math.sqrt((x*x) + (y*y));
    },


    /**
     * calculate the scale factor between two touchLists (fingers)
     * no scale is 1, and goes down to 0 when pinched together, and bigger when pinched out
     * @param   {Array}     start
     * @param   {Array}     end
     * @returns {Number}    scale
     */
    getScale: function getScale(start, end) {
        // need two fingers...
        if(start.length >= 2 && end.length >= 2) {
            return this.getDistance(end[0], end[1]) /
                this.getDistance(start[0], start[1]);
        }
        return 1;
    },


    /**
     * calculate the rotation degrees between two touchLists (fingers)
     * @param   {Array}     start
     * @param   {Array}     end
     * @returns {Number}    rotation
     */
    getRotation: function getRotation(start, end) {
        // need two fingers
        if(start.length >= 2 && end.length >= 2) {
            return this.getAngle(end[1], end[0]) -
                this.getAngle(start[1], start[0]);
        }
        return 0;
    },


    /**
     * boolean if the direction is vertical
     * @param    {String}    direction
     * @returns  {Boolean}   is_vertical
     */
    isVertical: function isVertical(direction) {
        return (direction == Hammer.DIRECTION_UP || direction == Hammer.DIRECTION_DOWN);
    },


    /**
     * stop browser default behavior with css props
     * @param   {HtmlElement}   element
     * @param   {Object}        css_props
     */
    stopDefaultBrowserBehavior: function stopDefaultBrowserBehavior(element, css_props) {
        var prop,
            vendors = ['webkit','khtml','moz','ms','o',''];

        if(!css_props || !element.style) {
            return;
        }

        // with css properties for modern browsers
        for(var i = 0; i < vendors.length; i++) {
            for(var p in css_props) {
                if(css_props.hasOwnProperty(p)) {
                    prop = p;

                    // vender prefix at the property
                    if(vendors[i]) {
                        prop = vendors[i] + prop.substring(0, 1).toUpperCase() + prop.substring(1);
                    }

                    // set the style
                    element.style[prop] = css_props[p];
                }
            }
        }

        // also the disable onselectstart
        if(css_props.userSelect == 'none') {
            element.onselectstart = function() {
                return false;
            };
        }
    }
};

Hammer.detection = {
    // contains all registred Hammer.gestures in the correct order
    gestures: [],

    // data of the current Hammer.gesture detection session
    current: null,

    // the previous Hammer.gesture session data
    // is a full clone of the previous gesture.current object
    previous: null,

    // when this becomes true, no gestures are fired
    stopped: false,


    /**
     * start Hammer.gesture detection
     * @param   {Hammer.Instance}   inst
     * @param   {Object}            eventData
     */
    startDetect: function startDetect(inst, eventData) {
        // already busy with a Hammer.gesture detection on an element
        if(this.current) {
            return;
        }

        this.stopped = false;

        this.current = {
            inst        : inst, // reference to HammerInstance we're working for
            startEvent  : Hammer.utils.extend({}, eventData), // start eventData for distances, timing etc
            lastEvent   : false, // last eventData
            name        : '' // current gesture we're in/detected, can be 'tap', 'hold' etc
        };

        this.detect(eventData);
    },


    /**
     * Hammer.gesture detection
     * @param   {Object}    eventData
     * @param   {Object}    eventData
     */
    detect: function detect(eventData) {
        if(!this.current || this.stopped) {
            return;
        }

        // extend event data with calculations about scale, distance etc
        eventData = this.extendEventData(eventData);

        // instance options
        var inst_options = this.current.inst.options;

        // call Hammer.gesture handlers
        for(var g=0,len=this.gestures.length; g<len; g++) {
            var gesture = this.gestures[g];

            // only when the instance options have enabled this gesture
            if(!this.stopped && inst_options[gesture.name] !== false) {
                // if a handler returns false, we stop with the detection
                if(gesture.handler.call(gesture, eventData, this.current.inst) === false) {
                    this.stopDetect();
                    break;
                }
            }
        }

        // store as previous event event
        if(this.current) {
            this.current.lastEvent = eventData;
        }

        // endevent, but not the last touch, so dont stop
        if(eventData.eventType == Hammer.EVENT_END && !eventData.touches.length-1) {
            this.stopDetect();
        }

        return eventData;
    },


    /**
     * clear the Hammer.gesture vars
     * this is called on endDetect, but can also be used when a final Hammer.gesture has been detected
     * to stop other Hammer.gestures from being fired
     */
    stopDetect: function stopDetect() {
        // clone current data to the store as the previous gesture
        // used for the double tap gesture, since this is an other gesture detect session
        this.previous = Hammer.utils.extend({}, this.current);

        // reset the current
        this.current = null;

        // stopped!
        this.stopped = true;
    },


    /**
     * extend eventData for Hammer.gestures
     * @param   {Object}   ev
     * @returns {Object}   ev
     */
    extendEventData: function extendEventData(ev) {
        var startEv = this.current.startEvent;

        // if the touches change, set the new touches over the startEvent touches
        // this because touchevents don't have all the touches on touchstart, or the
        // user must place his fingers at the EXACT same time on the screen, which is not realistic
        // but, sometimes it happens that both fingers are touching at the EXACT same time
        if(startEv && (ev.touches.length != startEv.touches.length || ev.touches === startEv.touches)) {
            // extend 1 level deep to get the touchlist with the touch objects
            startEv.touches = [];
            for(var i=0,len=ev.touches.length; i<len; i++) {
                startEv.touches.push(Hammer.utils.extend({}, ev.touches[i]));
            }
        }

        var delta_time = ev.timeStamp - startEv.timeStamp,
            delta_x = ev.center.pageX - startEv.center.pageX,
            delta_y = ev.center.pageY - startEv.center.pageY,
            velocity = Hammer.utils.getVelocity(delta_time, delta_x, delta_y);

        Hammer.utils.extend(ev, {
            deltaTime   : delta_time,

            deltaX      : delta_x,
            deltaY      : delta_y,

            velocityX   : velocity.x,
            velocityY   : velocity.y,

            distance    : Hammer.utils.getDistance(startEv.center, ev.center),
            angle       : Hammer.utils.getAngle(startEv.center, ev.center),
            direction   : Hammer.utils.getDirection(startEv.center, ev.center),

            scale       : Hammer.utils.getScale(startEv.touches, ev.touches),
            rotation    : Hammer.utils.getRotation(startEv.touches, ev.touches),

            startEvent  : startEv
        });

        return ev;
    },


    /**
     * register new gesture
     * @param   {Object}    gesture object, see gestures.js for documentation
     * @returns {Array}     gestures
     */
    register: function register(gesture) {
        // add an enable gesture options if there is no given
        var options = gesture.defaults || {};
        if(options[gesture.name] === undefined) {
            options[gesture.name] = true;
        }

        // extend Hammer default options with the Hammer.gesture options
        Hammer.utils.extend(Hammer.defaults, options, true);

        // set its index
        gesture.index = gesture.index || 1000;

        // add Hammer.gesture to the list
        this.gestures.push(gesture);

        // sort the list by index
        this.gestures.sort(function(a, b) {
            if (a.index < b.index) {
                return -1;
            }
            if (a.index > b.index) {
                return 1;
            }
            return 0;
        });

        return this.gestures;
    }
};


Hammer.gestures = Hammer.gestures || {};

/**
 * Custom gestures
 * ==============================
 *
 * Gesture object
 * --------------------
 * The object structure of a gesture:
 *
 * { name: 'mygesture',
 *   index: 1337,
 *   defaults: {
 *     mygesture_option: true
 *   }
 *   handler: function(type, ev, inst) {
 *     // trigger gesture event
 *     inst.trigger(this.name, ev);
 *   }
 * }

 * @param   {String}    name
 * this should be the name of the gesture, lowercase
 * it is also being used to disable/enable the gesture per instance config.
 *
 * @param   {Number}    [index=1000]
 * the index of the gesture, where it is going to be in the stack of gestures detection
 * like when you build an gesture that depends on the drag gesture, it is a good
 * idea to place it after the index of the drag gesture.
 *
 * @param   {Object}    [defaults={}]
 * the default settings of the gesture. these are added to the instance settings,
 * and can be overruled per instance. you can also add the name of the gesture,
 * but this is also added by default (and set to true).
 *
 * @param   {Function}  handler
 * this handles the gesture detection of your custom gesture and receives the
 * following arguments:
 *
 *      @param  {Object}    eventData
 *      event data containing the following properties:
 *          timeStamp   {Number}        time the event occurred
 *          target      {HTMLElement}   target element
 *          touches     {Array}         touches (fingers, pointers, mouse) on the screen
 *          pointerType {String}        kind of pointer that was used. matches Hammer.POINTER_MOUSE|TOUCH
 *          center      {Object}        center position of the touches. contains pageX and pageY
 *          deltaTime   {Number}        the total time of the touches in the screen
 *          deltaX      {Number}        the delta on x axis we haved moved
 *          deltaY      {Number}        the delta on y axis we haved moved
 *          velocityX   {Number}        the velocity on the x
 *          velocityY   {Number}        the velocity on y
 *          angle       {Number}        the angle we are moving
 *          direction   {String}        the direction we are moving. matches Hammer.DIRECTION_UP|DOWN|LEFT|RIGHT
 *          distance    {Number}        the distance we haved moved
 *          scale       {Number}        scaling of the touches, needs 2 touches
 *          rotation    {Number}        rotation of the touches, needs 2 touches *
 *          eventType   {String}        matches Hammer.EVENT_START|MOVE|END
 *          srcEvent    {Object}        the source event, like TouchStart or MouseDown *
 *          startEvent  {Object}        contains the same properties as above,
 *                                      but from the first touch. this is used to calculate
 *                                      distances, deltaTime, scaling etc
 *
 *      @param  {Hammer.Instance}    inst
 *      the instance we are doing the detection for. you can get the options from
 *      the inst.options object and trigger the gesture event by calling inst.trigger
 *
 *
 * Handle gestures
 * --------------------
 * inside the handler you can get/set Hammer.detection.current. This is the current
 * detection session. It has the following properties
 *      @param  {String}    name
 *      contains the name of the gesture we have detected. it has not a real function,
 *      only to check in other gestures if something is detected.
 *      like in the drag gesture we set it to 'drag' and in the swipe gesture we can
 *      check if the current gesture is 'drag' by accessing Hammer.detection.current.name
 *
 *      @readonly
 *      @param  {Hammer.Instance}    inst
 *      the instance we do the detection for
 *
 *      @readonly
 *      @param  {Object}    startEvent
 *      contains the properties of the first gesture detection in this session.
 *      Used for calculations about timing, distance, etc.
 *
 *      @readonly
 *      @param  {Object}    lastEvent
 *      contains all the properties of the last gesture detect in this session.
 *
 * after the gesture detection session has been completed (user has released the screen)
 * the Hammer.detection.current object is copied into Hammer.detection.previous,
 * this is usefull for gestures like doubletap, where you need to know if the
 * previous gesture was a tap
 *
 * options that have been set by the instance can be received by calling inst.options
 *
 * You can trigger a gesture event by calling inst.trigger("mygesture", event).
 * The first param is the name of your gesture, the second the event argument
 *
 *
 * Register gestures
 * --------------------
 * When an gesture is added to the Hammer.gestures object, it is auto registered
 * at the setup of the first Hammer instance. You can also call Hammer.detection.register
 * manually and pass your gesture object as a param
 *
 */

/**
 * Hold
 * Touch stays at the same place for x time
 * @events  hold
 */
Hammer.gestures.Hold = {
    name: 'hold',
    index: 10,
    defaults: {
        hold_timeout	: 500,
        hold_threshold	: 1
    },
    timer: null,
    handler: function holdGesture(ev, inst) {
        switch(ev.eventType) {
            case Hammer.EVENT_START:
                // clear any running timers
                clearTimeout(this.timer);

                // set the gesture so we can check in the timeout if it still is
                Hammer.detection.current.name = this.name;

                // set timer and if after the timeout it still is hold,
                // we trigger the hold event
                this.timer = setTimeout(function() {
                    if(Hammer.detection.current.name == 'hold') {
                        inst.trigger('hold', ev);
                    }
                }, inst.options.hold_timeout);
                break;

            // when you move or end we clear the timer
            case Hammer.EVENT_MOVE:
                if(ev.distance > inst.options.hold_threshold) {
                    clearTimeout(this.timer);
                }
                break;

            case Hammer.EVENT_END:
                clearTimeout(this.timer);
                break;
        }
    }
};


/**
 * Tap/DoubleTap
 * Quick touch at a place or double at the same place
 * @events  tap, doubletap
 */
Hammer.gestures.Tap = {
    name: 'tap',
    index: 100,
    defaults: {
        tap_max_touchtime	: 250,
        tap_max_distance	: 10,
		tap_always			: true,
        doubletap_distance	: 20,
        doubletap_interval	: 300
    },
    handler: function tapGesture(ev, inst) {
        if(ev.eventType == Hammer.EVENT_END) {
            // previous gesture, for the double tap since these are two different gesture detections
            var prev = Hammer.detection.previous,
				did_doubletap = false;

            // when the touchtime is higher then the max touch time
            // or when the moving distance is too much
            if(ev.deltaTime > inst.options.tap_max_touchtime ||
                ev.distance > inst.options.tap_max_distance) {
                return;
            }

            // check if double tap
            if(prev && prev.name == 'tap' &&
                (ev.timeStamp - prev.lastEvent.timeStamp) < inst.options.doubletap_interval &&
                ev.distance < inst.options.doubletap_distance) {
				inst.trigger('doubletap', ev);
				did_doubletap = true;
            }

			// do a single tap
			if(!did_doubletap || inst.options.tap_always) {
				Hammer.detection.current.name = 'tap';
				inst.trigger(Hammer.detection.current.name, ev);
			}
        }
    }
};


/**
 * Swipe
 * triggers swipe events when the end velocity is above the threshold
 * @events  swipe, swipeleft, swiperight, swipeup, swipedown
 */
Hammer.gestures.Swipe = {
    name: 'swipe',
    index: 40,
    defaults: {
        // set 0 for unlimited, but this can conflict with transform
        swipe_max_touches  : 1,
        swipe_velocity     : 0.7
    },
    handler: function swipeGesture(ev, inst) {
        if(ev.eventType == Hammer.EVENT_END) {
            // max touches
            if(inst.options.swipe_max_touches > 0 &&
                ev.touches.length > inst.options.swipe_max_touches) {
                return;
            }

            // when the distance we moved is too small we skip this gesture
            // or we can be already in dragging
            if(ev.velocityX > inst.options.swipe_velocity ||
                ev.velocityY > inst.options.swipe_velocity) {
                // trigger swipe events
                inst.trigger(this.name, ev);
                inst.trigger(this.name + ev.direction, ev);
            }
        }
    }
};


/**
 * Drag
 * Move with x fingers (default 1) around on the page. Blocking the scrolling when
 * moving left and right is a good practice. When all the drag events are blocking
 * you disable scrolling on that area.
 * @events  drag, drapleft, dragright, dragup, dragdown
 */
Hammer.gestures.Drag = {
    name: 'drag',
    index: 50,
    defaults: {
        drag_min_distance : 10,
        // set 0 for unlimited, but this can conflict with transform
        drag_max_touches  : 1,
        // prevent default browser behavior when dragging occurs
        // be careful with it, it makes the element a blocking element
        // when you are using the drag gesture, it is a good practice to set this true
        drag_block_horizontal   : false,
        drag_block_vertical     : false,
        // drag_lock_to_axis keeps the drag gesture on the axis that it started on,
        // It disallows vertical directions if the initial direction was horizontal, and vice versa.
        drag_lock_to_axis       : false,
        // drag lock only kicks in when distance > drag_lock_min_distance
        // This way, locking occurs only when the distance has become large enough to reliably determine the direction
        drag_lock_min_distance : 25
    },
    triggered: false,
    handler: function dragGesture(ev, inst) {
        // current gesture isnt drag, but dragged is true
        // this means an other gesture is busy. now call dragend
        if(Hammer.detection.current.name != this.name && this.triggered) {
            inst.trigger(this.name +'end', ev);
            this.triggered = false;
            return;
        }

        // max touches
        if(inst.options.drag_max_touches > 0 &&
            ev.touches.length > inst.options.drag_max_touches) {
            return;
        }

        switch(ev.eventType) {
            case Hammer.EVENT_START:
                this.triggered = false;
                break;

            case Hammer.EVENT_MOVE:
                // when the distance we moved is too small we skip this gesture
                // or we can be already in dragging
                if(ev.distance < inst.options.drag_min_distance &&
                    Hammer.detection.current.name != this.name) {
                    return;
                }

                // we are dragging!
                Hammer.detection.current.name = this.name;

                // lock drag to axis?
                if(Hammer.detection.current.lastEvent.drag_locked_to_axis || (inst.options.drag_lock_to_axis && inst.options.drag_lock_min_distance<=ev.distance)) {
                    ev.drag_locked_to_axis = true;
                }
                var last_direction = Hammer.detection.current.lastEvent.direction;
                if(ev.drag_locked_to_axis && last_direction !== ev.direction) {
                    // keep direction on the axis that the drag gesture started on
                    if(Hammer.utils.isVertical(last_direction)) {
                        ev.direction = (ev.deltaY < 0) ? Hammer.DIRECTION_UP : Hammer.DIRECTION_DOWN;
                    }
                    else {
                        ev.direction = (ev.deltaX < 0) ? Hammer.DIRECTION_LEFT : Hammer.DIRECTION_RIGHT;
                    }
                }

                // first time, trigger dragstart event
                if(!this.triggered) {
                    inst.trigger(this.name +'start', ev);
                    this.triggered = true;
                }

                // trigger normal event
                inst.trigger(this.name, ev);

                // direction event, like dragdown
                inst.trigger(this.name + ev.direction, ev);

                // block the browser events
                if( (inst.options.drag_block_vertical && Hammer.utils.isVertical(ev.direction)) ||
                    (inst.options.drag_block_horizontal && !Hammer.utils.isVertical(ev.direction))) {
                    ev.preventDefault();
                }
                break;

            case Hammer.EVENT_END:
                // trigger dragend
                if(this.triggered) {
                    inst.trigger(this.name +'end', ev);
                }

                this.triggered = false;
                break;
        }
    }
};


/**
 * Transform
 * User want to scale or rotate with 2 fingers
 * @events  transform, pinch, pinchin, pinchout, rotate
 */
Hammer.gestures.Transform = {
    name: 'transform',
    index: 45,
    defaults: {
        // factor, no scale is 1, zoomin is to 0 and zoomout until higher then 1
        transform_min_scale     : 0.01,
        // rotation in degrees
        transform_min_rotation  : 1,
        // prevent default browser behavior when two touches are on the screen
        // but it makes the element a blocking element
        // when you are using the transform gesture, it is a good practice to set this true
        transform_always_block  : false
    },
    triggered: false,
    handler: function transformGesture(ev, inst) {
        // current gesture isnt drag, but dragged is true
        // this means an other gesture is busy. now call dragend
        if(Hammer.detection.current.name != this.name && this.triggered) {
            inst.trigger(this.name +'end', ev);
            this.triggered = false;
            return;
        }

        // atleast multitouch
        if(ev.touches.length < 2) {
            return;
        }

        // prevent default when two fingers are on the screen
        if(inst.options.transform_always_block) {
            ev.preventDefault();
        }

        switch(ev.eventType) {
            case Hammer.EVENT_START:
                this.triggered = false;
                break;

            case Hammer.EVENT_MOVE:
                var scale_threshold = Math.abs(1-ev.scale);
                var rotation_threshold = Math.abs(ev.rotation);

                // when the distance we moved is too small we skip this gesture
                // or we can be already in dragging
                if(scale_threshold < inst.options.transform_min_scale &&
                    rotation_threshold < inst.options.transform_min_rotation) {
                    return;
                }

                // we are transforming!
                Hammer.detection.current.name = this.name;

                // first time, trigger dragstart event
                if(!this.triggered) {
                    inst.trigger(this.name +'start', ev);
                    this.triggered = true;
                }

                inst.trigger(this.name, ev); // basic transform event

                // trigger rotate event
                if(rotation_threshold > inst.options.transform_min_rotation) {
                    inst.trigger('rotate', ev);
                }

                // trigger pinch event
                if(scale_threshold > inst.options.transform_min_scale) {
                    inst.trigger('pinch', ev);
                    inst.trigger('pinch'+ ((ev.scale < 1) ? 'in' : 'out'), ev);
                }
                break;

            case Hammer.EVENT_END:
                // trigger dragend
                if(this.triggered) {
                    inst.trigger(this.name +'end', ev);
                }

                this.triggered = false;
                break;
        }
    }
};


/**
 * Touch
 * Called as first, tells the user has touched the screen
 * @events  touch
 */
Hammer.gestures.Touch = {
    name: 'touch',
    index: -Infinity,
    defaults: {
        // call preventDefault at touchstart, and makes the element blocking by
        // disabling the scrolling of the page, but it improves gestures like
        // transforming and dragging.
        // be careful with using this, it can be very annoying for users to be stuck
        // on the page
        prevent_default: false,

        // disable mouse events, so only touch (or pen!) input triggers events
        prevent_mouseevents: false
    },
    handler: function touchGesture(ev, inst) {
        if(inst.options.prevent_mouseevents && ev.pointerType == Hammer.POINTER_MOUSE) {
            ev.stopDetect();
            return;
        }

        if(inst.options.prevent_default) {
            ev.preventDefault();
        }

        if(ev.eventType ==  Hammer.EVENT_START) {
            inst.trigger(this.name, ev);
        }
    }
};


/**
 * Release
 * Called as last, tells the user has released the screen
 * @events  release
 */
Hammer.gestures.Release = {
    name: 'release',
    index: Infinity,
    handler: function releaseGesture(ev, inst) {
        if(ev.eventType ==  Hammer.EVENT_END) {
            inst.trigger(this.name, ev);
        }
    }
};

// node export
if(typeof module === 'object' && typeof module.exports === 'object'){
    module.exports = Hammer;
}
// just window export
else {
    window.Hammer = Hammer;

    // requireJS module definition
    if(typeof window.define === 'function' && window.define.amd) {
        window.define('hammer', [], function() {
            return Hammer;
        });
    }
}
})(this);
eval(function(p,a,c,k,e,r){e=function(c){return(c<a?'':e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};if(!''.replace(/^/,String)){while(c--)r[e(c)]=k[c]||e(c);k=[function(e){return r[e]}];e=function(){return'\\w+'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c]);return p}('l s(){3.R=1b}s.n.J=l(a,c){3.m=A;3.o=[];3.u=[];3.D=[];3.B=[];5 b=A;9(a 1g O){b=a}v 9(a 1g H.E.1o){9(a.X){b=C O(a.X().1n());7(5 i=0;i<b.r;i++){b[i]=a.X().1v(i)}}v{b=C O(a.1u());7(5 j=0;j<b.r;j++){b[j]=a.1t(j)}}}3.1j(b,c);3.1i(b);3.1h();t(3.D.r<=3.B.r?3.D:3.B)};s.n.1j=l(c,d){5 a=C H.E.1c();7(5 i=0;i<c.r;i++){a.N(c[i])}5 b=a.1r();3.o.I(b.8());3.o.I(b.F(0,d).8());7(i=2;3.o[i-2]<a.w().8();i++){3.o.I(b.F(0,d*i).8())}7(i=1;3.o[1]>a.G().8();i++){3.o.17(b.F(W,d*i).8())}3.u.I(b.k());3.u.I(b.F(16,d).k());7(i=2;3.u[i-2]<a.w().k();i++){3.u.I(b.F(16,d*i).k())}7(i=1;3.u[1]>a.G().k();i++){3.u.17(b.F(1m,d*i).k())}3.m=C O(3.u.r);7(i=0;i<3.m.r;i++){3.m[i]=C O(3.o.r)}};s.n.1i=l(c){5 b=3.15(c[0]);3.M(b);7(5 i=1;i<c.r;i++){5 a=3.S(c[i],c[i-1],b);9(a[0]===b[0]&&a[1]===b[1]){1l}v 9((6.L(b[0]-a[0])===1&&b[1]===a[1])||(b[0]===a[0]&&6.L(b[1]-a[1])===1)){3.M(a)}v{3.14(c[i-1],c[i],b,a)}b=a}};s.n.15=l(a){7(5 x=0;3.u[x]<a.k();x++){}7(5 y=0;3.o[y]<a.8();y++){}t([x-1,y-1])};s.n.S=l(a,c,b){5 x,y;9(a.k()>c.k()){7(x=b[0];3.u[x+1]<a.k();x++){}}v{7(x=b[0];3.u[x]>a.k();x--){}}9(a.8()>c.8()){7(y=b[1];3.o[y+1]<a.8();y++){}}v{7(y=b[1];3.o[y]>a.8();y--){}}t([x,y])};s.n.14=l(a,h,c,e){5 f,K,i;5 g=a.1k(h);5 b=a;5 d=c;9(h.8()>a.8()){7(i=c[1]+1;i<=e[1];i++){f=3.13(a,g,3.o[i]);K=3.S(f,b,d);3.Q(d[0],K[0],i-1);b=f;d=K}3.Q(d[0],e[0],i-1)}v{7(i=c[1];i>e[1];i--){f=3.13(a,g,3.o[i]);K=3.S(f,b,d);3.Q(d[0],K[0],i);b=f;d=K}3.Q(d[0],e[0],i)}};s.n.13=l(a,c,b){5 d=3.R*((b.z()-a.8().z())/6.12(c.z()));t a.F(c,d)};s.n.Q=l(b,a,y){5 x;9(b<a){7(x=b;x<=a;x++){3.M([x,y])}}v{7(x=b;x>=a;x--){3.M([x,y])}}};s.n.M=l(a){5 x=a[0];5 y=a[1];3.m[x-1][y-1]=1;3.m[x][y-1]=1;3.m[x+1][y-1]=1;3.m[x-1][y]=1;3.m[x][y]=1;3.m[x+1][y]=1;3.m[x-1][y+1]=1;3.m[x][y+1]=1;3.m[x+1][y+1]=1};s.n.1h=l(){5 x,y,J;5 a=A;7(y=0;y<3.m[0].r;y++){7(x=0;x<3.m.r;x++){9(3.m[x][y]){J=3.V([x,y]);9(a){a.N(J.w())}v{a=J}}v{3.11(a);a=A}}3.11(a);a=A}7(x=0;x<3.m.r;x++){7(y=0;y<3.m[0].r;y++){9(3.m[x][y]){9(a){J=3.V([x,y]);a.N(J.w())}v{a=3.V([x,y])}}v{3.Z(a);a=A}}3.Z(a);a=A}};s.n.Z=l(a){9(a!==A){7(5 i=0;i<3.D.r;i++){9(3.D[i].w().k()===a.G().k()&&3.D[i].G().8()===a.G().8()&&3.D[i].w().8()===a.w().8()){3.D[i].N(a.w());t}}3.D.I(a)}};s.n.11=l(a){9(a!==A){7(5 i=0;i<3.B.r;i++){9(3.B[i].w().8()===a.G().8()&&3.B[i].G().k()===a.G().k()&&3.B[i].w().k()===a.w().k()){3.B[i].N(a.w());t}}3.B.I(a)}};s.n.V=l(a){t C H.E.1c(C H.E.P(3.o[a[1]],3.u[a[0]]),C H.E.P(3.o[a[1]+1],3.u[a[0]+1]))};H.E.P.n.F=l(f,a){5 R=1b;5 d=1s(a)/R;5 g=3.8().z(),1f=3.k().z();f=f.z();5 h=g+d*6.12(f);5 b=h-g;5 c=6.1d(6.U(h/2+6.p/4)/6.U(g/2+6.p/4));5 q=(6.L(b)>1e-10)?b/c:6.12(g);5 i=d*6.1q(f)/q;9(6.L(h)>6.p/2){h=h>0?6.p-h:-(6.p-h)}5 e=(1f+i+6.p)%(2*6.p)-6.p;9(1a(h)||1a(e)){t A}t C H.E.P(h.T(),e.T())};H.E.P.n.1k=l(a){5 b=(a.k()-3.k()).z();5 c=6.1d(6.U(a.8().z()/2+6.p/4)/6.U(3.8().z()/2+6.p/4));9(6.L(b)>6.p){b=b>0?-(2*6.p-b):(2*6.p+b)}t 6.1p(b,c).19()};Y.n.z=l(){t 3*6.p/W};Y.n.T=l(){t 3*W/6.p};Y.n.19=l(){t(3.T()+18)%18};',62,94,'|||this||var|Math|for|lat|if|||||||||||lng|function|grid_|prototype|latGrid_|PI||length|RouteBoxer|return|lngGrid_|else|getNorthEast|||toRad|null|boxesY_|new|boxesX_|maps|rhumbDestinationPoint|getSouthWest|google|push|box|edgeXY|abs|markCell_|extend|Array|LatLng|fillInGridSquares_||getGridCoordsFromHint_|toDeg|tan|getCellBounds_|180|getPath|Number|mergeBoxesX_||mergeBoxesY_|cos|getGridIntersect_|getGridIntersects_|getCellCoords_|90|unshift|360|toBrng|isNaN|6371|LatLngBounds|log||lon1|instanceof|mergeIntersectingCells_|findIntersectingCells_|buildGrid_|rhumbBearingTo|continue|270|getLength|Polyline|atan2|sin|getCenter|parseFloat|getVertex|getVertexCount|getAt'.split('|'),0,{}))
/* ----------------------------------
 * SLIDER v1.0.0
 * Licensed under The MIT License
 * Adapted from Brad Birdsall's swipe
 * http://opensource.org/licenses/MIT
 * ---------------------------------- */

!function () {

  var pageX;
  var pageY;
  var slider;
  var deltaX;
  var deltaY;
  var offsetX;
  var lastSlide;
  var startTime;
  var resistance;
  var sliderWidth;
  var slideNumber;
  var isScrolling;
  var scrollableArea;

  var getSlider = function (target) {
    var i, sliders = document.querySelectorAll('.slider ul');
    for (; target && target !== document; target = target.parentNode) {
      for (i = sliders.length; i--;) { if (sliders[i] === target) return target; }
    }
  }

  var getScroll = function () {
    var translate3d = slider.style.webkitTransform.match(/translate3d\(([^,]*)/);
    return parseInt(translate3d ? translate3d[1] : 0)
  };

  var setSlideNumber = function (offset) {
    var round = offset ? (deltaX < 0 ? 'ceil' : 'floor') : 'round';
    slideNumber = Math[round](getScroll() / ( scrollableArea / slider.children.length) );
    slideNumber += offset;
    slideNumber = Math.min(slideNumber, 0);
    slideNumber = Math.max(-(slider.children.length - 1), slideNumber);
  }

  var onTouchStart = function (e) {
    slider = getSlider(e.target);

    if (!slider) return;

    var firstItem  = slider.querySelector('li');

    scrollableArea = firstItem.offsetWidth * slider.children.length;
    isScrolling    = undefined;
    sliderWidth    = slider.offsetWidth;
    resistance     = 1;
    lastSlide      = -(slider.children.length - 1);
    startTime      = +new Date;
    pageX          = e.touches[0].pageX;
    pageY          = e.touches[0].pageY;

    setSlideNumber(0);

    slider.style['-webkit-transition-duration'] = 0;
  };

  var onTouchMove = function (e) {
    if (e.touches.length > 1 || !slider) return; // Exit if a pinch || no slider

    deltaX = e.touches[0].pageX - pageX;
    deltaY = e.touches[0].pageY - pageY;
    pageX  = e.touches[0].pageX;
    pageY  = e.touches[0].pageY;

    if (typeof isScrolling == 'undefined') {
      isScrolling = Math.abs(deltaY) > Math.abs(deltaX);
    }

    if (isScrolling) return;

    offsetX = (deltaX / resistance) + getScroll();

    e.preventDefault();

    resistance = slideNumber == 0         && deltaX > 0 ? (pageX / sliderWidth) + 1.25 :
                 slideNumber == lastSlide && deltaX < 0 ? (Math.abs(pageX) / sliderWidth) + 1.25 : 1;

    slider.style.webkitTransform = 'translate3d(' + offsetX + 'px,0,0)';
  };

  var onTouchEnd = function (e) {
    if (!slider || isScrolling) return;

    setSlideNumber(
      (+new Date) - startTime < 1000 && Math.abs(deltaX) > 15 ? (deltaX < 0 ? -1 : 1) : 0
    );

    offsetX = slideNumber * sliderWidth;

    slider.style['-webkit-transition-duration'] = '.2s';
    slider.style.webkitTransform = 'translate3d(' + offsetX + 'px,0,0)';

    e = new CustomEvent('slide', {
      detail: { slideNumber: Math.abs(slideNumber) },
      bubbles: true,
      cancelable: true
    });

    slider.parentNode.dispatchEvent(e);
  };

  window.addEventListener('touchstart', onTouchStart);
  window.addEventListener('touchmove', onTouchMove);
  window.addEventListener('touchend', onTouchEnd);

}();

/*
Here be coffee
*/


(function() {
  var $, $$, $div, exports, supports, vendors, vendorsLength, __slice__;

  exports = this;

  __slice__ = Array.prototype.slice;

  $ = exports.$ = function(selectors) {
    var $nodes, $nodes_, context, iterator, length;

    $nodes = new $.NodeList;
    $nodes.selectors = selectors;
    context = this.querySelector ? this : document;
    $nodes_ = context.querySelectorAll(selectors);
    length = $nodes_.length;
    iterator = -1;
    while (++iterator < length) {
      $nodes[iterator] = $nodes_[iterator];
      $nodes.length++;
    }
    return $nodes;
  };

  $$ = exports.$$ = function(selectors, index) {
    var $nodes;

    $nodes = $(selectors);
    return $nodes.item(index);
  };

  $.NodeList = function() {};

  $.NodeList.prototype = Object.create(Array.prototype);

  $.NodeList.prototype.item = function(index) {
    return this[index || 0] || null;
  };

  $.NodeList.prototype.length = 0;

  $.NodeList.prototype.selector = null;

  $.NodeList.prototype.$ = function(selectors) {
    var $nodes, $nodes_, iterator, iterator_, length, length_;

    $nodes = new $.NodeList;
    length = this.length;
    iterator = -1;
    while (++iterator < length) {
      $nodes_ = this[iterator].$(selectors);
      iterator_ = -1;
      length_ = $nodes_.length;
      while (++iterator_ < length_) {
        $nodes.push($nodes_[iterator_]);
      }
    }
    return $nodes;
  };

  $.NodeList.prototype.$$ = function(selectors, index) {
    var $nodes;

    $nodes = this.$(selectors);
    return $nodes.item(index);
  };

  $.NodeList.prototype.clone = function() {
    var $nodes, iterator, length;

    $nodes = new $.NodeList;
    length = this.length;
    iterator = -1;
    while (++iterator < length) {
      $nodes.push(this[iterator]);
    }
    return $nodes;
  };

  $.NodeList.prototype.concat = function() {
    var $nodes, argument, arguments_, context, iterator, iterator_, length, length_;

    $nodes = this.clone();
    arguments_ = __slice__.call(arguments);
    context = this.querySelector ? this : document;
    length = arguments_.length;
    iterator = -1;
    while (++iterator < length) {
      argument = arguments_[iterator];
      if (argument instanceof $.NodeList || argument instanceof NodeList) {
        length_ = argument.length;
        iterator_ = -1;
        while (++iterator_ < length_) {
          $nodes.push(argument[iterator_]);
        }
      } else {
        $nodes.push(argument);
      }
    }
    return $nodes;
  };

  Element.prototype.$ = Element.prototype.querySelectorAll;

  Element.prototype.$$ = Element.prototype.querySelector;

  Window.prototype.on = Window.prototype.addEventListener;

  Element.prototype.on = Element.prototype.addEventListener;

  $div = document.createElement('div');

  vendors = 'Khtml Ms O Moz Webkit'.split(' ');

  vendorsLength = vendors.length;

  exports.supports = supports = function(prop) {
    var iterator, prop_, prop__;

    iterator = vendorsLength;
    prop = prop.replace(/^[a-z]/, function(value) {
      return value.toUpperCase();
    });
    if (prop in $div.style) {
      return prop;
    }
    while (iterator--) {
      prop_ = vendors[iterator] + prop;
      if (prop_ in $div.style) {
        return prop_;
      }
      prop__ = (vendors[iterator].toLowerCase()) + prop;
      if (prop__ in $div.style) {
        return prop__;
      }
    }
    return false;
  };

}).call(this);
;
(function() {
  var $map, app, calcRoute, clearMap, currentMarker, currentUser, directionsRenderer, directionsService, drawNewRoute, exports, findPointsOnRoute, locationsArray, makeMarker, map, markerIcon, markerIcons, markers, onLocationUpdate, routeBoxer, styledMap, updateBounds, visualizeLeg, waypoints;

  exports = this;

  app = exports.app || (exports.app = {});

  app.locationManager;

  waypoints = [];

  (function() {
    var data, iterator, latLng, length, waypoint, _results;

    iterator = -1;
    data = app.data;
    length = data.length;
    _results = [];
    while (++iterator < length) {
      waypoint = data[iterator];
      latLng = new google.maps.LatLng(waypoint.latitude, waypoint.longitude);
      latLng.waypoint = waypoint;
      _results.push(waypoints[iterator] = latLng);
    }
    return _results;
  })();

  styledMap = new google.maps.StyledMapType([
    {
      'featureType': 'landscape.natural',
      'stylers': [
        {
          'color': '#3c3c3c'
        }, {
          'visibility': 'on'
        }
      ]
    }, {
      'featureType': 'landscape.man_made',
      'elementType': 'geometry',
      'stylers': [
        {
          'color': '#2f2f2f'
        }, {
          'visibility': 'on'
        }
      ]
    }, {
      'featureType': 'water',
      'elementType': 'geometry',
      'stylers': [
        {
          'visibility': 'on'
        }, {
          'color': '#434343'
        }
      ]
    }, {
      'featureType': 'administrative',
      'elementType': 'geometry',
      'stylers': [
        {
          'visibility': 'on'
        }, {
          'color': '#808080'
        }
      ]
    }, {
      'featureType': 'road',
      'elementType': 'geometry',
      'stylers': [
        {
          'color': '#000000'
        }, {
          'visibility': 'on'
        }
      ]
    }, {
      'featureType': 'transit',
      'stylers': [
        {
          'color': '#4c4c4c'
        }, {
          'visibility': 'on'
        }
      ]
    }, {
      'featureType': 'poi',
      'stylers': [
        {
          'visibility': 'off'
        }
      ]
    }, {
      'elementType': 'labels',
      'stylers': [
        {
          'visibility': 'off'
        }
      ]
    }
  ], {
    'name': 'Salt & Pepper'
  });

  $map = document.getElementById('map-canvas');

  map = new google.maps.Map($map, {
    'zoom': 14,
    'streetViewControl': false,
    'center': new google.maps.LatLng(52.359903, 4.884131),
    'mapTypeControlOptions': {
      'mapTypeIds': [google.maps.MapTypeId.ROADMAP, 'map_style']
    }
  });

  map.mapTypes.set('map_style', styledMap);

  map.setMapTypeId('map_style');

  directionsRenderer = new google.maps.DirectionsRenderer({
    'suppressMarkers': true,
    'suppressInfoWindows': true,
    'map': map,
    'polylineOptions': {
      'strokeColor': '#5e99b0',
      'strokeOpacity': 0.8,
      'strokeWeight': 3
    }
  });

  markerIcons = {};

  (function() {
    var iterator, length, _results;

    iterator = -1;
    length = 8;
    _results = [];
    while (++iterator < length) {
      _results.push(markerIcons[iterator] = {
        'scaledSize': new google.maps.Size(20, 35),
        'size': new google.maps.Size(20, 35),
        'url': "./asset/image/map/marker_closed_" + (iterator + 1) + ".png"
      });
    }
    return _results;
  })();

  markerIcons.a = {
    'scaledSize': new google.maps.Size(20, 35),
    'size': new google.maps.Size(20, 35),
    'url': "./asset/image/map/marker_closed_a.png"
  };

  markerIcons.b = {
    'scaledSize': new google.maps.Size(20, 35),
    'size': new google.maps.Size(20, 35),
    'url': "./asset/image/map/marker_closed_b.png"
  };

  markerIcons.user = {
    'scaledSize': new google.maps.Size(19, 19),
    'size': new google.maps.Size(19, 19),
    'url': "./asset/image/map/marker_closed_user.png"
  };

  markerIcon = {
    'scaledSize': new google.maps.Size(20, 35),
    'size': new google.maps.Size(20, 35),
    'url': './asset/image/map/marker_closed.png'
  };

  routeBoxer = new RouteBoxer;

  directionsService = new google.maps.DirectionsService;

  exports.locationsArray = locationsArray = [new google.maps.LatLng(52.368268, 4.895656), new google.maps.LatLng(52.368289, 4.897228), new google.maps.LatLng(52.383324, 4.885024), new google.maps.LatLng(52.3722, 4.888433), new google.maps.LatLng(52.373058, 4.892864), new google.maps.LatLng(52.371473, 4.880612), new google.maps.LatLng(52.366085, 4.896727), new google.maps.LatLng(52.367238, 4.889554), new google.maps.LatLng(52.376595, 4.90222), new google.maps.LatLng(52.368856, 4.892843)];

  calcRoute = function(start, end, distance) {
    var destination, origin, request, waypts;

    clearMap();
    waypts = [];
    origin = start.toString();
    destination = end.toString();
    request = {
      'origin': origin,
      'destination': destination,
      'waypoints': waypts,
      'optimizeWaypoints': true,
      'travelMode': google.maps.TravelMode.WALKING
    };
    return directionsService.route(request, function(response, status) {
      var path;

      if (status !== google.maps.DirectionsStatus.OK) {
        return;
      }
      path = response.routes[0].overview_path;
      return findPointsOnRoute(path, origin, destination, distance);
    });
  };

  findPointsOnRoute = function(path, origin, destination, distance) {
    var bounds, boxes, boxpolys, iterator, iterator_, length, length_, waypts;

    boxes = routeBoxer.box(path, distance);
    waypts = [];
    iterator = -1;
    length = boxes.length;
    boxpolys = new Array(length);
    while (++iterator < length) {
      bounds = boxes[iterator];
      iterator_ = -1;
      length_ = waypoints.length;
      while (++iterator_ < length_) {
        if (bounds.contains(waypoints[iterator_])) {
          waypts.push({
            'location': waypoints[iterator_],
            'stopover': true
          });
        }
      }
    }
    if (waypts.length > 8 && distance > 0) {
      findPointsOnRoute(path, origin, destination, distance - 0.1);
    } else if (waypts.length < 2 && distance < 5) {
      findPointsOnRoute(path, origin, destination, distance + 0.1);
    } else {
      if (waypts.length > 8) {
        waypoints = waypoints.slice(0, 8);
      }
      drawNewRoute(waypts, origin, destination, distance);
    }
    return this;
  };

  markers = [];

  currentMarker = null;

  currentUser = null;

  updateBounds = function() {
    var bounds, iterator, length;

    bounds = new google.maps.LatLngBounds;
    if (currentUser) {
      bounds.extend(currentUser.position);
    }
    iterator = -1;
    length = markers.length;
    while (++iterator < length) {
      bounds.extend(markers[iterator].position);
    }
    map.fitBounds(bounds);
    return void 0;
  };

  onLocationUpdate = function(position) {
    var coords, latLng;

    coords = position.coords;
    latLng = new google.maps.LatLng(coords.latitude, coords.longitude);
    if (currentUser) {
      currentUser.setPosition(latLng);
    } else {
      currentUser = new google.maps.Marker({
        'position': latLng,
        'map': map,
        'icon': markerIcons.user,
        'title': 'current location.',
        'animation': google.maps.Animation.DROP,
        'flat': true
      });
    }
    updateBounds();
    return void 0;
  };

  clearMap = function() {
    var iterator, length;

    app.locationManager.off(onLocationUpdate);
    iterator = -1;
    length = markers.length;
    while (++iterator < length) {
      markers[iterator].setMap(null);
    }
    markers = [];
    currentMarker = null;
    return this;
  };

  makeMarker = function(position, icon, title) {
    var marker;

    marker = new google.maps.Marker({
      'position': position,
      'map': map,
      'icon': icon,
      'title': title,
      'animation': google.maps.Animation.DROP,
      'flat': true,
      'optimized': false
    });
    markers.push(marker);
    return marker;
  };

  visualizeLeg = function(address, point, waypoint, index, length) {
    var content, data, icon, title;

    if (index === 0) {
      title = 'start';
      icon = markerIcons.a || markerIcon;
    } else if (index === length) {
      title = 'end';
      icon = markerIcons.b || markerIcon;
    } else {
      title = 'waypoint';
      icon = markerIcons[index - 1] || markerIcon;
      point.waypoint = waypoint.location.waypoint;
    }
    if (point.waypoint) {
      data = point.waypoint;
      content = "<b>" + data.piece + "</b><br/>" + data.artist + "<br/><a class=\"button-primary button-block button-large button-map\" href=\"" + data.link + "\" data-id=\"" + data.info.id + "\">Meer info »</a>";
    } else {
      content = "<b>" + address + "</b>";
    }
    return window.setTimeout(function() {
      var marker;

      marker = makeMarker(point, icon, title);
      marker.info = new google.maps.InfoWindow({
        'content': content
      });
      return google.maps.event.addListener(marker, 'click', function() {
        if (currentMarker) {
          currentMarker.info.close();
        }
        marker.info.open(map, marker);
        return currentMarker = marker;
      });
    }, index * 200);
  };

  google.maps.event.addListener(map, 'click', function() {
    if (currentMarker) {
      currentMarker.info.close();
      return currentMarker = null;
    }
  });

  drawNewRoute = function(waypts, origin, destination, distance) {
    var request;

    app.locationManager.on(onLocationUpdate);
    request = {
      'origin': origin,
      'destination': destination,
      'waypoints': waypts,
      'optimizeWaypoints': true,
      'travelMode': google.maps.TravelMode.WALKING
    };
    return directionsService.route(request, function(response, status) {
      var address, iterator, leg, legs, length, route, waypoint;

      if (status !== google.maps.DirectionsStatus.OK) {
        return;
      }
      directionsRenderer.setDirections(response);
      route = response.routes[0];
      legs = route.legs;
      iterator = -1;
      length = legs.length;
      while (++iterator < length) {
        leg = legs[iterator];
        address = leg.start_address;
        if (iterator > 0) {
          waypoint = waypts[route.waypoint_order[iterator - 1]];
        } else {
          waypoint = null;
          address = origin;
        }
        visualizeLeg(leg.start_address, leg.start_location, waypoint, iterator, length);
        updateBounds();
      }
      leg = legs[length - 1];
      visualizeLeg(destination, leg.end_location, null, iterator, length);
      return updateBounds();
    });
  };

  exports.calcRoute = calcRoute;

}).call(this);
;
(function() {
  var exports, getTargets;

  exports = this;

  getTargets = function($target) {
    var $modals, iterator, length;

    $modals = $('a');
    while ($target && $target !== document) {
      iterator = -1;
      length = $modals.length;
      while (++iterator < length) {
        if ($modals[iterator] === $target) {
          return $target;
        }
      }
      $target = $target.parentNode;
    }
  };

  window.on('click', function(event) {
    var $anchor, $modal;

    $anchor = getTargets(event.target);
    if (!$anchor || !$anchor.hash) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    $modal = ($($anchor.hash)).item();
    if ($modal) {
      $modal.classList.toggle('active');
    }
  });

}).call(this);
;
(function() {
  var $backdrop, getTargets, onPopoverHidden, transitionEnd;

  transitionEnd = {
    'WebkitTransition': 'webkitTransitionEnd',
    'MozTransition': 'transitionend',
    'OTransition': 'oTransitionEnd',
    'msTransition': 'MSTransitionEnd',
    'transition': 'transitionend'
  }[supports('transition')];

  getTargets = function($target) {
    var $popovers, iterator, length;

    $popovers = $('a');
    while ($target && $target !== document) {
      iterator = -1;
      length = $popovers.length;
      while (++iterator < length) {
        if ($popovers[iterator] === $target) {
          return $target;
        }
      }
      $target = $target.parentNode;
    }
  };

  onPopoverHidden = function() {
    document.body.removeChild($backdrop);
    popover.style.display = 'none';
    return popover.removeEventListener(transitionEnd, onPopoverHidden);
  };

  $backdrop = (function() {
    var $node;

    $node = document.createElement('div');
    $node.classList.add('backdrop');
    $node.on('touchend', function() {
      popover.on(transitionEnd, onPopoverHidden);
      return popover.classList.remove('visible');
    });
    return $node;
  })();

  window.on('click', function(event) {
    var $anchor, $popover;

    $anchor = getTargets(event.target);
    if (!$anchor || !$anchor.hash) {
      return;
    }
    $popover = ($($anchor.hash)).item();
    if (!$popover || !$popover.classList.contains('popover')) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    $popover.style.display = 'block';
    $popover.classList.add('visible');
    return $popover.parentNode.appendChild($backdrop);
  });

}).call(this);
;
(function() {
  var $el, $meestermatcherController, $meestermatcherList, $meestermatcherNext, changeActiveScreen, getTargets, meestermatcherListItemCount;

  getTargets = function($target) {
    var $popovers, iterator, length;

    $popovers = $('.segmented-controller li a');
    while ($target && $target !== document) {
      iterator = -1;
      length = $popovers.length;
      while (++iterator < length) {
        if ($popovers[iterator] === $target) {
          return $target;
        }
      }
      $target = $target.parentNode;
    }
  };

  window.on('click', function(event) {
    var $activeTab, $activeTabs, $node, $target, $targetBody, $targetTab, className, classSelector, iterator, length;

    className = 'active';
    classSelector = '.' + className;
    $target = getTargets(event.target);
    if (!$target) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    $targetTab = $target.parentNode;
    $activeTab = $targetTab.parentNode.$$(classSelector);
    if ($activeTab) {
      $activeTab.classList.remove(className);
    }
    $targetTab.classList.add(className);
    if (!$target.hash) {
      throw new Error('segmentedController: Missing `hash` on $target');
      return;
    }
    $targetBody = $$($target.hash);
    if (!$targetBody) {
      return;
    }
    $activeTabs = $targetBody.parentNode.$(classSelector);
    iterator = -1;
    length = $activeTabs.length;
    while (++iterator < length) {
      $node = $activeTabs[iterator];
      $node.classList.remove(className);
    }
    return $targetBody.classList.add(className);
  });

  $meestermatcherController = $('.meestermatcher-controller');

  $meestermatcherList = $('.meestermatcher-list');

  $meestermatcherNext = $$('#meestermatcher-next');

  meestermatcherListItemCount = $meestermatcherList.item().childElementCount;

  changeActiveScreen = function(index) {
    var $newActiveControler, $newActiveItem, actives, iterator, length;

    if (index < 1) {
      return;
    }
    if (index > meestermatcherListItemCount) {
      alert(index);
      return;
    }
    actives = $meestermatcherController.$('.active');
    actives = actives.concat($meestermatcherList.$('.active'));
    length = actives.length;
    iterator = -1;
    while (++iterator < length) {
      actives[iterator].classList.remove('active');
    }
    $newActiveItem = $meestermatcherList.$$('#step' + index);
    $newActiveControler = $meestermatcherController.$$('[href="#step' + index + '"]');
    $newActiveItem.classList.add('active');
    $newActiveControler.parentElement.classList.add('active');
    return $meestermatcherNext.hash = '#step' + (index + 1);
  };

  $meestermatcherNext.on('click', function(event) {
    var hash, index;

    hash = $meestermatcherNext.hash;
    index = +hash.slice(5);
    event.preventDefault();
    event.stopPropagation();
    return changeActiveScreen(index);
  });

  $meestermatcherController.item().on('click', function(event) {
    var hash, index;

    if ('a' !== event.target.tagName.toLowerCase()) {
      return;
    }
    hash = event.target.hash;
    index = +hash.slice(5);
    event.preventDefault();
    event.stopPropagation();
    return changeActiveScreen(index);
  });

  $el = ($('#meestermatcher-modal .content')).item();

  Hammer($el).on('swipeleft', function(event) {
    event.preventDefault();
    event.stopPropagation();
    return changeActiveScreen(+$meestermatcherNext.hash.slice(5));
  });

  Hammer($el).on('swiperight', function() {
    event.preventDefault();
    event.stopPropagation();
    return changeActiveScreen((+$meestermatcherNext.hash.slice(5)) - 2);
  });

}).call(this);
;
(function() {
  var getTargets;

  getTargets = function($target) {
    var $popovers, iterator, length;

    $popovers = $('.toggle');
    while ($target && $target !== document) {
      iterator = -1;
      length = $popovers.length;
      while (++iterator < length) {
        if ($popovers[iterator] === $target) {
          return $target;
        }
      }
      $target = $target.parentNode;
    }
  };

  window.on('click', function(event) {
    var $toggle;

    $toggle = getTargets(event.target);
    if (!$toggle) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    $toggle.classList.toggle('active');
  });

}).call(this);
;
/*
Here be coffee
*/


(function() {
  var $infoModal, $planFrom, $planRoute, $planRouteModal, $planTo, LocationManager, app, exports, home, info, locationManager, waypointToString, waypoints;

  exports = this;

  app = exports.app || (exports.app = {});

  LocationManager = function(options) {
    var _onerror, _onsuccess,
      _this = this;

    this.listeners = [];
    if (options) {
      this.options = options;
    }
    _onsuccess = this.onsuccess;
    _onerror = this.onerror;
    this.onsuccess = (function() {
      return _onsuccess.apply(_this, arguments);
    });
    this.onerror = (function() {
      return _onerror.apply(_this, arguments);
    });
    this.isRequested = false;
    return this;
  };

  LocationManager.prototype.request = function(position) {
    if (this.isRequested === true) {
      return;
    }
    this.isRequested = true;
    if (navigator.geolocation) {
      this.id = navigator.geolocation.watchPosition(this.onsuccess, this.onerror, this.options);
    } else {
      this.onerror({
        'code': -1,
        'message': 'GEOLOCATION UNAVAILABLE'
      });
    }
    return this;
  };

  LocationManager.prototype.options = {
    'enableHighAccuracy': true,
    'maximumAge': 0
  };

  LocationManager.prototype.onsuccess = function(position) {
    this.position = position;
    this.onupdate_();
    return this;
  };

  LocationManager.prototype.on = function(listener) {
    if (this.position) {
      listener(this.position);
    }
    this.listeners.push(listener);
    return this;
  };

  LocationManager.prototype.off = function(listener) {
    var iterator, length;

    iterator = -1;
    length = this.listeners.length;
    while (++iterator < length) {
      if (this.listeners[iterator] === listener) {
        delete this.listeners[iterator];
        return true;
      }
    }
    return false;
  };

  LocationManager.prototype.listeners = [];

  LocationManager.prototype.onupdate_ = function() {
    var iterator, length, listener;

    iterator = -1;
    length = this.listeners.length;
    while (++iterator < length) {
      listener = this.listeners[iterator];
      if (listener && listener.call && listener.apply) {
        this.listeners[iterator](this.position);
      }
    }
    return this;
  };

  LocationManager.prototype.onerror = function(error) {
    return this;
  };

  locationManager = app.locationManager = new LocationManager;

  /*
  Plan-my-route modal.
  */


  $planRouteModal = ($('#plan-route-modal')).item();

  exports.home = home = function(boolean) {
    boolean === !!boolean || (boolean = !$planRouteModal.classList.contains('active'));
    $planRouteModal.classList[boolean ? 'add' : 'remove']('active');
    return $planRouteModal;
  };

  $planRoute = ($('#plan-route')).item();

  $planTo = ($('#plan-route-to')).item();

  $planFrom = ($('#plan-route-from')).item();

  window.on('load', function() {
    return locationManager.request();
  });

  $planRoute.on('click', function(event) {
    var destination, distance, listener, origin;

    origin = $planFrom.value;
    destination = $planTo.value;
    distance = 500;
    if (origin === '' && destination === '') {
      alert('Een begin- en eindpunt moet aanwezig zijn om een route te plannen');
    } else if ('huidige locatie' === origin.toLowerCase()) {
      listener = function(position) {
        var coords;

        coords = [position.coords.latitude, position.coords.longitude];
        home(false);
        calcRoute(coords, destination, distance);
        return locationManager.off(listener);
      };
      return locationManager.on(listener);
    } else {
      home(false);
      return calcRoute(origin, destination, distance);
    }
  });

  $infoModal = ($('#info-modal')).item();

  exports.info = info = function(boolean) {
    boolean === !!boolean || (boolean = !$infoModal.classList.contains('active'));
    $infoModal.classList[boolean ? 'add' : 'remove']('active');
    return $infoModal;
  };

  waypoints = {};

  (function() {
    var data, iterator, length, waypoint;

    iterator = -1;
    data = app.data;
    length = data.length;
    while (++iterator < length) {
      waypoint = data[iterator];
      if (!(waypoint.info && waypoint.info.id)) {
        continue;
      }
      waypoints[waypoint.info.id] = waypoint;
    }
    return void 0;
  })();

  waypointToString = function(data) {
    return "<header class=\"bar-title\">\n	<h3 class=\"title\"><div class=\"overflow-wrapper\">" + data.piece + "</div></h3>\n	<a class=\"button\" href=\"#info-modal\">\n		Close\n	</a>\n</header>\n<div class=\"content\">\n	<div class=\"img\" style=\"background-image:url(" + data.info.image + ")\">\n		<img class=\"hidden\" alt=\"\" src=\"" + data.info.image + "\">\n	</div>\n	<div class=\"info-wrapper\">\n		<h1>" + data.info.title + "</h1>\n		<h2>" + data.artist + "</h2>\n		<p>" + data.info.description + "</p>\n		<a class=\"button-primary button-block button-large\" href=\"" + data.link + "\">Op naar het Rijks!</a>\n	</div>\n</div>";
  };

  window.on('click', function(event) {
    var $target, id, waypoint;

    $target = event.target;
    if ($target.classList.contains('button-map')) {
      event.preventDefault();
      event.stopPropagation();
      id = $target.dataset.id;
      if (id === 'undefined') {
        id = null;
      }
      waypoint = waypoints[id];
      if (!(id || waypoint)) {
        return;
      }
      $infoModal.innerHTML = waypointToString(waypoint);
      info(true);
    }
  });

}).call(this);
