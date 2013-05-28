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

PrimeFaces.Layout = {
    /**
     * Set of component IDs we are updating in the current AJAX request. Populated
     * with the pre-request handler below.
     */
    idsToUpdate : {},
    
    
    /**
     * Selectors used to identify scrollers.
     */
    scrollerSel : '.pm-scroller,.pm-scroller-nozoom,.pm-scroller-zoomonly',

    /**
     * List of all scrollers in the application.
     */
    allScrollers : {},
    
    /**
     * Create a scroller attached to the (optional) element, or attached to all elements
     * matching the scrollerSel selector.
     * 
     * @param elem
     *      The optional element parameter. If not specified, scrollerSel is used to
     *      find all scrollers in the active page.
     */
    addScrollers : function(elem) {
        var toAdd;
        if (elem === undefined) {
            toAdd = $.mobile.activePage.find(PrimeFaces.Layout.scrollerSel);
        } else {
            toAdd = $(elem);
        }

        toAdd.each(function() {            
            if (this.id in PrimeFaces.Layout.allScrollers) {
                PrimeFaces.Layout.allScrollers[this.id].refresh();
            } else {
                // Make sure we have at least one child, otherwise there is nothing to scroll
                // and iScroll fails.
                if ($(this).children().length == 0) {
                    return;
                }

                var doZoom = true;
                var doScroll = true;
                var doHScroll = false;
                var doVScroll = doScroll;

                if ($(this).hasClass('pm-scroller-zoomonly')) {
                    doScroll = false;
                } else if ($(this).hasClass('pm-scroller-nozoom')) {
                    doZoom = false;
                } 

                if ($(this).hasClass('pm-scroller-horizontal')) {
                    doHScroll = doScroll;
                    doVScroll = false;
                }

                PrimeFaces.Layout.allScrollers[this.id] = new iScroll(this.id, {
                    hScroll        : doHScroll,
                    vScroll        : doVScroll,
                    hScrollbar     : false,
                    vScrollbar     : false,
                    fixedScrollbar : false,
                    fadeScrollbar  : false,
                    hideScrollbar  : false,
                    bounce         : true,
                    momentum       : true,
                    lockDirection  : true,
                    zoom           : doZoom,
                    onBeforeScrollStart: function (e) {
                        var target = e.target;
                        while (target.nodeType != 1) target = target.parentNode;

                        if (target.tagName != 'SELECT' && target.tagName != 'INPUT' && target.tagName != 'TEXTAREA'){
                            e.preventDefault();
                        }
                    }
                });
            }
        });
    },

    /**
     * Determine if an element is a scrolling element.
     */
    isScroller : function(elem) {
        if (elem && $(elem).is(PrimeFaces.Layout.scrollerSel)) {
            return true;
        }
        return false;
    },

    /**
     * Determine if an element is contained within a scrolling element.
     */
    isInScroller : function(elem) {
        if (elem && ($(elem).closest(PrimeFaces.Layout.scrollerSel).length !== 0)) {
            return true;
        }
        return false;
    },
    
    /**
     * Update a single scroller, identified by an ID or JQM object.
     */
    updateScrollersForID : function(updateID, oldHeight, nRetries) {
        var obj = $(updateID);
        if (obj.length > 0 ) {
            var newHeight = obj.height();
            var heightUpdated = (newHeight != oldHeight);

            if (nRetries > 3 ||
                heightUpdated) {
                // If this or a parent object matches the scrollerSel then update it.
                PrimeFaces.Layout.addScrollers($(obj).closest(PrimeFaces.Layout.scrollerSel));

                // Update scrollers in child objects.
                PrimeFaces.Layout.addScrollers($(obj).find(PrimeFaces.Layout.scrollerSel));

                return true;
            }
        }
        return false;
    },
    
    /**
     * Update all scrollers related to components after an AJAX request.
     */
    updateScrollers : function() {
        var nupdates = 0;
        var toDelete = [];
        for (var update in PrimeFaces.Layout.idsToUpdate) {
            if (PrimeFaces.Layout.idsToUpdate.hasOwnProperty(update)) {
                var updateObj = PrimeFaces.Layout.idsToUpdate[update];
                updateObj.nretries = updateObj.nretries + 1;

                if (PrimeFaces.Layout.updateScrollersForID(update, 
                        updateObj.height, 
                        updateObj.nretries)) {
                    toDelete.push(update);
                } else {
                    ++nupdates;
                }
            }
        }

        for (var key in toDelete) {
            delete PrimeFaces.Layout.idsToUpdate[key];
        }

        if (nupdates > 0) {
            setTimeout(function() {
                PrimeFaces.Layout.updateScrollers();
            }, 200);
        }
    },
    
    /**
     * Refresh a scrolling area (identified with the selector). Called after an
     * AJAX request has been completed or the DOM has been updated locally.
     */
    refreshScroller : function(sel) {
        var scrollerId = $(sel).attr('id');
        if (!scrollerId) {
            return;
        }

        /* Save off the current height of the element we are updating so that we can
         * tell post update when the rendering of the updated element is likely done.
         */
        PrimeFaces.Layout.idsToUpdate[PrimeFaces.escapeClientId(scrollerId)] = { 
           height: $(sel).children().height(), 
           nretries: 0 
        };

        // Placing inside of setTimeout per the advice on cubiq.org/iscroll-4
        // in the "Mastering the Refresh() method" section
        setTimeout(function() {
            PrimeFaces.Layout.updateScrollers();
        }, 200);
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
        $(component).height(maxHeight);
        var children = $(component).children();
        var totHeight = 0;
        for (var i = 0; i < children.length - 1; ++i) {
            if ($(children[i]).is("style,script")) {
                // Skip style and script tags - see note at http://api.jquery.com/height/
                continue;
            }

            var child_i_height = $(children[i]).outerHeight(true);
            totHeight += child_i_height;
        }
        $(children[children.length - 1]).height(maxHeight - totHeight);
        $(children).find('.pm-layout-full-height').each(function() {
            var thisHeight = $(this).parent().height();
            PrimeFaces.Layout.layoutFullHeightComponent(thisHeight, this);
        });
    },
    resizePages: function() {
        var height = $(window).height();
        var width = $(window).width();

        /* In our mobile framework we never let pages scroll. Elements inside can scroll
        * using the scrollingDiv. Here we just take the min-height that jQuery has assigned
        * to a particular page and turn it into the page height. 
        */
        $.mobile.activePage.height(height);

        var headerHeight = $('[data-role="header"]', $.mobile.activePage).height();
        var footerHeight = $('[data-role="footer"]', $.mobile.activePage).height();
        var contentHeight = (.99 * height) - headerHeight - footerHeight;
        $('[data-role="content"]', $.mobile.activePage).css('height', contentHeight);
        $('[data-role="content"]', $.mobile.activePage).css('width', width);
        
        return contentHeight;
    },
    layoutPageFullScreen: function() {
        var contentHeight = PrimeFaces.Layout.resizePages();
        $('[data-role="content"]', $.mobile.activePage).find('.pm-layout-full-height').each(function() {
            PrimeFaces.Layout.layoutFullHeightComponent(contentHeight, this);
        });
        
        // Placing inside of setTimeout per the advice on cubiq.org/iscroll-4
        // in the "Mastering the Refresh() method" section
        setTimeout(function() {
            PrimeFaces.Layout.addScrollers();
        }, 0);        
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
    if (cfg.update !== undefined) {
        var updatedIDs = cfg.update.split(" ");
        for (var i = 0; i < updatedIDs.length; ++i) {
            /* Escape colons because primefaces use the colon character in its naming scheme ... */
            var updateSel = PrimeFaces.escapeClientId(updatedIDs[i]);
            
            /* Save off the current height of the element we are updating so that we can
             * tell post update when the rendering of the updated element is likely done.
             */
            PrimeFaces.Layout.idsToUpdate[updateSel] = { 
                height: $(updateSel).height(), 
                nretries: 0 
            };
            
            /* 
             * Clean up all scrollers that may be deleted when this item is updated.
             */
            $(updateSel).find(PrimeFaces.Layout.scrollerSel).each(function(index, element) {
                /* Save off the height of the item we are going to update. */
                var scrollerID = $(this).attr('id'); 
                delete PrimeFaces.Layout.allScrollers[scrollerID];
            });
        }
    }
});

$(document).bind('postrequest', function(ev, xhr) {
    var responseXML = xhr.responseXML;
    var xmlDoc = $(responseXML.documentElement),
    updates = xmlDoc.find('update');
    for(var i=0; i < updates.length; i++) {
        var updateID = updates.eq(i).attr('id');
        
        /* Escape colons because primefaces use the colon character in its naming scheme ... */
        var updateSel = PrimeFaces.escapeClientId(updateID);

        /* Determine if the item we have updated has children that are scrollers. If
         * so, make sure we create those scrollers from scratch. Otherwise we may end
         * up with bogus scrollers added by the pageshow event that are then overwritten
         * by an AJAX update that happens when the page is first loading.
         */
        $(updateSel).find(PrimeFaces.Layout.scrollerSel).each(function(index, element) {
            /* Save off the height of the item we are going to update. */
            var scrollerID = $(this).attr('id'); 
            delete PrimeFaces.Layout.allScrollers[scrollerID];
        });
        
        /*
         * Trigger JQM enhancement and our own enhancement on the updated markup.
         */
        $(updateSel).trigger("create");
        
        /*
         * Trigger our own enhancement event.
         */
        $(document).trigger('pmcreate', updateSel);
    }
    
    /* Reset the full screen layout of the page. */
    PrimeFaces.Layout.layoutPageFullScreen();
    
    // Placing inside of setTimeout per the advice on cubiq.org/iscroll-4
    // in the "Mastering the Refresh() method" section
    setTimeout(function() {
        PrimeFaces.Layout.updateScrollers();
    }, 200);
});

/**
 * Add the icon style class as an override to all icon button icons.
 */
$(document).bind('pageinit', function() {
    $('.iconbutton').each(function(index, value) {
        var btn = $(this).find('.ui-icon');
        var iconData = $(this).jqmData('icon');
        btn.removeClass('ui-icon').addClass(iconData + ' ui-icon');
    });
});

PrimeFaces.deviceType = (function() {
    if (window.screen.width <= 480) {
        return "phone";
    } else if (window.screen.width <= 767) {
        return "phablet";
    } else {
        return "tablet";
    }
})();