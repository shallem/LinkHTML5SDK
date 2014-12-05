/**
 * Within Viewport
 *
 * @description Determines whether an element is completely
 *              within the browser viewport
 * @author      Craig Patik, http://patik.com/
 * @version     0.0.3
 * @date        2014-03-03
 */
;(function() {
    
    var withinViewportConfig = function _getConfig(options) {
        var config = {};
        var settings = {};
        
        // Settings argument may be a simple string (`top`, `right`, etc)
        if (typeof options === 'string') {
            settings = {sides: options};
        }
        else {
            settings = options || {};
        }
        
        // Build configuration from defaults and given settings
        config.container = settings.container || withinViewport.defaults.container || document.body;
        config.sides = settings.sides || withinViewport.defaults.sides || 'all';
        config.top = settings.top || withinViewport.defaults.top || 0;
        config.right = settings.right || withinViewport.defaults.right || 0;
        config.bottom = settings.bottom || withinViewport.defaults.bottom || 0;
        config.left = settings.left || withinViewport.defaults.left || 0;
        
        return config;
    };
    
    /**
     * withinViewport
     * @param  {Object} [elem]      DOM Element, required
     * @param  {Object} [config]   Optional settings
     * @param  {Object} [scrollOffset]   Scroll offset obtained from scrollOffset call
     * @return {Boolean}            Whether the element was completely within the viewport
    */
    var withinViewport = function _withinViewport(elem, config, scrollOffset) {
        var result = false, isWithin, elemOffset, arr, i, side;

        if (elem instanceof jQuery) {
            elem = elem.get(0);
        }

        if (typeof elem !== 'object' || elem.nodeType !== 1) {
            throw new Error('First argument must be an element');
        }

        // Element testing methods
        isWithin = {
            // Element is below the top edge of the viewport
            top: function _isWithin_top() {
                return elemOffset[1] + elem.offsetHeight >= scrollOffset[1] + config.top;
            },
            
            // Element's bottom is below the top of the scroll view.
            topvisible: function _isWithin_top() {
                return elemOffset[1] >= scrollOffset[1] + config.top;
            },

            // Element is to the left of the right edge of the viewport
            right: function _isWithin_right() {
                var container = (config.container === document.body) ? window : config.container;

                return elemOffset[0] + elem.offsetWidth <= container.clientWidth + scrollOffset[0] - config.right;
            },

            // Element's bottom is above the bottom edge of the viewport
            bottom: function _isWithin_bottom() {
                var container = (config.container === document.body) ? window : config.container;

                return elemOffset[1] + elem.offsetHeight <= scrollOffset[1] + container.clientHeight - config.bottom;
            },
            
            // Element's top is above the bottom edge of the viewport.
            bottomvisible: function _isWithin_bottomVisible() {
                var container = (config.container === document.body) ? window : config.container;

                return elemOffset[1] <= scrollOffset[1] + container.clientHeight - config.bottom;
            },

            // Element is to the right of the left edge of the viewport
            left: function _isWithin_left() {
                return elemOffset[0] >= scrollOffset[0] + config.left;
            },

            all: function _isWithin_all() {
                return (isWithin.top() && isWithin.right() && isWithin.bottom() && isWithin.left());
            }
        };

        /* SAH - this calculation was originally not right. The offsetTop property is the offset from
         * the offsetParent node in the DOM. If node A and its parent B have the same offsetParent then
         * the elemOffset from the container should actually be A.offsetTop - B.offsetTop (b/c both are relative
         * to the same element).
         */
        elemOffset = (function _elemOffset() {
            var el = elem,
                x = 0,
                y = 0,
                parent = null;

            while (el) {
                if (el === config.container) {
                    break;
                }

                x += el.offsetLeft;
                parent = el.parentNode;

                if (parent.offsetParent === el.offsetParent) {
                    y += (el.offsetTop - parent.offsetTop);
                } else {
                    y += el.offsetTop;
                }
                el = el.parentNode;
            }

            return [x, y];
        })();

        // Test the element against each side of the viewport that was requested
        arr = config.sides.split(' ');
        i = arr.length;
        while (i--) {
            side = arr[i].toLowerCase();
            if (/top|right|bottom|left|all/.test(side)) {
                if (isWithin[side]()) {
                    result = true;
                }
                else {
                    result = false;
                    // Quit as soon as the first failure is found
                    break;
                }
            }
        }

        return result;
    }; // end of `withinViewport()`

    var scrollOffset = function _scrollOffset(config) {
        // Whether we can use the `<html`> element for `scrollTop`
        // Unfortunately at the moment I can't find a way to do this without UA-sniffing
        var useHtmlElem = !/Chrome/.test(navigator.userAgent);
        
        var x = $(config.container).scrollLeft(),
            y = $(config.container).scrollTop();

        if (y === 0) {
            if (config.container.pageYOffset) {
                y = config.container.pageYOffset;
            }
            else if (window.pageYOffset) {
                y = window.pageYOffset;
            }
            else {
                if (config.container === document.body) {
                    if (useHtmlElem) {
                        y = (config.container.parentElement) ? $(config.container.parentElement).scrollTop() : 0;
                    }
                    else {
                        y = (config.container.parentElement) ? $(config.container.parentElement).scrollTop() : 0;
                    }
                }
                else {
                    y = (config.container.parentElement) ? $(config.container.parentElement).scrollTop() : 0;
                }
            }
        }

        if (x === 0) {
            if (config.container.pageXOffset) {
                x = config.container.pageXOffset;
            }
            else if (window.pageXOffset) {
                x = window.pageXOffset;
            }
            else {
                if (config.container === document.body) {
                    x = (config.container.parentElement) ? $(config.container.parentElement).scrollLeft() : 0;
                }
                else {
                    x = (config.container.parentElement) ? $(config.container.parentElement).scrollLeft() : 0;
                }
            }
        }

        return [x, y];
    };

    // Default settings
    withinViewport.prototype.defaults = {
        container: document.body,
        sides: 'all',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
    };

    withinViewport.defaults = withinViewport.prototype.defaults;

    // Make function available globally
    window.withinViewport = withinViewport;
    window.viewportScrollOffset = scrollOffset;
    window.withinViewportConfig = withinViewportConfig;

    /**
     * Optional enhancements and shortcuts
     *
     * @description Uncomment or comment these pieces as they apply to your project and coding preferences
     */

    // Shortcut methods for each side of the viewport
    // Ex: withinViewport.top(elem) is the same as withinViewport(elem, 'top')
    withinViewport.prototype.top = function _withinViewport_top(element) {
        return withinViewport(element, 'top');
    };

    withinViewport.prototype.right = function _withinViewport_right(element) {
        return withinViewport(element, 'right');
    };

    withinViewport.prototype.bottom = function _withinViewport_bottom(element) {
        return withinViewport(element, 'bottom');
    };

    withinViewport.prototype.left = function _withinViewport_left(element) {
        return withinViewport(element, 'left');
    };
})();
