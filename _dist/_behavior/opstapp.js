/*! opstapp - v0.0.1 - 2013-05-22
* https://github.com/wooorm/opstapp
* Copyright (c) 2013 wooorm; Licensed MIT */
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
  var $, $$, exports, __slice__;

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

  $.NodeList.prototype.$ = function() {
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

}).call(this);
;
(function() {
  var $map, directionsRenderer, directionsService, exports, map, start, styledMap;

  exports = this;

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

  start = new google.maps.LatLng(52.359903, 4.884131);

  map = new google.maps.Map($map, {
    'zoom': 14,
    'center': start,
    'mapTypeControlOptions': {
      'mapTypeIds': [google.maps.MapTypeId.ROADMAP, 'map_style']
    }
  });

  map.mapTypes.set('map_style', styledMap);

  map.setMapTypeId('map_style');

  directionsService = new google.maps.DirectionsService;

  directionsRenderer = new google.maps.DirectionsRenderer;

  directionsRenderer.setMap(map);

  exports.calculateRoute = function(start, end) {
    var destination, origin, request, travelMode;

    origin = start.toString();
    destination = end.toString();
    travelMode = google.maps.DirectionsTravelMode.WALKING;
    request = {
      'origin': origin,
      'destination': destination,
      'travelMode': travelMode
    };
    return directionsService.route(request, function(response, status) {
      if (status === google.maps.DirectionsStatus.OK) {
        return directionsRenderer.setDirections(response);
      }
    });
  };

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
  var $backdrop, getTargets, onPopoverHidden;

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
    return popover.removeEventListener('webkitTransitionEnd', onPopoverHidden);
  };

  $backdrop = (function() {
    var $node;

    $node = document.createElement('div');
    $node.classList.add('backdrop');
    $node.on('touchend', function() {
      popover.on('webkitTransitionEnd', onPopoverHidden);
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
  var $meestermatcherController, $meestermatcherControllers, $meestermatcherNext, getTargets;

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

  $meestermatcherNext = ($('#meestermatcher-next')).item();

  $meestermatcherNext.on('click', function(event) {
    var $active, $active_, $target, hash, index;

    hash = $meestermatcherNext.hash;
    $target = $$(hash);
    if (!$target) {
      return;
    }
    $active = $target.parentNode.$$('.active');
    event.preventDefault();
    event.stopPropagation();
    if ($active) {
      $active.classList.remove('active');
    }
    $target.classList.add('active');
    index = +hash.slice(5);
    index++;
    $meestermatcherNext.hash = '#step' + index;
    $active_ = $meestermatcherController.$$('.active');
    $active_.classList.remove('active');
    $active_.nextElementSibling.classList.add('active');
  });

  $meestermatcherController = ($('#meestermatcher-controller')).item();

  $meestermatcherControllers = $meestermatcherController.$('#meestermatcher-controller a');

  $meestermatcherController.on('click', function(event) {
    var $active, $active_, $target, hash, index;

    if ('a' !== event.target.tagName.toLowerCase()) {
      return;
    }
    hash = event.target.hash;
    $target = $$(hash);
    console.log(this, this.hash);
    if (!$target) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    $active = $target.parentNode.$$('.active');
    $active_ = $meestermatcherController.$$('.active');
    if ($active) {
      $active.classList.remove('active');
    }
    if ($active_) {
      $active_.classList.remove('active');
    }
    $target.classList.add('active');
    event.target.parentElement.classList.add('active');
    index = +hash.slice(5);
    index++;
    return $meestermatcherNext.hash = '#step' + index;
  });

  console.log($meestermatcherController, $meestermatcherControllers);

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
  var $planFrom, $planRoute, $planRouteModal, $planTo, exports, home;

  exports = this;

  /*
  Plan-my-route modal.
  */


  $planRouteModal = ($('#plan-route-modal')).item();

  exports.home = home = function(boolean) {
    boolean === !!boolean || (boolean = !$planRouteModal.classList.contains('active'));
    if (boolean) {
      return $planRouteModal.classList.add('active');
    } else {
      return $planRouteModal.classList.remove('active');
    }
  };

  $planRoute = ($('#plan-route')).item();

  $planTo = ($('#plan-route-to')).item();

  $planFrom = ($('#plan-route-from')).item();

  $planRoute.on('click', function(event) {
    var destination, origin;

    origin = $planTo.value;
    destination = $planFrom.value;
    if (origin === '' && destination === '') {
      return;
    }
    home(false);
    return calculateRoute(origin, destination);
  });

}).call(this);
