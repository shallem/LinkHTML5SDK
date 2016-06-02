/*
 * Copyright 2013 Mobile Helix, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Client-side layout functions.
 * 
 * @author Seth Hallem
 */

$(document).on('resumeActive', function() {
    // This is called when we open a window by switching windows. At this point, a header bar has
    // been added to the app screen, which decreases the size of the webview enclosing our app. We 
    // need to resize our app appropriately.
    Helix.Layout.layoutPage();
});

Helix.Layout = {
    /**
     * Selectors used to identify scrollers.
     */
    scrollerSel : '.pm-scroller,.pm-scroller-nozoom,.pm-scroller-zoomonly,.pm-scroller-horizontal',

    /**
     * Selectors used to identify full height components.
     */
    fullHeightClasses: [
        '.pm-layout-full-height',
        '.hx-layout-full-height',
        '.mh-layout-parent-height',
        '.hx-overlay-full-height',
        '.hx-layout-parent-height',
        /* Include built-in jQM wrapper classes. These classes are inserted in between
         * two elements with a user-controllable class list. If the parent has a recursive 
         * layout class then we want to layout the child, even though it will not have any
         * layout classes attached to it. If the parent does no have a recursive layout class
         * attached then the class' presence here means nothing.
         */
        '.ui-panel-inner'
    ],
    
    /**
     * Selectors used to identify components that should be recursively laid out.
     */
    recurseLayoutClasses: [
        '.pm-layout-full-height',
        '.hx-layout-full-height',
        '.hx-overlay-full-height',
        '.hx-layout-recurse'
    ],

    /**
     * List of all scrollers in the application.
     */
    allScrollers : {},
    
    /**
     * Content height, excluding headers and footers.
     */
    contentHeight : 0,
    
    /**
     * Determine if an element is a scrolling element.
     */
    isScroller : function(elem) {
        if (elem && $(elem).is(Helix.Layout.scrollerSel)) {
            return true;
        }
        return false;
    },

    /**
     * Determine if an element is contained within a scrolling element.
     */
    isInScroller : function(elem) {
        if (elem && ($(elem).closest(Helix.Layout.scrollerSel).length !== 0)) {
            return true;
        }
        return false;
    },
        
    /**
     * Layout a component that should have height maxHeight. This function also
     * recursively lays out the children of the parent component such that the 
     * aggregated height of all child components is equal to maxHeight. It does so
     * by extending the length of the last child to equal the remaining vertical 
     * distance when the height of all children except the last are subtracted from
     * maxHeight.
     * 
     * @param maxHeight
     *      The target height for the supplied component.
     * @param component
     *      The target component whose height should be set to maxHeight.
     */
    layoutFullHeightComponent: function(maxHeight, component) {
        var paddingPixels = $(component).outerHeight(true) - $(component).height();
        var offsetPixels = 0;
        var fullHeightSelector = Helix.Layout.fullHeightClasses.join(",");
        var recurseSelector = Helix.Layout.recurseLayoutClasses.join(",");
        
        if ($(component).css('top') !== 'auto') {
            // Doesn't handle all unit types.
            var cssAuto = $(component).css('top');
            offsetPixels = parseInt(cssAuto, 10);
        }
        
        var totHeight = paddingPixels + offsetPixels;
        $(component).height(maxHeight - totHeight);
        
        if (!$(component).is(recurseSelector)) {
            /* Set the layout to the parent height and do
             * not recurse any further.
             */
            return;
        }
        
        var children = $(component).children();
        var remainingHeight = offsetPixels;
        var $fullHeightChild = null;
        for (var i = 0; i < children.length; ++i) {
            if ($(children[i]).is("style,script")) {
                // Skip style and script tags - see note at http://api.jquery.com/height/
                continue;
            }
            if ($(children[i]).is(fullHeightSelector)) {
                // These items must be side-by-side, otherwise the proposed layout is fully overlapping ...
                continue;
            }
            if (!$(children[i]).is(":visible")) {
                continue;
            }
            if ($(children[i]).is('.hx-full-height-skip')) {
                continue;
            }

            $fullHeightChild = $(children[i]);
            var child_i_height = $($fullHeightChild).outerHeight(true);
            totHeight += child_i_height;
            remainingHeight += child_i_height;
        }        
        var childrenToRecurse = $(component).children(fullHeightSelector);
        
        /* If there are no elements to recurse over, set the last child of this element to full the 
         * rest of the screen.
         */
        if (childrenToRecurse.length === 0) {
            if ($fullHeightChild) {
                totHeight -= $fullHeightChild.outerHeight(true);
                remainingHeight -= $fullHeightChild.outerHeight(true);
                var minHeight = $fullHeightChild.css('min-height');
                var newHeight = maxHeight - remainingHeight;
                if (minHeight && newHeight < minHeight) {
                    // never resize to less than the min height.
                } else if (newHeight > 0) {
                    $fullHeightChild.height(newHeight);
                }
            }
        } else {
            childrenToRecurse.each(function() {
                if ($(this).is('.hx-overlay-full-height')) {
                    Helix.Layout.layoutFullHeightComponent(maxHeight, this);
                } else {
                    Helix.Layout.layoutFullHeightComponent(maxHeight - totHeight, this);
                }
            });
        }
    },
    resizePages: function(page) {
        var height = $(window).height();
        page.css('max-height', '');
        page.css('min-height', '');
        page.height(height);

        /* In our mobile framework we never let pages scroll. Elements inside can scroll
         * using the scrollingDiv. jQuery Mobile lays out headers and footers by attaching
         * an appropriately sized padding to the page. This means that to prevent any
         * scrolling by the browser we need to size the page contents to be the difference
         * between the viewport height and the combined header/footer height. 
         */
        var $header = page.find('[data-role="header"]');
        var headerHeight = Helix.Layout.headerHeight = 0;
        if ($header.is(':visible')) {
            headerHeight = Helix.Layout.headerHeight = $header.outerHeight(true);
        }
        
        var $footer = page.find('[data-role="footer"]');
        var footerHeight = Helix.Layout.footerHeight = 0;
        if ($footer.is(':visible')) {
            footerHeight = Helix.Layout.footerHeight = $footer.outerHeight(true);
        }
        var contentHeight = height - footerHeight - headerHeight;
        
        var $content = page.find('.hx-main-content');
        $content.parentsUntil('.ui-page').addClass('hx-full-height').addClass('hx-full-width');
        
        if ($content.parent().is('.ui-page')) {
            page.children( ".ui-header, .ui-content, .ui-footer" ).wrapAll( '<div class="hx-page-flex hx-full-height" />' );
        }
        
        return contentHeight;
    },
    
    layoutPageFullScreen: function(page) {
        var contentHeight = Helix.Layout.resizePages(page);
        setTimeout(function() {
            var $content = page.find('.hx-main-content');
            $content.height(contentHeight);
            
            // Overlays should always be the height of the underlying window.
            page.find('.hx-overlay-full-height').height($(window).height());
        }, 0);
    },
    
    renderer: function(page, id, fn) {
        if (!Helix.Utils.isString(id)) {
            fn = id;
            id = null;
        }
        
        if (id) {
            var renderersMap = $(page).data('hxrendermap');
            if (!renderersMap) {
                renderersMap = {};
                $(page).data('hxrendermap', renderersMap);
            }
            if (id in renderersMap) {
                // Already installed this named renderer
                return;
            }
            renderersMap[id] = true;
        }
        
        var renderers = $(page).data('hxrender');
        if (!renderers) {
            renderers = [];
            $(page).data('hxrender', renderers);
        } 
        renderers.push(fn);
    },
    
    postRenderer: function(page, fn, isOneTime) {
        var postRenderers = $(page).data('hxpostrender');
        if (!postRenderers) {
            postRenderers = [];
            $(page).data('hxpostrender', postRenderers);
        } 
        postRenderers.push({ 
            'fn': fn,
            'oneTime': (isOneTime === true ? true : false)
        });
    },
    
    refresh: function(page, noTrigger) {
        if (!page) {
            page = $.mobile.activePage;
        }
        
        var renderers = $(page).data('hxrender');
        if (renderers) {
            for (var i = 0; i < renderers.length; ++i) {
                renderers[i].call(this);
            }
        }
        
        //Helix.Layout.layoutPage($(page), noTrigger);
    },
    
    postRefresh: function(page) {
        if (!page) {
            page = $.mobile.activePage;
        }
        
        var nxtPostRenderers = [];
        var postRenderers = $(page).data('hxpostrender');
        if (postRenderers) {
            for (var i = 0; i < postRenderers.length; ++i) {
                var nxt = postRenderers[i];
                nxt.fn.call(this);
                if (nxt.oneTime !== true) {
                    nxtPostRenderers.push(nxt);
                }
            }
            $(page).data('hxpostrender', nxtPostRenderers);
        }
    },
    
    setMiniViewMode: function() {
        $('.ui-page').addClass('hx-mini-mode');
        $('.ui-page').removeClass('hx-full-mode');
        Helix.Layout.layoutPage();
    },
    
    setRegularViewMode: function() {
        $('.ui-page').addClass('hx-full-mode');
        $('.ui-page').removeClass('hx-mini-mode');
    }
};

/**
 * In general, apps should use the pagebeforeshow event to layout the DOM. When
 * the page load is done, they should call this function.
 */
Helix.Layout.layoutPage = function(page, noTrigger) {
    if (!page) {
        page = $.mobile.activePage;
        if (!page) {
            /* Nothing to do. */
            return;
        }
    } else {
        page = $(page);
    }
    
    /* Reset the full screen layout of the page. */
    Helix.Layout.layoutPageFullScreen(page);
    
    /* Trigger an event indicating that the page layout is done. */
    if (!noTrigger) {
        $(page).trigger("hxLayoutDone");
    }
};

/**
 * Do an initial layout on before show. This mostly gets rid of the snapping
 * effect. However, the heights of the different elements are not quite right. 
 * So we do it again on show.
 */
$(document).on('pagebeforeshow', function(ev, data) {
    /**
     * Layout the page based on the Mobile Helix styles unless this is an async page, in which case
     * we wait for the app to explicitly trigger the final render actions on the page.
     */
    if (!$.mobile.activePage.is('[data-async="true"]')) {
        Helix.Layout.refresh(ev.target, true);
    }
    
    /**
     * Fix .ui-header-fixed, per
     * 
     * http://stackoverflow.com/questions/13514163/header-jump-to-the-middle-of-screen-jquerymobile
     */
    $('.ui-header-fixed').css('position', 'fixed');
});

$(document).on('pageshow', function(ev) {
    /**
     * Trigger the layout done event unless this is an async page, in which case
     * we wait for the app to explicitly trigger the final render actions on the page.
     */
    if (!$.mobile.activePage.is('[data-async="true"]')) {
        Helix.Layout.postRefresh(ev.target, true);
    }
});

$(document).on('pagecreate', function(ev) {
    Helix.Layout.postRenderer($(ev.target), $.proxy(function() {
        Helix.Layout.layoutPage(this);
    }, $(ev.target)), true);
});

/*$(document).on('keyboardHide', function(ev) {
    Helix.Layout.layoutPage();
});*/

window.addEventListener('orientationchange', function(ev) {
    $('.ui-page').each(function() {
        Helix.Layout.refresh($(this));
        Helix.Layout.layoutPage($(this));    
    });
});

Helix.deviceType = (function() {
    if (window.screen.width <= 500) {
        return "phone";
    } else if (window.screen.width <= 767) {
        return "phablet";
    } else {
        return "tablet";
    }
})();

Helix.hasTouch = (function() {
    return !!('ontouchstart' in window) // works on most browsers 
        || !!('onmsgesturechange' in window); // works on ie10
})();

Helix.clickEvent = (function() {
    return (Helix.hasTouch ? 'vclick' : 'click');
})();

Helix.contextEvent = (function() {
    return (Helix.hasTouch ? 'taphold' : 'contextmenu');
})();

Helix.browser = (function() {
    if (navigator.userAgent.indexOf("AppleWebKit") !== -1) {
        // Safari or mobile safari.
        if (navigator.userAgent.indexOf("Mobile") !== -1) {
            return "iOS";
        } else {
            return "MacOS";
        }
    }
    return "Standard";
})();