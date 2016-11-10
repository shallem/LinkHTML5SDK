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
            name: null,
            
            /**
             * Optional theme. Used to provide a color swatch for the menu. Defaults to jquery mobile theme 'd'.
             */
            theme: 'd',
            
            /**
             * Optional divider theme. Used to provide a color swatch for dividers in the menu. Default to jquery mobile
             * theme 'd'.
             */
            dividerTheme: 'd'
        },

        _create: function() {
            this.active = false;

            if (Helix.hasTouch) {
                this.tapEvent = 'touchstart';
                this.stopEvent = Helix.clickEvent + ' tap touchend click mousedown';
            } else {
                this.tapEvent = 'click';
                this.stopEvent = '';
            }
            if (Helix.deviceType === 'phone') {
                this._maxHeight = 300;
            } else {
                this._maxHeight = 500;
            }
            
            if (!this.options.name) {
                this.options.name = Helix.Utils.getUniqueID();
            }
            
            this.optionsList = null;
            this.page = this.element.closest( ".ui-page" );
            this.id = Helix.Utils.getUniqueID();
            this.refresh();
        },
        
        // showItem, status = true or false
        showItem: function(itemIndex, status) {
            if (itemIndex >= this.options.items.length) {
                return false;
            }
            
            var selected = this.options.items[itemIndex];
            var items = this.optionsList.find('[data-index="' + itemIndex + '"]');

            if (items.length === 0) {
                return false;
            }
            var target = items[0];

            if (status === true) {
                // show item
                $(target).closest('li').show();
            } else {
                // hide item
                $(target).closest('li').hide();
            }

            selected.enabled = status;
            return true;
        },
        
        // status = true or false
        enableItem: function(itemIndex, status) {
            if (itemIndex >= this.options.items.length) {
                return false;
            }
            
            var selected = this.options.items[itemIndex];
            var items = this.optionsList.find('[data-index="' + itemIndex + '"]');

            if (items.length === 0) {
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
            var _self = this;
            
            $(this.element).empty();
            this._menuContainer = $('<div/>').attr({
                'data-role' : 'popup',
                'data-theme' : 'a',
                'id' : this.id,
                'data-history': 'false',
                'class' : 'hx-no-webkit-select'
            }).appendTo(this.element);
            this.optionsList = $('<ul />').attr({
                'data-role' : 'listview',
                'data-inset' : 'true',
                'id' : this.id + "-ul" 
            }).appendTo(this._menuContainer);
            for (var i = 0; i < this.options.items.length; ++i) {
                var nxtItem = this.options.items[i];
                var nxtLI = $('<li />');

                if (nxtItem.isDivider) {
                    nxtLI.attr('data-role', 'list-divider');
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
                    if (nxtItem.styleClass) {
                        nxtLI.addClass(nxtItem.styleClass);
                    }
                    nxtLI.append(nxtLink);
                    nxtLink.on(_self.tapEvent, function(evt) {
                        return _self._handleClick(evt);
                    });
                    if (_self.stopEvent) {
                        nxtLink.on(_self.stopEvent, function(evt) {
                            evt.stopImmediatePropagation();
                            return false;
                        });
                    }
                }
                this.optionsList.append(nxtLI);
            }

            $(_self._menuContainer).on(_self.tapEvent, function(evt) {
                // Prevent these events from reaching whatever is below the menu.
                evt.stopImmediatePropagation();
                return false;
            });
            if (_self.stopEvent) {
                $(_self._menuContainer).on(_self.stopEvent, function(evt) {
                    // Prevent these events from reaching whatever is below the menu.
                    evt.stopImmediatePropagation();
                    return false;
                });
            }

            this.optionsList.listview({
                theme: this.options.theme,
                dividerTheme: this.options.dividerTheme
            });
            _self._menuContainer.popup({
                dismissible: !Helix.hasTouch, // We will explicitly close the popup when this is a touch device.
                afterclose: function() {
                    _self.active = false;
                }
            });
        },
        _handleClick : function(evt) {
            if (!this.active) {
                return true;
            }
            evt.stopImmediatePropagation();
            evt.preventDefault();

            var cbData = $(evt.target).attr('data-field');
            var cbIndex = $(evt.target).attr('data-index');

            var _self = this;
            var item = this.options.items[cbIndex];
            if (item.action) {
                var __runAction = function () {
                    var args = [ cbData, evt ];
                    args.push.apply(args, _self._extraArgs);
                    if (_self._thisArg) {
                        item.action.apply(_self._thisArg, args);
                    } else {
                        item.action.apply(_self, args);
                    }
                    // Do this asynchronously so that the screen overlay is still there until
                    // after touch end has completely made its way through the DOM.
                    setTimeout(function() {
                        _self.close();
                    }, 0);
                };
                if (Helix.hasTouch) {
                    // See if the user scrolls before we see touchend. If they do,
                    // then do not fire the event.
                    var scrollTop = $(this._menuContainer).scrollTop();
                    $(evt.target).off('touchend').on('touchend', function (evt2) {
                        var cbIndex2 = $(evt2.target).attr('data-index');
                        if (cbIndex === cbIndex2 &&
                                Math.abs(scrollTop - $(_self._menuContainer).scrollTop()) < 10) {
                            evt2.stopImmediatePropagation();
                            __runAction();
                            return false;
                        }
                        return true;
                    });
                    setTimeout(function () {
                        $(evt.target).off('touchend');
                    }, 2500);
                    return true;
                } else {
                    __runAction();
                    return false;
                }
            }
            return false;
        },
        open: function (obj) {            
            this._thisArg = (obj ? obj.thisArg : null);
            this._extraArgs = ((obj && obj.extraArgs) ? obj.extraArgs : []);
            this.active = true;

            if (this.options.beforeopen) {
                if (this._thisArg) {
                    var args = [ this ];
                    args.push.apply(args, this._extraArgs);
                    this.options.beforeopen.apply(this._thisArg, args);
                } else {
                    this.options.beforeopen.call(this);
                }
            }
            // Make sure at least one item is enabled
            var enabledCt = 0;
            for (var i = 0; i < this.options.items.length; ++i) {
                var nxt = this.options.items[i];
                if (nxt.enabled) {
                    ++enabledCt;
                    break;
                }
            }
            
            if (enabledCt === 0) {
                this.active = false;
                return;
            }

            $(this.page).find(PrimeFaces.escapeClientId(this.id + "-screen")).on(this.tapEvent, $.proxy(this, "_stopAndClose"));
            if (this.stopEvent) {
                $(this.page).find(PrimeFaces.escapeClientId(this.id + "-screen")).on(this.stopEvent, $.proxy(this, "_stop"));
            }

            if (obj) {
                this._menuContainer.popup("open", obj);
            } else {
                this._menuContainer.popup("open");
            }
        },
        hideGroup: function (grp) {
            $(this.optionsList).find('[data-group="' + grp + '"]').hide();
            this.optionsList.listview("refresh");
        },
        showGroup: function (grp) {
            $(this.optionsList).find('[data-group="' + grp + '"]').show();
            this.optionsList.listview("refresh");
        },
        _stopAndClose: function (ev) {
            ev.preventDefault();
            ev.stopImmediatePropagation();
            this.close();
            return false;
        },
        _stop: function (ev) {
            ev.preventDefault();
            ev.stopImmediatePropagation();
            return false;
        },
        close: function () {
            this.active = false;
            this._menuContainer.popup("close");
            $(this.page).find(PrimeFaces.escapeClientId(this.id + "-screen")).off(this.tapEvent);
            if (this.stopEvent) {
                $(this.page).find(PrimeFaces.escapeClientId(this.id + "-screen")).off(this.stopEvent);
            }
        },
        getName: function () {
            return this.options.name;
        },
        isActive: function() {
            return this.active;
        }
    });
}(jQuery));