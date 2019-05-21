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
(function ($) {

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
            useMiniLayout: {
                "phone": true
            },
            /**
             * Optional callback that is invoked before the context menu is opened. The 'this' variable
             * in the call is determined by the object that opens this context menu. If that object specifies
             * a 'this' object, then that specified object is relayed to the callback. Otherwise the context menu
             * object is 'this' in the callback.
             */
            beforeopen: null,
            /**
             * Optional callback that is invoked after the context menu is opened. The 'this' variable
             * in the call is determined by the object that opens this context menu. If that object specifies
             * a 'this' object, then that specified object is relayed to the callback. Otherwise the context menu
             * object is 'this' in the callback.
             */
            afteropen: null,
            /**
             * Called after the context menu is closed. Optional.
             */
            afterclose: null,
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
        _refreshControlGroups: false,
        _create: function () {
            this.active = false;

            if (Helix.hasTouch) {
                this.tapEvent = 'touchstart';
                this.stopEvent = Helix.clickEvent + ' tap touchstart touchend vclick click mousedown';
            } else {
                this.tapEvent = 'click';
                this.stopEvent = 'vclick click';
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
            this.page = this.element.closest(".ui-page");
            this.id = Helix.Utils.getUniqueID();
            this.refresh();
        },
        // Update the label with a runtime override
        updateOverrideLabel: function(selected, target, overrideLabel) {
            if (overrideLabel) {
                if (selected.type === 'radio') {
                    $(target).find('legend.span').text(overrideLabel);
                } else if (selected.type === 'checkbox') {
                    $(target).find('span.ui-btn-text').text(overrideLabel);
                } else if (selected.type === 'text') {
                    $(target).find('label').text(overrideLabel);
                } else {
                    $(target).text(overrideLabel);
                }
            }
        },
        
        // showItem, status = true or false
        showItem: function (itemIndex, status, overrideLabel) {
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
            
            this.updateOverrideLabel(selected, target, overrideLabel);
            selected.enabled = status;
            return true;
        },
        // status = true or false
        enableItem: function (itemIndex, status, overrideLabel) {
            if (itemIndex >= this.options.items.length) {
                return false;
            }

            var selected = this.options.items[itemIndex];
            var items = this.optionsList.find('[data-index="' + itemIndex + '"]');

            if (items.length === 0) {
                return false;
            }
            var target = items[0];

            if (selected.type === 'radio') {
                var inputs = $(target).find('input[type="radio"]');
                for (var i = 0; i < status.length; ++i) {
                    var _input = inputs[i];
                    var nxt = status[i];
                    var isEnabled = $.isArray(nxt) ? nxt[0] : nxt;
                    var nxtVal = $.isArray(nxt) ? nxt[1] : false;
                    if (isEnabled === true) {
                        $(_input).checkboxradio('enable');
                    } else {
                        $(_input).checkboxradio('disable');
                    }
                    if (nxtVal === true) {
                        $(_input).attr('checked', true);
                    } else {
                        $(_input).removeAttr('checked');
                    }
                }
                this._refreshControlGroups = true;
            } else if (selected.type === 'checkbox') {
                if (status === true) {
                    $(items).checkboxradio('enable');
                } else {
                    $(items).checkboxradio('disable');
                }
            } else if (selected.type === 'text') {
                var isEnabled = $.isArray(status) ? status[0] : status;
                var nxtVal = $.isArray(status) ? status[1] : '';
                if (isEnabled === true) {
                    $(items).textinput('enable');
                } else {
                    $(items).textinput('disable');
                }
                $(items).val(nxtVal);
            } else {
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
            }

            this.updateOverrideLabel(selected, target, overrideLabel);
            selected.enabled = status;
            return true;
        },
        refresh: function () {
            var _self = this;

            $(this.element).empty();
            this._menuContainer = $('<div/>').attr({
                'data-role': 'popup',
                'data-theme': 'a',
                'id': this.id,
                'data-history': 'false',
                'class': 'hx-no-webkit-select'
            }).appendTo(this.element);
            this.optionsList = $('<ul />').attr({
                'data-role': 'listview',
                'data-inset': 'true',
                'id': this.id + "-ul"
            });
            this._menuContainer.append(this.optionsList);
            for (var i = 0; i < this.options.items.length; ++i) {
                var nxtItem = this.options.items[i];
                var nxtLI = $('<li />');

                if (nxtItem.isDivider) {
                    nxtLI.attr('data-role', 'list-divider');
                    nxtLI.append(nxtItem.display);
                } else {
                    var nxtLink;
                    var inputID = this.options.name + '-' + (nxtItem.name ? nxtItem.name : i);
                    switch (nxtItem.type) {
                        case 'radio':
                            var form = $('<form/>').appendTo(nxtLI);
                            var fieldSet = nxtLink = $('<fieldset/>').attr({
                                'data-role': 'controlgroup',
                                'data-type': 'horizontal',
                                'data-index': i
                            }).append($('<legend/>').append($('<span/>').css('font-weight', 'bold').append(nxtItem.display))).appendTo(form);
                            for (var j = 0; j < nxtItem.options.length; ++j) {
                                var _opt = nxtItem.options[j];
                                var inputMarkup = $('<input/>').attr({
                                    'type': 'radio',
                                    'name': nxtItem.name,
                                    'id': inputID + '-' + j + '-id',
                                    'value': _opt.value
                                });
                                fieldSet.append(inputMarkup)
                                fieldSet.append($('<label/>').attr({
                                    'for': inputID + '-' + j + '-id'
                                }).append(_opt.label));
                                inputMarkup.checkboxradio({
                                    mini: true
                                });
                                $(inputMarkup).change(nxtItem, function (ev) {
                                    if ($(this).prop('checked')) {
                                        _self.__runAction(ev, ev.data, $(this).attr('value'), true);
                                    }
                                });
                            }
                            fieldSet.controlgroup({
                                mini: true,
                                type: 'vertical'
                            });
                            break;
                        case 'checkbox':
                            var form = $('<form/>').appendTo(nxtLI);
                            nxtLink = $('<input/>').attr({
                                'name': nxtItem.name,
                                'id': inputID,
                                'type': 'checkbox',
                                'tabindex': -1,
                                'data-index': i
                            }).appendTo(form);
                            $('<label/>').attr({
                                'for': inputID,
                                'data-corners': 'false'
                            }).append(nxtItem.display).appendTo(form);
                            nxtLink.checkboxradio({
                                mini: true
                            });
                            $(nxtLink).change(nxtItem, function (ev) {
                                if ($(this).prop('checked')) {
                                    _self.__runAction(ev, ev.data, true, true);
                                } else {
                                    _self.__runAction(ev, ev.data, false, true);
                                }
                            });
                            break;
                        case 'text':
                            var inputMarkup = $('<input />').attr({
                                'name': nxtItem.name,
                                'id': inputID,
                                'type': 'text',
                                'autocapitalize': 'off',
                                'data-index': i
                            });

                            var textContainer = $('<div />').attr({
                                'data-role': 'fieldcontain',
                                'class': 'hx-mini-fieldcontain',
                                'style' : 'max-width: 150px !important;'
                            })
                                    .append($('<label />').attr({
                                        'for': inputID
                                    })
                                            .append(nxtItem.display)
                                            )
                                    .append(inputMarkup)
                                    .appendTo(nxtLI);
                            textContainer.fieldcontain();
                            $(inputMarkup).textinput({
                                disabled: !nxtItem.enabled
                            });
                            if (nxtItem.action) {
                                $(inputMarkup).on('input', null, [_self, nxtItem], function (ev) {
                                    ev.data[0].__runAction(ev, ev.data[1], $(ev.target).val(), true);
                                });
                            }
                            break;
                        default:
                            nxtLink = $('<a />').attr({
                                'href': 'javascript:void(0)',
                                'data-index': i,
                                'id': inputID
                            }).append(nxtItem.display).appendTo(nxtLI);
                            nxtLink.on(_self.tapEvent, function (evt) {
                                return _self._handleClick(evt);
                            });
                            if (_self.stopEvent) {
                                nxtLink.on(_self.stopEvent, function (evt) {
                                    evt.stopImmediatePropagation();
                                    return false;
                                });
                            }
                            break;
                    }
                    if (nxtItem.data) {
                        nxtLI.attr('data-field', nxtItem.data);
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
                }
                this.optionsList.append(nxtLI);
            }

            this.optionsList.listview({
                theme: this.options.theme,
                dividerTheme: this.options.dividerTheme
            });
            _self._menuContainer.popup({});
            $(_self._menuContainer).on('popupafterclose', null, _self, function(ev) {
                var _p = ev.data;
                _p.active = false;
                if (_p.options.afterclose) {
                    if (_p._thisArg) {
                        var args = [_p];
                        args.push.apply(args, _p._extraArgs);
                        _p.options.afterclose.apply(_p._thisArg, args);
                    } else {
                        _p.options.afterclose.call(_p);
                    }
                }
            });
        },
        __runAction: function (evt, item, value, noClose) {
            var _self = this;
            var cbData = $(evt.target).closest('li').attr('data-field');

            var args = [cbData, evt];
            args.push.apply(args, _self._extraArgs);
            if (value !== undefined) {
                args.push(value);
            }
            if (_self._thisArg) {
                args.push(_self);
                item.action.apply(_self._thisArg, args);
            } else {
                item.action.apply(_self, args);
            }
            // Do this asynchronously so that the screen overlay is still there until
            // after touch end has completely made its way through the DOM.
            setTimeout(function () {
                if (!noClose) {
                    _self.close();
                }
            }, 0);
        },
        _handleClick: function (evt) {
            if (!this.active) {
                return true;
            }
            evt.stopImmediatePropagation();
            evt.preventDefault();

            var cbIndex = $(evt.target).attr('data-index');

            var _self = this;
            var item = this.options.items[cbIndex];
            if (item.action) {
                if (Helix.hasTouch) {
                    // See if the user scrolls before we see touchend. If they do,
                    // then do not fire the event.
                    var scrollTop = $(this._menuContainer).scrollTop();
                    $(evt.target).off('touchend').on('touchend', item, function (evt2) {
                        var cbIndex2 = $(evt2.target).attr('data-index');
                        if (cbIndex === cbIndex2 &&
                                Math.abs(scrollTop - $(_self._menuContainer).scrollTop()) < 10) {
                            evt2.stopImmediatePropagation();
                            _self.__runAction(evt2, evt2.data);
                            return false;
                        }
                        return true;
                    });
                    setTimeout(function () {
                        $(evt.target).off('touchend');
                    }, 2500);
                    return true;
                } else {
                    _self.__runAction(evt, item);
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
                    var args = [this];
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

            if (this._refreshControlGroups) {
                $(this._menuContainer).find('fieldset').controlgroup('refresh');
                this._refreshControlGroups = false;
            }
            if (this.options.afteropen) {
                if (this._thisArg) {
                    var args = [this];
                    args.push.apply(args, this._extraArgs);
                    this.options.afteropen.apply(this._thisArg, args);
                } else {
                    this.options.afteropen.call(this);
                }
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
        isActive: function () {
            return this.active;
        },
        getMenuElement: function () {
            return this.optionsList;
        },
        getMenuItemElement: function (idx) {
            var e = this.optionsList.find('li')[idx]
            return $(e);
        },
        getInputValue: function (name) {
            var e = this.optionsList.find('input[name="' + name + '"]');
            if (e && e.length) {
                return e.val();
            }
            return null;
        }
    });
}(jQuery));