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
    
    $.widget("helix.helixContextMenu", {        
        
        options: {
            /**
             * Array of context menu items that are included in the popup menu. Each item
             * is an object that specifies a menu item delaratively as follows:
             *
             * display : String to display.
             * action : Function to execute when this item is tapped. This function is
             *          executed with this popup menu object as the 'this' object.
             * data: String to store in each item in the context menu and to pass to the action as
             *       the only argument when a tap occurs. This is optional. Null is passed to the action
             *       if data is not specified.
             */
            items: [],
            
            /**
             * Object mapping device types to a constant, true or false, which indicates
             * if the form layout should be in "mini" mode for that device type. Supported
             * device types are "tablet", "phablet", and "phone". The default is { "phone" : true }.
             */
            useMiniLayout : {
                "phone" : true
            }
        },

        _create: function() {
            this.active = false;
            
            if (Helix.hasTouch) {
                this.tapEvent = 'touchstart';
            } else {
                this.tapEvent = 'click';
            }
            this.refresh();
        },
        
        refresh: function() {
            $(this.element).empty();
            this._menuContainer = $('<div/>').attr({
                'data-role' : 'popup',
                'id' : Helix.Utils.getUniqueID(),
                'data-theme' : 'a',
                'data-history': 'false'
            }).appendTo(this.element);
            var optionsList = $('<ul />').attr({ 
                'data-role' : 'listview',
                'data-inset' : 'true',
                'data-theme' : 'b'
            }).appendTo(this._menuContainer);
            for (var i = 0; i < this.options.items.length; ++i) {
                var nxtItem = this.options.items[i];
                var nxtLI = $('<li />');
                var nxtLink = $('<a />').attr({ 
                    'href' : 'javascript:void(0)',
                    'data-index' : i
                }).append(nxtItem.display);
                if (nxtItem.data) {
                    nxtLink.attr('data-field', nxtItem.data);
                }
                nxtLI.append(nxtLink);
                optionsList.append(nxtLI);
            }
            
            var _self = this;
            optionsList.on(_self.tapEvent, 'li', function(evt) {
                evt.stopImmediatePropagation();
                evt.stopPropagation();
                evt.preventDefault();

                var cbData = $(evt.target).attr('data-field');
                var cbIndex = $(evt.target).attr('data-index');

                var item = _self.options.items[cbIndex];
                if (item.action) {
                    item.action.call(_self, cbData);
                }
                _self.close();
            });
            
            if (Helix.hasTouch) {
                // Prevent touch events from propagating.
                optionsList.on('tap', function(ev) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    ev.stopImmediatePropagation();
                });
            }
            
            optionsList.listview();
            _self._menuContainer.popup({
                afteropen: function(ev, ui) {
                    _self.active = true;
                },
                afterclose: function(ev, ui) {
                    _self.active = false;
                }
            });
        },
        
        open: function(obj) {
            this._menuContainer.popup("open", obj);
        },
        
        close: function() {
            this._menuContainer.popup("close");
        }
    });
}( jQuery ));