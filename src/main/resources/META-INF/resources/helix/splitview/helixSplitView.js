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
            onRefresh: null,
            
            /**
             * Boolean flag that indicates if the split view should use header buttons to navigate
             * between the right and left panes in the single-pane view. A typical scenario is to have
             * a list in the left pane that, when an item is tapped, updates the right pane to show detail
             * of the selected item. In this scenario, you would use this flag to have the jQM header's 
             * left button say "Close" and toggle from the right pane back to the left. The default value
             * is true.
             */
            useHeaderToToggle: true,
            
            /**
             * A string that is used for the text in the toggle button when useHeaderToToggle is set to true.
             * The default is 'Close'.
             */
            headerToggleText: "Close"
        },

        _create: function() {
            // Setup styling of the parent element.
            $(this.element).addClass('pm-layout-full-height');
        
            // Get the left/right.
            this.__left = $(this.element).children()[0];
            this.__right = $(this.element).children()[1];
            
            if (this.options.useHeaderToToggle) {
                // Get the enclosing page.
                this.__page = $(this.element).closest('[data-role="page"]');
            
                // Get the header element in the enclosing page, if it exists.
                this.__pageHeader = $(this.__page).find('[data-role="header"]')
            }
            
            if (!this.__left || !this.__right) {
                alert("A split view must have two children, representing the left and right portions of the split.");
            }
            
            if (Helix.hasTouch) {
                this.__clickEvent = 'tap';
            } else {
                this.__clickEvent = 'click';
            }
            
            this.__restoreMarkup = null;
            this.__current = null;
            this.refresh();
            var _self = this;
            $( document ).on( "orientationchange", function( event ) {
                _self.refresh();
                // In case we were viewing the right pane of the split when we
                // rotated back to a split view with 2 panes.
                _self._restoreLeftHeaderButton();
            });
        },
        
        _restoreLeftHeaderButton: function() {
            if (this.options.useHeaderToToggle && this.__pageHeader.length > 0 && this.__restoreMarkup) {
                // Remove or restore the left button depending on whether or
                // not there was a left button before we toggled.
                var curLeftBtn = $(this.__pageHeader).find('.ui-btn-left');
                if (curLeftBtn.length > 0) {
                    $(curLeftBtn).remove();
                }

                // Insert or update the left button.
                $(this.__pageHeader).prepend(this.__restoreMarkup);
                this.__restoreMarkup = null;
            }
        },
    
        /**
         * Render the form using the form layout code. valuesMap is an optional
         * map from field names to field values.
         * 
         * @param valuesMap Map form field names to values.
         */
        refresh: function() {            
            var curWidth = $(window).width();
            var curLeftBtn = null;
            var __self = this;
            if (curWidth > this.options.splitThreshold) {
                var leftWidth = Math.floor((this.options.leftWidth / 100) * curWidth);
                var rightWidth = Math.floor((this.options.rightWidth / 100) * curWidth) - this.options.splitPadding;
               
                $(this.element).addClass('hx-split-master');
            
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
                    $(this.__left).addClass('pm-layout-full-height');
                    $(this.__left).css('width', '');
                    $(this.__left).show();
                    $(this.__right).hide();
                    
                    this._restoreLeftHeaderButton();
                } else {
                    $(this.__right).removeClass('hx-split-right-area');
                    $(this.__right).addClass('hx-split-full');
                    $(this.__right).addClass('pm-layout-full-height');
                    $(this.__right).css('width', '');
                    $(this.__right).show();
                    $(this.__left).hide();
                    
                    if (this.options.useHeaderToToggle && this.__pageHeader.length > 0) {
                        // Capture the current left button so that we can restore it.
                        var theme;
                        curLeftBtn = $(this.__pageHeader).find('.ui-btn-left');
                        if (curLeftBtn.length > 0) {
                            this.__restoreMarkup = $(curLeftBtn);
                            theme = $(curLeftBtn).attr('data-theme');
                            $(curLeftBtn).remove();
                        }
                        if (!theme) {
                            theme = 'a';
                        }
                        
                        // Insert or update the left button.
                        $(this.__pageHeader).prepend($('<a/>').attr({
                            'href' : 'javascript:void(0)',
                            'class' : 'ui-btn-left',
                            'data-theme' : theme,
                            'data-icon' : 'back'
                        }).append(this.options.headerToggleText).on(this.__clickEvent, function(ev) {
                            ev.preventDefault();
                            __self.toggle();
                        }).button());
                    }
                }
            }
            if (this.options.onRefresh) {
                this.options.onRefresh((this.__current) ? "full" : "split");
            }
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
            
            Helix.Layout.refresh();
            Helix.Layout.layoutPage($.mobile.activePage, true);
        },
        
        showRight: function() {
            if (!this.__current) {
                return;
            }
            if (this.__current === "left") {
                this.__current = "right";
                
                this.refresh();
            
                Helix.Layout.refresh();
                Helix.Layout.layoutPage($.mobile.activePage, true);
            } else {
                /* Do nothing. We are already on the right. */
            }
        },
        
        showLeft: function() {
            if (!this.__current) {
                return;
            }
            if (this.__current === "right") {
                this.__current = "left";
                
                this.refresh();
            
                Helix.Layout.refresh();
                Helix.Layout.layoutPage($.mobile.activePage, true);
            } else {
                /* Do nothing. We are already on the right. */
            }
        },
        
        isSplitView: function() {
            return (this.__current == null);
        },
        
        getLeft: function() {
            return $(this.__left);
        },
        
        getRight: function() {
            return $(this.__right);
        }
    });
}( jQuery ));