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
    
    $.widget("helix.helixSplitView", {        
        
        options: {
            /**
             * Left width. Specify an integer, which translates into the % of the full
             * width occupied by the left-hand pane.
             */
            leftWidth: 30,
            
            /**
             * Right width. Specify an integer, which translates into the % of the full
             * widht occupied by the right-hand pane.
             */
            rightWidth: 70,
            
            /**
             * Padding (in pixels) between the left and right sides of the split view.
             */
            splitPadding: 5,
            
            /**
             * Specify a threshold in width pixels, above which both panes of the split view
             * should be visible on the screen.
             */
            splitThreshold: 800,
            
            /**
             * Callback to invoke after each refresh. This allows the app using this component
             * to change the UI based on whether the split view is full screen or side-by-side.
             * The callback is passed a single string as an argument - either 'split' or 'full', 
             * depending on whether the split view is showing as a split view or as two full
             * screen views.
             */
            onRefresh: null
        },

        _create: function() {
            // Setup styling of the parent element.
            $(this.element).addClass('splitMaster');
            $(this.element).addClass('pm-layout-full-height');
        
            // Get the left/right.
            this.__left = $(this.element).children()[0];
            this.__right = $(this.element).children()[1];
            
            if (!this.__left || !this.__right) {
                alert("A split view must have two children, representing the left and right portions of the split.");
            }
            this.__current = null;
            this.refresh();
            var _self = this;
            $( window ).on( "orientationchange", function( event ) {
                alert($(window).width());
                _self.refresh();
            });
        },
    
        /**
         * Render the form using the form layout code. valuesMap is an optional
         * map from field names to field values.
         * 
         * @param valuesMap Map form field names to values.
         */
        refresh: function() {            
            var curWidth = $(window).width();
            if (curWidth > this.options.splitThreshold) {
                var leftWidth = Math.floor((this.options.leftWidth / 100) * curWidth);
                var rightWidth = Math.floor((this.options.rightWidth / 100) * curWidth) - this.options.splitPadding;
                
                $(this.__left).addClass('hx-split-left-area').addClass('pm-layout-full-height');
                $(this.__left).width(leftWidth);
                $(this.__right).addClass('hx-split-right-area').addClass('pm-layout-full-height');
                $(this.__right).width(rightWidth);
                
                $(this.__left).show();
                $(this.__right).show();
                
                this.__current = null;
            } else {
                if (!this.__current) {
                    this.__current = "left";
                }
                
                if (this.__current === "left") {
                    $(this.__left).removeClass('hx-split-left-area');
                    $(this.__left).addClass('hx-split-full');
                    $(this.__left).css('width', '');
                    $(this.__left).show();
                    $(this.__right).hide();
                } else {
                    $(this.__right).removeClass('hx-split-right-area');
                    $(this.__right).addClass('hx-split-full');
                    $(this.__right).css('width', '');
                    $(this.__right).show();
                    $(this.__left).hide();                    
                }
            }
            if (this.options.onRefresh) {
                this.options.onRefresh((this.__current) ? "full" : "split");
            }
            
            /* Reset the full screen layout of the page. */
            Helix.Layout.layoutPage();
        },
        
        toggle: function() {
            if (!this.__current) {
                return;
            }
            if (this.__current === "left") {
                this.__current = "right";
            } else {
                this.__current = "left";
            }
            this.refresh();
        },
        
        isSplitView: function() {
            return (this.__current == null);
        }
    });
}( jQuery ));