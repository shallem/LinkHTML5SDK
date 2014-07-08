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
            namespace : ''
        },

        _create: function() {
            /* Initialize variables. */
            this._typeMap = [];
            this._fieldMap = [];
            
            this.page = $(this.element).closest('[data-role="page"]');
            
            /* Determine if we should use the mini layout based on the device
             * type
             */
            this.layoutMini = false;
            if (Helix.deviceType in this.options.useMiniLayout &&
                this.options.useMiniLayout[Helix.deviceType]) {
                $(this.element).addClass('hx-form-mini');
                this.layoutMini = true;
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
        
        _processItems: function(itemsList) {
            for (var idx = 0; idx < itemsList.length; ++idx) {
                var formElem = itemsList[idx];
                this._typeMap[formElem.name] = formElem.type;
                this._fieldMap[formElem.name] = formElem;
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
            var fldName = this._stripNamespace(formElem.name);
            var oldHidden = formElem.hidden;
            if (valuesMap && fldName in valuesMap) {
                formElem.value = valuesMap[fldName];
            }
            if (formElem.condition) {
                if (valuesMap && formElem.condition in valuesMap) {
                    if (valuesMap[formElem.condition]) {
                        formElem.hidden = false;
                    } else {
                        formElem.hidden = true;
                    }
                } else  {
                    var fn = window[formElem.condition];
                    if(typeof fn === 'function') {
                        formElem.hidden = !(fn.call(this, (valuesMap ? valuesMap : null)));
                    } else {
                        formElem.hidden = true;
                    }
                }
            } else {
                formElem.hidden = false;
            }
            if (oldHidden != formElem.hidden) {
                // Hidden changed.
                return true;
            }
            // Hidden did not change.
            return false;
        },
    
        _computeHidden : function(valuesMap) {
            var idx = 0;
            var i = 0;
            for (idx = 0; idx < this.options.items.length; ++idx) {
                var formElem = this.options.items[idx];
                
                // Process sub items.
                if (formElem.type in this._groupedTypes) {
                    for (i = 0; i < formElem.controls.length; ++i) {
                        var subItem = formElem.controls[i];
                        this.__computeOneHidden(subItem, valuesMap);
                    }
                } else if (formElem.type === 'subPanel') { 
                    for (i = 0; i < formElem.items.length; ++i) {
                        var subpItem = formElem.items[i];
                        this.__computeOneHidden(subpItem, valuesMap);
                    }
                }
                this.__computeOneHidden(formElem, valuesMap);
            }
        },
    
        updateItem: function(name, updatedProperties) {
            var idx = 0;
            for (idx = 0; idx < this.options.items.length; ++idx) {
                var formElem = this.options.items[idx];
                var fldName = this._stripNamespace(formElem.name);
                if (fldName === name) {
                    for (var prop in updatedProperties) {
                        formElem[prop] = updatedProperties[prop];
                    }
                }
            }
        },
    
        /**
         * Render the form using the form layout code. valuesMap is an optional
         * map from field names to field values.
         * 
         * @param valuesMap Map form field names to values.
         */
        refresh: function(valuesMap) { 
            this._computeHidden(valuesMap);
            
            if (!valuesMap) {
                this.__clearValues(this.options.items);
            } else {
                this.__copyValues(this.options.items, valuesMap);
            }
            Helix.Utils.layoutForm(this.element, this.options, this.page, this.layoutMini);
            this.rendered = true;
        },
        
        toggle: function(valuesMap) {
            if (this.options.currentMode === 'edit') {
                this.setView(valuesMap);
            } else {
                this.setEdit(valuesMap);
            }
        },
        
        setView: function (valuesMap) {
            if (this.options.modes !== 'all' &&
                this.options.modes !== 'view') {
                alert("Attempting to set a form to view mode when view mode is not supported.");
            }
            this.options.currentMode = 'view';
            
            if (this.rendered) {
                this.refreshValues(valuesMap ? valuesMap : {});
            } else {
                this.refresh(valuesMap ? valuesMap : {});
            }
        },
        
        setEdit : function(valuesMap) {
            if (this.options.modes !== 'all' &&
                this.options.modes !== 'edit') {
                alert("Attempting to set a form to edit mode when view mode is not supported.");
            }
            this.options.currentMode = 'edit';
            
            if (this.rendered) {
                this.refreshValues(valuesMap ? valuesMap : {});
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
            "textarea" : true,
            "pickList" : true,
            "hidden" : true,
            "checkbox" : true,
            "tzSelector" : true,
            "radio" : true
        },
        
        _groupedTypes: {
            "controlset" : true
        },
        
        serializeItem: function(nxtItem, toSerialize) {
            var fieldID = nxtItem.name;
            var strippedFieldID = this._stripNamespace(fieldID);
            var fieldType = nxtItem.type;
            var selector = '[name="' + fieldID + '"]';
            
            var __serializeOneItem = function() {
                if (fieldType === "htmlarea" ||
                    fieldType === "htmlframe") {
                    var $editor = $(this).data('cleditor');
                    if ($editor) {
                        $editor.updateTextArea();
                    }
                    toSerialize.push({
                        name: strippedFieldID,
                        value: $(this).val()
                    });
                } else if (fieldType === "checkbox") {
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
                           fieldType === "tzSelector") {
                    var selected = $(this).find('option:selected');
                    toSerialize.push({
                            name : strippedFieldID,
                            value: selected.val()
                    });
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
        
        serialize: function() {
            var toSerialize = [];
            var i;
            var subItem;
            for (var idx = 0; idx < this.options.items.length; ++idx) {
                var nxtItem = this.options.items[idx];
                var fieldType = nxtItem.type;
                
                if (fieldType in this._groupedTypes) {
                    // Process sub items.
                    for (i = 0; i < nxtItem.controls.length; ++i) {
                        subItem = nxtItem.controls[i];
                        this.serializeItem(subItem, toSerialize);
                    }
                    // We don't serialize the controlset itself - just its component checkboxes
                    continue;
                } else if (fieldType === 'subPanel') {
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
                if (nxtItem.type === "subPanel") {
                    for (var subidx = 0; subidx < nxtItem.items.length; ++subidx) {
                        var subitem = nxtItem.items[subidx];
                        this.__updateValue(mode,this._stripNamespace(subitem.name),subitem,{});
                    }
                } else{
                    this.__updateValue(mode,this._stripNamespace(nxtItem.name),nxtItem,{});
                }
            }
        },
        
        __updateValue: function(mode, name, item, valuesMap) {
            var value = item.value;
            var thisField = null;
            if (this.rendered) {
                var fldType = item.type;
                var searchName = this._addNamespace(name);

                if (mode) {
                    // This element does not exist in edit mode.
                    if (!item.editDOM) {
                        if (item.DOM) {
                            item.DOM.hide();
                        }
                        if (item.SEPARATOR) {
                            item.SEPARATOR.hide();
                        }
                        return;
                    }
                    item.DOM = item.editDOM;
                    if (item.viewDOM) {
                        item.viewDOM.hide();
                    }
                } else {
                    // This element does not exist in view mode.
                    if (!item.viewDOM) {
                        if (item.DOM) {
                            item.DOM.hide();
                        }
                        if (item.SEPARATOR) {
                            item.SEPARATOR.hide();
                        }
                        return;
                    }
                    
                    item.DOM = item.viewDOM;
                    if (item.editDOM) {
                        item.editDOM.hide();
                    }
                }

                if (item.hidden) {
                    if (item.DOM) {
                        $(item.DOM).hide();
                        if (item.SEPARATOR) {
                            // Hide the HR.
                            $(item.SEPARATOR).hide();
                        }
                    }
                    return;
                } else {
                    $(item.DOM).show();
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
                } else if (fldType === 'pickList') {
                    if (mode) {
                        thisField = $(item.DOM).find('[name="' + searchName + '"]');
                        $(thisField).find('option:selected').each(function() {
                            $(this).prop({ selected : false });
                        });
                        $(thisField).find('option[value="' + value + '"]').each(function() {
                            $(this).prop({ selected : true });
                        });
                        $(thisField).selectmenu('refresh');                        
                    } else {
                        __refreshTextBox(mode, item);
                    }
                } else if (fldType === 'checkbox') {
                    __refreshControl(item, false, mode);
                } else if (fldType === 'radio') {
                    __refreshRadioButtons(item);
                } else if (fldType === 'htmlframe') {
                    __refreshHTMLFrame(item);
                } else if (fldType === 'buttonGroup') {
                    __refreshButtonGroup(item);
                } else if (fldType === 'pickList') {
                    __refreshSelectMenu(item);
                } else if (fldType === 'text') {
                    __refreshTextBox(mode, item);
                } else if (fldType === 'textarea') {
                    __refreshTextArea(mode, item);
                } else if (fldType === 'horizontalScroll') {
                    __refreshHorizontalScroll(item);
                } else if (fldType === 'subPanel') { 
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
                        /*if (!controlItem.hidden) {
                            $(controlItem.DOM).closest('div.ui-checkbox').show();
                        } else {
                            $(controlItem.DOM).closest('div.ui-checkbox').hide();
                        }*/
                        
                        this.__refreshOneValue(mode, controlItem, valuesMap);
                    }
                } else if (fldType === 'htmlarea') {
                    __refreshHTMLArea(item);
                } else if (fldType === 'separator') {
                    return;
                } else {
                    if (value === undefined) {
                        value = "";
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
        
        __copyOneValue : function(item, valuesMap) {
            var fieldID = item.name;
            var strippedFieldID = this._stripNamespace(fieldID);
            if (!item.readOnly) {
                if (valuesMap[strippedFieldID] !== undefined ||
                    valuesMap['default'] !== undefined) {
                    var newValue = (valuesMap[strippedFieldID] !== undefined ? 
                                        valuesMap[strippedFieldID] : valuesMap['default']);
                    
                    var fldType = item.type;
                    if (fldType !== 'buttonGroup') {
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
        
        __refreshOneValue: function(mode, item, valuesMap) {
            var hiddenChanged = this.__computeOneHidden(item, valuesMap);
            var valueChanged = this.__copyOneValue(item, valuesMap);
            if (hiddenChanged || valueChanged) {
                this.__updateValue(mode, this._stripNamespace(item.name), item, valuesMap);                
            }
        },
        
        refreshValues: function(valuesMap) {
            var mode = (this.options.currentMode === 'edit' ? 1 : 0);
            for (var idx = 0; idx < this.options.items.length; ++idx) {
                var nxtItem = this.options.items[idx];
                if (nxtItem.type === "subPanel") {
                    for (var subidx = 0; subidx < nxtItem.items.length; ++subidx) {
                        var subitem = nxtItem.items[subidx];
                        this.__refreshOneValue(mode,subitem,valuesMap);
                    }
                } else{
                    this.__refreshOneValue(mode, nxtItem, valuesMap);
                }
            }
        },
        
        __copyValues: function(items, valuesMap) {
            for (var idx = 0; idx < items.length; ++idx) {
                var nxtItem = items[idx];
                this.__copyOneValue(nxtItem, valuesMap);
                if (nxtItem.type === 'subPanel') {
                    this.__copyValues(nxtItem.items, valuesMap);
                }
            }
        },
        
        __clearOneValue : function(item) {
            if (!item.readOnly) {
                var fldType = item.type;
                if (fldType !== 'buttonGroup') {
                    item.value = null;
                } else {
                    item.buttons = null;
                }
            }
        },
        
        __clearValues: function(items) {
            for (var idx = 0; idx < items.length; ++idx) {
                var nxtItem = items[idx];
                this.__clearOneValue(nxtItem);
                if (nxtItem.type === 'subPanel') {
                    this.__clearValues(nxtItem.items);
                } else if (nxtItem.type === 'controlset') {
                    // controlset or radio
                    this.__clearValues(nxtItem.controls);
                }
            }
        },
        
        setValue: function(name, value) {
            var item;
            for (var idx = 0; idx < this.options.items.length; ++idx) {
                item = this.options.items[idx];
                var fieldID = item.name;
                var strippedFieldID = this._stripNamespace(fieldID);

                if (name === strippedFieldID) {
                    break;
                }
            }
            if (!item) {
                return;
            }
            
            var mode = (this.options.currentMode === 'edit' ? 1 : 0);
            var valuesObj = {};
            valuesObj[name] = value;
            this.__refreshOneValue(mode, item, valuesObj);
        },
        
        getValue: function(name) {
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
            var fldType = this._typeMap[name];
            
            // Checkboxes and radios are handled the same regardless of mode.
            if (fldType === 'checkbox') {
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
            if (!mode) {
                return $(fld.DOM).find('[data-name="' + fld.name + '"]').html();
            }
            
            if (fldType === 'date' ||
                fldType === 'exactdate' ||
                fldType === 'datetime') {
                var dateObj = thisField.data('mobile-datebox');
                var timeElem = $(this.element).find('[name="' + searchName + '_time"]');
                if (timeElem.length > 0) {
                    var timeObj = timeElem.data('mobile-datebox');
                    dateObj.theDate.set({
                        hour : timeObj.theDate.getHours(),
                        minute: timeObj.theDate.getMinutes()
                    });           
                }
                return dateObj.theDate;
            } else if (fldType === 'tzSelector' ||
                       fldType === 'pickList') {
                var selected = $(thisField).find('option:selected');
                if (selected.length > 0) {
                    return selected.val();
                }
            } else {
                return thisField.val();
            }
            
            return null;
        },
        
        getValues: function() {
            var obj = {};
            for (var fieldID in this._fieldMap) {
                obj[fieldID] = this.getValue(fieldID);
            }
            
            return obj;
        },
        
        getFieldElement: function(name) {
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
                ret = $(fld.DOM).find('input'+nameAttribute+",textarea"+nameAttribute);
                if (ret.length == 0) {
                    ret = $(fld.DOM).find('[data-name="' + fld.name + '"]');
                }
                if (ret.length == 0) {
                    ret = $(fld.DOM);
                }
                
                return ret;
            }
            return null;
        },
        
        disableField: function(name) {
            var fieldElem = this.getFieldElement(name);
            if (fieldElem && fieldElem.is('input')) {
                fieldElem.addClass('ui-disabled');
            }
        },
        
        enableField: function(name) {
            var fieldElem = this.getFieldElement(name);
            if (fieldElem && fieldElem.is('input')) {
                fieldElem.removeClass('ui-disabled');
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
            if (!val.getTime && isNaN(val)) {
                // Not a date object.
                return false;
            }
            
            if (!val.getTime) {
                val = new Date(parseInt(val));
            }
            return !(val.isBefore(new Date()));
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
                $(this.element).find('textarea[name="' + fieldID + '"]').each(function() {
                    var $editor = $(this).data('cleditor');
                    if ($editor) {
                        $editor.updateTextArea();
                    }
                });
            }
        },
        
        validate: function() {
            var idx = 0;
            var validationErrors = {};
            for (idx = 0; idx < this.options.items.length; ++idx) {
                var nxtItem = this.options.items[idx];
                var fieldID = nxtItem.name;
                var strippedFieldID = this._stripNamespace(fieldID);
                var fieldType = nxtItem.type;
                if (!(fieldType in this._serializeTypes)) {
                    /* All other types are unserializable. */
                    continue;
                }
                
                var validator = null;
                // Determine the validator function.
                if (nxtItem.validator) {
                    if (Helix.Utils.isString(nxtItem.validator)) {
                        if (nxtItem.validator === 'notempty') {
                            validator = this._checkNonEmpty;
                        } else if (nxtItem.validator === 'notpast') {
                            validator = this._checkNotPast;
                        }
                    } else {
                        validator = nxtItem.validator;
                    }
                } else {
                    continue;
                }
                
                $(this.element).find('[name="' + fieldID + '"]').each(function() {
                    var toValidate = "";
                    if (fieldType === "htmlarea") {
                        var $editor = $(this).data('cleditor');
                        if ($editor) {
                            $editor.updateTextArea();
                        }
                        toValidate = $(this).val();
                    } else if (fieldType === "checkbox") {
                        if ($(this).is(":checked")) {
                            toValidate = true;
                        } else {
                            toValidate = false;
                        }
                    } else if (fieldType === "pickList" ||
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
            }
            return validationErrors;
        }
    });
}( jQuery ));