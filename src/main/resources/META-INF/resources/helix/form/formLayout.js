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
            var idx = 0;
            for (idx = 0; idx < this.options.items.length; ++idx) {
                var formElem = this.options.items[idx];
                this._typeMap[formElem.name] = formElem.type;
                if (this.options.namespace) {
                    if (formElem.id) {
                        formElem.id = this.options.namespace + "_" + formElem.id;
                    }
                    formElem.name = this.options.namespace + "_" + formElem.name;
                }
            }

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
            var fldName = this._stripNamespace(formElem.name);
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
                    for (i = 0; idx < formElem.items.length; ++idx) {
                        var subpItem = formElem.items.items[idx];
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
                this.setView();
            } else {
                this.setEdit();
            }
            
            if (this.rendered) {
                this.refreshValues(valuesMap);
            } else {
                this.refresh(valuesMap);
            }
        },
        
        setView: function () {
            if (this.options.modes !== 'all' &&
                this.options.modes !== 'view') {
                alert("Attempting to set a form to view mode when view mode is not supported.");
            }
            this.options.currentMode = 'view';
        },
        
        setEdit : function() {
            if (this.options.modes !== 'all' &&
                this.options.modes !== 'edit') {
                alert("Attempting to set a form to edit mode when view mode is not supported.");
            }
            this.options.currentMode = 'edit';
        },
        
        isEdit : function() {
            return (this.options.currentMode === 'edit');
        },
        
        isView: function() {
            return !(this.isEdit());
        },
        
        _serializeTypes : {
            "htmlarea" : true,
            "text" : true,
            "textarea" : true,
            "pickList" : true,
            "hidden" : true,
            "checkbox" : true,
            "tzSelector" : true
        },
        
        _groupedTypes: {
            "controlset" : true
        },
        
        serializeItem: function(nxtItem, toSerialize) {
            var fieldID = nxtItem.name;
            var strippedFieldID = this._stripNamespace(fieldID);
            var fieldType = nxtItem.type;
            
            $(this.element).find('[name="' + fieldID + '"]').each(function() {
                if (fieldType === "htmlarea") {
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
            });
        },
        
        serialize: function() {
            var toSerialize = [];
            for (var idx = 0; idx < this.options.items.length; ++idx) {
                var nxtItem = this.options.items[idx];
                var fieldType = nxtItem.type;
                
                if (fieldType in this._groupedTypes) {
                    // Process sub items.
                    for (var i = 0; i < nxtItem.controls.length; ++i) {
                        var subItem = nxtItem.controls[i];
                        this.serializeItem(subItem, toSerialize);
                    }
                    // We don't serialize the controlset itself - just its component checkboxes
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
            this.refreshValues({});
        },
        
        __updateValue: function(name, item, valuesMap) {
            var value = item.value;
            var mode = (this.options.currentMode === 'edit' ? 1 : 0);
            if (this.rendered) {
                var fldType = item.type;
                var searchName = this._addNamespace(name);
                var thisField = $(this.element).find('[name="' + searchName + '"]');

                if (mode) {
                    // This element does not exist in edit mode.
                    if (!item.editDOM) {
                        if (item.DOM) {
                            item.DOM.hide();
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
                        return;
                    }
                    
                    item.DOM = item.viewDOM;
                    if (item.editDOM) {
                        item.editDom.hide();
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
                } else if (fldType === 'tzSelector' ||
                           fldType === 'pickList') {
                    if (mode) {
                        $(thisField).find('option:selected').each(function() {
                            $(this).prop({ selected : false });
                        });
                        $(thisField).find('option[value="' + value + '"]').each(function() {
                            $(this).prop({ selected : true });
                        });
                        $(thisField).selectmenu('refresh');                        
                    } else {
                        if (value === undefined) {
                            value = "";
                        }
                        $(thisField).html(value);
                    }
                } else if (fldType === 'checkbox') {
                    if (mode) {
                        if (value) {
                            $(thisField).attr('checked', 'true');
                        } else {
                            $(thisField).removeAttr('checked');
                        }                        
                    } else {
                        if (value === undefined) {
                            value = "";
                        }
                        $(thisField).html("&nbsp;" + value);
                    }
                } else if (fldType === 'htmlframe') {
                    __refreshIFrame(item);
                } else if (fldType === 'buttonGroup') {
                    __refreshButtonGroup(item);
                } else if (fldType === 'pickList') {
                    __refreshSelectMenu(item);
                } else if (fldType === 'text') {
                    __refreshTextBox(mode, item);
                } else if (fldType === 'horizontalScroll') {
                    __refreshHorizontalScroll(item);
                } else if (fldType === 'subPanel') { 
                    for (var idx = 0; idx < item.items.length; ++idx) {
                        var subpItem = item.items[idx];
                        this.__refreshOneValue(mode, subpItem, valuesMap);
                    }
                } else if (fldType === 'htmlarea') {
                    __refreshHTMLArea(item);
                } else {
                    
                    if (value === undefined) {
                        value = "";
                    }
                    if (mode) {
                        thisField.val(value);
                    } else {
                        thisField.html(value);
                    }
                }
            }
        },
        
        __copyOneValue : function(item, valuesMap) {
            var fieldID = item.name;
            var strippedFieldID = this._stripNamespace(fieldID);
            if (!item.readOnly && (valuesMap[strippedFieldID] !== undefined)) {
                var fldType = item.type;
                if (fldType !== 'buttonGroup') {
                    item.value = valuesMap[strippedFieldID];
                } else {
                    item.buttons = valuesMap[strippedFieldID];
                }
            }
        },
        
        __refreshOneValue: function(item, valuesMap) {
            this.__computeOneHidden(item, valuesMap);
            this.__copyOneValue(item, valuesMap);
            this.__updateValue(this._stripNamespace(item.name), item, valuesMap);
        },
        
        refreshValues: function(valuesMap) {
            for (var idx = 0; idx < this.options.items.length; ++idx) {
                var nxtItem = this.options.items[idx];
                this.__refreshOneValue(nxtItem, valuesMap);
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
                }
            }
        },
        
        setValue: function(name, value) {
            // Set the value fields in the form items regardless of whether or not the
            // form has already been rendered. The reason is that we want to be certain
            // that if we toggle the form we get the right values. Toggling the form re-renders
            // all elements for obvious reasons ...
            for (var idx = 0; idx < this.options.items.length; ++idx) {
                var fieldID = this.options.items[idx].name;
                var strippedFieldID = this._stripNamespace(fieldID);

                if (name === strippedFieldID) {
                    this.options.items[idx].value = value;
                    break;
                }
            }
            this.__updateValue(name, this.options.items[idx]);
        },
        
        getValue: function(name) {
            var searchName = this._addNamespace(name);
            var thisField = $(this.element).find('[name="' + searchName + '"]');
            var fldType = $(thisField).attr('data-formType');
            
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
            } else if (fldType === 'checkbox') {
                if ($(thisField).is(":checked")) {
                    return true;
                }
                return false;
            } else {
                return thisField.val();
            }
            
            return null;
        },
        
        getValues: function() {
            var obj = {};
            var idx = 0;
            for (idx = 0; idx < this.options.items.length; ++idx) {
                var fieldID = this.options.items[idx].name;
                obj[fieldID] = this.getValues(fieldID);
            }
            
            return obj;
        },
        
        getFieldElement: function(name) {
            var searchName = this._addNamespace(name);
            var thisField = $(this.element).find(PrimeFaces.escapeClientId(searchName));
            return thisField;
        },
        
        disableField: function(name) {
            var fieldElem = this.getFieldElement(name);
            if (fieldElem.is('input')) {
                fieldElem.addClass('ui-disabled');
            }
        },
        
        enableField: function(name) {
            var fieldElem = this.getFieldElement(name);
            if (fieldElem.is('input')) {
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
                $(this.element).find('[name="' + fieldID + '"]').each(function() {
                    if (fieldType === "htmlarea") {
                        var $editor = $(this).data('cleditor');
                        if ($editor) {
                            $editor.updateTextArea();
                        }
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