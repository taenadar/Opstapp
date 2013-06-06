/*! opstapp - v0.0.1 - 2013-06-06
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
/**
 * @name RouteBoxer
 * @version 1.0
 * @copyright (c) 2010 Google Inc.
 * @author Thor Mitchell
 *
 * @fileoverview The RouteBoxer class takes a path, such as the Polyline for a
 * route generated by a Directions request, and generates a set of LatLngBounds
 * objects that are guaranteed to contain every point within a given distance
 * of that route. These LatLngBounds objects can then be used to generate
 * requests to spatial search services that support bounds filtering (such as
 * the Google Maps Data API) in order to implement search along a route.
 * <br/><br/>
 * RouteBoxer overlays a grid of the specified size on the route, identifies
 * every grid cell that the route passes through, and generates a set of bounds
 * that cover all of these cells, and their nearest neighbours. Consequently
 * the bounds returned will extend up to ~3x the specified distance from the
 * route in places.
 */

/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License. 
 */

/**
 * Creates a new RouteBoxer
 *
 * @constructor
 */
function RouteBoxer() {
  this.R = 6371; // earth's mean radius in km
}

/**
 * Generates boxes for a given route and distance
 *
 * @param {google.maps.LatLng[] | google.maps.Polyline} path The path along
 *           which to create boxes. The path object can be either an Array of
 *           google.maps.LatLng objects or a Maps API v2 or Maps API v3
 *           google.maps.Polyline object.
 * @param {Number} range The distance in kms around the route that the generated
 *           boxes must cover.
 * @return {google.maps.LatLngBounds[]} An array of boxes that covers the whole
 *           path.
 */
RouteBoxer.prototype.box = function (path, range) {
  // Two dimensional array representing the cells in the grid overlaid on the path
  this.grid_ = null;
  
  // Array that holds the latitude coordinate of each vertical grid line
  this.latGrid_ = [];
  
  // Array that holds the longitude coordinate of each horizontal grid line  
  this.lngGrid_ = [];
  
  // Array of bounds that cover the whole route formed by merging cells that
  //  the route intersects first horizontally, and then vertically
  this.boxesX_ = [];

  // Array of bounds that cover the whole route formed by merging cells that
  //  the route intersects first vertically, and then horizontally
  this.boxesY_ = [];
  
  // The array of LatLngs representing the vertices of the path
  var vertices = null;

  // If necessary convert the path into an array of LatLng objects
  if (path instanceof Array) {
    // already an arry of LatLngs (eg. v3 overview_path)
    vertices = path;
  } else if (path instanceof google.maps.Polyline) {
    if (path.getPath) {
      // v3 Maps API Polyline object
      vertices = new Array(path.getPath().getLength());
      for (var i = 0; i < vertices.length; i++) {
        vertices[i] = path.getPath().getAt(i);
      }
    } else {
      // v2 Maps API Polyline object
      vertices = new Array(path.getVertexCount());
      for (var j = 0; j < vertices.length; j++) {
        vertices[j] = path.getVertex(j);
      }
    }
  }

  // Build the grid that is overlaid on the route
  this.buildGrid_(vertices, range);
  
  // Identify the grid cells that the route intersects
  this.findIntersectingCells_(vertices);
  
  // Merge adjacent intersected grid cells (and their neighbours) into two sets
  //  of bounds, both of which cover them completely
  this.mergeIntersectingCells_();

  // Return the set of merged bounds that has the fewest elements
  return (this.boxesX_.length <= this.boxesY_.length ?
          this.boxesX_ :
          this.boxesY_);
};

/**
 * Generates boxes for a given route and distance
 *
 * @param {LatLng[]} vertices The vertices of the path over which to lay the grid
 * @param {Number} range The spacing of the grid cells.
 */
RouteBoxer.prototype.buildGrid_ = function (vertices, range) {

  // Create a LatLngBounds object that contains the whole path
  var routeBounds = new google.maps.LatLngBounds();
  for (var i = 0; i < vertices.length; i++) {
    routeBounds.extend(vertices[i]);
  }
  
  // Find the center of the bounding box of the path
  var routeBoundsCenter = routeBounds.getCenter();
  
  // Starting from the center define grid lines outwards vertically until they
  //  extend beyond the edge of the bounding box by more than one cell
  this.latGrid_.push(routeBoundsCenter.lat());
  
  // Add lines from the center out to the north
  this.latGrid_.push(routeBoundsCenter.rhumbDestinationPoint(0, range).lat());
  for (i = 2; this.latGrid_[i - 2] < routeBounds.getNorthEast().lat(); i++) {
    this.latGrid_.push(routeBoundsCenter.rhumbDestinationPoint(0, range * i).lat());
  }

  // Add lines from the center out to the south  
  for (i = 1; this.latGrid_[1] > routeBounds.getSouthWest().lat(); i++) {
    this.latGrid_.unshift(routeBoundsCenter.rhumbDestinationPoint(180, range * i).lat());
  }

  // Starting from the center define grid lines outwards horizontally until they
  //  extend beyond the edge of the bounding box by more than one cell  
  this.lngGrid_.push(routeBoundsCenter.lng());
  
  // Add lines from the center out to the east
  this.lngGrid_.push(routeBoundsCenter.rhumbDestinationPoint(90, range).lng());
  for (i = 2; this.lngGrid_[i - 2] < routeBounds.getNorthEast().lng(); i++) {
    this.lngGrid_.push(routeBoundsCenter.rhumbDestinationPoint(90, range * i).lng());
  }
  
  // Add lines from the center out to the west
  for (i = 1; this.lngGrid_[1] > routeBounds.getSouthWest().lng(); i++) {
    this.lngGrid_.unshift(routeBoundsCenter.rhumbDestinationPoint(270, range * i).lng());
  }
  
  // Create a two dimensional array representing this grid
  this.grid_ = new Array(this.lngGrid_.length);
  for (i = 0; i < this.grid_.length; i++) {
    this.grid_[i] = new Array(this.latGrid_.length);
  }
};

/**
 * Find all of the cells in the overlaid grid that the path intersects
 *
 * @param {LatLng[]} vertices The vertices of the path
 */
RouteBoxer.prototype.findIntersectingCells_ = function (vertices) {
  // Find the cell where the path begins
  var hintXY = this.getCellCoords_(vertices[0]);
  
  // Mark that cell and it's neighbours for inclusion in the boxes
  this.markCell_(hintXY);

  // Work through each vertex on the path identifying which grid cell it is in
  for (var i = 1; i < vertices.length; i++) {
    // Use the known cell of the previous vertex to help find the cell of this vertex
    var gridXY = this.getGridCoordsFromHint_(vertices[i], vertices[i - 1], hintXY);
    
    if (gridXY[0] === hintXY[0] && gridXY[1] === hintXY[1]) {
      // This vertex is in the same cell as the previous vertex
      // The cell will already have been marked for inclusion in the boxes
      continue;
    
    } else if ((Math.abs(hintXY[0] - gridXY[0]) === 1 && hintXY[1] === gridXY[1]) ||
        (hintXY[0] === gridXY[0] && Math.abs(hintXY[1] - gridXY[1]) === 1)) {
      // This vertex is in a cell that shares an edge with the previous cell
      // Mark this cell and it's neighbours for inclusion in the boxes
      this.markCell_(gridXY);
      
    } else {
      // This vertex is in a cell that does not share an edge with the previous
      //  cell. This means that the path passes through other cells between
      //  this vertex and the previous vertex, and we must determine which cells
      //  it passes through
      this.getGridIntersects_(vertices[i - 1], vertices[i], hintXY, gridXY);
    }
    
    // Use this cell to find and compare with the next one
    hintXY = gridXY;
  }
};

/**
 * Find the cell a path vertex is in by brute force iteration over the grid
 *
 * @param {LatLng[]} latlng The latlng of the vertex
 * @return {Number[][]} The cell coordinates of this vertex in the grid
 */ 
RouteBoxer.prototype.getCellCoords_ = function (latlng) {
  for (var x = 0; this.lngGrid_[x] < latlng.lng(); x++) {}
  for (var y = 0; this.latGrid_[y] < latlng.lat(); y++) {}
  return ([x - 1, y - 1]);
};

/**
 * Find the cell a path vertex is in based on the known location of a nearby
 *  vertex. This saves searching the whole grid when working through vertices
 *  on the polyline that are likely to be in close proximity to each other.
 *
 * @param {LatLng[]} latlng The latlng of the vertex to locate in the grid
 * @param {LatLng[]} hintlatlng The latlng of the vertex with a known location
 * @param {Number[]} hint The cell containing the vertex with a known location
 * @return {Number[]} The cell coordinates of the vertex to locate in the grid
 */ 
RouteBoxer.prototype.getGridCoordsFromHint_ = function (latlng, hintlatlng, hint) {
  var x, y;
  if (latlng.lng() > hintlatlng.lng()) {
    for (x = hint[0]; this.lngGrid_[x + 1] < latlng.lng(); x++) {}
  } else {
    for (x = hint[0]; this.lngGrid_[x] > latlng.lng(); x--) {}
  }
  
  if (latlng.lat() > hintlatlng.lat()) {
    for (y = hint[1]; this.latGrid_[y + 1] < latlng.lat(); y++) {}
  } else {        
    for (y = hint[1]; this.latGrid_[y] > latlng.lat(); y--) {}
  }
  
  return ([x, y]);
};


/**
 * Identify the grid squares that a path segment between two vertices
 * intersects with by:
 * 1. Finding the bearing between the start and end of the segment
 * 2. Using the delta between the lat of the start and the lat of each
 *    latGrid boundary to find the distance to each latGrid boundary
 * 3. Finding the lng of the intersection of the line with each latGrid
 *     boundary using the distance to the intersection and bearing of the line
 * 4. Determining the x-coord on the grid of the point of intersection
 * 5. Filling in all squares between the x-coord of the previous intersection
 *     (or start) and the current one (or end) at the current y coordinate,
 *     which is known for the grid line being intersected
 *     
 * @param {LatLng} start The latlng of the vertex at the start of the segment
 * @param {LatLng} end The latlng of the vertex at the end of the segment
 * @param {Number[]} startXY The cell containing the start vertex
 * @param {Number[]} endXY The cell containing the vend vertex
 */ 
RouteBoxer.prototype.getGridIntersects_ = function (start, end, startXY, endXY) {
  var edgePoint, edgeXY, i;
  var brng = start.rhumbBearingTo(end);         // Step 1.
  
  var hint = start;
  var hintXY = startXY;
  
  // Handle a line segment that travels south first
  if (end.lat() > start.lat()) {
    // Iterate over the east to west grid lines between the start and end cells
    for (i = startXY[1] + 1; i <= endXY[1]; i++) {
      // Find the latlng of the point where the path segment intersects with
      //  this grid line (Step 2 & 3)
      edgePoint = this.getGridIntersect_(start, brng, this.latGrid_[i]);
      
      // Find the cell containing this intersect point (Step 4)
      edgeXY = this.getGridCoordsFromHint_(edgePoint, hint, hintXY);
      
      // Mark every cell the path has crossed between this grid and the start,
      //   or the previous east to west grid line it crossed (Step 5)
      this.fillInGridSquares_(hintXY[0], edgeXY[0], i - 1);
      
      // Use the point where it crossed this grid line as the reference for the
      //  next iteration
      hint = edgePoint;
      hintXY = edgeXY;
    }
    
    // Mark every cell the path has crossed between the last east to west grid
    //  line it crossed and the end (Step 5)
    this.fillInGridSquares_(hintXY[0], endXY[0], i - 1);
    
  } else {
    // Iterate over the east to west grid lines between the start and end cells
    for (i = startXY[1]; i > endXY[1]; i--) {
      // Find the latlng of the point where the path segment intersects with
      //  this grid line (Step 2 & 3)
      edgePoint = this.getGridIntersect_(start, brng, this.latGrid_[i]);
      
      // Find the cell containing this intersect point (Step 4)
      edgeXY = this.getGridCoordsFromHint_(edgePoint, hint, hintXY);

      // Mark every cell the path has crossed between this grid and the start,
      //   or the previous east to west grid line it crossed (Step 5)
      this.fillInGridSquares_(hintXY[0], edgeXY[0], i);

      // Use the point where it crossed this grid line as the reference for the
      //  next iteration
      hint = edgePoint;
      hintXY = edgeXY;
    }
    
    // Mark every cell the path has crossed between the last east to west grid
    //  line it crossed and the end (Step 5)
    this.fillInGridSquares_(hintXY[0], endXY[0], i);
    
  }
};

/**
 * Find the latlng at which a path segment intersects with a given
 *   line of latitude
 *     
 * @param {LatLng} start The vertex at the start of the path segment
 * @param {Number} brng The bearing of the line from start to end
 * @param {Number} gridLineLat The latitude of the grid line being intersected
 * @return {LatLng} The latlng of the point where the path segment intersects
 *                    the grid line
 */ 
RouteBoxer.prototype.getGridIntersect_ = function (start, brng, gridLineLat) {
  var d = this.R * ((gridLineLat.toRad() - start.lat().toRad()) / Math.cos(brng.toRad()));
  return start.rhumbDestinationPoint(brng, d);
};

/**
 * Mark all cells in a given row of the grid that lie between two columns
 *   for inclusion in the boxes
 *     
 * @param {Number} startx The first column to include
 * @param {Number} endx The last column to include
 * @param {Number} y The row of the cells to include
 */ 
RouteBoxer.prototype.fillInGridSquares_ = function (startx, endx, y) {
  var x;
  if (startx < endx) {
    for (x = startx; x <= endx; x++) {
      this.markCell_([x, y]);
    }
  } else {
    for (x = startx; x >= endx; x--) {
      this.markCell_([x, y]);
    }            
  }      
};

/**
 * Mark a cell and the 8 immediate neighbours for inclusion in the boxes
 *     
 * @param {Number[]} square The cell to mark
 */ 
RouteBoxer.prototype.markCell_ = function (cell) {
  var x = cell[0];
  var y = cell[1];
  this.grid_[x - 1][y - 1] = 1;
  this.grid_[x][y - 1] = 1;
  this.grid_[x + 1][y - 1] = 1;
  this.grid_[x - 1][y] = 1;
  this.grid_[x][y] = 1;
  this.grid_[x + 1][y] = 1;
  this.grid_[x - 1][y + 1] = 1;
  this.grid_[x][y + 1] = 1;
  this.grid_[x + 1][y + 1] = 1;
};

/**
 * Create two sets of bounding boxes, both of which cover all of the cells that
 *   have been marked for inclusion.
 *
 * The first set is created by combining adjacent cells in the same column into
 *   a set of vertical rectangular boxes, and then combining boxes of the same
 *   height that are adjacent horizontally.
 *
 * The second set is created by combining adjacent cells in the same row into
 *   a set of horizontal rectangular boxes, and then combining boxes of the same
 *   width that are adjacent vertically.
 *     
 */ 
RouteBoxer.prototype.mergeIntersectingCells_ = function () {
  var x, y, box;
  
  // The box we are currently expanding with new cells
  var currentBox = null;
  
  // Traverse the grid a row at a time
  for (y = 0; y < this.grid_[0].length; y++) {
    for (x = 0; x < this.grid_.length; x++) {
      
      if (this.grid_[x][y]) {
        // This cell is marked for inclusion. If the previous cell in this
        //   row was also marked for inclusion, merge this cell into it's box.
        // Otherwise start a new box.
        box = this.getCellBounds_([x, y]);
        if (currentBox) {
          currentBox.extend(box.getNorthEast());
        } else {
          currentBox = box;
        }
        
      } else {
        // This cell is not marked for inclusion. If the previous cell was
        //  marked for inclusion, merge it's box with a box that spans the same
        //  columns from the row below if possible.
        this.mergeBoxesY_(currentBox);
        currentBox = null;
      }
    }
    // If the last cell was marked for inclusion, merge it's box with a matching
    //  box from the row below if possible.
    this.mergeBoxesY_(currentBox);
    currentBox = null;
  }

  // Traverse the grid a column at a time
  for (x = 0; x < this.grid_.length; x++) {
    for (y = 0; y < this.grid_[0].length; y++) {
      if (this.grid_[x][y]) {
        
        // This cell is marked for inclusion. If the previous cell in this
        //   column was also marked for inclusion, merge this cell into it's box.
        // Otherwise start a new box.
        if (currentBox) {
          box = this.getCellBounds_([x, y]);
          currentBox.extend(box.getNorthEast());
        } else {
          currentBox = this.getCellBounds_([x, y]);
        }
        
      } else {
        // This cell is not marked for inclusion. If the previous cell was
        //  marked for inclusion, merge it's box with a box that spans the same
        //  rows from the column to the left if possible.
        this.mergeBoxesX_(currentBox);
        currentBox = null;
        
      }
    }
    // If the last cell was marked for inclusion, merge it's box with a matching
    //  box from the column to the left if possible.
    this.mergeBoxesX_(currentBox);
    currentBox = null;
  }
};

/**
 * Search for an existing box in an adjacent row to the given box that spans the
 * same set of columns and if one is found merge the given box into it. If one
 * is not found, append this box to the list of existing boxes.
 *
 * @param {LatLngBounds}  The box to merge
 */ 
RouteBoxer.prototype.mergeBoxesX_ = function (box) {
  if (box !== null) {
    for (var i = 0; i < this.boxesX_.length; i++) {
      if (this.boxesX_[i].getNorthEast().lng() === box.getSouthWest().lng() &&
          this.boxesX_[i].getSouthWest().lat() === box.getSouthWest().lat() &&
          this.boxesX_[i].getNorthEast().lat() === box.getNorthEast().lat()) {
        this.boxesX_[i].extend(box.getNorthEast());
        return;
      }
    }
    this.boxesX_.push(box);
  }
};

/**
 * Search for an existing box in an adjacent column to the given box that spans
 * the same set of rows and if one is found merge the given box into it. If one
 * is not found, append this box to the list of existing boxes.
 *
 * @param {LatLngBounds}  The box to merge
 */ 
RouteBoxer.prototype.mergeBoxesY_ = function (box) {
  if (box !== null) {
    for (var i = 0; i < this.boxesY_.length; i++) {
      if (this.boxesY_[i].getNorthEast().lat() === box.getSouthWest().lat() &&
          this.boxesY_[i].getSouthWest().lng() === box.getSouthWest().lng() &&
          this.boxesY_[i].getNorthEast().lng() === box.getNorthEast().lng()) {
        this.boxesY_[i].extend(box.getNorthEast());
        return;
      }
    }
    this.boxesY_.push(box);
  }
};

/**
 * Obtain the LatLng of the origin of a cell on the grid
 *
 * @param {Number[]} cell The cell to lookup.
 * @return {LatLng} The latlng of the origin of the cell.
 */ 
RouteBoxer.prototype.getCellBounds_ = function (cell) {
  return new google.maps.LatLngBounds(
    new google.maps.LatLng(this.latGrid_[cell[1]], this.lngGrid_[cell[0]]),
    new google.maps.LatLng(this.latGrid_[cell[1] + 1], this.lngGrid_[cell[0] + 1]));
};

/* Based on the Latitude/longitude spherical geodesy formulae & scripts
   at http://www.movable-type.co.uk/scripts/latlong.html
   (c) Chris Veness 2002-2010
*/ 
google.maps.LatLng.prototype.rhumbDestinationPoint = function (brng, dist) {
  var R = 6371; // earth's mean radius in km
  var d = parseFloat(dist) / R;  // d = angular distance covered on earth's surface
  var lat1 = this.lat().toRad(), lon1 = this.lng().toRad();
  brng = brng.toRad();

  var lat2 = lat1 + d * Math.cos(brng);
  var dLat = lat2 - lat1;
  var dPhi = Math.log(Math.tan(lat2 / 2 + Math.PI / 4) / Math.tan(lat1 / 2 + Math.PI / 4));
  var q = (Math.abs(dLat) > 1e-10) ? dLat / dPhi : Math.cos(lat1);
  var dLon = d * Math.sin(brng) / q;
  // check for going past the pole
  if (Math.abs(lat2) > Math.PI / 2) {
    lat2 = lat2 > 0 ? Math.PI - lat2 : - (Math.PI - lat2);
  }
  var lon2 = (lon1 + dLon + Math.PI) % (2 * Math.PI) - Math.PI;
 
  if (isNaN(lat2) || isNaN(lon2)) {
    return null;
  }
  return new google.maps.LatLng(lat2.toDeg(), lon2.toDeg());
};

google.maps.LatLng.prototype.rhumbBearingTo = function (dest) {
  var dLon = (dest.lng() - this.lng()).toRad();
  var dPhi = Math.log(Math.tan(dest.lat().toRad() / 2 + Math.PI / 4) / Math.tan(this.lat().toRad() / 2 + Math.PI / 4));
  if (Math.abs(dLon) > Math.PI) {
    dLon = dLon > 0 ? -(2 * Math.PI - dLon) : (2 * Math.PI + dLon);
  }
  return Math.atan2(dLon, dPhi).toBrng();
};

/**
 * Extend the Number object to convert degrees to radians
 *
 * @return {Number} Bearing in radians
 * @ignore
 */ 
Number.prototype.toRad = function () {
  return this * Math.PI / 180;
};

/**
 * Extend the Number object to convert radians to degrees
 *
 * @return {Number} Bearing in degrees
 * @ignore
 */ 
Number.prototype.toDeg = function () {
  return this * 180 / Math.PI;
};

/**
 * Normalize a heading in degrees to between 0 and +360
 *
 * @return {Number} Return 
 * @ignore
 */ 
Number.prototype.toBrng = function () {
  return (this.toDeg() + 360) % 360;
};
(function() {
  var DataManager, exports;

  exports = this;

  DataManager = function() {};

  DataManager.prototype.getPoint = function(id) {
    return this._points[id] || false;
  };

  DataManager.prototype.getPointByLocation = function(location) {
    var iterator, length, point, points;

    if (location.id) {
      return this.getPoint(location.id);
    }
    points = this.getPointsAsArray();
    iterator = -1;
    length = points.length;
    while (++iterator < length) {
      point = points[iterator];
      if (point.latLng.equals(location)) {
        return point;
      }
    }
    return false;
  };

  location;

  DataManager.prototype.getPoints = function() {
    return this._points || false;
  };

  DataManager.prototype.getPointsAsArray = function() {
    var key, prop, result, _ref;

    result = [];
    _ref = this._points;
    for (key in _ref) {
      prop = _ref[key];
      result.push(prop);
    }
    return result;
  };

  DataManager.prototype.clearPoint = function(id) {
    var point;

    point = this._points[id];
    this._points[id] = null;
    return point;
  };

  DataManager.prototype.clearPoints = function() {
    var points;

    points = this._points;
    this._points = {};
    return points;
  };

  DataManager.prototype.setPoint = function(point) {
    if (!(point.info && point.info.id)) {
      return false;
    }
    point.isPoint = true;
    point.latLng = new google.maps.LatLng(point.latitude, point.longitude);
    point.latLng.id = point.info.id;
    point.waypoint = {
      'location': point.latLng,
      'stopover': true
    };
    this._points[point.info.id] = point;
    return this;
  };

  DataManager.prototype.setPoints = function(points) {
    var iterator, length;

    this._points || (this._points = {});
    iterator = -1;
    length = points.length;
    while (++iterator < length) {
      this.setPoint(points[iterator]);
    }
    return this;
  };

  DataManager.prototype.getRoute = function(id) {
    return this._routes[id] || false;
  };

  DataManager.prototype.getRoutes = function() {
    return this._routes || false;
  };

  DataManager.prototype.getRoutesAsArray = function() {
    var key, prop, result, _ref;

    result = [];
    _ref = this._routes;
    for (key in _ref) {
      prop = _ref[key];
      result.push(prop);
    }
    return result;
  };

  DataManager.prototype.clearRoute = function(id) {
    var route;

    route = this._routes[id];
    this._routes[id] = null;
    return route;
  };

  DataManager.prototype.clearRoutes = function() {
    var routes;

    routes = this._routes;
    this._routes = {};
    return routes;
  };

  DataManager.prototype.setRoute = function(route) {
    var iterator, length, point_, points, points_, route_;

    points = [];
    iterator = -1;
    points_ = route.route;
    length = points_.length;
    while (++iterator < length) {
      point_ = this.getPoint(points_[iterator].id);
      if (point_) {
        points.push(point_);
      }
    }
    route_ = {
      'image': route.image,
      'name': route.name,
      'description': route.description,
      'origin': points[0],
      'destination': points[points.length - 1],
      'waypoints': []
    };
    points = route_.points = points.slice(1, points.length - 1);
    iterator = -1;
    length = points.length;
    while (++iterator < length) {
      route_.waypoints.push(points[iterator].waypoint);
    }
    this._routes[route.id] = route_;
    return this;
  };

  DataManager.prototype.setRoutes = function(routes) {
    var iterator, length;

    this._routes || (this._routes = {});
    iterator = -1;
    length = routes.length;
    while (++iterator < length) {
      this.setRoute(routes[iterator]);
    }
    return this;
  };

  exports.DataManager = DataManager;

}).call(this);
;
/*
Here be coffee
*/


(function() {
  var $, $$, $div, exports, supports, vendors, vendorsLength, __slice__;

  exports = this;

  exports.console || (exports.console = {});

  exports.console.log || (exports.console.log = function() {});

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
    if (prop in $div.style) {
      return prop;
    }
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
  var LocationManager, app, exports, locationManager;

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

  LocationManager.prototype.once = function(listener) {
    var listener_,
      _this = this;

    if (this.position) {
      listener(this.position);
      return this;
    }
    listener_ = function(position) {
      listener(_this.position);
      return _this.off(listener_);
    };
    this.listeners.push(listener_);
    return this;
  };

  LocationManager.prototype.off = function(listener) {
    var iterator, length;

    iterator = -1;
    length = this.listeners.length;
    while (++iterator < length) {
      if (this.listeners[iterator] === listener) {
        this.listeners[iterator] = null;
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

}).call(this);
;
(function() {
  var MapView, app, exports;

  exports = this;

  app = exports.app || (exports.app = {});

  MapView = function($node, options) {
    var _this = this;

    this._$node = $node;
    this.options = options;
    this._mapStyles = {};
    this._map = new google.maps.Map($node, options);
    this._markers = [];
    this._marker = null;
    app.locationManager.on(function() {
      return _this.onLocationUpdate.apply(_this, arguments);
    });
    google.maps.event.addListener(this._map, 'click', function() {
      return _this.onClick.apply(_this, arguments);
    });
    return this;
  };

  MapView.prototype.setRenderer = function(options) {
    if (this.renderer) {
      this.renderer.setMap(null);
    }
    this.renderer = new google.maps.DirectionsRenderer(options);
    this.renderer.setMap(this._map);
    return this;
  };

  MapView.prototype.setPolylineOptions = function(options) {
    this.renderer.set('polylineOptions', options);
    return this;
  };

  MapView.prototype.setService = function(options) {
    this.service = new google.maps.DirectionsService(options);
    return this;
  };

  MapView.prototype.activateMapStyle = function(name) {
    if (!this._mapStyles[name]) {
      return;
    }
    this._map.mapTypes.set(name, this._mapStyles[name]);
    this._map.setMapTypeId(name);
    return this;
  };

  MapView.prototype.setMapStyle = function(name, style) {
    this._mapStyles[name] = new google.maps.StyledMapType(style, {
      'name': name
    });
    return this;
  };

  MapView.prototype.setMapStyles = function(styles) {
    var key, value;

    for (key in styles) {
      value = styles[key];
      this.setMapStyle(key, value);
    }
    return this;
  };

  MapView.prototype.setIcon = function(name, icon) {
    var size;

    this._icons || (this._icons = {});
    size = new google.maps.Size(icon.size[0], icon.size[1]);
    this._icons[name] = {
      'scaledSize': size,
      'size': size,
      'url': icon.url
    };
    return this;
  };

  MapView.prototype.getIcon = function(name) {
    if (!this._icons) {
      return false;
    }
    return this._icons[name] || this._icons['default'] || false;
  };

  MapView.prototype.setIcons = function(icons) {
    var key, value;

    this._icons || (this._icons = {});
    for (key in icons) {
      value = icons[key];
      this.setIcon(key, value);
    }
    return this;
  };

  MapView.prototype.setRouteBoxer = function(routeBoxer) {
    this._boxer = routeBoxer;
    return this;
  };

  MapView.prototype.onLocationUpdate = function(position) {
    var coords, latLng;

    coords = position.coords;
    latLng = new google.maps.LatLng(coords.latitude, coords.longitude);
    if (this._currentUser) {
      this._currentUser.setPosition(latLng);
    } else {
      this._currentUser = new google.maps.Marker({
        'position': latLng,
        'map': this._map,
        'icon': this.getIcon('user'),
        'title': 'Huidige locatie.',
        'animation': google.maps.Animation.DROP,
        'flat': true,
        'optimized': false,
        'visible': true
      });
    }
    return this;
  };

  MapView.prototype.clear = function() {
    var iterator, length, marker;

    iterator = -1;
    length = this._markers.length;
    while (++iterator < length) {
      marker = this._markers[iterator];
      marker.setMap(null);
      if (marker.infoWindow) {
        marker.infoWindow.setMap(null);
      }
    }
    this._markers = [];
    this._marker = null;
    return this;
  };

  MapView.prototype.requestRoute = function(origin, destination, distance, callback) {
    var request,
      _this = this;

    origin = origin.toString();
    destination = destination.toString();
    request = {
      'origin': origin,
      'destination': destination,
      'travelMode': google.maps.TravelMode.WALKING
    };
    this.service.route(request, function(response, status) {
      if (status !== google.maps.DirectionsStatus.OK) {
        if (!~origin.indexOf('Amsterdam')) {
          origin += ' Amsterdam, Netherlands';
          destination += ' Amsterdam, Netherlands';
          _this.requestRoute(origin, destination, distance, callback);
        } else {
          console.log('---|', _this, arguments);
          throw new Error('Uncatched error in `MapView::requestRoute`');
        }
        return;
      }
      _this.findPointsOnRoute(response, origin, destination, distance, callback);
    });
    return this;
  };

  MapView.prototype.REGEXP_LAT_LONG = /(?:\d{1,2}\.\d*),(?:\d{1,2}\.\d*)/;

  MapView.prototype.findPointsOnRoute = function(response, origin, destination, distance, callback) {
    var box, boxes, iterator, iterator_, length, length_, path, point, points, points_, summary;

    path = response.routes[0].overview_path;
    boxes = this._boxer.box(path, distance);
    points_ = app.dataManager.getPointsAsArray();
    points = [];
    iterator = -1;
    length = boxes.length;
    while (++iterator < length) {
      box = boxes[iterator];
      iterator_ = -1;
      length_ = points_.length;
      while (++iterator_ < length_) {
        point = points_[iterator_];
        if (box.contains(point.latLng)) {
          points.push(point.waypoint);
        }
      }
    }
    if (points.length > 8 && distance >= 0.2) {
      this.findPointsOnRoute(response, origin, destination, distance - 0.1, callback);
    } else if (points.length < 4 && distance < 10) {
      this.findPointsOnRoute(response, origin, destination, distance + 0.1, callback);
    } else {
      if (points.length > 8) {
        points = points.slice(0, 8);
      } else if (points.length < 1) {
        origin = origin.replace(this.REGEXP_LAT_LONG, 'huidige locatie');
        destination = destination.replace(this.REGEXP_LAT_LONG, 'huidige locatie');
        summary = response.routes[0].summary;
        if (origin === destination) {
          callback({
            'error': "De applicatie kon geen punten vinden in de buurt van\n\"" + summary + "\"."
          });
        } else {
          callback({
            'error': "De applicatie kon geen punten vinden tussen \"" + origin + "\" \nen \"" + destination + "\""
          });
        }
        return;
      }
      this.calculateRoute(points, origin, destination, callback);
    }
    return this;
  };

  MapView.prototype.metersToString = function(meters) {
    var kilometers;

    kilometers = meters / 1000;
    kilometers = Math.floor(kilometers * 10) / 10;
    return "" + kilometers + "km";
  };

  MapView.prototype.secondsToString = function(seconds) {
    var hours, minutes;

    minutes = seconds / 60;
    minutes = Math.round(minutes);
    hours = 0;
    while (minutes > 59) {
      minutes -= 60;
      hours += 1;
    }
    if (hours < 10) {
      hours = '0' + hours;
    }
    if (minutes < 10) {
      minutes = '0' + minutes;
    }
    return "" + hours + ":" + minutes;
  };

  MapView.prototype.onClick = function(event) {
    if (this._marker && this._marker.infoWindow) {
      this._marker.infoWindow.close();
      return this._marker = null;
    }
  };

  MapView.prototype.calculateRoute = function(points, origin, destination, callback) {
    var request,
      _this = this;

    request = {
      'origin': origin,
      'destination': destination,
      'waypoints': points,
      'optimizeWaypoints': true,
      'travelMode': google.maps.TravelMode.WALKING
    };
    this.service.route(request, function(response, status) {
      var address, calculatedRoute, destination_, distance, duration, index, iterator, leg, legs, length, location, origin_, point, points_, route;

      if (status !== google.maps.DirectionsStatus.OK) {
        console.log('---|', _this, arguments);
        throw new Error('Uncatched error in `MapView::calculateRoute`');
        return;
      }
      route = response.routes[0];
      legs = route.legs;
      distance = 0;
      duration = 0;
      points_ = [];
      if (origin.lat && origin.lng) {
        origin_ = app.dataManager.getPointByLocation(origin);
      }
      if (destination.lat && destination.lng) {
        destination_ = app.dataManager.getPointByLocation(destination);
      }
      iterator = 0;
      length = legs.length;
      if (origin_) {
        points_.push(origin_);
      } else {
        point = legs[0];
        points_.push({
          'isPoint': false,
          'latLng': point.start_location,
          'piece': point.start_address
        });
      }
      while (++iterator < length) {
        leg = legs[iterator];
        address = leg.start_address;
        distance += leg.distance.value;
        duration += leg.duration.value;
        index = route.waypoint_order[iterator - 1];
        if (index !== void 0) {
          location = points[index].location;
          points_.push(app.dataManager.getPointByLocation(location));
        }
      }
      if (destination_) {
        points_.push(destination_);
      } else {
        point = legs[length - 1];
        points_.push({
          'isPoint': false,
          'latLng': point.end_location,
          'piece': point.end_address
        });
      }
      calculatedRoute = {
        'points': points_,
        'origin': origin,
        'destination': destination,
        'distance': _this.metersToString(distance),
        'duration': _this.secondsToString(duration),
        'response': response
      };
      callback(calculatedRoute);
    });
    return this;
  };

  MapView.prototype.updateBounds = function() {
    var bounds, iterator, length;

    bounds = new google.maps.LatLngBounds;
    iterator = -1;
    length = this._markers.length;
    while (++iterator < length) {
      bounds.extend(this._markers[iterator].position);
    }
    if (this._currentUser) {
      bounds.extend(this._currentUser.position);
    }
    this._map.fitBounds(bounds);
    return this;
  };

  MapView.prototype.renderPoint = function(point, index, length) {
    var content, icon, title,
      _this = this;

    if (!point.isPoint) {
      if (index === length - 1) {
        icon = this.getIcon('b');
      } else if (index === 0) {
        icon = this.getIcon('a');
      } else {
        icon = this.getIcon();
      }
    } else {
      icon = this.getIcon(index);
    }
    title = point.piece;
    if (point.artist) {
      content = "<b>" + point.piece + "</b><br/>" + point.artist + "<br/>";
    } else {
      content = "<b>" + point.piece + "</b>";
    }
    window.setTimeout(function() {
      var marker;

      marker = new google.maps.Marker({
        'position': point.latLng,
        'map': _this._map,
        'icon': icon,
        'title': title,
        'animation': google.maps.Animation.DROP,
        'flat': true,
        'optimized': false
      });
      marker.infoWindow = new InfoBox({
        'map': _this._map,
        'latlng': point.latLng,
        'content': content,
        'onclick': function(event) {
          if (app.infoWindowIntent) {
            event.data = point;
            app.infoWindowIntent.apply(this, arguments);
          }
        }
      });
      _this._markers.push(marker);
      return google.maps.event.addListener(marker, 'click', function() {
        _this.onClick();
        _this._marker = marker;
        marker.infoWindow.open(_this._map);
      });
    }, index * 300);
    return this;
  };

  MapView.prototype.renderPoints = function(points, hideIndex) {
    var iterator, length, originIsPoint;

    iterator = -1;
    length = points.length;
    if (!hideIndex) {
      originIsPoint = points[0].isPoint;
      if (originIsPoint) {
        while (++iterator < length) {
          this.renderPoint(points[iterator], iterator + 1, length);
        }
      } else {
        while (++iterator < length) {
          this.renderPoint(points[iterator], iterator, length);
        }
      }
    } else {
      while (++iterator < length) {
        this.renderPoint(points[iterator], 0, length);
      }
    }
    return this;
  };

  MapView.prototype.renderRoute = function(route) {
    this.clear();
    this.updateBounds();
    this.renderer.setDirections(route.response);
    this.renderPoints(route.points);
    this.updateBounds();
    return this;
  };

  exports.MapView = MapView;

}).call(this);
;
(function() {
  var F, InfoBox, exports;

  exports = this;

  /*
  An InfoBox is like an info window, but it displays
  under the marker, opens quicker, and has flexible styling.
  @param {GLatLng} latlng Point to place bar at
  @param {Map} map The map on which to display this InfoBox.
  @param {Object} opts Passes configuration options - content,
  	 offsetVertical, offsetHorizontal, className, height, width
  */


  InfoBox = function(options) {
    google.maps.OverlayView.call(this);
    this.point = options.latlng;
    this.content = options.content;
    this.onclick = options.onclick;
    this.height = 150;
    this.width = 150;
    this.offsetVertical = -200;
    this.offsetHorizontal = -75;
    return this;
  };

  F = function() {};

  F.prototype = google.maps.OverlayView.prototype;

  InfoBox.prototype = new F;

  InfoBox.prototype.remove = function() {
    return this.close();
  };

  InfoBox.prototype.close = function() {
    if (this.$node) {
      this.$node.parentNode.removeChild(this.$node);
      this.$node = null;
    }
    this.setMap(null);
    return this;
  };

  InfoBox.prototype.open = function(map) {
    var _this = this;

    this.onboundsChange = google.maps.event.addListener(map, 'bounds_changed', function() {
      return _this.panMap();
    });
    this.setMap(map);
    return this;
  };

  InfoBox.prototype.draw = function() {
    var pixPosition;

    this.createElement();
    if (!this.$node) {
      return;
    }
    pixPosition = this.getProjection().fromLatLngToDivPixel(this.point);
    if (!pixPosition) {
      return;
    }
    this.$node.style.width = "" + this.width + "px";
    this.$node.style.left = "" + (pixPosition.x + this.offsetHorizontal) + "px";
    this.$node.style.height = "" + this.height + "px";
    this.$node.style.top = "" + (pixPosition.y + this.offsetVertical) + "px";
    this.$node.style.display = 'table';
    return this;
  };

  InfoBox.prototype.createElement = function() {
    var $content, $node, panes,
      _this = this;

    panes = this.getPanes();
    $node = this.$node;
    if (!$node) {
      $node = this.$node = document.createElement('div');
      $node.style.position = 'absolute';
      $node.style.backgroundColor = 'white';
      $node.style.textAlign = 'center';
      $node.style.boxShadow = '0 0 0 5px rgba(0,0,0,.5)';
      $node.style.textTransform = 'uppercase';
      $node.style.borderRadius = "100%";
      $node.style.zIndex = "999";
      $node.onclick = function() {
        if (_this.onclick) {
          _this.onclick.apply(_this, arguments);
        }
        return _this;
      };
      $content = document.createElement('div');
      $content.innerHTML = this.content;
      $content.style.display = 'table-cell';
      $content.style.verticalAlign = 'middle';
      $content.style.padding = '0 0.75em';
      $node.appendChild($content);
      $node.style.display = 'none';
      panes.floatPane.appendChild($node);
      return this.panMap();
    } else if ($node.parentNode !== panes.floatPane) {
      return panes.floatPane.appendChild($node.parentNode.removeChild($node));
    } else {

    }
  };

  InfoBox.prototype.panMap = function() {
    var bounds, boxEastLng, boxNorthLat, boxOffsetX, boxOffsetY, boxPaddingX, boxPaddingY, boxSouthLat, boxWestLng, center, centerX, centerY, degreesPixelX, degreesPixelY, map, mapDiv, mapEastLng, mapHeight, mapNorthLat, mapSouthLat, mapWestLng, mapWidth, position, shiftLat, shiftLng, spanBounds, spanLat, spanLong;

    map = this.map;
    bounds = map.getBounds();
    if (!bounds) {
      return;
    }
    position = this.point;
    boxOffsetX = this.offsetHorizontal;
    boxOffsetY = this.offsetVertical;
    boxPaddingX = 40;
    boxPaddingY = 40;
    mapDiv = map.getDiv();
    mapWidth = mapDiv.offsetWidth;
    mapHeight = mapDiv.offsetHeight;
    spanBounds = bounds.toSpan();
    spanLong = spanBounds.lng();
    spanLat = spanBounds.lat();
    degreesPixelX = spanLong / mapWidth;
    degreesPixelY = spanLat / mapHeight;
    mapWestLng = bounds.getSouthWest().lng();
    mapEastLng = bounds.getNorthEast().lng();
    mapNorthLat = bounds.getNorthEast().lat();
    mapSouthLat = bounds.getSouthWest().lat();
    boxWestLng = position.lng() + (boxOffsetX - boxPaddingX) * degreesPixelX;
    boxEastLng = position.lng() + (boxOffsetX + this.width + boxPaddingX) * degreesPixelX;
    boxNorthLat = position.lat() - (boxOffsetY - boxPaddingY) * degreesPixelY;
    boxSouthLat = position.lat() - (boxOffsetY + this.height + boxPaddingY) * degreesPixelY;
    shiftLng = (boxWestLng < mapWestLng ? mapWestLng - boxWestLng : 0) + (boxEastLng > mapEastLng ? mapEastLng - boxEastLng : 0);
    shiftLat = (boxNorthLat > mapNorthLat ? mapNorthLat - boxNorthLat : 0) + (boxSouthLat < mapSouthLat ? mapSouthLat - boxSouthLat : 0);
    center = map.getCenter();
    centerX = center.lng() - shiftLng;
    centerY = center.lat() - shiftLat;
    map.panTo(new google.maps.LatLng(centerY, centerX));
    google.maps.event.removeListener(this.onboundsChange);
    return this.onboundsChange = null;
  };

  exports.InfoBox = InfoBox;

}).call(this);
;
(function() {
  var app, exports;

  exports = this;

  app = exports.app || (exports.app = {});

  app.options || (app.options = {});

  app.options.directionsRenderer = {
    'suppressMarkers': true,
    'suppressInfoWindows': true
  };

  app.options.polylineOptions = {
    'strokeColor': '#5e99b0',
    'strokeOpacity': 0.8,
    'strokeWeight': 3
  };

  app.options.mapStyles = {
    'dark': [
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
    ]
  };

  app.options.icons = {
    '1': {
      'size': [20, 35],
      'url': './asset/image/map/marker_closed_1.png'
    },
    '2': {
      'size': [20, 35],
      'url': './asset/image/map/marker_closed_2.png'
    },
    '3': {
      'size': [20, 35],
      'url': './asset/image/map/marker_closed_3.png'
    },
    '4': {
      'size': [20, 35],
      'url': './asset/image/map/marker_closed_4.png'
    },
    '5': {
      'size': [20, 35],
      'url': './asset/image/map/marker_closed_5.png'
    },
    '6': {
      'size': [20, 35],
      'url': './asset/image/map/marker_closed_6.png'
    },
    '7': {
      'size': [20, 35],
      'url': './asset/image/map/marker_closed_7.png'
    },
    '8': {
      'size': [20, 35],
      'url': './asset/image/map/marker_closed_8.png'
    },
    'a': {
      'size': [20, 35],
      'url': './asset/image/map/marker_closed_a.png'
    },
    'b': {
      'size': [20, 35],
      'url': './asset/image/map/marker_closed_b.png'
    },
    'user': {
      'size': [19, 19],
      'url': './asset/image/map/marker_closed_user.png'
    },
    'default': {
      'size': [20, 35],
      'url': './asset/image/map/marker_closed.png'
    }
  };

}).call(this);
;
(function() {
  var Carousel, exports;

  exports = this;

  Carousel = function($node, insertController) {
    var $controller, $hammer, $item, handler, items, iterator, length,
      _this = this;

    this.$node = $node;
    this.$container = $node.$$('.carousel-list');
    this.$panes = $node.$('.carousel-list > li');
    this.paneWidth = 0;
    this.paneCount = this.$panes.length;
    this.paneCurrent = 0;
    if (insertController) {
      this.$controller = $controller = document.createElement('ul');
      $controller.classList.add('carousel-controller');
      items = [];
      iterator = -1;
      length = this.paneCount;
      while (++iterator < length) {
        items[iterator] = "<li><a href=\"#\" data-id=\"" + iterator + "\">" + (iterator + 1) + "</a></li>";
      }
      $controller.innerHTML = items.join('');
      this.$items = $controller.$('li');
      $item = $controller.$$("[data-id='" + this.paneCurrent + "']");
      $item.parentElement.classList.add('active');
      $node.appendChild($controller);
    }
    $hammer = Hammer($node, {
      'drag_lock_to_axis': true
    });
    $hammer.on('release dragleft dragright swipeleft swiperight', function() {
      return _this.handleHammer.apply(_this, arguments);
    });
    this.$controller.addEventListener('click', function(event) {
      if ('a' === event.target.tagName.toLowerCase()) {
        return _this.handleController(event);
      }
    });
    this.setPaneDimensions();
    handler = function() {
      return _this.setPaneDimensions();
    };
    window.addEventListener('load', handler);
    window.addEventListener('resize', handler);
    window.addEventListener('orientationchange', handler);
    return this;
  };

  Carousel.prototype.setPaneDimensions = function() {
    var iterator, length;

    this.paneWidth = this.$node.getBoundingClientRect().width;
    iterator = -1;
    length = this.paneCount;
    while (++iterator < length) {
      this.$panes[iterator].style.width = this.paneWidth + 'px';
    }
    this.$container.style.width = (this.paneWidth * this.paneCount) + 'px';
    return this;
  };

  Carousel.prototype.showPane = function(index) {
    var $item, iterator, length;

    this.paneCurrent = Math.max(0, Math.min(index, this.paneCount - 1));
    if (this.$items) {
      iterator = -1;
      length = this.$items.length;
      while (++iterator < length) {
        this.$items[iterator].classList.remove('active');
      }
      $item = this.$controller.$$("[data-id='" + this.paneCurrent + "']");
      $item.parentElement.classList.add('active');
    }
    this.setContainerOffset((100 / this.paneCount) * -this.paneCurrent, true);
    return this;
  };

  Carousel.prototype.setContainerOffset = function(percent, animate) {
    var transform;

    if (animate) {
      this.$container.classList.add('animate');
    }
    if (transform = supports('transform')) {
      if (animate) {
        this.$container.style[transform] = "translate3d(" + percent + "%,0,0) scale3d(1,1,1)";
      } else {
        this.$container.style[transform] = "translate3d(" + percent + "%,0,0) scale3d(0.95,0.95,1)";
      }
    } else {
      this.$container.style.left = "" + (percent * this.paneCount) + "%";
    }
    if (!animate) {
      this.$container.classList.remove('animate');
    }
    return this;
  };

  Carousel.prototype.next = function() {
    return this.showPane(this.paneCurrent + 1, true);
  };

  Carousel.prototype.prev = function() {
    return this.showPane(this.paneCurrent - 1, true);
  };

  Carousel.prototype.handleController = function(event) {
    var $target, id;

    $target = event.target;
    id = +$target.dataset.id;
    event.preventDefault();
    event.stopPropagation();
    this.showPane(id, true);
    return this;
  };

  Carousel.prototype.handleHammer = function(event) {
    var direction, offsetDrag, offsetPane, type;

    event.gesture.preventDefault();
    type = event.type;
    direction = event.gesture.direction;
    if (type === 'dragright' || type === 'dragleft') {
      offsetPane = (100 / this.paneCount) * -this.paneCurrent;
      offsetDrag = ((100 / this.paneWidth) * event.gesture.deltaX) / this.paneCount;
      if ((this.paneCurrent === 0 && direction === Hammer.DIRECTION_RIGHT) || (this.paneCurrent === this.paneCount - 1 && direction === Hammer.DIRECTION_LEFT)) {
        offsetDrag *= 0.4;
      }
      this.setContainerOffset(offsetDrag + offsetPane);
    } else if (type === 'swipeleft') {
      this.next();
      event.gesture.stopDetect();
    } else if (type === 'swiperight') {
      this.prev();
      event.gesture.stopDetect();
    } else if (type === 'release') {
      if (this.paneWidth / 2 < Math.abs(event.gesture.deltaX)) {
        if (direction === 'right') {
          this.prev();
        } else {
          this.next();
        }
      } else {
        this.showPane(this.paneCurrent, true);
      }
    }
    return this;
  };

  exports.Carousel = Carousel;

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
  var Planner, exports;

  exports = this;

  Planner = function($node, insertController) {
    var $hammer,
      _this = this;

    this.$node = $node;
    this.height = window.innerHeight;
    this.nodeHeight = $node.getBoundingClientRect().height;
    $hammer = Hammer($node, {
      'drag_lock_to_axis': true
    });
    $hammer.on('touch swipedown swipeup dragup dragdown release', function() {
      return _this.handleHammer.apply(_this, arguments);
    });
    return this;
  };

  Planner.prototype.setContainerOffset = function(delta, animate) {
    var offset;

    this.$node.classList[animate ? 'add' : 'remove']('animate');
    if (delta > 0) {
      delta = delta * 0.3;
    } else if (delta < -this.nodeHeight) {
      delta = -this.nodeHeight + ((this.nodeHeight + delta) * 0.3);
    }
    offset = (-delta / this.height) * 100;
    this.$node.style.bottom = "" + (100 - offset) + "%";
    return this;
  };

  Planner.prototype.show = function() {
    this.setContainerOffset(-this.nodeHeight, true);
    if (this.onshow) {
      this.onshow(this);
    }
    return this;
  };

  Planner.prototype.hide = function() {
    this.setContainerOffset(0, true);
    if (this.onhide) {
      this.onhide(this);
    }
    return this;
  };

  Planner.prototype.handleHammer = function(event) {
    var direction, type;

    if (event.target !== this.$node) {
      return;
    }
    event.gesture.preventDefault();
    event.preventDefault();
    type = event.type;
    direction = event.gesture.direction;
    if (type === 'dragup' || type === 'dragdown') {
      this.setContainerOffset(-1 * event.gesture.center.pageY);
    } else if (type === 'swipedown') {
      this.show();
    } else if (type === 'swipeup') {
      this.hide();
    } else if (type === 'release') {
      if (this.nodeHeight / 2 < Math.abs(event.gesture.deltaY)) {
        if (direction === 'up') {
          this.hide();
        } else {
          this.show();
        }
      } else {
        this.show();
      }
    }
    return this;
  };

  exports.Planner = Planner;

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
(function() {
  var $info, $map, $planFrom, $planRoute, $planTo, $planner, $startupImage, $uitgestippeld, $uitgestippeldCarousel, $w1, $w2, $w3, $w4, $w5, $walkthrough, REGEXP_CURRENT_LOCATION, app, exports, mapView, planner;

  exports = this;

  app = exports.app || (exports.app = {});

  app.dataManager = new DataManager;

  app.dataManager.setPoints(app.data);

  app.dataManager.setRoutes(app.route);

  $planner = $$('.planner');

  $planRoute = $$('#plan-route');

  $planTo = $$('#plan-route-to');

  $planFrom = $$('#plan-route-from');

  $info = $$('.info-modal');

  $uitgestippeld = $$('.uitgestippeld-modal');

  $walkthrough = $$('.walkthrough-modal');

  $uitgestippeldCarousel = $$('.uitgestippeld-modal .carousel');

  $startupImage = $$('.startup-image');

  $map = $$('.home-modal');

  app.pointToString = function(point) {
    return "<header class=\"bar-title\">\n	<h3 class=\"title\"><div class=\"overflow-wrapper\">" + point.piece + "</div></h3>\n	<a class=\"button\" href=\"#info-modal\">\n		Close\n	</a>\n</header>\n<div class=\"content\">\n	<div class=\"img\" style=\"background-image:url(./asset/image/data/" + point.info.id + "_large.jpg)\">\n		<img class=\"hidden\" alt=\"\" src=\"./asset/image/data/" + point.info.id + "_large.jpg\">\n	</div>\n	<div class=\"info-wrapper\">\n		<h1>" + point.info.title + "</h1>\n		<h2>" + point.artist + "</h2>\n		<p>" + point.info.description + "</p>\n		<a class=\"button-primary button-block button-large\" href=\"" + point.link + "\">Op naar het Rijks!</a>\n	</div>\n</div>";
  };

  app.infoWindowIntent = function(event) {
    var point;

    point = event.data;
    if (!point.isPoint) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    $info.innerHTML = app.pointToString(point);
    $info.classList.add('active');
    return void 0;
  };

  mapView = app.mapView = new MapView($$('#map-canvas'), {
    'zoom': 14,
    'center': new google.maps.LatLng(52.359903, 4.884131),
    'disableDefaultUI': true
  });

  mapView.setMapStyles(app.options.mapStyles);

  mapView.setIcons(app.options.icons);

  mapView.setRenderer(app.options.directionsRenderer);

  mapView.setPolylineOptions(app.options.polylineOptions);

  mapView.setService(null);

  mapView.setRouteBoxer(new RouteBoxer);

  mapView.activateMapStyle('dark');

  REGEXP_CURRENT_LOCATION = /huidige locatie/i;

  $planRoute.on('click', function(event) {
    var callback, destination, distance, origin;

    event.preventDefault();
    event.stopPropagation();
    $planRoute.classList.add('loading');
    origin = $planFrom.value;
    destination = $planTo.value;
    distance = 0.5;
    origin || (origin = 'Huidige locatie');
    destination || (destination = 'Huidige locatie');
    callback = function(route) {
      console.log('route', route);
      if (route.error) {
        alert("Sorry. Er trad een fout op in de applicatie: " + route.error);
        console.log('ERROR!', arguments);
      } else {
        app.mapView.renderRoute(route);
        planner.hide();
      }
      $planRoute.classList.remove('loading');
    };
    if (REGEXP_CURRENT_LOCATION.test(origin) || REGEXP_CURRENT_LOCATION.test(destination)) {
      app.locationManager.once(function(position) {
        var coords;

        coords = [position.coords.latitude, position.coords.longitude];
        if (REGEXP_CURRENT_LOCATION.test(origin)) {
          origin = coords;
        }
        if (REGEXP_CURRENT_LOCATION.test(destination)) {
          destination = coords;
        }
        return app.mapView.requestRoute(origin, destination, distance, callback);
      });
    } else {
      app.mapView.requestRoute(origin, destination, distance, callback);
    }
    return void 0;
  });

  window.on('click', function(event) {
    var $parent, $target, route;

    $target = event.target;
    if (!$target.classList.contains('uitgestippeld-link')) {
      $parent = $target.parentElement;
      if ($parent.classList.contains('uitgestippeld-link')) {
        $target = $parent;
      } else {
        return;
      }
    }
    route = app.dataManager.getRoute($target.dataset.id);
    if (!route) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    $target.classList.add('loading');
    app.mapView.calculateRoute(route.waypoints, route.origin.latLng, route.destination.latLng, function(route) {
      $target.classList.remove('loading');
      console.log('route', route);
      if (route.error) {
        alert("Sorry. Er trad een fout op in de applicatie: " + route.error);
        return console.log('ERROR!', arguments);
      } else {
        app.mapView.renderRoute(route);
        planner.hide();
        return $uitgestippeld.classList.remove('active');
      }
    });
    return void 0;
  });

  new Carousel($uitgestippeldCarousel, true);

  planner = new Planner($planner);

  window.setTimeout((function() {
    return $startupImage.classList.add('hidden');
  }), 500);

  $w1 = $$('.walkthrough-modal .p1');

  $w2 = $$('.walkthrough-modal .p2');

  $w3 = $$('.walkthrough-image');

  $w4 = $$('.walkthrough-modal .p3');

  $w5 = $$('.walkthrough-end');

  window.setTimeout(function() {
    return $walkthrough.classList.add('active');
  }, 800);

  window.setTimeout(function() {
    $w1.classList.remove('hidden');
    planner.show();
    $planner.style.height = '100%';
    $map.classList.add('active');
    return app.mapView.renderPoints(app.dataManager.getPointsAsArray(), true);
  }, 1500);

  window.setTimeout(function() {
    return $w2.classList.remove('hidden');
  }, 2000);

  window.setTimeout(function() {
    return $w3.classList.remove('hidden');
  }, 2500);

  window.setTimeout(function() {
    return $w4.classList.remove('hidden');
  }, 3000);

  window.setTimeout(function() {
    return $w5.classList.remove('hidden');
  }, 3500);

  window.setTimeout((function() {
    return $startupImage.style.display = 'none';
  }), 1100);

  window.on('load', function() {
    return app.locationManager.request();
  });

}).call(this);
