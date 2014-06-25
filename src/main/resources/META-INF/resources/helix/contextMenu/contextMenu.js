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
             * enabled : If false, the menu item is displayed but disabled
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
            },
            
            /**
             * Optional callback that is invoked before the context menu is opened. The 'this' variable
             * in the call is determined by the object that opens this context menu. If that object specifies
             * a 'this' object, then that specified object is relayed to the callback. Otherwise the context menu
             * object is 'this' in the callback.
             */
            beforeopen: null,
            
            /**
             * Optional name. Used to provide a unique ID for each menu item of the form <name>-<index>.
             * If no name is provided, one is generated. The getName method returns the name.
             */
            name: null
        },

        _create: function() {
            this.active = false;

            if (Helix.hasTouch) {
                this.tapEvent = 'touchstart';
            } else {
                this.tapEvent = 'click';
            }
            if (!this.options.name) {
                this.options.name = Helix.Utils.getUniqueID();
            }
            
            this.optionsList = null;
            this.page = this.element.closest( ".ui-page" );
            this.id = Helix.Utils.getUniqueID();
            this.refresh();
        },
        
        // status = true or false
        enableItem: function(itemIndex, status) {
            if (itemIndex >= this.options.items.length) {
                return false;
            }
            
            var selected = this.options.items[itemIndex];
            var items = this.optionsList.find('[data-index="' + itemIndex + '"]');

            if (items.length == 0) {
                return false;
            }
            var target = items[0];

            if (status === true) {
                // Enable item
                if (selected.enabled === false) {
                    $(target).closest('li').removeClass('ui-disabled');
                }
            } else {
                // Disable item
                // 'enabled' may be true, false or null/undefined
                if (selected.enabled || (selected.enabled === undefined)) {
                    var li = $(target).closest('li');
                    $(li).addClass('ui-disabled');
                }   
            }

            selected.enabled = status;
            return true;
        },

        refresh: function() {
            $(this.element).empty();
            this._menuContainer = $('<div/>').attr({
                'data-role' : 'popup',
                'data-theme' : 'a',
                'id' : this.id,
                'data-history': 'false'
            }).appendTo(this.element);
            this.optionsList = $('<ul />').attr({
                'data-role' : 'listview',
                'data-inset' : 'true',
                'id' : this.id + "-ul",
                'data-theme' : 'b'
            }).appendTo(this._menuContainer);
            for (var i = 0; i < this.options.items.length; ++i) {
                var nxtItem = this.options.items[i];
                var nxtLI = $('<li />');

                if (nxtItem.isDivider) {
                    nxtLI.attr('data-role', 'divider');
                    nxtLI.attr('data-theme', 'a');
                    nxtLI.append(nxtItem.display);
                } else {
                    var nxtLink = $('<a />').attr({
                        'href' : 'javascript:void(0)',
                        'data-index' : i,
                        'id' : this.options.name + '-' + (nxtItem.name ? nxtItem.name: i) 
                    }).append(nxtItem.display);
                    if (nxtItem.data) {
                        nxtLink.attr('data-field', nxtItem.data);
                    }
                    if (nxtItem.enabled === false) {
                        nxtLI.addClass('ui-disabled');
                    }
                    if (nxtItem.group) {
                        nxtLI.attr('data-group', nxtItem.group);
                    }
                    nxtLI.append(nxtLink);
                }
                this.optionsList.append(nxtLI);
            }

            var _self = this;
            this.optionsList.on(_self.tapEvent, 'a', function(evt) {
                evt.stopImmediatePropagation();
                evt.stopPropagation();
                evt.preventDefault();

                var cbData = $(evt.target).attr('data-field');
                var cbIndex = $(evt.target).attr('data-index');

                var item = _self.options.items[cbIndex];
                if (item.action) {
                    if (_self._thisArg) {
                        item.action.call(_self._thisArg, cbData, evt);
                    } else {
                        item.action.call(_self, cbData, evt);
                    }
                }
                _self.close();
            });

            if (Helix.hasTouch) {
                // Prevent touch events from propagating.
                this.optionsList.on('tap', function(ev) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    ev.stopImmediatePropagation();
                    return false;
                });
            }

            this.optionsList.listview();
            _self._menuContainer.popup({
                dismissible: !Helix.hasTouch, // We will explicitly close the popup when this is a touch device.
                afterclose: function() {
                    _self.active = false;
                }
            });
        },

        open: function(obj) {
            this._thisArg = obj.thisArg;
            if (this.options.beforeopen) {
                if (this._thisArg) {
                    this.options.beforeopen.call(this._thisArg);
                } else {
                    this.options.beforeopen.call(this);
                }
            }
            
            this._menuContainer.popup("open", obj);
            if (Helix.hasTouch) {
                this.active = true;
                $(this.page).find(PrimeFaces.escapeClientId(this.id + "-screen")).on( this.tapEvent, $.proxy( this, "_stopAndClose" ) );
                $(this.page).find(PrimeFaces.escapeClientId(this.id + "-screen")).on( 'tap', $.proxy( this, "_stop" ) );
            }
            
        },
        
        hideGroup: function(grp) {
            $(this.optionsList).find('[data-group="' + grp + '"]').hide();
            this.optionsList.listview("refresh");
        },
        
        showGroup: function(grp) {
            $(this.optionsList).find('[data-group="' + grp + '"]').show();
            this.optionsList.listview("refresh");
        },

        _stopAndClose: function(ev) {
            ev.preventDefault();
            ev.stopImmediatePropagation();
            this.close();
            return false;
        },

        _stop: function(ev) {
            ev.preventDefault();
            ev.stopImmediatePropagation();
            return false;
        },

        close: function() {
            this.active = false;
            this._menuContainer.popup("close");
            if (Helix.hasTouch) {
                $(this.page).find(PrimeFaces.escapeClientId(this.id + "-screen")).off( this.tapEvent );
                $(this.page).find(PrimeFaces.escapeClientId(this.id + "-screen")).off( 'tap' );
            }
        },
        
        getName: function() {
            return this.options.name;
        }
    });
}( jQuery ));