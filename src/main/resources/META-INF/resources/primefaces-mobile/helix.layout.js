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
            toAdd = $.mobile.activePage.find(Helix.Layout.scrollerSel);
        } else {
            toAdd = $(elem);
        }

        toAdd.each(function() {            
            if (this.id in Helix.Layout.allScrollers) {
                return;
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

                var newScroller = new iScroll(this.id, {
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
                    handleClick    : doZoom,
                    onBeforeScrollStart: function (e) {
                        return;
                        var target = e.target;
                        while (target.nodeType != 1) target = target.parentNode;

                        if (target.tagName != 'SELECT' && target.tagName != 'INPUT' && target.tagName != 'TEXTAREA'){
                            e.preventDefault();
                        }
                    }
                });
                Helix.Layout.allScrollers[this.id] = {
                    scroller: newScroller,
                    height: $(this).children().height()
                };
            }
        });
    },

    /**
     * Delete a single scroller.
     */
    deleteScroller: function(id) {
        if (id in Helix.Layout.allScrollers) {
            var toDelete = Helix.Layout.allScrollers[id].scroller;
            toDelete.destroy();
            toDelete = null;
            delete Helix.Layout.allScrollers[id];
        }
    },

    /**
     * Cleanup all scrollers. Called when a page is hidden to free up memory for the 
     * browser.
     */
    cleanupScrollers: function(page) {
        $(page).find(Helix.Layout.scrollerSel).each(function() {
            Helix.Layout.deleteScroller(this.id);
        });
    },

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
     * Update a single scroller, identified by an ID or JQM object.
     */
    updateScrollersForID : function(obj, objID, oldHeight, nRetries) {
        if (!Helix.Layout.allScrollers[objID]) {
            return;
        }
        
        var newHeight = $(obj).children().height();
        var heightUpdated = (newHeight != oldHeight);

        if (nRetries >= 3 ||
            heightUpdated) {
            Helix.Layout.allScrollers[objID].scroller.refresh(); 
            Helix.Layout.allScrollers[objID].height = newHeight;
            
            // If this or a parent object matches the scrollerSel then update it.
            /*$(obj).closest(Helix.Layout.scrollerSel).each(function() {
                if (this.id in Helix.Layout.allScrollers) {
                    Helix.Layout.allScrollers[this.id].scroller.refresh(); 
                    Helix.Layout.allScrollers[this.id].height = newHeight;
                }
            });*/

            // Update scrollers in child objects.
            /*$(obj).find(Helix.Layout.scrollerSel).each(function() {
                if (this.id in Helix.Layout.allScrollers) {
                    Helix.Layout.allScrollers[this.id].scroller.refresh(); 
                    Helix.Layout.allScrollers[this.id].height = newHeight;
                }
            });*/
        }
        
        if (nRetries < 3) {
            /* WE set the timeout even when the height has already changed. This is because not
             * all content loads at the same time, so over time more content may appear and, hence
             * the scroller will need to update. A perfect example is images that are loaded into
             * the page.
             */
            setTimeout(function() {
                Helix.Layout.updateScrollersForID(obj, objID, oldHeight, ++nRetries);
            }, 400);
        }
    },
    
    /**
     * Update all scrollers related to components after an AJAX request.
     */
    updateScrollers : function(elem) {
        var toUpdate;
        if (elem === undefined) {
            toUpdate = $.mobile.activePage.find(Helix.Layout.scrollerSel);
        } else {
            toUpdate = $(elem);
        }

        toUpdate.each(function() {            
            if (this.id in Helix.Layout.allScrollers) {
                Helix.Layout.updateScrollersForID(this,
                        this.id,
                        Helix.Layout.allScrollers[this.id].height, 
                        1);
            }
        });
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
            $(children[children.length - 1]).height(maxHeight - remainingHeight);
        } else {
            childrenToRecurse.each(function() {
                Helix.Layout.layoutFullHeightComponent(maxHeight - totHeight, this);
            });
        }
    },
    resizePages: function() {
        var height = $(window).height();
        var width = $(window).width();

        /* In our mobile framework we never let pages scroll. Elements inside can scroll
        * using the scrollingDiv. Here we just take the min-height that jQuery has assigned
        * to a particular page and turn it into the page height. 
        */
        $.mobile.activePage.height(height);

        var headerHeight = $.mobile.activePage.children('[data-role="header"]').height();
        var footerHeight = $.mobile.activePage.children('[data-role="footer"]').height();
        var contentHeight = (.99 * height) - headerHeight - footerHeight;
        $.mobile.activePage.children('[data-role="content"]').css('height', contentHeight);
        $.mobile.activePage.children('[data-role="content"]').css('width', width);
        
        return contentHeight;
    },
    
    layoutPageFullScreen: function() {
        var contentHeight = Helix.Layout.resizePages();
        $('[data-role="content"]', $.mobile.activePage).children('.pm-layout-full-height,.mh-layout-parent-height').each(function() {
            Helix.Layout.layoutFullHeightComponent(contentHeight, this);
        });        
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
            
            /* 
             * Clean up all scrollers that may be deleted when this item is updated.
             */
            $(updateSel).find(Helix.Layout.scrollerSel).each(function(index, element) {
                /* Save off the height of the item we are going to update. */
                var scrollerID = $(this).attr('id');
                Helix.Layout.deleteScroller(scrollerID);
            });
        }
    }
});

$(document).bind('postrequest', function(ev, xhr) {
    var responseXML = xhr.responseXML;
    var xmlDoc = $(responseXML.documentElement),
    updates = xmlDoc.find('update'),
    nUpdated = 0;
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
         */
        $(updateSel).find(Helix.Layout.scrollerSel).each(function() {
            /* Save off the height of the item we are going to update. */
            var scrollerID = $(this).attr('id');
            Helix.Layout.deleteScroller(scrollerID);
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
    
    if (nUpdated > 0) {
        /* Reset the full screen layout of the page. */
        Helix.Layout.layoutPage();
    }
});

/**
 * Add the icon style class as an override to all icon button icons.
 */
$(document).bind('pageinit', function() {
    /*$('.iconbutton').each(function(index, value) {
        var btn = $(this).find('.ui-icon');
        var iconData = $(this).jqmData('icon');
        btn.removeClass('ui-icon').addClass(iconData + ' ui-icon');
    });*/
});

/**
 * In general, apps should use the pagebeforeshow event to layout the DOM. When
 * the page load is done, they should call this function.
 */
Helix.Layout.layoutPage = function() {
    /* Reset the full screen layout of the page. */
    Helix.Layout.layoutPageFullScreen();
    
    /* Add all scrollers. NOTE, that these scrollers will also be updated in the call
     * below. This is essential because the DOM may not be finished when we reach
     * this point.
     */
    Helix.Layout.addScrollers();
    
    // Placing inside of setTimeout per the advice on cubiq.org/iscroll-4
    // in the "Mastering the Refresh() method" section. Updates all scrollers
    // currently on the page.
    
    /* NOTE: each time we update scrollers we make sure that the height has changed. Hence,
     * we call this function a few times at intervals of 200 MS. When there is no
     * updating to be done, nothing happens.
     */
    var existingScrollers = $.mobile.activePage.find(Helix.Layout.scrollerSel);
    setTimeout(function() {
        Helix.Layout.updateScrollers(existingScrollers);
    }, 0);
};

/**
 * When a page is hidden, we kill all of its scrollers to save memory. 
 */
$(document).on('pagebeforehide', function() {
    Helix.Layout.cleanupScrollers(this);
});

Helix.deviceType = (function() {
    if (window.screen.width <= 480) {
        return "phone";
    } else if (window.screen.width <= 767) {
        return "phablet";
    } else {
        return "tablet";
    }
})();