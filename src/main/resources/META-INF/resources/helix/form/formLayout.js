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
            separateElements: false
        },

        _create: function() {
            this.page = $(this.element).closest('[data-role="page"]');
            if (this.options.items.length > 0) {
                this.refresh();
            }
        },
    
        /**
         * Render the form using the form layout code. valuesMap is an optional
         * map from field names to field values.
         * 
         * @param valuesMap Map form field names to values.
         */
        refresh: function(valuesMap) {            
            var idx = 0;
            for (idx = 0; idx < this.options.items.length; ++idx) {
                var fldName = this.options.items[idx].name;
                if (valuesMap && (fldName in valuesMap)) {
                    this.options.items[idx].value = valuesMap[fldName];
                } else {
                    this.options.items[idx].value = "";
                }
            }    
           Helix.Utils.layoutForm(this.element, this.options, this.page);
        },
        
        serialize: function() {
            var idx = 0;
            var toSerialize = [];
            for (idx = 0; idx < this.options.items.length; ++idx) {
                var fieldID = this.options.items[idx].name;
                var fieldType = this.options.items[idx].type;
                if (fieldType !== "htmlarea" &&
                    fieldType !== "text" &&
                    fieldType !== "textarea" &&
                    fieldType !== "pickList" &&
                    fieldType !== "hidden") {
                    /* All other types are unserializable. */
                    continue;
                }
                $('[name="' + fieldID + '"]').each(function() {
                    if (fieldType === "htmlarea") {
                        var $editor = $(this).data('cleditor');
                        if ($editor) {
                            $editor.updateTextArea();
                        }
                        toSerialize.push({
                            name: fieldID,
                            value: $(this).val()
                        });
                    } else {
                        toSerialize.push({
                            name : fieldID,
                            value: $(this).val()
                        });
                    }
                });
            }
            return $.param(toSerialize);
        }
    });
}( jQuery ));