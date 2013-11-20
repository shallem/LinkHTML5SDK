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
             * True if we are laying out a form for editing. False if not.
             */
            mode: false,
            
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
                    formElem.name = this.options.namespace + "_" + formElem.name;
                    formElem.id = this.options.namespace + "_" + formElem.id;
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
    
        _computeOneHidden: function(formElem, valuesMap) {
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
            }
        },
    
        _computeHidden : function(valuesMap) {
            var idx = 0;
            for (idx = 0; idx < this.options.items.length; ++idx) {
                var formElem = this.options.items[idx];
                
                // Process sub items.
                if (formElem.type in this._groupedTypes) {
                    for (var i = 0; i < formElem.controls.length; ++i) {
                        var subItem = formElem.controls[i];
                        this._computeOneHidden(subItem, valuesMap);
                    }
                } 
                this._computeOneHidden(formElem, valuesMap);
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
                this.clear();
                if (this.rendered) {
                    return;
                }
            }
            this.currentValues = valuesMap;
            Helix.Utils.layoutForm(this.element, this.options, this.page, this.layoutMini);
            this.rendered = true;
        },
        
        toggle: function(valuesMap) {
            if (this.options.mode) {
                this.options.mode = false;
            } else {
                this.options.mode = true;
            }
            this._computeHidden(valuesMap);
            Helix.Utils.layoutForm(this.element, this.options, this.page, this.layoutMini);
            this.rendered = true;
        },
        
        setView: function (valuesMap) {
            this.options.mode = false;
            this._computeHidden(valuesMap);
            Helix.Utils.layoutForm(this.element, this.options, this.page, this.layoutMini);
        },
        
        setEdit : function(valuesMap) {
            this.options.mode = true;
            this._computeHidden(valuesMap);
            Helix.Utils.layoutForm(this.element, this.options, this.page, this.layoutMini);            
        },
        
        isEdit : function() {
            return this.options.mode;
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
            var idx = 0;
            for (idx = 0; idx < this.options.items.length; ++idx) {
                var fieldID = this.options.items[idx].name;
                var fieldType = this.options.items[idx].type;
                
                /* Clear out all values so that all fields are reset to their defaults. */
                this.options.items[idx].value = null;

                if (!(fieldType in this._serializeTypes) ||
                    fieldType === "horizontalScroll") {
                    /* All other types have nothing to clear.. */
                    continue;
                }
                $(this.element).find('[name="' + fieldID + '"]').each(function() {
                    if (fieldType === "htmlarea") {
                        var $editor = $(this).data('cleditor');
                        $editor.clear();
                    } else if (fieldType === "pickList") {
                        $(this).find('option:selected').each(function() {
                            this.selected = false;
                            $(this).removeAttr('selected');
                        });
                        $(this).selectmenu('refresh');
                    } else if (fieldType === "checkbox") {
                        $(this).removeAttr('checked');
                    } else if (fieldType === "horizontalScroll") {
                        $(this).empty();
                    } else {
                        $(this).val('');
                    }
                });
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
            if (this.rendered) {
                var fldType = this._typeMap[name];
                var searchName = this._addNamespace(name);
                var thisField = $(this.element).find('[name="' + searchName + '"]');

                if (fldType === 'date' ||
                    fldType === 'exactdate' ||
                    fldType === 'datetime') {
                    $(thisField).trigger('datebox', { method: 'set', value : value });
                    $(thisField).trigger('datebox', { method: 'doset' });
                    
                    var timeElem = $(this.element).find('[name="' + searchName + '_time"]');
                    if (timeElem.length > 0) {
                        $(timeElem).trigger('datebox', { method: 'set', value: value });
                        $(timeElem).trigger('datebox', { method: 'doset' });
                    }
                } else if (fldType === 'tzSelector' ||
                           fldType === 'pickList') {
                    $(thisField).find('option:selected').each(function() {
                        $(this).prop({ selected : false });
                    });
                    $(thisField).find('option[value="' + value + '"]').each(function() {
                        $(this).prop({ selected : true });
                    });
                    $(thisField).selectmenu('refresh');
                } else if (fldType === 'checkbox') {
                    if (value) {
                        $(thisField).attr('checked', 'true');
                    } else {
                        $(thisField).removeAttr('checked');
                    }
                } else {
                    thisField.val(value);
                }
            }
        },
        
        getValue: function(name) {
            var fldType = this._typeMap[name];
            var searchName = this._addNamespace(name);
            var thisField = $(this.element).find('[name="' + searchName + '"]');
            
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
        
        getFieldElement: function(name) {
            var searchName = this._addNamespace(name);
            var thisField = $(this.element).find(PrimeFaces.escapeClientId(searchName));
            return thisField;
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