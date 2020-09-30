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
    
    $.widget("helix.helixFormLayout", {        
        
        options: {
            /**
             * Array of form layout items that are included in the form. Each item
             * is an object that specifies a field declaratively with the following
             * object fields:
             *      type: One of the supported field types.
             *      name: Name for the field. Used as the input name and id.
             *      fieldTitle: Title for the field. Can be text, markup, or omitted.
             *      value: Current value for the field. May be empty.
             *      styleClass: Styling for this form element.
             *      width: Width of this field.
             *      height: Height of this field (only used for images).
             *      style: CSS style attached to the field container.
             */
            items: [],
            
            /**
             * Supported modes. Can be 'view', 'edit', or 'all'.
             */
            modes: 'view',
            
            /**
             * Current mode. Can be 'view' or 'edit'. Cannot be a mode not specified
             * in the modes option.
             */
            currentMode: 'view',
            
            /**
             * True if a horizontal separator should be placed in between field.
             */
            separateElements: false,
            
            /**
             * True if this layout should extend to the full screen height using a flex box.
             */
            fullScreen: false,
            
            /**
             * Object mapping device types to a constant, true or false, which indicates
             * if the form layout should be in "mini" mode for that device type. Supported
             * device types are "tablet", "phablet", and "phone". The default is { "phone" : true }.
             */
            useMiniLayout : {
                "phone" : true
            },
            
            /**
             * Namespace. Used to prefix all names to all form elements to make sure we don't
             * get naming conflicts between different forms in the same applications. It is strongly
             * recommended that the namespace is non-empty.
             */
            namespace : '',
                        
            /**
             * Text to display in the footer when data is loading.
             */
            footerLoadingText: null,
            
            /**
             * Style class for all field titles.
             */
            titleStyleClass: '',
            
            /**
             * Style class for all text inputs.
             */
            textStyleClass: '',
            
            /**
             * Form style class - style class for the form container
             */
            formStyleClass: ''
        },

        _create: function() {
            /* Initialize variables. */
            this._typeMap = [];
            this._fieldMap = [];
            this._isDirty = false;
            
            this.page = $(this.element).closest('[data-role="page"]');
            
            /* Determine if we should use the mini layout based on the device
             * type
             */
            var formStyleClass = '';
            this.layoutMini = false;
            if (("all" in this.options.useMiniLayout) ||
                (Helix.deviceType in this.options.useMiniLayout &&
                 this.options.useMiniLayout[Helix.deviceType])) {
                formStyleClass = 'hx-form-mini';
                this.layoutMini = true;
            }
            
            if (this.options.formStyleClass) {
                formStyleClass = formStyleClass + ' ' + this.options.formStyleClass;
            }
            if (formStyleClass) {
                $(this.element).addClass(formStyleClass);
            }

            /* Attach a namespace to each element. Also create a mapping from field names (no namespace)
             * to types to make it easy to get the value of any field.
             */
            if (!this.options.namespace) {
                this.options.namespace = $(this.element).attr('id');
            }
            
            this._processItems(this.options.items);

            if (this.options.items.length > 0) {
                this.rendered = false;
                this.refresh();
            }
        },
        
        _destroy: function() {
            $(this.element).empty();
        },
        
        _processOneItem: function(formElem) {
            this._typeMap[formElem.name] = formElem.type;
            this._fieldMap[formElem.name] = formElem;
            formElem.parentForm = this;
            formElem.origCondition = formElem.condition;
            formElem.originalName = formElem.name;
            if (this.options.namespace) {
                if (formElem.id) {
                    formElem.id = this.options.namespace + "_" + formElem.id;
                }
                formElem.name = this.options.namespace + "_" + formElem.name;
            }
            if (formElem.type === 'controlset') {
                // Control set.
                this._processItems(formElem.controls);
            } else if (formElem.items) {
                // Sub panel.
                this._processItems(formElem.items);
            }        
        },
        
        _processItems: function(itemsList) {
            for (var idx = 0; idx < itemsList.length; ++idx) {
                var formElem = itemsList[idx];
                this._processOneItem(formElem);
            }
        },
        
        hide: function() {
            $(this.element).hide();
        },
        
        show: function() {
            $(this.element).show();
        },
        
        resetItems: function(itemsList) {
            this._typeMap = [];
            this._fieldMap = [];
            this._isDirty = false;

            for (var idx = 0; idx < itemsList.length; ++idx) {
                var formElem = itemsList[idx];
                if (formElem.originalName) {
                    formElem.name = formElem.originalName;
                }
            }
            this.options.items = itemsList;
            this._processItems(this.options.items);

            if (this.options.items.length > 0) {
                this.rendered = false;
                this.refresh();
            }
        },
    
        _stripNamespace: function(fldName) {
            return fldName.replace(this.options.namespace + "_", '');
        },
        
        _addNamespace : function(fldName) {
            if (this.options.namespace) {
                return this.options.namespace + "_" + fldName;
            }
            return fldName;
        },
    
        __computeOneHidden: function(formElem, valuesMap) {
            var oldHidden = formElem.hidden;
            var fldName = this._stripNamespace(formElem.name);
            if (formElem.condition) {
                if ($.isFunction(formElem.condition)) {
                    formElem.hidden = !(formElem.condition.call(this, (valuesMap ? valuesMap : null), fldName));
                } else if (valuesMap && formElem.condition.toLowerCase() in valuesMap) {
                    if (valuesMap[formElem.condition]) {
                        formElem.hidden = false;
                    } else {
                        formElem.hidden = true;
                    }
                } else  {
                    var fn = window[formElem.condition];
                    if(typeof fn === 'function') {
                        formElem.hidden = !(fn.call(this, (valuesMap ? valuesMap : null), fldName));
                    } else {
                        formElem.hidden = true;
                    }
                }
            }
            if (oldHidden !== formElem.hidden) {
                // Hidden changed.
                return true;
            }
            // Hidden did not change.
            return false;
        },
    
        _computeHidden : function(valuesMap, updateHidden) {
            var idx = 0;
            var i = 0;
            for (idx = 0; idx < this.options.items.length; ++idx) {
                var formElem = this.options.items[idx];
                
                // Process sub items.
                if (formElem.type in this._groupedTypes || formElem.type === 'radio') {
                    for (i = 0; i < formElem.controls.length; ++i) {
                        var subItem = formElem.controls[i];
                        if (this.__computeOneHidden(subItem, valuesMap) &&
                                updateHidden) {
                            this.__updateValue(subItem.mode, subItem.name, subItem, {});
                        }
                    }
                } else if (formElem.type === 'subPanel' ||
                        formElem.type === 'horizontalBlock') { 
                    for (i = 0; i < formElem.items.length; ++i) {
                        var subpItem = formElem.items[i];
                        if (this.__computeOneHidden(subpItem, valuesMap) &&
                                updateHidden) {
                            this.__updateValue(subpItem.mode, subpItem.name, subpItem, {});                            
                        }
                    }
                }
                if (this.__computeOneHidden(formElem, valuesMap) &&
                        updateHidden) {
                    this.__updateValue(formElem.mode, formElem.name, formElem, {});                    
                }
            }
        },
        
        refreshHidden: function(valuesMap) {
            valuesMap = this._normalizeValuesMap(valuesMap);
            this._computeHidden(valuesMap, true);
        },
    
        updateItem: function(name, updatedProperties, reRenderItem) {
            var idx = 0;
            var formElem = null;
            for (idx = 0; idx < this.options.items.length; ++idx) {
                formElem = this.options.items[idx];
                var fldName = this._stripNamespace(formElem.name);
                if (fldName.toLowerCase() === name.toLowerCase()) {
                    for (var prop in updatedProperties) {
                        formElem[prop] = updatedProperties[prop];
                    }
                    break;
                }
                formElem = null;
            }
            if (formElem && reRenderItem) {
                this.__updateValue(this.options.currentMode, this._stripNamespace(formElem.name), formElem, {}, reRenderItem);
            }
        },
    
        startLoading: function(text) {
            var loader = $('<div/>').addClass('hx-datalist-loading')
                    .append($('<div/>').addClass('hx-datalist-loading-bar'))
                    .append($('<div/>').addClass('hx-datalist-loading-bar'))
                    .append($('<div/>').addClass('hx-datalist-loading-bar'))
                    .append($('<div/>').addClass('hx-datalist-loading-bar'));
            
            if (!text) {
                text = this.options.footerLoadingText;
            }
            
            if (text) {
                loader = $('<div/>').addClass('hx-datalist-loading-parent')
                        .append(loader)
                        .append($('<div/>').addClass('hx-datalist-loading-text').append(text));
            }
            this.setFooterContents(loader);
        },
        
        stopLoading: function() {
            this.setFooterContents();
        },
        
        setFooterContents: function(contents) {
            this.$footerSection.empty();
            if (contents) {
                this.$footerSection.append(contents);
                this.$footerSection.show();
            } else {
                this.$footerSection.hide();
            }
        },
        
        hideFooter: function() {
            this.$footerSection.hide();
        },

        /**
         * Render the form using the form layout code. valuesMap is an optional
         * map from field names to field values.
         * 
         * @param valuesMap Map form field names to values.
         */
        refresh: function(valuesMap) {
            valuesMap = this._normalizeValuesMap(valuesMap);
            $(this.element).off('change.' + this.options.namespace);
            this._isDirty = false;
            this._computeHidden(valuesMap);
            
            if (!valuesMap) {
                this.__clearValues(this.options.items);
            } else {
                this.__copyValues(this.options.items, valuesMap);
            }
            $(this.element).empty();
            this.$section = $('<section/>').addClass('hx-full-height hx-full-width').appendTo(this.element);
            if (this.options.fullScreen) {
                this.$section.addClass('hx-flex-vertical');
            }
            
            this.options.formLayout = this;
            Helix.Utils.layoutForm(this.$section, this.options, this.page, this.layoutMini);
            this.rendered = true;
            for (var z = 0; z < this.options.items.length; ++z) {
                this.options.items[z].parentForm = this;
            }
            /**
             * Append the footer.
             */
            this.$footerSection = $('<footer/>').appendTo(this.$section).hide();
                        
            $(this.element).off('change.' + this.options.namespace).on('change.' + this.options.namespace, 'input,textarea,select,fieldset,div[contenteditable="true"]', this, function(ev) {
                ev.data.markDirty();
            });
            $(this.element).off('keydown.' + this.options.namespace).on('keydown.' + this.options.namespace, 'input,textarea', this, function(ev) {
                var key = ev.keyCode || ev.which || ev.charCode;
                switch(key) {
                    case 39:
                        // Right arrow.
                        ev.data._setCaretPosition(1);
                        break;
                    case 37:
                        // Left arrow.
                        ev.data._setCaretPosition(-1);
                        break;
                }
            });
        },
        
        markDirty: function() {
            this._isDirty = true;
        },
        
        isDirty: function() {
            return this._isDirty;
        },
        
        clearDirty: function() {
            this._isDirty = false;
        },
        
        toggle: function(valuesMap) {
            if (this.options.currentMode === 'edit') {
                this.setView(valuesMap);
            } else {
                this.setEdit(valuesMap);
            }
        },
        
        setView: function (valuesMap) {
            if (this.options.fullScreen && this.$section) {
                this.$section.removeClass('hx-flex-vertical');
            }

            if (this.options.modes !== 'all' &&
                this.options.modes !== 'view') {
                alert("Attempting to set a form to view mode when view mode is not supported.");
            }
            this.options.currentMode = 'view';
            
            if (this.rendered) {
                this.refreshValues(valuesMap ? valuesMap : {}, true);
            } else {
                this.refresh(valuesMap ? valuesMap : {});
            }
        },
        
        setEdit : function(valuesMap) {
            if (this.options.fullScreen && this.$section) {
                this.$section.addClass('hx-flex-vertical');
            }
            if (this.options.modes !== 'all' &&
                this.options.modes !== 'edit') {
                alert("Attempting to set a form to edit mode when view mode is not supported.");
            }
            this.options.currentMode = 'edit';
            
            if (this.rendered) {
                this.refreshValues(valuesMap ? valuesMap : {}, true);
            } else {
                this.refresh(valuesMap ? valuesMap : {});
            }
        },
        
        isEdit : function() {
            return (this.options.currentMode === 'edit');
        },
        
        isView: function() {
            return !(this.isEdit());
        },
        
        _serializeTypes : {
            "htmlarea" : true,
            "htmlframe" : true,
            "text" : true,
            "search" : true,
            "textarea" : true,
            "pickList" : true,
            "picklist" : true,
            "hidden" : true,
            "checkbox" : true,
            "onoff" : true,
            "tzSelector" : true,
            "radio" : true,
            "date" : true,
            "datetime" : true
        },
        
        _groupedTypes: {
            "controlset" : true
        },
        
        serializeItem: function(nxtItem, toSerialize) {
            var fieldID = nxtItem.name;
            var strippedFieldID = this._stripNamespace(fieldID);
            var fieldType = nxtItem.type;
            var selector = '[name="' + fieldID + '"]';
            var _self = this;
            
            var __serializeOneItem = function() {
                if (fieldType === "htmlarea" ||
                    fieldType === "htmlframe") {
                    toSerialize.push({
                        name: strippedFieldID,
                        value: $(this).editor('getHTML')
                    });
                } else if (fieldType === "checkbox" ||
                           fieldType === 'onoff') {
                    if ($(this).is(":checked")) {
                        toSerialize.push({
                            name : strippedFieldID,
                            value: true
                        }); 
                    } else {
                        toSerialize.push({
                            name : strippedFieldID,
                            value: false
                        }); 
                    }
                } else if (fieldType === "radio") {
                    if ($(this).is(":checked")) {
                        toSerialize.push({
                            name : strippedFieldID,
                            value: $(this).attr('data-value')
                        });
                    }
                } else if (fieldType === "pickList" ||
                           fieldType === 'picklist' ||
                           fieldType === "tzSelector") {
                    var selected = $(this).find('option:selected');
                    toSerialize.push({
                            name : strippedFieldID,
                            value: selected.val()
                    });
                } else if (fieldType === "date" ||
                           fieldType === "datetime" ||
                           fieldType === 'exactdate') {
                    var timeVal = _self._getDateTimeValue(nxtItem.DOM, this, nxtItem.name);
                    if (timeVal) {
                        toSerialize.push({
                            name: strippedFieldID,
                            value: timeVal.getTime()
                        });
                    }
                } else {
                    toSerialize.push({
                        name : strippedFieldID,
                        value: $(this).val()
                    });
                }
            }
            
            if ($(nxtItem.DOM).is(selector)) {
                __serializeOneItem.call(nxtItem.DOM);
            } else {
                $(nxtItem.DOM).find(selector).each(function() {
                    __serializeOneItem.call(this);
                });
            }
        },
        
        serialize: function(excludeFields) {
            var toSerialize = [];
            var i;
            var subItem;
            for (var idx = 0; idx < this.options.items.length; ++idx) {
                var nxtItem = this.options.items[idx];
                var fieldType = nxtItem.type;
                var strippedFieldID = this._stripNamespace(nxtItem.name);
                if (excludeFields &&
                        (strippedFieldID in excludeFields)) {
                    continue;
                }
                
                if (fieldType in this._groupedTypes) {
                    // Process sub items.
                    for (i = 0; i < nxtItem.controls.length; ++i) {
                        subItem = nxtItem.controls[i];
                        this.serializeItem(subItem, toSerialize);
                    }
                    // We don't serialize the controlset itself - just its component checkboxes
                    continue;
                } else if (fieldType === 'subPanel' || fieldType === 'horizontalBlock') {
                    // Process sub items.
                    for (i = 0; i < nxtItem.items.length; ++i) {
                        subItem = nxtItem.items[i];
                        this.serializeItem(subItem, toSerialize);
                    }
                    // We don't serialize the subPanel itself - just its components
                    continue;
                }
                if (fieldType in this._serializeTypes) {
                    this.serializeItem(nxtItem, toSerialize);
                }
                
                /* All other types are for display - they are not serialized. */
            }
            return $.param(toSerialize);
        },
        
        clear: function() {
            this.__clearValues(this.options.items);
            var mode = (this.options.currentMode === 'edit' ? 1 : 0);
            for (var idx = 0; idx < this.options.items.length; ++idx) {
                var nxtItem = this.options.items[idx];
                if (nxtItem.type === 'subPanel' ||
                        nxtItem.type === 'horizontalBlock') {
                    for (var subidx = 0; subidx < nxtItem.items.length; ++subidx) {
                        var subitem = nxtItem.items[subidx];
                        this.__updateValue(mode,this._stripNamespace(subitem.name),subitem,{});
                    }
                } else{
                    this.__updateValue(mode,this._stripNamespace(nxtItem.name),nxtItem,{});
                }
            }
        },
        
        __hideItem: function(item, DOM) {
            if (!DOM) {
                return;
            }
            
            if (item.parentContainer &&
                item.parentContainer.type &&
                (item.parentContainer.type === "subPanel" ||
                    item.parentContainer.type === 'horizontalBlock')) {
                $(DOM).hide();
            } else {
                $(DOM).closest('.hx-form-container').hide();
            }
        },
        
        __showItem: function(item, DOM) {
            if (!DOM) {
                return;
            }
            
            if (item.parentContainer &&
                item.parentContainer.type &&
                (item.parentContainer.type === "subPanel" ||
                    item.parentContainer.type === 'horizontalBlock')) {
                $(DOM).show();
            } else {
                $(DOM).closest('.hx-form-container').show();
            }
        },
        
        __updateValue: function(mode, name, item, valuesMap, rerenderItem) {
            var value = item.value;
            var thisField = null;
            if (this.rendered) {
                var fldType = item.type;
                var searchName = this._addNamespace(name);

                if (mode) {
                    // This element does not exist in edit mode.
                    if (!item.editDOM) {
                        this.__hideItem(item, item.DOM);
                        if (item.SEPARATOR) {
                            item.SEPARATOR.hide();
                        }
                        return;
                    }
                    item.DOM = item.editDOM;
                    this.__hideItem(item, item.viewDOM);
                } else {
                    // This element does not exist in view mode.
                    if (!item.viewDOM) {
                        this.__hideItem(item, item.DOM);
                        if (item.SEPARATOR) {
                            item.SEPARATOR.hide();
                        }
                        return;
                    }
                    
                    item.DOM = item.viewDOM;
                    this.__hideItem(item, item.editDOM);
                }
                
                if (!item.DOM) {
                    return;
                }

                if (item.hidden) {
                    if (item.DOM) {
                        this.__hideItem(item, item.DOM);
                        if (item.SEPARATOR) {
                            // Hide the HR.
                            $(item.SEPARATOR).hide();
                        }
                    }
                } else if (fldType !== 'hidden') {
                    this.__showItem(item, item.DOM);
                    if (item.SEPARATOR) {
                        // Show the HR.
                        $(item.SEPARATOR).show();
                    }
                }
                
                if (item.readOnly) {
                    // No further updating required.
                    return;
                }

                if (fldType === 'date' ||
                    fldType === 'exactdate' ||
                    fldType === 'datetime') {
                    __refreshDate(mode, item);
                } else if (fldType === 'tzSelector') {
                    __refreshTZSelector(mode, item);
                } else if (fldType === 'pickList' ||
                           fldType === 'picklist') {
                    if (mode) {
                        __refreshSelectMenu(this.options, item, this.layoutMini);
                    } else {
                        __refreshTextBox(mode, item);
                    }
                } else if (fldType === 'checkbox') {
                    __refreshControl(item, undefined, mode, true);
                } else if (fldType === 'onoff') {
                    __refreshOnOffSlider(item);
                } else if (fldType === 'radio') {
                    __refreshRadioButtons(item, rerenderItem);
                } else if (fldType === 'htmlframe') {
                    __refreshHTMLFrame(item, mode);
                } else if (fldType === 'buttonGroup') {
                    __refreshButtonGroup(item);
                } else if ((fldType === 'text') || (fldType === 'search') || (fldType === 'rawText')) {
                    __refreshTextBox(mode, item);
                } else if (fldType === 'textarea' || fldType === 'rawTextarea') {
                    __refreshTextArea(mode, item);
                } else if (fldType === 'textlabel') {
                    __refreshTextLabel(mode, item);
                } else if (fldType === 'horizontalScroll') {
                    __refreshHorizontalScroll(item);
                } else if (fldType === 'subPanel' ||
                        fldType === 'horizontalBlock') { 
                    if (item.panelMode) {
                        if (item.panelMode === 'reverse') {
                            // The sub-panel uses the opposite mode of the parent.
                            mode = (mode ? 0 : 1);
                        } else {
                            mode = (item.panelMode === 'edit' ? 1 : 0);
                        }
                    }
                    for (var idx = 0; idx < item.items.length; ++idx) {
                        var subpItem = item.items[idx];
                        this.__refreshOneValue(mode, subpItem, valuesMap);
                    }
                } else if (fldType === 'controlset') {
                    // Controlset
                    for (idx = 0; idx < item.controls.length; ++idx) {
                        var controlItem = item.controls[idx];
                        this.__refreshOneValue(mode, controlItem, valuesMap);
                    }
                } else if (fldType === 'htmlarea') {
                    __refreshHTMLArea(item);
                } else if (fldType === 'separator') {
                    return;
                } else {
                    if (value === undefined) {
                        value = "";
                    } else if ($.isPlainObject(value) ||
                            $.isArray(value)) {
                        value = JSON.stringify(value);
                    }
                    if (mode) {
                        thisField = $(item.DOM).find('[name="' + searchName + '"]');
                        thisField.val(value);
                    } else {
                        thisField = $(item.DOM).find('[data-name="' + searchName + '"]');
                        thisField.html(value);
                    }
                }
            }
        },
        
        __getValueFromMap: function(item, valuesMap) {
            var newValue = undefined;
            var fieldID = item.name.trim();
            var strippedFieldID = this._stripNamespace(fieldID);
            if (fieldID.toLowerCase() in valuesMap) {
                newValue = valuesMap[fieldID.toLowerCase()];
            } else if (strippedFieldID.toLowerCase() in valuesMap) {
                newValue = valuesMap[strippedFieldID.toLowerCase()];
            } else if ('default' in valuesMap) {
                newValue = valuesMap['default'];
            }
            if (newValue === undefined) {
                newValue = item.defaultValue;
            }
            return newValue;
        },
        
        __copyOneValue: function(item, valuesMap) {
            if (!item.readOnly) {
                var newValue = this.__getValueFromMap(item, valuesMap);
                if (newValue !== undefined) {
                    var fldType = item.type;
                    if (fldType !== 'buttonGroup') {
                        if (item.value === newValue) {
                            // No change
                            return false;
                        }
                        item.value = newValue;
                    } else {
                        item.buttons = newValue;
                    }
                    // Value changed.
                    return true;
                }
            }
            // Value did not change.
            return false;
        },
        
        __refreshOneValue: function(mode, item, valuesMap, modeChanged) {
            var visibilityChanged = 
                (mode === 0 && item.mode === 'edit') || 
                (mode === 1 && item.mode === 'view') || 
                (item.type === 'controlset') ||
                modeChanged;

            var valueChanged = false;
            if (!item.readOnly) {
                valueChanged = this.__copyOneValue(item, valuesMap);
            }
            var hiddenChanged = this.__computeOneHidden(item, valuesMap);
            
            // Update the rendered form ...
            if (visibilityChanged || valueChanged || hiddenChanged) {
                this.__updateValue(mode, this._stripNamespace(item.name), item, valuesMap);
                return true;
            }
                       
            return false;
        },
        
        _normalizeValuesMap: function(valuesMapIn) {
            var valuesMap = {};
            if (!valuesMapIn) {
                valuesMapIn = this.getValues();
            }
            for (var k in valuesMapIn) {
                try {
                    valuesMap[k.trim().toLowerCase()] = valuesMapIn[k];
                    valuesMap[k] = valuesMapIn[k];
                } catch(e) {
                    
                }
            }
            return valuesMap;
        },
        
        refreshValue: function(valuesMap, fieldName, modeChanged) {
            valuesMap = this._normalizeValuesMap(valuesMap);
            
            var mode = (this.options.currentMode === 'edit' ? 1 : 0);
            for (var idx = 0; idx < this.options.items.length; ++idx) {
                var nxtItem = this.options.items[idx];
                if (nxtItem.type === 'subPanel' ||
                        nxtItem.type === 'horizontalBlock') {
                    var forceRefresh = false;
                    if (this._stripNamespace(nxtItem.name) === fieldName) {
                        this.__refreshOneValue(mode,nxtItem,valuesMap,modeChanged);
                        forceRefresh = true;
                        // Fall through - refreshing the parent implies refreshing all children ...
                    }
                    for (var subidx = 0; subidx < nxtItem.items.length; ++subidx) {
                        var subitem = nxtItem.items[subidx];
                        if (forceRefresh === true) {
                            // We are refreshing the parent. Refresh all children.
                            this.__refreshOneValue(mode,subitem,valuesMap,modeChanged);
                        } else if (this._stripNamespace(subitem.name) === fieldName) {
                            this.__refreshOneValue(mode,subitem,valuesMap,modeChanged);
                            return;
                        }
                    }                        
                } else if (this._stripNamespace(nxtItem.name) === fieldName) {
                    this.__refreshOneValue(mode, nxtItem, valuesMap,modeChanged);
                    return;
                }
            }

        },
        
        refreshValues: function(valuesMap, modeChanged) {
            valuesMap = this._normalizeValuesMap(valuesMap);
            var mode = (this.options.currentMode === 'edit' ? 1 : 0);
            for (var idx = 0; idx < this.options.items.length; ++idx) {
                var nxtItem = this.options.items[idx];
                if (nxtItem.type === "subPanel" ||
                        nxtItem.type === 'horizontalBlock') {
                    if (!this.__refreshOneValue(mode,nxtItem,valuesMap,modeChanged)) {
                        for (var subidx = 0; subidx < nxtItem.items.length; ++subidx) {
                            var subitem = nxtItem.items[subidx];
                            this.__refreshOneValue(mode,subitem,valuesMap,modeChanged);
                        } 
                    }
                    $(nxtItem.DOM).trigger('collapse');
                } else{
                    this.__refreshOneValue(mode, nxtItem, valuesMap,modeChanged);
                }
            }
        },
        
        __copyValues: function(items, valuesMap) {
            for (var idx = 0; idx < items.length; ++idx) {
                var nxtItem = items[idx];
                this.__copyOneValue(nxtItem, valuesMap);
                if (nxtItem.type === 'subPanel' ||
                        nxtItem.type === 'horizontalBlock') {
                    this.__copyValues(nxtItem.items, valuesMap);
                }
            }
        },
        
        __clearOneValue : function(item) {
            if (!item.readOnly) {
                var fldType = item.type;
                if (fldType !== 'buttonGroup') {
                    item.value = (item.defaultValue ? item.defaultValue : null);
                } else {
                    item.buttons = null;
                }
            }
        },
        
        __clearValues: function(items) {
            for (var idx = 0; idx < items.length; ++idx) {
                var nxtItem = items[idx];
                this.__clearOneValue(nxtItem);
                if (nxtItem.type === 'subPanel' ||
                        nxtItem.type === 'horizontalBlock') {
                    this.__clearValues(nxtItem.items);
                } else if (nxtItem.type === 'controlset') {
                    // controlset or radio
                    this.__clearValues(nxtItem.controls);
                }
            }
        },
        
        setValue: function(name, value) {
            var item, subItem;
            name = this._stripNamespace(name);
            item = this._fieldMap[name];
            for (var idx = 0; idx < this.options.items.length; ++idx) {
                item = this.options.items[idx];
                var fieldID = item.name;
                var strippedFieldID = this._stripNamespace(fieldID);

                if (name.toLowerCase() === strippedFieldID.toLowerCase()) {
                    break;
                }
                if (item.type === 'subPanel' ||
                        item.type === 'horizontalBlock') {
                    // Go through the items.
                    for (var j = 0; j < item.items.length; ++j) {
                        subItem = item.items[j];
                        var _subID = this._stripNamespace(subItem.name);
                        if (name.toLowerCase() === _subID.toLowerCase()) {
                            break;
                        }
                        subItem = null;
                    }
                }
                if (subItem) {
                    item = subItem;
                    break;
                }
                item = null;
            }
            if (!item) {
                return;
            }
            
            var mode = (this.options.currentMode === 'edit' ? 1 : 0);
            var valuesObj = {};
            if (value !== null && value !== undefined) {
                valuesObj[name] = value;
            }
            valuesObj = this._normalizeValuesMap(valuesObj);
            this.__refreshOneValue(mode, item, valuesObj);
        },
        
        _getDateTimeValue: function(parentDOM, fld, searchName) {
            var thisField = $(parentDOM).find('[name="' + searchName + '"]');
            var timeField = $(parentDOM).find('[name="' + searchName + '_time"]');
        
            var dateObj = new Date();
            if (thisField.length) {
                dateObj = $(thisField).pickadate('get', 'select');
                if (dateObj) {
                    dateObj = dateObj.obj;
                } else {
                    dateObj = new Date();
                }
            }
            if (timeField.length) {
                var timeObj = $(timeField).pickatime('get', 'select');
                if (timeObj) {
                    dateObj.setHours(timeObj.hour);
                    dateObj.setMinutes(timeObj.mins);
                }
            }
            
            return dateObj;
            
            /*var isoStr = $(fld).val();
            if (!isoStr) {
                return null;
            }
            
            var d = new Date(isoStr);
            // Re-adjust back to local TZ.
            //d.addMinutes(d.getTimezoneOffset());
            return d;*/
        },
        
        getValue: function(name) {
            name = this._stripNamespace(name);
            var fld = this._fieldMap[name];
            if (!fld) {
                return null;
            }
            if (!fld.name) {
                // Cannot get the value of name-less fields.
                return null;
            }
            
            var searchName = this._addNamespace(name);
            
            var fldSelector = '[name="' + searchName + '"]';
            var thisField;
            if ($(fld.DOM).is(fldSelector)) {
                thisField = $(fld.DOM);
            } else {
                thisField = $(fld.DOM).find(fldSelector);
            }
            if (thisField.length === 0) {
                return (fld.defaultValue ? fld.defaultValue : null);
            }
            
            var fldType = this._typeMap[name];
            // Checkboxes and radios are handled the same regardless of mode.
            if (fldType === 'checkbox' ||
                fldType === 'onoff') {
                if ($(thisField).is(":checked")) {
                    return true;
                }
                return false;
            } else if (fldType === 'radio') {
                var checked = $(fld.DOM).find(':checked');
                if (checked.length > 0) {
                    return checked.attr('data-value');
                }
                return null;
            }
            
            var mode = (this.options.currentMode === 'edit' ? 1 : 0);
            if (!mode || fld.viewOnly) {
                return $(fld.DOM).find('[data-name="' + fld.name + '"]').html();
            }
            
            if (fldType === 'date' ||
                fldType === 'exactdate' ||
                fldType === 'datetime') {
                return this._getDateTimeValue(fld.DOM, thisField, searchName);
            } else if (fldType === 'tzSelector' ||
                       fldType === 'pickList' ||
                       fldType === 'picklist') {
                var selected = $(thisField).find('option:selected');
                if (selected.length > 0) {
                    return selected.val();
                }
            } else if (fldType === 'htmlarea' ||
                       fldType === 'htmlframe') {
                return $(thisField).editor('getHTML')
            } else {
                return thisField.val();
            }
            
            return null;
        },
        
        getValues: function(excludes) {
            var obj = {};
            for (var fieldID in this._fieldMap) {
                if (excludes && fieldID in excludes) {
                    continue;
                }
                
                obj[fieldID] = this.getValue(fieldID);
            }
            
            return obj;
        },
        
        getField: function(name) {
            name = this._stripNamespace(name);
            return this._fieldMap[name];
        },
        
        getFieldElement: function(name) {
            name = this._stripNamespace(name);
            
            var fld = this._fieldMap[name];
            var ret = null;
            if (fld) {
                if (!fld.name) {
                    return fld.DOM;
                }
                
                if (fld.type === 'radio') {
                    // The radio field is the container itself.
                    return fld.DOM;
                } 
                
                
                var nameAttribute = '[name="' + fld.name + '"]';
                ret = $(fld.DOM).find('input'+nameAttribute+",textarea"+nameAttribute+",div"+nameAttribute);
                if (ret.length === 0) {
                    ret = $(fld.DOM).find('[data-name="' + fld.name + '"]');
                }
                if (ret.length === 0) {
                    ret = $(fld.DOM);
                }
                
                return ret;
            }
            return null;
        },
        
        hideField : function(name) {
            name = this._stripNamespace(name);
            
            var fld = this._fieldMap[name];
            if (!fld || fld.hidden === true) {
                // Bad name, or already hidden
                return;
            }
            fld.hidden = true;
            fld.condition = __hx_always_invisible;
            this.__updateValue(fld.mode, name, fld, {});            
        },
        
        showField: function(name) {
            name = this._stripNamespace(name);
            var fld = this._fieldMap[name];
            if (!fld || fld.hidden === false) {
                // Already showing ...
                return;
            }
            
            fld.hidden = false;
            fld.condition = fld.origCondition;
            this.__updateValue(fld.mode, name, fld, {});
        },
        
        isHidden: function(name) {
            name = this._stripNamespace(name);
            var fld = this._fieldMap[name];
            return fld.hidden;
        },
        
        disableField: function(name) {
            var fieldElem = this.getFieldElement(name);
            if (fieldElem && fieldElem.is('input,textarea')) {
                fieldElem.addClass('ui-disabled');
                fieldElem[0].readOnly = true;
            }
        },
        
        focusField: function(name) {
            var fieldElem = this.getFieldElement(name);
            if (fieldElem) {
                if (fieldElem.is('input,textarea,select')) {
                    fieldElem.focus();
                } else {
                    // See if this is an editor.
                    var fld = this.getField(name);
                    if (fld.type === 'htmlarea') {
                        $(fieldElem).editor('focus');
                    }
                }
            }
        },
        
        blurForm: function() {
            $(this.element).find('input,select,textarea,div[contenteditable="true"]').blur();
        },
        
        enableField: function(name) {
            var fieldElem = this.getFieldElement(name);
            if (fieldElem && fieldElem.is('input,textarea')) {
                fieldElem.removeClass('ui-disabled');
                fieldElem[0].readOnly = false;
            }
        },
        
        _checkNonEmpty: function(val) {
            if (val) {
                return true;
            }  
            
            return false;
        },
        
        _checkNotPast: function(val) {
            // Val should be a date object
            if (!val || (!val.getTime && isNaN(val))) {
                // Not a date object.
                return false;
            }
            
            if (!val.getTime) {
                val = new Date(parseInt(val));
            }
            var nowDate = new Date();
            // Adjust nowDate to account for the fact that 'val' is interpreted as GMT time, whereas for this purpose
            // we want to interpret it in the local TZ. getTimezoneOffset returns minutes of offset from current TZ to
            // GMT (e.g., EST is GMT -300, and getTimezoneOffset returns +300)
            nowDate.setTime(nowDate.getTime() - (nowDate.getTimezoneOffset() * 60 * 1000));
            return !(val.isBefore(nowDate));
        },
        
        save: function () {
            var idx = 0;
            for (idx = 0; idx < this.options.items.length; ++idx) {
                var nxtItem = this.options.items[idx];
                var fieldID = nxtItem.name;
                var fieldType = nxtItem.type;
                if (fieldType !== 'htmlarea') {
                    /* Other types don't require an explicit save. */
                    continue;
                }
            }
        },
        
        _validateItem: function(nxtItem, validationErrors) {
            var fieldType = nxtItem.type;
            var fieldID = nxtItem.name;
            var strippedFieldID = this._stripNamespace(fieldID);
            if (!(fieldType in this._serializeTypes)) {
                /* All other types are unserializable. */
                return;
            }

            var validator = null;
            // Determine the validator function.
            if (nxtItem.validator) {
                if (Helix.Utils.isString(nxtItem.validator)) {
                    if (nxtItem.validator === 'notempty') {
                        validator = this._checkNonEmpty;
                    } else if (nxtItem.validator === 'notpast') {
                        validator = this._checkNotPast;
                    } else {
                        var fn = window[nxtItem.validator];
                        if(typeof fn !== 'function') {
                            validator = function() {
                                Helix.Utils.statusMessage('Invalid validator', nxtItem.validator + ' is not a function.', 'error');
                            };
                        } else {
                            validator = fn;
                        }
                    }
                } else {
                    validator = nxtItem.validator;
                }
            } else {
                return;
            }

            $(this.element).find('[name="' + fieldID + '"]').each(function() {
                var toValidate = "";
                if (fieldType === "htmlarea") {
                    toValidate = $(this).editor('getHTML');
                } else if (fieldType === "checkbox") {
                    if ($(this).is(":checked")) {
                        toValidate = true;
                    } else {
                        toValidate = false;
                    }
                } else if (fieldType === "pickList" ||
                            fieldType === 'picklist' ||
                           fieldType === "tzSelector") {
                    var selected = $(this).find('option:selected');
                    toValidate = selected.val();
                } else {
                    toValidate = $(this).val();
                }
                if (!validator.call(this, toValidate)) {
                    // Validation failed.
                    validationErrors[strippedFieldID] = nxtItem;
                }
            });            
        },
        
        validate: function() {
            var idx = 0;
            var validationErrors = {};
            for (idx = 0; idx < this.options.items.length; ++idx) {
                var nxtItem = this.options.items[idx];
                if (nxtItem.hidden) {
                    continue;
                }
                if (nxtItem.type === 'subPanel' ||
                        nxtItem.type === 'horizontalBlock') {
                    // Go through the items.
                    for (var j = 0; j < nxtItem.items.length; ++j) {
                        this._validateItem(nxtItem.items[j], validationErrors);
                    }
                } else {
                    this._validateItem(nxtItem, validationErrors);
                }                
            }
            return validationErrors;
        },
        
        addItem: function(item) {
            this.options.items.push(item);
            this._processOneItem(item);
        },
        
        removeItem: function(item) {
            item.originalName = item.name;
            item.name =  this.options.namespace + '_' + item.name;
            
            if (this.options.items) {
                for (var i=0; i<this.options.items.length; i++) {
                    if (this.options.items[i].name === item.name) {
                            this.options.items.splice(i, 1);
                            return i;
                    }
                }
            }
            
            return -1;
        },
              
        replaceItem: function(item) {
            item.originalName = item.name;
            item.name =  this.options.namespace + '_' + item.name;
            
            if (this.options.items) {
                for (var i=0; i<this.options.items.length; i++) {
                    if (this.options.items[i].name === item.name) {
                            this.options.items[i] = item;
                            return i;
                    }
                }
            }
            
            return -1;
        },
        
        getItems: function() {
            return this.options.items;
        },
        
        _setCaretPosition: function (delta) {
            var sel = window.getSelection();
            if (sel) {
                var newRange = null;
                var anchorNode = sel.anchorNode;
                if (!anchorNode) {
                    return;
                }
                if (anchorNode.nodeType === 3) {
                    if (delta > 0) {
                        if (sel.anchorOffset + delta <= anchorNode.length) {
                            newRange = document.createRange();
                            newRange.setStart(sel.anchorNode, sel.anchorOffset + delta);
                        }
                    } else {
                        if (sel.anchorOffset + delta >= 0) {
                            newRange = document.createRange();
                            newRange.setStart(sel.anchorNode, sel.anchorOffset + delta);
                        }
                    }
                    if (newRange !== null) {
                        newRange.collapse(true);
                        sel.removeAllRanges();
                        sel.addRange(newRange);
                        return;
                    }
                }
            }
        }
    });
}( jQuery ));

function __hx_always_invisible() {
    return false;
}