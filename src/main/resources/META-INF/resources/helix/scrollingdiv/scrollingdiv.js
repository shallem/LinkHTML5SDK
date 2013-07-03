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
(function($) {
    
    $.widget("helix.helixScrollingDiv", {        
        
        options: {
            
            /**
             * Direction we are scrolling - either 'vertical' (the default) or
             * 'horizontal.
             */
            orientation: "vertical",
            
            /**
             * Boolean value indicating if double-tab to zoom is available inside
             * of this scroller. Default is false.
             */
            isZoom: false,
            
            /**
             * Width of the scroller. Specify as a string, either indicating pixels
             * or a percentage. Default is to occupy the full width of the content
             * view (specified as either the page width or the parent element marked
             * with the hx-main-content class. Specify this behavior with 'full'.
             */
            width: "full",
            
            /**
             * Fixed height of the scroller. Content inside the scrolling div
             * will scroll within the boundaries specified by the width and height
             * parameters. Like width, specify as a string indicating the pixel
             * width or the percentage width. The default is to use the height
             * already attached to the wrapped element. Specify this behavior
             * with 'inherit'.
             */
            height: "inherit"
        },

        _create: function() {
            /* Insert the wrapper around this.element. The wrapper has fixed size, and
             * the transform styles are applied to this.element. 
             */
            this.element.wrap('<div/>');
            this._$wrapper = this.element.parent();
            
            /* Attach a unique ID to the wrapper. Our scroller framework requires that
             * elements have an ID.
             */
            this._$wrapper.attr('id', Helix.Utils.getUniqueID());
            
            this.refresh();
        },
    
        /**
         * Create the scrolling container and mark with the appropriate styles.
         * Attach an iScroll scroller to the div, or refresh the scroller if 
         * it already exists.
         */
        refresh: function() {    
            this._$parentView = $(this.element).closest(".hx-main-content");
            this._$page = $(this.element).closest('[data-role="page"]');
            if (this._$parentView.length == 0) {
                this._$parentView = this._$page;
            }
            
            /* Set the height/width of the scroller wrapper. */
            if (this.options.width === "full") {
                this._$wrapper.width(this._$parentView.width());
            } else {
                this._$wrapper.width(this.options.width);
            }
            if (this.options.height === "inherit") {
                /* The height of this component is fixed and should be inherited
                 * according to the form layout scheme. If the wrapper has not
                 * yet had its height specified then we invoke layoutPage to
                 * do so.
                 */
                if (!this._$wrapper.hasClass('mh-layout-parent-height')) {
                    this._$wrapper.addClass('mh-layout-parent-height');
                    Helix.Layout.layoutPage(this._$page);
                }
            } else {
                this._$wrapper.height(this.options.height);
            }
            
            
            /* Determine the scroller type and add/refresh the scroller. */
            var scrollingClass;
            if (this.options.orientation === "vertical") {
                scrollingClass = "hx-scroller-nozoom";
            } else if (this.options.orientation === "horizontal") {
                scrollingClass = "hx-horizontal-scroller-nozoom";
            } else {
                console.log("Invalid scroller orientation " + this.options.orientation);
                return;
            }
            
            var zoomClass = "";
            if (this.options.zoom) {
                // Not supported at this moment.
                //zoomClass = "pm-scroller-nozoom";
            }
            
            if (this._$page.is(":visible")) {
                if (this._$wrapper.hasClass(scrollingClass)) {
                    /* Refresh the scroller. */
                    //Helix.Layout.updateScrollers(this._$wrapper);
                } else {
                    this._$wrapper.addClass(scrollingClass);
                    if (zoomClass) {
                        this._$wrapper.addClass(zoomClass);
                    }
                    //Helix.Layout.addScrollers(this._$wrapper);
                }
            }
        },
        
        /**
         * Call this function when the scroller contents have changed to just
         * refresh the iScroll scroller.
         */
        refreshScroller: function() {
            //Helix.Layout.updateScrollers(this._$wrapper);
        },
        
        /**
         * Call this function to remove this element from the DOM. Removes the
         * wrapper.
         */
        remove: function () {
            this._$wrapper.remove();
        },
        
        destroy: function() {
            //Helix.Layout.cleanupScrollers(this._$wrapper.parent());
        }
    });
}( jQuery ));