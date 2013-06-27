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
            this._parentView = $(this.element).closest(".hx-main-content");
            if (this._parentView.length == 0) {
                this._parentView = $(this.element).closest('[data-role="page"]');
            }
            
            /* Insert the wrapper around this.element. The wrapper has fixed size, and
             * the transform styles are applied to this.element. 
             */
            this._$wrapper = $('<div/>');
            this.element.wrap(this._$wrapper);
            
            /* Attach a unique ID to the wrapper. Our scroller framework requires that
             * elements have an ID.
             */
            this._$wrapper.attr('id', Helix.Utils.getUniqueID());
            
            /* Make sure that if this.element is removed from the DOM we delete
             * its scroller.
             */
            var _self = this;
            this.element.on("remove", function() {
                Helix.Layout.cleanupScrollers(_self._$wrapper);
                _self._$wrapper.remove();
            });
            
            this.refresh();
        },
    
        /**
         * Create the scrolling container and mark with the appropriate styles.
         * Attach an iScroll scroller to the div, or refresh the scroller if 
         * it already exists.
         */
        refresh: function() {            
            /* Set the height/width of the scroller wrapper. */
            if (this.options.height === "inherit") {
                this._$wrapper.height(this.element.height());
            } else {
                this._$wrapper.height(this.options.height);
            }
            if (this.options.width === "full") {
                this._$wrapper.width(this._$parentView.width());
            } else {
                this._$wrapper.width(this.options.width);
            }
            
            
            /* Determine the scroller type and add/refresh the scroller. */
            var scrollingClass;
            if (this.options.orientation === "vertical") {
                scrollingClass = "pm-scroller";
            } else if (this.options.orientation === "horizontal") {
                scrollingClass = "pm-scroller-horizontal";
            } else {
                console.log("Invalid scroller orientation " + this.options.orientation);
                return;
            }
            
            var zoomClass = "";
            if (!this.options.zoom) {
                zoomClass = "pm-scroller-nozoom";
            }
            
            if (this._$wrapper.hasClass(scrollingClass)) {
                /* Refresh the scroller. */
                Helix.Layout.updateScrollers(this._$wrapper);
            } else {
                this._$wrapper.addClass(scrollingClass);
                if (zoomClass) {
                    this._$wrapper.addClass(zoomClass);
                }
                Helix.Layout.addScrollers(this._$wrapper);
            }
        }
    });
}( jQuery ));