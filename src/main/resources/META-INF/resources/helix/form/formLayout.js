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
    
        _computeHidden : function(valuesMap) {
            var idx = 0;
            for (idx = 0; idx < this.options.items.length; ++idx) {
                var formElem = this.options.items[idx];
                var fldName = this._stripNamespace(formElem.name);
                if (valuesMap && fldName in valuesMap) {
                    formElem.value = valuesMap[fldName];
                }
                // if we fall through then we don't want to overwrite a static value ...
                
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
        
        _serializeTypes : {
            "htmlarea" : true,
            "text" : true,
            "textarea" : true,
            "pickList" : true,
            "hidden" : true,
            "checkbox" : true,
            "tzSelector" : true
        },
        
        serialize: function() {
            var idx = 0;
            var toSerialize = [];
            for (idx = 0; idx < this.options.items.length; ++idx) {
                var fieldID = this.options.items[idx].name;
                var strippedFieldID = this._stripNamespace(fieldID);
                var fieldType = this.options.items[idx].type;
                if (!(fieldType in this._serializeTypes)) {
                    /* All other types are unserializable. */
                    continue;
                }
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

                if (!(fieldType in this._serializeTypes)) {
                    /* All other types have nothing to clear.. */
                    continue;
                }
                $(this.element).find('[name="' + fieldID + '"]').each(function() {
                    if (fieldType === "htmlarea") {
                        var $editor = $(this).data('cleditor');
                        $editor.clear();
                    } else if (fieldType === "pickList") {
                        $(this).find('option:selected').removeAttr('selected');
                        $(this).selectmenu('refresh');
                    } else if (fieldType === "checkbox") {
                        $(this).attr('checked', false);
                    } else {
                        $(this).val('');
                    }
                });
            }
        },
        
        setValue: function(name, value) {
            if (!this.rendered) {
                for (var idx = 0; idx < this.options.items.length; ++idx) {
                    var fieldID = this.options.items[idx].name;
                    var strippedFieldID = this._stripNamespace(fieldID);

                    if (name === strippedFieldID) {
                        this.options.items[idx].value = value;
                        break;
                    }
                }
            } else {
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
                        $(timeElem).datebox('set', value);           
                    }
                } else if (fldType === 'tzSelector' ||
                           fldType === 'pickList') {
                    $(thisField).find('option').removeAttr('selected');
                    var selected = $(thisField).find('option[value="' + value + '"]');
                    if (selected.length > 0) {
                        selected.attr('selected', 'true');
                    }
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
        }
    });
}( jQuery ));