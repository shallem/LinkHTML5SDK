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

Helix.Layout = {
    /**
     * Selectors used to identify scrollers.
     */
    scrollerSel : '.pm-scroller,.pm-scroller-nozoom,.pm-scroller-zoomonly,.pm-scroller-horizontal',

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
        var paddingPixels = $(component).outerHeight(true) - $(component).innerHeight();
        var offsetPixels = 0;
        if ($(component).css('top') !== 'auto') {
            // Doesn't handle all unit types.
            var cssAuto = $(component).css('top');
            offsetPixels = parseInt(cssAuto, 10);
        }
        
        $(component).height(maxHeight - paddingPixels - offsetPixels);
        
        if ($(component).is(".mh-layout-parent-height")) {
            /* This selector means to set the layout to the parent height and
             * not recurse any further.
             */
            return;
        }
        
        var children = $(component).children();
        var totHeight = 0;
        var remainingHeight = 0;
        for (var i = 0; i < children.length; ++i) {
            if ($(children[i]).is("style,script")) {
                // Skip style and script tags - see note at http://api.jquery.com/height/
                continue;
            }
            if ($(children[i]).is(".pm-layout-full-height,.mh-layout-parent-height")) {
                // These items must be side-by-side, otherwise the proposed layout is fully overlapping ...
                continue;
            }
            if (!$(children[i]).is(":visible")) {
                continue;
            }

            var child_i_height = $(children[i]).outerHeight(true);
            totHeight += child_i_height;
            if (i < (children.length - 1)) {
                remainingHeight += child_i_height;
            }
        }
        
        var childrenToRecurse = $(component).children('.pm-layout-full-height,.mh-layout-parent-height');
        
        /* If there are no elements to recurse over, set the last child of this element to full the 
         * rest of the screen.
         */
        if (childrenToRecurse.length == 0) {
            var $fullHeightChild = $(children[children.length - 1]);
            $fullHeightChild.height(maxHeight - remainingHeight);
        } else {
            childrenToRecurse.each(function() {
                Helix.Layout.layoutFullHeightComponent(maxHeight - totHeight, this);
            });
        }
    },
    resizePages: function(page) {
        var height = $(window).height();
        var width = $(window).width();

        /* In our mobile framework we never let pages scroll. Elements inside can scroll
         * using the scrollingDiv. jQuery Mobile lays out headers and footers by attaching
         * an appropriately sized padding to the page. This means that to prevent any
         * scrolling by the browser we need to size the page contents to be the difference
         * between the viewport height and the combined header/footer height. 
         */
        var $header = page.find('[data-role="header"]');
        var headerHeight = Helix.Layout.headerHeight = $header.outerHeight(true);
        
        var $footer = page.find('[data-role="footer"]');
        var footerHeight = 0;
        if ($footer.is(':visible')) {
            footerHeight = $footer.outerHeight(true);
        }
        var pageHeight = height;
        var contentHeight = height - footerHeight;
        contentHeight = contentHeight - headerHeight;
        if ($header.is('[data-position="fixed"]')) {
            pageHeight = contentHeight;
        } 
        page.height(pageHeight);
        
        var content = page.find('.hx-main-content');
        content.css('height', contentHeight);
        if (!$(content).parent().is('.ui-page')) {
            $(content).parent().height(pageHeight);
        }
        
        content.each(function() {
            //var innerWidth = width - (this.offsetWidth - this.clientWidth);
            $(this).css('width', width);
        });
        
        /* Fixed position panels need to have a padding at the top equal to the header height.
         * Otherwise the top of the panel slides under the header.
         */
        $('.ui-panel-fixed').css('padding-top', Helix.Layout.headerHeight + 'px');
        
        return contentHeight;
    },
    
    layoutPageFullScreen: function(page) {
        var contentHeight = Helix.Layout.resizePages(page);
        Helix.Layout.contentHeight = contentHeight;
        $('[data-role="content"]', page).children().each(function() {
            if ($(this).is("style,script")) {
                // Skip style and script tags - see note at http://api.jquery.com/height/
                return;
            }
            
            if ($(this).is('.pm-layout-full-height,.mh-layout-parent-height')) {
                Helix.Layout.layoutFullHeightComponent(contentHeight, this);
            } else {
                contentHeight = contentHeight - $(this).outerHeight(true);
            }
        });        
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
    
    postRenderer: function(page, fn) {
        var postRenderers = $(page).data('hxpostrender');
        if (!postRenderers) {
            postRenderers = [];
            $(page).data('hxpostrender', postRenderers);
        } 
        postRenderers.push(fn);
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
        
        var prenderers = $(page).data('hxpostrender');
        if (prenderers) {
            for (var i = 0; i < prenderers.length; ++i) {
                prenderers[i].call(this);
            }
        }
    }
};

/**
 * Prior to any AJAX request, track the height of the items we are updating with that
 * request. When the response is received, we set a timeout handler that we try 3 times 
 * at 200ms intervals to wait for the height to update after the DOM is updated. When 
 * the height has updated, we refresh the scrollers to ensure that the scroller covers
 * the full scrolling area. The 3 retries prevent us from infinitely trying and 
 * retrying in the event that the downloaded update has the exact same height as the 
 * current html.
 */
$(document).bind('prerequest', function(ev, cfg) {
    if (cfg && cfg.update) {
        var updatedIDs = cfg.update.split(" ");
        for (var i = 0; i < updatedIDs.length; ++i) {
            /* Escape colons because primefaces use the colon character in its naming scheme ... */
            var updateSel = PrimeFaces.escapeClientId(updatedIDs[i]);
            
            /* 
             * Clean up all scrollers that may be deleted when this item is updated.
             *
            $(updateSel).find(Helix.Layout.scrollerSel).each(function(index, element) {
                var scrollerID = $(this).attr('id');
                Helix.Layout.deleteScroller(scrollerID);
            });*/
        }
    }
});

$(document).bind('postrequest', function(ev, xhr) {
    if (!xhr.responseXML) {
        return;
    }
    
    var responseXML = xhr.responseXML;
    var xmlDoc = $(responseXML.documentElement),
    updates = xmlDoc.find('update'),
    nUpdated = 0;
    
    if (!updates) {
        return;
    }
    for(var i=0; i < updates.length; i++) {
        var updateID = updates.eq(i).attr('id');
        
        /* Escape colons because primefaces use the colon character in its naming scheme ... */
        var updateSel = PrimeFaces.escapeClientId(updateID);

        if ($(updateSel).length == 0) {
            /* This update selector is not in the DOM ...*/
            continue;
        }
        ++nUpdated;

        /* Determine if the item we have updated has children that are scrollers. If
         * so, make sure we create those scrollers from scratch. Otherwise we may end
         * up with bogus scrollers added by the pageshow event that are then overwritten
         * by an AJAX update that happens when the page is first loading.
         *
        $(updateSel).find(Helix.Layout.scrollerSel).each(function() {
            var scrollerID = $(this).attr('id');
            Helix.Layout.deleteScroller(scrollerID);
        });*/
        
        /*
         * Trigger JQM enhancement and our own enhancement on the updated markup.
         */
        $(updateSel).trigger("create");
        
        /*
         * Trigger our own enhancement event.
         */
        $(document).trigger('pmcreate', updateSel);
    }
    
    if (nUpdated > 0) {
        /* Reset the full screen layout of the page. */
        Helix.Layout.layoutPage();
    }
});

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
}

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
        Helix.Layout.layoutPage($.mobile.activePage);
        Helix.Layout.postRefresh(ev.target, true);
    }
});

$(document).on('keyboardHide', function(ev) {
    Helix.Layout.layoutPage();
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