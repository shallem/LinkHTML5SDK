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

/**
 * Layout a single form element.
 */

/**
 * Private helper functions.
 */
function __mkTZOption(tzOffsetHours, curTime, text, val) {
    // Determine if the current time is in this time zone.
    var selected = false;
    if (Helix.Utils.isString(curTime)) {
        selected = (curTime === val);    
    } else {
        var tzOffset = tzOffsetHours * 60;
        if ((-tzOffset) == curTime.getTimezoneOffset()) {
            selected = true;
        }        
    }

    var tzO = $('<option />').attr({
        value: val,
        'data-offset' : tzOffsetHours
    }).append(text);
    if (selected) {
        tzO.attr("selected", true);
    }
    
    return tzO;
}

/**
 * Return true if we are in daylight savings time. False if not.
 */
function __isCurrentTZ(stdOffsetHours) {
    var today = new Date();
    var offsetMinutes = today.stdTimezoneOffset();
    if (offsetMinutes == (-stdOffsetHours * 60)) {
        return true;
    }
    return false;
}

function __getTZSelect(tabIndex, name, id, curTime) {
    var date = null;
    if (!curTime) {
        date = new Date();
    } else if (!Helix.Utils.isString(curTime)) {
        date = new Date(curTime);
    }
    
    var tzSelect = $('<select />').attr({
        'name' : name,
        'id' : id,
        'tabIndex' : tabIndex
    });
    __mkTZOption(-12.0, date, "(GMT -12:00) Eniwetok, Kwajalein", "ENIWETOK").appendTo(tzSelect);
    __mkTZOption(-11.0, date, "(GMT -11:00) Midway Island, Samoa", "MIDWAY_ISLAND").appendTo(tzSelect);
    __mkTZOption(-10.0, date, "(GMT -10:00) Hawaii", "HAWAII").appendTo(tzSelect);
    
    if (date.dst()) {
        __mkTZOption(-8.0, date, "(GMT -8:00) Alaska Daylight Time", "ALASKA").appendTo(tzSelect);
        __mkTZOption(-7.0, date, "(GMT -7:00) Pacific Daylight Time (US &amp; Canada)", "PACIFIC").appendTo(tzSelect);
        __mkTZOption(-6.0, date, "(GMT -6:00) Mountain Daylight Time (US &amp; Canada)", "MOUNTAIN").appendTo(tzSelect);              
        __mkTZOption(-5.0, date, "(GMT -5:00) Central Daylight Time (US &amp; Canada), Mexico City", "CENTRAL").appendTo(tzSelect);
        __mkTZOption(-4.5, date, "(GMT -4:30) Venezuela Standard Time, Caracas", "CARACAS").appendTo(tzSelect);
        __mkTZOption(-4.0, date, "(GMT -4:00) Eastern Daylight Time (US &amp; Canada), Bogota, Lima", "EASTERN").appendTo(tzSelect);
        __mkTZOption(-3.0, date, "(GMT -3:00) Atlantic Daylight Time (Canada), La Paz", "ATLANTIC_CANADA").appendTo(tzSelect);
        __mkTZOption(-2.5, date, "(GMT -2:30) Newfoundland Daylight Time", "NEWFOUNDLAND").appendTo(tzSelect);
        __mkTZOption(-2.0, date, "(GMT -2:00) Brazil, Buenos Aires, Georgetown", "BUENOS_AIRES").appendTo(tzSelect);
    } else {
        __mkTZOption(-9.0, date, "(GMT -9:00) Alaska", "ALASKA").appendTo(tzSelect);
        __mkTZOption(-8.0, date, "(GMT -8:00) Pacific Time (US &amp; Canada)", "PACIFIC").appendTo(tzSelect);
        __mkTZOption(-7.0, date, "(GMT -7:00) Mountain Time (US &amp; Canada)", "MOUNTAIN").appendTo(tzSelect);        
        __mkTZOption(-6.0, date, "(GMT -6:00) Central Time (US &amp; Canada), Mexico City", "CENTRAL").appendTo(tzSelect);
        __mkTZOption(-5.0, date, "(GMT -5:00) Eastern Time (US &amp; Canada), Bogota, Lima", "EASTERN").appendTo(tzSelect);
        __mkTZOption(-4.5, date, "(GMT -4:30) Venezuela Standard Time, Caracas", "CARACAS").appendTo(tzSelect);
        __mkTZOption(-4.0, date, "(GMT -4:00) Atlantic Time (Canada), La Paz", "ATLANTIC_CANADA").appendTo(tzSelect);
        __mkTZOption(-3.5, date, "(GMT -3:30) Newfoundland", "NEWFOUNDLAND").appendTo(tzSelect);
        __mkTZOption(-3.0, date, "(GMT -3:00) Brazil, Buenos Aires, Georgetown", "BUENOS_AIReS").appendTo(tzSelect);
        __mkTZOption(-2.0, date, "(GMT -2:00) Mid-Atlantic", "MID_ATLANTIC").appendTo(tzSelect);
    }
    __mkTZOption(-1.0, date, "(GMT -1:00 hour) Azores, Cape Verde Islands", "AZORES").appendTo(tzSelect);
    __mkTZOption(0.0, date, "(GMT) Western Europe Time, London, Lisbon, Casablanca", "GMT").appendTo(tzSelect);
    __mkTZOption(1.0, date, "(GMT +1:00 hour) Brussels, Copenhagen, Madrid, Paris", "PARIS").appendTo(tzSelect);
    __mkTZOption(2.0, date, "(GMT +2:00) Cairo, South Africa", "CAIRO").appendTo(tzSelect);
    __mkTZOption(3.0, date, "(GMT +3:00) Baghdad, Riyadh, Moscow, St. Petersburg", "MOSCOW").appendTo(tzSelect);
    __mkTZOption(3.5, date, "(GMT +3:30) Tehran", "TEHRAN").appendTo(tzSelect);
    __mkTZOption(4.0, date, "(GMT +4:00) Abu Dhabi, Muscat, Baku, Tbilisi", "ABU_DHABI").appendTo(tzSelect);
    __mkTZOption(4.5, date, "(GMT +4:30) Kabul", "KABUL").appendTo(tzSelect);
    __mkTZOption(5.0, date, "(GMT +5:00) Ekaterinburg, Islamabad, Karachi, Tashkent", "ISLAMABAD").appendTo(tzSelect);
    __mkTZOption(5.5, date, "(GMT +5:30) Bombay, Calcutta, Madras, New Delhi", "BOMBAY").appendTo(tzSelect);
    __mkTZOption(5.75, date, "(GMT +5:45) Kathmandu", "NEPAL").appendTo(tzSelect);
    __mkTZOption(6.0, date, "(GMT +6:00) Almaty, Dhaka, Colombo", "DHAKA").appendTo(tzSelect);
    __mkTZOption(7.0, date, "(GMT +7:00) Bangkok, Hanoi, Jakarta", "BANGKOK").appendTo(tzSelect);
    __mkTZOption(8.0, date, "(GMT +8:00) Beijing, Perth, Singapore, Hong Kong", "HONG_KONG").appendTo(tzSelect);
    __mkTZOption(9.0, date, "(GMT +9:00) Tokyo, Seoul, Osaka, Sapporo, Yakutsk", "TOKYO").appendTo(tzSelect);
    __mkTZOption(9.5, date, "(GMT +9:30) Adelaide, Darwin", "ADELAIDE").appendTo(tzSelect);
    __mkTZOption(10.0, date, "(GMT +10:00) Eastern Australia, Guam, Vladivostok", "VLADIVOSTOK").appendTo(tzSelect);
    __mkTZOption(11.0, date, "(GMT +11:00) Magadan, Solomon Islands, New Caledonia", "MAGADAN").appendTo(tzSelect);
    __mkTZOption(12.0, date, "(GMT +12:00) Auckland, Wellington, Fiji, Kamchatka", "WELLINGTON").appendTo(tzSelect);
    return tzSelect;
}

function __computeDateString(mode, formElem) {
    var displayDate = null;
    if (formElem.value) {
        if (Helix.Utils.isString(formElem.value) && formElem.value.toLowerCase() === 'now') {
            formElem.value = new Date();
            if (!mode) {
                displayDate = formElem.value;
            }
        } else if (Object.prototype.toString.call(formElem.value) !== '[object Date]') {
            if (isNaN(formElem.value)) {
                // Keep formElem.value as is - a string to parse.
                displayDate = Date.parse(formElem.value);
            } else {
                formElem.value = Number(formElem.value);
                displayDate = new Date(formElem.value);
            }
        } else {
            displayDate = formElem.value;
        }
    }
    return displayDate;
}

function __refreshDate(mode, formElem) {
    var displayDate = __computeDateString(mode, formElem);
    if (mode) {
        var thisField = $(formElem.DOM).find('[name="' + formElem.name + '"]');
        var newDateStr = displayDate ? displayDate.toString('yyyy-MM-ddTHH:mm:ss') : '';
        if (formElem.type === 'date' ||
            formElem.type === 'exactdate') {
            newDateStr = newDateStr.substring(0, 10);
        }
        $(thisField).val(newDateStr);
    } else {
        var dateDisplayStr, timeDisplayStr;
        if (displayDate) {
            dateDisplayStr = displayDate.toString('ddd MMM d, yyyy');
            timeDisplayStr = displayDate.toString('h:mm tt');
        }
        var dataNameAttr = '[data-name="' + formElem.name + '"]';
        var selector = 'span' + dataNameAttr + ',div' + dataNameAttr;
        if (formElem.value) {
            if (formElem.type === 'date' ||
                formElem.type === 'exactdate') {
                if (formElem.type === 'date') {
                    var dateMarkup = $('<a />').attr({
                        'title': displayDate.toISOString()
                    }).prettyDate();
                    $(formElem.DOM).find(selector).text($(dateMarkup).text());
                } else {
                    $(formElem.DOM).find(selector).text(dateDisplayStr);
                }
            } else {
                $(formElem.DOM).find(selector).text(" " + dateDisplayStr + " " + timeDisplayStr);
            }
        } else {
            $(formElem.DOM).find(selector).text('');
        }
    }
}

function __appendDate(mode, formLayout, formElem, $fieldContainer, useMiniLayout) {
    if (!formElem.name) {
        console.log("Cannot add a date field with no name to a form layout.");
        return;
    }
    var dateInput;
    if (mode) {
        var defaultValue = Date.now();
        if (formElem.value) {
            defaultValue = Number(formElem.value);
        }

        /* Edit */
        var dateDiv = $('<div />').attr({
            'style' : formLayout.computedFieldStyle,
            'class' : 'ui-field-contain ui-body ui-br ' + formLayout.computedFieldStyleClass + formElem.computedFieldStyleClass + (useMiniLayout ? 'hx-mini-fieldcontain' : '')
        })
        .append($('<label />').attr({
            'for' : formElem.name,
            'class' : 'ui-input-text ' + (formLayout.titleStyleClass ? formLayout.titleStyleClass : '')
            })
            .append(formElem.fieldTitle)
        );
        var inputType;
        var valueString;
        var stepStr = formElem.dateStep ? formElem.dateStep : '300';
        if (formElem.type === 'datetime') {
            // Date and time
            inputType = 'datetime-local';
        } else if (formElem.type === 'date' ||
                   formElem.type === 'exactdate') {
            inputType = 'date';
        } else {
            // Just date
            inputType = 'time';
        }
        valueString = new Date(defaultValue).toISOString();
        var inputWrapper = $('<div/>').addClass('ui-input-text').addClass('hx-input-date').appendTo(dateDiv);
        var inputID = Helix.Utils.getUniqueID();
        dateInput = $('<input />').attr({
            'name': formElem.name,
            'id': inputID,
            'data-role' : 'none',
            'type' : inputType,
            'step' : stepStr
        }).appendTo(inputWrapper);
        if (formElem.onfocus) {
            dateInput.focus(formElem.onfocus);
        }
        if (formElem.onchange) {
            dateInput.change(formElem.onchange);
        }
        $fieldContainer.append(dateDiv);
        dateDiv.fieldcontain();
    } else {
        var displayDate = __computeDateString(mode, formElem);
        var dateDisplayStr = '', timeDisplayStr = '';
        if (displayDate) {
            dateDisplayStr = displayDate.toString('ddd MMM d, yyyy');
            timeDisplayStr = displayDate.toString('h:mm tt');
        }
        var dateMarkup;
        if (formElem.type === 'date' ||
            formElem.type === 'exactdate') {
            if (displayDate && formElem.type === 'date') {
                dateMarkup = $('<a />').attr({
                    'title': displayDate.toISOString()
                }).prettyDate();
            } else {
                dateMarkup = $('<a />').append(dateDisplayStr);
            }
            if (formElem.fieldTitle) {
                dateInput = $('<span/>').attr({
                    'style' : formElem.computedStyle,
                    'class' : formElem.computedStyleClass,
                    'data-name' : formElem.name
                }).text(" " + $(dateMarkup).text()); 
            } else {
                dateInput = $('<div />').attr({
                    'style' : formElem.computedStyle,
                    'class' : formElem.computedStyleClass,
                    'data-name' : formElem.name
                }).text($(dateMarkup).text());
            }
            formElem.DOM.append(dateInput);
        } else {
            dateInput = $('<span/>').attr('data-name', formElem.name).text(" " + dateDisplayStr + " " + timeDisplayStr);
            if (formElem.computedStyle) {
                dateInput.attr('style', formElem.computedStyle);
            }
            if (formElem.computedStyleClass) {
                dateInput.addClass(formElem.computedStyleClass); 
            }
            if (formElem.fieldTitle) {
                formElem.DOM.append(dateInput);
            } else {
                formElem.DOM.append($('<div />').append(dateInput));
            }
        }
    }
    if (formLayout.textStyleClass || formElem.textStyleClass) {
        dateInput.addClass(formElem.textStyleClass ? formElem.textStyleClass : formLayout.textStyleClass);
    }     
}

function __refreshTZSelector(mode, formElem) {
    if (!formElem.value) {
        // Use the current time zone.
        var curTime = new Date();
        var tzOffsetHours = -(curTime.getTimezoneOffset() / 60.0);
        formElem.value = $(formElem.DOM).find('option[data-offset="' + tzOffsetHours + '"]').attr('value');
    }
    
    if (mode) {
        $(formElem.DOM).find('option').prop({ selected : false });
        $(formElem.DOM).find('option[value="' + formElem.value + '"]').prop({ selected : true });
        $(formElem.DOM).find('select').selectmenu('refresh');
    } else {
        $('p[data-name="'+ formElem.name + '"]').empty().append(formElem.value);
    }
}

function __appendTZSelector(mode, formLayout, formElem, $fieldContainer, useMiniLayout) {
    if (!formElem.name) {
        /* No field name. We cannot render this field. */
        console.log("Cannot add a TZ selector with no name to a form layout.");
        return;
    }
    if (mode) {
        var defaultValue = Date.now();
        if (formElem.value) {
            defaultValue = formElem.value;
        }

        /* Edit */
        var labelWidthOverride = '';
        if (useMiniLayout) {
            // On small devices force the label on to a full line.
            labelWidthOverride = ';width: 100%';
        }
        var inputID = Helix.Utils.getUniqueID();
        var dateDiv = $('<div />').attr({
            'data-role' : 'fieldcontain',
            'style' : formLayout.computedFieldStyle,
            'class' : 'hx-tz-selector ' + (useMiniLayout ? 'hx-mini-fieldcontain ' : '') + formLayout.computedFieldStyleClass + formElem.computedFieldStyleClass
        })
        .append($('<label />').attr({
            'for' : inputID,
            'style' : labelWidthOverride,
            'class' : 'ui-input-text ' + formLayout.titleStyleClass
            })
            .append(formElem.fieldTitle)
        );
        
        var tzSelect = __getTZSelect(formLayout.__tabIndex++, formElem.name, inputID, defaultValue).appendTo(dateDiv);
        if (formElem.onchange) {
            $(tzSelect).change(function() {
                var newVal = $(this).find("option:selected");
                formElem.onchange.call(this, newVal.val(), newVal);
            });
        }
        
        // 'value' : defaultValueText,
        $fieldContainer.append(dateDiv);
        tzSelect.selectmenu({
            corners: false,
            mini: useMiniLayout
        });
        dateDiv.fieldcontain();
        if (formElem.computedStyle || formElem.computedStyleClass) {
            var uiSelect = $(dateDiv).find('div.ui-select');
            if (formElem.computedStyle) {
                uiSelect.attr('style', formElem.computedStyle);
            }
            if (formElem.computedStyleClass) {
                uiSelect.addClass(formElem.computedStyleClass); 
            }
        }

    } else {
        $fieldContainer.append($('<p />').attr('data-name', formElem.name).append(formElem.value));
    }
}

function __refreshTextArea(mode, formElem) {
    if (mode) {
        var $input = $(formElem.DOM).find('textarea[name="'+formElem.name+'"]');
        $input.val(formElem.value);
    } else {
        var dataNameAttr = '[data-name="' + formElem.name + '"]';
        var selector = 'span' + dataNameAttr + ',p' + dataNameAttr;
        var $span = $(formElem.DOM).find(selector);
        if ($span.is('span')) {
            $span.html("&nbsp;" + formElem.value);
        } else {
            /* Should be a 'p' tag. */
            $span.html(formElem.value);
        }
    }
}

function __appendTextArea(mode, formLayout, formElem, $fieldContainer, useMiniLayout) {
    if (!formElem.value) {
        formElem.value = "";
    }
    
    if (!formElem.name) {
        /* No field name. We cannot use this field in a form layout. */
        console.log("Cannot use a text area field with no name in a form layout.");
        return;
    }
    
    var inputMarkup;
    if (mode) {
        /* Edit */
        // Use the mini style to set font size to 'small'
        var inputID = Helix.Utils.getUniqueID();
        var heightStyle = formElem.height ? 'height: ' + formElem.height : '';
        var computedStyle = formElem.computedStyle;
        if (computedStyle && heightStyle) {
            computedStyle = computedStyle + ';' + heightStyle;
        } else if (heightStyle) {
            computedStyle = heightStyle;
        }
        inputMarkup = $('<textarea />').attr({
            'name': formElem.name,
            'id' : inputID,
            'style': computedStyle,
            'class' : formElem.computedStyleClass,
            'tabindex' : formLayout.__tabIndex++
        }).append(formElem.value);
        var lbl = $('<label />').attr({
            'for' : inputID,
            'class' : formLayout.titleStyleClass
            })
        .append(formElem.fieldTitle);
        if (!formElem.fieldTitle) {
            lbl.hide();
        }

        var textContainer = $('<div />').attr({
            'data-role' : 'fieldcontain',
            'style' : formLayout.computedFieldStyle,
            'class' : (useMiniLayout ? 'hx-mini-fieldcontain ' : '') + formLayout.computedFieldStyleClass + formElem.computedFieldStyleClass
        })
        .append(lbl)
        .append(inputMarkup);
        
        $fieldContainer.append(textContainer);
        textContainer.fieldcontain();
        $(inputMarkup).textinput();
        if (formElem.fieldTitleType === 'button') {
            $(formElem.fieldTitle).button();
        }
        if (formElem.onblur) {
            $(inputMarkup).blur(function() {
                formElem.onblur.apply(this);
            });
        }
        if (formElem.onchange) {
            $(inputMarkup).change(function() {
                formElem.onchange.call(this, formElem);
            });
        }
        if (formElem.onfocus) {
            $(inputMarkup).focus(formElem.onfocus);
        }
        $(inputMarkup).on('input', function() {
            $(this).trigger('change');
        });
    } else {
        if (formElem.fieldTitle && (typeof formElem.fieldTitle === "string")) {
            inputMarkup = $('<span />').attr('data-name', formElem.name).append("&nbsp;" + formElem.value);
        } else {
            inputMarkup = $('<p />').attr('data-name', formElem.name).append(formElem.value);
        }
        $fieldContainer.append(inputMarkup);
    }
    if (formLayout.textStyleClass || formElem.textStyleClass) {
        inputMarkup.addClass(formElem.textStyleClass ? formElem.textStyleClass : formLayout.textStyleClass);
    }
}

function __refreshSelectMenu(formLayout, formElem, useMiniLayout) {
    var $fieldContainer = formElem.DOM;
    if ($fieldContainer) {
        $fieldContainer.empty();
    }
    
    var inputID = Helix.Utils.getUniqueID();
    var inputMarkup = $('<select />').attr({
        'name': formElem.name,
        'id' : inputID,
        'tabindex' : formElem.tabIndex
    });
    if (formElem.computedWidth) {
        $(inputMarkup).attr('width', formElem.computedWidth);
    }

    var i;
    for (i = 0; i < formElem.options.length; ++i) {
        // If not independent label is specified, make it the same as the value.
        if (!formElem.options[i].label) {
            formElem.options[i].label = formElem.options[i].value;
        }
        var option = $('<option />').attr({
            'value': formElem.options[i].value
        }).append(formElem.options[i].label).appendTo(inputMarkup);

        if (formElem.value && formElem.options[i].value === formElem.value) {
            // This item is selected.
            option.attr('selected', true);
        }
    }

    if (formElem.fieldTitle) {
        var selectContainer = $('<div />').attr({
            'data-role' : 'fieldcontain',
            'style' : formElem.computedStyle,
            'class' : (useMiniLayout ? 'hx-mini-fieldcontain ' : '')
        })
        .append($('<label />').attr({
            'for' : inputID,
            'class' : formLayout.titleStyleClass
            })
            .append(formElem.fieldTitle)
        )
        .append(inputMarkup);
        $fieldContainer.append(selectContainer);
        selectContainer.fieldcontain();
        if (formElem.selectWidth) {
            $(selectContainer).attr('width', formElem.selectWidth);
        }
    } else {
        $fieldContainer.append(inputMarkup);
    }
    $(inputMarkup).selectmenu({
        corners: false,
        mini: useMiniLayout
    });
    // SAH: migrated to flex box ...
    // if (formElem.computedWidth) {
    //  $(inputMarkup).closest('.ui-select').width(formElem.computedWidth);
    // }
    if (formLayout.textStyleClass) {
        $fieldContainer.find('.ui-btn-text').addClass(formLayout.textStyleClass);
    }
    if (formElem.onchange) {
        $(inputMarkup).change(function() {
            formElem.onchange.call(this, formElem);
        });
    }
}

function __appendSelectMenu(mode, formLayout, formElem, $fieldContainer, useMiniLayout) {
    if (!formElem.name) {
        /* No field name. We cannot edit this field. */
        console.log("Invalid select menu in form layout. No field name specified.");
        return;
    }
    if (mode) {
        /* Edit */
        if (!formElem.options) {
            return;
        }
        
        formElem.tabIndex = formLayout.__tabIndex++;
            
        __refreshSelectMenu(formLayout, formElem, useMiniLayout);
    } else {
        __appendTextBox(mode, formLayout, formElem, $fieldContainer, useMiniLayout);
    }
}

function __refreshTextBox(mode, formElem) {
    if (mode && !formElem.viewOnly) {
        var $input = $(formElem.DOM).find('input[name="'+formElem.name+'"]');
        $input.val(formElem.value);
        if (formElem.autocompleteList) {
            formElem.autocompleteList.hide();
        }
    } else {
        var dataNameAttr = '[data-name="' + formElem.name + '"]';
        var selector = 'span' + dataNameAttr + ',p' + dataNameAttr + ",div" + dataNameAttr;
        var $span = $(formElem.DOM).find(selector);
        if ($span.is('span')) {
            $span.text(' ' + formElem.value);
        } else {
            /* Should be a 'p' tag or a 'div' tag. */
            $span.text(' ' + formElem.value);
        }
    }
}

function __appendTextBox(mode, formLayout, formElem, $fieldContainer, useMiniLayout, isPassword) {
    if (!formElem.value) {
        formElem.value = "";
    }
    
    var inputMarkup = null;
    if (mode && !formElem.viewOnly) {
        /* Edit */
        if (mode && !formElem.name) {
            /* No field name. We cannot edit this field. */
            return;
        }

        if (!formElem.dataType) {
            formElem.dataType = formElem.type;
        }

        var inputID = Helix.Utils.getUniqueID();
        var capitalization = (formElem.autocapitalize ? formElem.autocapitalize : 'sentences');
        formElem.inputMarkup = inputMarkup = $('<input />').attr({
            'name': formElem.name,
            'id' : inputID,
            'type': formElem.dataType,
            'value': (formElem.value),
            'tabindex' : formLayout.__tabIndex++,
            'autocapitalize' : capitalization
        });
        
        // WE always use the mini style. Otherwise the fonts are too large even on tablets.
        var textContainer = $('<div />').attr({
            'data-role' : 'fieldcontain',
            'style' : formLayout.computedFieldStyle,
            'class' : (useMiniLayout ? 'hx-mini-fieldcontain ' : '') + formLayout.computedFieldStyleClass + formElem.computedFieldStyleClass
        })
        .append($('<label />').attr({
            'for' : inputID,
            'class' : formLayout.titleStyleClass
            })
            .append(formElem.fieldTitle)
        )
        .append(inputMarkup);
        $fieldContainer.append(textContainer);
        textContainer.fieldcontain();
        $(inputMarkup).textinput({
            disabled: formElem.inputDisabled ? true : false
        });
        if (formElem.width && formElem.type === 'search') {
            $(inputMarkup).parent('.ui-input-search').width(formElem.width);
        }
        
        if (formElem.fieldTitleType === 'button') {
            $(formElem.fieldTitle).button();
            $(formElem.fieldTitle).addClass('hx-btn-inlabel');
        }
        if (formElem.onblur) {
            $(inputMarkup).blur(function() {
                if (!formElem.__noblur) {
                    formElem.onblur.apply(this);
                }
            });
        }
        if (formElem.onchange) {
            $(inputMarkup).on('input', function() {
                formElem.onchange.call(this, formElem);
            });
        }
        if (formElem.onspace) {
            $(inputMarkup).on("keydown", function (e) {
                if (e.which === 32) {
                    formElem.onspace.apply(this);
                }
            });
        }
        if (formElem.onenter) {
            $(inputMarkup).on("keydown", function (e) {
                if (e.which === 13) {
                    formElem.onenter.apply(this);
                }
            });
        }
        
        // Apply styling to the input text div ...
        if (formElem.computedStyle || formElem.computedStyleClass) {
            var uiInputText = textContainer.find('div.ui-input-text');
            if (formElem.computedStyle) {
                $(uiInputText).attr('style', formElem.computedStyle);
            }
            if (formElem.computedStyleClass) {
                $(uiInputText).addClass(formElem.computedStyleClass);
            }
        }
        
        // Add in autocomplete.
        if (formElem.autocomplete && formElem.autocompleteSelect) {
            if (formElem.autocompleteThreshold === undefined) {
                formElem.autocompleteThreshold = 2;
            }
            if (formElem.autocompleteTimeout === undefined) {
                formElem.autocompleteTimeout = 1.5;
            }
            // To get this to hover, we must make it a 'positioned' element. position: relative does
            // nothing on the iPad. position: absolute yields proper hovering.
            var autoCompleteList = $('<ul/>').css('z-index', 10000)
                                             .css('width', '90%')
                                             //.css('position', 'absolute')
                                             .css('max-height', (formElem.autocompleteHeight ? formElem.autocompleteHeight : '200px'))
                                             .css('overflow-y', 'scroll')
                                             .css('display', 'none')
                                             .css('background-color', '#f9f9f9')
                                             .appendTo($fieldContainer).listview({ inset : true });
            formElem.autocompleteList = autoCompleteList;
            $(inputMarkup).on('input', function() {
                if (formElem.__autocompleteTimeout) {
                    clearTimeout(formElem.__autocompleteTimeout);
                }
                
                var text = $(this).val();
                var _self = $(this);
                if (text.length < formElem.autocompleteThreshold) {
                    autoCompleteList.empty();
                    autoCompleteList.hide();
                    autoCompleteList.listview("refresh");
                } else {
                    var __doAutocomplete = function() {
                        formElem.autocomplete.call(formElem, text, function(LIs, queryText) {
                            if (queryText !== _self.val()) {
                                // The user has changed the text further since we ran this query.
                                return;
                            }
                            
                            // Set __noblur to prevent the user's clicking on an autocomplete list
                            // item from triggering a blur event, which doesn't make sense because
                            // the value supplied to the blur event should be the value clicked upon,
                            // not the value in the input text box.
                            formElem.__noblur = true;
                            autoCompleteList.empty();
                            if (LIs && LIs.length) {
                                if (LIs.length === 1 && LIs[0] === _self.val()) {
                                    // This is a special case where the user typed the full text. Do not present a list with one
                                    // item that is exactly the same as the input text.
                                    formElem.__noblur = false;                                
                                } else {
                                    $("<li/>").append("Dismiss").css('color', 'red').on('vclick', function() {
                                        autoCompleteList.empty();
                                        autoCompleteList.hide();
                                        formElem.__noblur = false;
                                        return false;
                                    }).appendTo(autoCompleteList);
                                    // We cap out the list length at 20 b/c otherwise we might crash the app ...
                                    var i;
                                    for (i = 0; i < Math.min(20, LIs.length); ++i) {
                                        $("<li/>").addClass('wordBreak').append(LIs[i]).on('vclick', function() {
                                            var ret = formElem.autocompleteSelect.call(_self, $(this).text(), formElem);
                                            autoCompleteList.empty();
                                            autoCompleteList.hide();
                                            if (ret === true) {

                                            } else {
                                                $(_self).val('');
                                            }
                                            formElem.__noblur = false;
                                            return false;
                                        }).appendTo(autoCompleteList);
                                    }
                                    if (i < LIs.length) {
                                        // We cut off the autocomplete list.
                                        $("<li/>").append("The search returned >20 results.");
                                    }

                                    autoCompleteList.show();
                                    autoCompleteList.listview("refresh");
                                }
                            } else {
                                formElem.__noblur = false;
                                autoCompleteList.empty();
                                autoCompleteList.hide();
                            }
                        });
                    };
                    
                    // Wait 1 second for the user to pause typing before we do anything.
                    formElem.__autocompleteTimeout = setTimeout(function() {
                        __doAutocomplete();
                    }, formElem.autocompleteTimeout * 1000);                    
                }
            });
        }
    } else {
        var hasTitle = formElem.fieldTitle && (typeof formElem.fieldTitle === "string"); 
        if (hasTitle && mode) {
            inputMarkup = $('<div/>').attr({
                'data-name' : formElem.name,
                'id' : formElem.name,
                'class' : 'ui-input-text hx-full-width'
            }).append(formElem.value);
            var valSpan = $('<div/>').attr({
                'class': 'hx-mini-fieldcontain ui-field-contain ui-body ui-br'
            })
            .append($('<label/>').attr({
                'for' : formElem.name,
                'class' : 'ui-input-text ' + (formLayout.titleStyleClass ? formLayout.titleStyleClass : '')
            }).append(formElem.fieldTitle))
            .append(inputMarkup);
            if (formElem.computedStyle) {
                valSpan.attr('style', formElem.computedStyle);
            }
            if (formElem.computedStyleClass) {
                valSpan.addClass(formElem.computedStyleClass);
            }
            $fieldContainer.append(valSpan);
        } else {
            inputMarkup = $('<span />').attr({
                'data-name' : formElem.name
            }).text(' ' + formElem.value);
            if (!mode && hasTitle) {
                inputMarkup.addClass('ui-input-text');
            }
            if (formElem.computedStyle) {
                $fieldContainer.attr('style', formElem.computedStyle);
            }
            if (formElem.computedStyleClass) {
                $fieldContainer.addClass(formElem.computedStyleClass);
            }
            $fieldContainer.append(inputMarkup);
        }
        if (formElem.onclick) {
            $(inputMarkup).on('vclick', function(ev) {
                ev.stopImmediatePropagation();
                formElem.onclick.call(formElem, ev);
                return false;
            });
        }
    }
    if (formLayout.textStyleClass || formElem.textStyleClass) {
        inputMarkup.addClass(formElem.textStyleClass ? formElem.textStyleClass : formLayout.textStyleClass);
    }
}

function __appendCheckBox(mode, formLayout, formElem, $fieldContainer, useMiniLayout) {
    if (!formElem.name) {
        /* No field name. We cannot edit this field. */
        console.log("Invalid checkbox in form layout. No field name specified.");
        return null;
    }
    
    var type = 'checkbox';
    if (formElem.type === 'radio') {
        type = 'radio';
    }
    
    var inputID = Helix.Utils.getUniqueID();
    var inputMarkup = $('<input/>').attr({
        'name': formElem.name,
        'id' : inputID,
        'type' : type,
        'tabindex' : -1,
        'data-corners' : 'false'
    });
    var lbl = $('<label />').attr('for', inputID).attr('data-corners', 'false').append(formElem.fieldTitle).appendTo($fieldContainer);
    if (formLayout.textStyleClass || formElem.textStyleClass) {
        lbl.addClass(formElem.textStyleClass ? formElem.textStyleClass : formLayout.textStyleClass);
    }
    $(inputMarkup).appendTo($fieldContainer);
    __refreshControl(formElem, true);
    $(inputMarkup).checkboxradio({ 
        mini: useMiniLayout
    });
    $fieldContainer.find('label').removeClass('ui-btn-corner-all');
    if (formElem.onchange) {
        $(inputMarkup).change(function() {
            formElem.onchange.call(this, formElem);
        });
    }
    if (!mode) {
        /* View */
        $(inputMarkup).checkboxradio("disable");
    }        
    return inputMarkup;
}

function __refreshControl(subElem, noRefresh, mode) {
    var DOM;
    if ($(subElem.DOM).is('input')) {
        DOM = subElem.DOM;
    } else {
        DOM = $(subElem.DOM).find('input');
    }
    
    if (subElem.value) {
        if (typeof subElem.value === "boolean" &&
            subElem.value) {
            $(DOM).prop('checked', true);
        } else if (subElem.value === "true") {
            $(DOM).prop('checked', true);
        }
    } else if (subElem.value !== undefined) {
        $(DOM).prop('checked', false);
    }
    if (!noRefresh) {
        $(DOM).checkboxradio("refresh");
        if (!mode) {
            /* View */
            $(DOM).checkboxradio("disable");
        } else {
            /* Edit */
            $(DOM).checkboxradio("enable");
        }
    }
}

function __refreshRadioButtons(formElem) {
    // Clear out all selections.
    $(formElem.DOM).find('input').removeAttr('checked').prop('checked', false);
    $(formElem.DOM).find('input[data-value="' + formElem.value + '"]').attr('checked', true).prop('checked', true);
    $(formElem.DOM).find('fieldset').controlgroup('refresh');
}

function __appendRadioButtons(mode, formLayout, formElem, $fieldContainer, useMiniLayout) {
    if (!formElem.name) {
        console.log("Skipping radio button because it has no name.");
        return;
    }
    
    var fieldMarkup = $('<div />').appendTo($fieldContainer);
    if (formElem.computedWidth) {
        fieldMarkup.css('width', formElem.computedWidth);
    }
    if (useMiniLayout) {
        $(fieldMarkup).addClass('hx-mini-fieldcontain');
    }

    var formMarkup = $("<form />").addClass('hx-full-width').appendTo(fieldMarkup);
    var wrapperMarkup = $('<fieldset/>').appendTo(formMarkup).addClass('hx-full-width');

    if (formElem.fieldTitle) {
        wrapperMarkup.append($('<legend/>').attr({
            'class' : formLayout.titleStyleClass
        }).append(formElem.fieldTitle));
    }

    var i = 0;
    for (i = 0; i < formElem.controls.length; ++i) {
        var subElem = formElem.controls[i];
        __preprocessFormElement(formLayout, subElem);
        if (subElem.hidden || subElem.disabled) {
            continue;
        }
        subElem.name = formElem.name;
        subElem.type = 'radio';
        var inputMarkup = __appendCheckBox(mode, formLayout, subElem, wrapperMarkup, useMiniLayout);
        if (mode) {
            subElem.editDOM = inputMarkup;
        } else {
            subElem.viewDOM = inputMarkup;
        }
        if (formLayout.currentMode === 'edit') {
            subElem.DOM = subElem.editDOM;
        } else {
            subElem.DOM = subElem.viewDOM;
        }
        if (subElem.defaultValue !== undefined) {
            $(inputMarkup).attr('data-value', subElem.defaultValue);
        }
        if ((subElem.defaultValue === formElem.defaultValue) || (subElem.defaultValue === formElem.value)) {
            $(inputMarkup).attr('checked', 'true');
        }
        if (formElem.onchange) {
            $(inputMarkup).change(function() {
                if ($(this).attr('checked') !== 'true') {
                    formElem.onchange($(this).attr('data-value'));
                }
            });
        }
    }
    $(wrapperMarkup).controlgroup({ 
        mini : useMiniLayout,
        type: (formElem.direction ? formElem.direction : "horizontal")
    });
    $(fieldMarkup).fieldcontain();
    if (formLayout.textStyleClass) {
        $fieldContainer.find('.ui-btn-text').addClass(formLayout.textStyleClass);
    }
}

function __refreshOnOffSlider(formElem) {
    $(formElem.DOM).find('input').removeAttr('checked').prop('checked', formElem.value);
}

// Borrowed from: https://proto.io/freebies/onoff/
function __appendOnOffSlider(mode, formLayout, formElem, $fieldContainer, useMiniLayout) {
    if (!formElem.name) {
        console.log("Skipping on/off slider because it has no name.");
        return;
    }
    
    var fieldMarkup = $('<div />').appendTo($fieldContainer);
    if (useMiniLayout) {
        $(fieldMarkup).addClass('hx-mini-fieldcontain');
    }

    if (formElem.fieldTitle) {
        fieldMarkup.addClass('ui-field-contain');
        fieldMarkup.append($('<label/>').addClass('ui-input-text').append(formElem.fieldTitle));
    }

    if (mode) {        
        var switchContainer = $('<div/>').addClass('hxonoff').appendTo(fieldMarkup);
        var switchInput = $('<input/>').attr({
            'name' : formElem.name,
            'type' : 'checkbox',
            'class' : 'hxonoff-checkbox',
            'id' : formElem.name
        }).appendTo(switchContainer);
        if (formElem.onchange) {
            switchInput.change(function() {
                formElem.onchange.call(this, formElem);
            });
        }
        if (formElem.value === true) {
            switchInput.prop('checked', true);
        }
        
        switchContainer.append($('<label/>').attr({
            'class': 'hxonoff-label',
            'for' : formElem.name
        }).append($('<span/>').addClass('hxonoff-inner'))
                .append($('<span/>').addClass('hxonoff-switch'))
        );
    } else {
        fieldMarkup.append($('<div/>').append(formElem.value ? 'on' : 'off'));
    }
}

function __appendControlSet(mode, formLayout, formElem, $fieldContainer, useMiniLayout) {
    var fieldMarkup = $('<div />').attr({
        'style' : 'width: auto'
        /*'data-role' : 'fieldcontain'*/
    }).appendTo($fieldContainer);

    if (useMiniLayout) {
        $(fieldMarkup).addClass('hx-mini-fieldcontain');
    }

    var wrapperMarkup = $('<fieldset/>').attr({
    /*    'data-role' : 'controlgroup',
        'data-type' : 'horizontal',
        'data-mini' : (useMiniLayout ? 'true' : 'false') */
    }).appendTo(fieldMarkup).addClass('hx-full-width');

    if (formElem.fieldTitle) {
        wrapperMarkup.append($('<legend/>').attr({
            'class' : formLayout.titleStyleClass
        }).append(formElem.fieldTitle));
    }

    var i = 0;
    for (i = 0; i < formElem.controls.length; ++i) {
        var subElem = formElem.controls[i];
        __preprocessFormElement(formLayout, subElem);
        if (subElem.disabled) {
            continue;
        }
        if (!subElem.name) {
            console.log("Skipping controlset checkbox because it has no name.");
            continue;
        }
        var inputMarkup = __appendCheckBox(mode, formLayout, subElem, wrapperMarkup, useMiniLayout);
        subElem.DOM = inputMarkup;
    }
    $(wrapperMarkup).controlgroup({ 
        mini : useMiniLayout,
        type: "horizontal" 
    });
    $(fieldMarkup).fieldcontain();
    if (formLayout.textStyleClass) {
        $fieldContainer.find('.ui-btn-text').addClass(formLayout.textStyleClass);
    }
    
    // After enhancement, hide any hidden controls
    for (i = 0; i < formElem.controls.length; ++i) {
        subElem = formElem.controls[i];
        subElem.DOM = subElem.viewDOM = subElem.editDOM = $(subElem.DOM).closest('div.ui-checkbox');
        if (subElem.hidden) {
            $(subElem.DOM).hide();
        }
        if (subElem.mode === 'edit') {
            /* No view. */
            subElem.viewDOM = null;
        }
        if (subElem.mode === 'view') {
            /* No edit. */
            subElem.editDOM = null;
        }
    }
}

function __makeButtonMarkup(formElem, useMiniLayout, $parent) {
    if (!formElem.fieldTitle) {
        formElem.fieldTitle = "";
    }
    if (!formElem.id) {
        formElem.id = Helix.Utils.getUniqueID();
    }
    var $buttonLink;
    if (formElem.iconClass) {
        $buttonLink = $('<a />').attr({
            'data-role' : 'button',
            'data-iconpos' : 'bottom',
            'data-icon' : formElem.iconClass,
            'data-iconshadow' : formElem.iconShadow ? 'true' : 'false',
            'data-corners' : formElem.iconCorners ? 'true' : 'false',
            'data-shadow' : formElem.shadow ? 'true' : 'false',
            'class' : 'iconbutton',
            'id': formElem.id
        }).append(formElem.fieldTitle).button();            
    } else {
        $buttonLink = $('<a />').attr({
            'data-role' : 'button',
            'data-inline' : true,
            'data-shadow' : formElem.shadow ? 'true' : 'false',
            'data-theme' : formElem.theme ? formElem.theme : 'b',
            'data-corners' : formElem.iconCorners ? 'true' : 'false',
            'id': formElem.id
        }).append(formElem.fieldTitle);
    }
    if (formElem.computedWidth) {
        $buttonLink.width(formElem.computedWidth);
    }
    
    if (formElem.href) {
        $buttonLink.attr('href', formElem.href);
    } else {
        $buttonLink.attr('href', 'javascript:void(0);');
    }
    $buttonLink.buttonMarkup({ mini : useMiniLayout });
    $buttonLink.appendTo($parent);
    if (formElem.onclick) {
        $buttonLink.on('vclick', function(ev) {
            return formElem.onclick.call(this, ev);
        });
    }
    return $buttonLink;
}

function __appendButton(mode, formLayout, formElem, $fieldContainer, useMiniLayout) {
    __makeButtonMarkup(formElem, useMiniLayout, $fieldContainer);
}

function __refreshIFrame(formElem) {
    var frameID = formElem.name;
    var $frame = (formElem.$frame ? formElem.$frame : formElem.DOM.find(PrimeFaces.escapeClientId(frameID)));
    if (formElem.frameMarkup) {
        // We are refreshing an existing frame. We need to replace it in the DOM with a new one, otherwise onload will not
        // be called.
        formElem.$frame = $(formElem.frameMarkup);
        $frame.replaceWith(formElem.$frame);
        $frame = formElem.$frame;
    }
    
    $frame.hide();
    
    // Load the iframe document content
    var contentWindow = $frame[0].contentWindow;
    //contentWindow.scrollTo(0, 0);
    
    var doc = contentWindow.document;
    doc.open();
    if (!formElem.noHTML) {
        doc.write('<html>');
    }
    if (!formElem.noHead) {
        doc.write('<head>');
        doc.write('<meta name="viewport" content="width=device-width,height=device-height,initial-scale=1"/>');
        doc.write('</head>');
    }
    if (!formElem.noBody) {
        if (!formElem.bodyStyle) {
            formElem.bodyStyle = '';
        } else {
            formElem.bodyStyle = ' ' + formElem.bodyStyle;
        }
        doc.write('<body style="height: 100%;' + formElem.bodyStyle + '">');
    }
    /*if (formElem.isScroller) {
        $(doc.body).css('overflow-y', 'scroll');
    }*/
    doc.write(formElem.value);
    if (!formElem.noBody) {
        doc.write('</body>');
    }
    if (!formElem.noHTML) {
        doc.write('</html>');
    }
    if (formElem.onload) {
        doc.body.onload = function() {
            setTimeout(function() {
                window[formElem.onload].call(window, frameID);            
            }, 250);
        };
    }
    doc.close();
    if (!formElem.isScroller) {
        $(doc.body).parent().css('overflow', 'hidden');
    }
    
    $frame.show();
}

function __refreshHTMLFrame(formElem, mode) {
    if ($(formElem.editDOM).is(':visible') || mode === 1) {
        var elem = $(formElem.DOM).find('[name="' + formElem.name + '"]');
        if (!formElem.value) {
            $(elem).editor('update', ''); 
        } else {
            $(elem).editor('update', formElem.value);
        }        
    } else if ($(formElem.viewDOM).is(':visible') || mode === 0) {
        // Reset onload, otherwise it is not called.
        __refreshIFrame(formElem);
    }
}

function __makeIFrameMarkup(formElem) {
    var frameID = formElem.name;
    if (!frameID) {
        console.log("Each IFrame form element must have a name. Cannot specify an IFrame form element without either.");
        return;
    }
    var extraStyle = '';
    if (formElem.isScroller) {
        extraStyle = 'overflow-y: scroll; -webkit-overflow-scrolling: touch;';
    }

    var iFrameMarkup = null;
    var iFrameStyle = ' style="border:0px; ' + extraStyle + '"';
    var iFrameWidth = ' width="' + formElem.computedWidth + '"';
    var onloadAttr = null; // (formElem.onload ? (' onload="' + formElem.onload + '(\'' + frameID + '\')"') : '');

    if (!formElem.height || (formElem.height === 'full')) {
        iFrameMarkup = '<iframe id="' + frameID + 
            '" src="javascript:true;"' +
            iFrameWidth +
            onloadAttr +
            iFrameStyle + '>';
    } else {
        iFrameMarkup = '<iframe id="' + frameID + '" src="javascript:true;" height="' + formElem.height + '"' +
            iFrameWidth +
            onloadAttr +
            iFrameStyle + '>';
    }
    return iFrameMarkup;
}

function __appendIFrame(mode, formLayout, formElem, $fieldContainer, useMiniLayout, page, parentDiv) {
    if (formElem.height === 'full') {
        $fieldContainer.addClass('hx-flex-fill');
    }
    if (formElem.computedStyle) {
        var combinedStyle = $fieldContainer.attr('style') + ' ' + formElem.computedStyle;
        $fieldContainer.attr('style', combinedStyle);
    }
    if (formElem.computedStyleClass) {
        $fieldContainer.addClass(formElem.computedStyleClass);
    }
    if (formElem.computedWidth) {
        $fieldContainer.width(formElem.computedWidth);
    }
    
    if (!mode) {
        if (formElem.isScroller) {
            $fieldContainer.css('overflow-y', 'scroll').css('-webkit-overflow-scrolling', 'touch');
        }        
        var newFrameMarkup = __makeIFrameMarkup(formElem);
        formElem.$frame = $(newFrameMarkup).appendTo($fieldContainer).hide();
        __refreshIFrame(formElem);
        formElem.frameMarkup = newFrameMarkup;
    } else {
        __appendEditor(mode, formLayout, formElem, $fieldContainer, useMiniLayout, page, parentDiv);
    }
}

function __refreshButtonGroup(formElem) {
    if (!formElem.buttons) {
        return;
    }
    var $buttonBar = $(formElem.DOM).find('.buttonBarMaster').empty();
    
    var formButton;
    var formButtonIdx;
    for (formButtonIdx = 0; formButtonIdx < formElem.buttons.length; ++formButtonIdx) {
        formButton = formElem.buttons[formButtonIdx];
        __makeButtonMarkup(formButton, formButton.mini, $buttonBar);
    }
    $buttonBar.controlgroup({ 
        type: (formElem.orientation ? formElem.orientation : "horizontal"),
        shadow: (formElem.shadow ? true : false)
    });
}

function __refreshHTMLArea(formElem) {
    if ($(formElem.editDOM).is(':visible')) {
        var elem = $(formElem.DOM).find('[name="' + formElem.name + '"]');
        if (!formElem.value) {
            $(elem).editor('update', ''); 
        } else {
            $(elem).editor('update', formElem.value);
        }        
    } else if ($(formElem.viewDOM).is(':visible')) {
        var viewContainer = $(formElem.viewDOM).find('div[data-name="' + formElem.name + '"]').empty();
        viewContainer.append(formElem.value);
    }
}

function __appendEditor(mode, formLayout, formElem, $fieldContainer, useMiniLayout, page, parentDiv) {
    if (formElem.computedWidth) {
        if (formElem.computedWidth === "100%") {
            $fieldContainer.addClass('hx-full-width');
        }            
    }
    if (formElem.height && formElem.height !== 'full') {
        $fieldContainer.height(formElem.height);
        $fieldContainer.css('min-height', $.isNumeric(formElem.height) ? formElem.height + "px" : formElem.height);
    }

    if (!formElem.name) {
        /* No field name. We cannot edit this field. */
        console.log("Cannot layout an HTML area in edit mode without an element name.");
        return;
    }

    var editorID = Helix.Utils.getUniqueID();
    var editorDiv = $('<div />').attr({
        'name' : formElem.name,
        'id' : editorID,
        'tabIndex' : -1,
        'class' : 'hx-full-height'
    });
    $fieldContainer.append(editorDiv
        .append($('<label />').attr({
            'for' : editorID,
            'class' : formLayout.titleStyleClass
            })
            .append(formElem.fieldTitle)
        )
    );
    editorDiv.editor({
        'tabIndex' : formLayout.__tabIndex++,
        'parentElement' : $fieldContainer
    });
    $(editorDiv).editor('update', formElem.value);   
}

function __appendHTMLArea(mode, formLayout, formElem, $fieldContainer, useMiniLayout, page, parentDiv) {
    if (mode) {
        if (formElem.height === 'full') {
            $fieldContainer.addClass('hx-flex-fill');
        }
        __appendEditor(mode, formLayout, formElem, $fieldContainer, useMiniLayout, page, parentDiv);
    } else {
        var isFullWidth = false;
        if (formElem.computedWidth) {
            if (formElem.computedWidth === "100%") {
                isFullWidth = true;
            }            
        }
        
        var width = "98%";
        if (isFullWidth) {
            width = "100%";
        } else if (formElem.computedWidth) {
            width = formElem.computedWidth;
        }
        if (!formElem.name) {
            formElem.name = Helix.Utils.getUniqueID();
        }
        
        var htmlDiv = $('<div />').attr('data-name', formElem.name).append(formElem.value);
        if (formElem.computedStyle) {
            htmlDiv.attr('style', formElem.computedStyle);
        }
        if (formElem.computedStyleClass) {
            htmlDiv.addClass(formElem.computedStyleClass); 
        }
        var textClass = formElem.textStyleClass ? formElem.textStyleClass : formLayout.textStyleClass;
        if (textClass) {
            htmlDiv.addClass(textClass);
        }
        $fieldContainer.append(htmlDiv);
        if (formElem.isScroller) {
            $fieldContainer.helixScrollingDiv({ width: width });
        } else {
            $fieldContainer.css('overflow', 'none');
            $fieldContainer.width(width);
        }
    }
}

function __appendButtonGroup(mode, formLayout, formElem, $fieldContainer, useMiniLayout) {
    var $buttonBar = $('<div />').attr({
        'class' : 'buttonBarMaster buttonbar ' + formElem.computedStyleClass
    }).appendTo($fieldContainer);
    if (formElem.onclick) {
        $buttonBar.on(Helix.clickEvent, formElem.onclick);
    }
    if (formElem.name) {
        $buttonBar.attr('id', formElem.name);
    }
    __refreshButtonGroup(formElem);
}

function __refreshHorizontalScroll(formElem) {
    var hscroll = $(formElem.DOM).find('div[data-name="' + formElem.name + '"]');
    $(hscroll).empty(); 
    if (formElem.value) {
        $(hscroll).append(formElem.value);
    }
}

function __appendHorizontalScroll(mode, formLayout, formElem, $fieldContainer, useMiniLayout) {
    var hscroll = $('<div />').attr({
        'class' : 'hx-horizontal-scroller-nozoom hx-full-width ' + formElem.computedStyleClass,
        'data-name' : formElem.name
    }).appendTo($fieldContainer);
    if (formElem.computedStyle) {
        hscroll.attr('style', formElem.computedStyle);
    }
    if (formElem.value) {
        hscroll.append(formElem.value);
    }
}

function __appendHorizontalBlockPanel(mode, formLayout, formElem, $fieldContainer, useMiniLayout, page) {
    var subPanelObj = formElem;
    
    // The panelMode field determines if the subPanel is in a fixed mode (edit or view), or it is the same/reverse
    // of the main form.
    if (!subPanelObj.panelMode) {
        // Render in the same mode as the enclosing form.
        subPanelObj.modes = formLayout.modes;
        subPanelObj.currentMode = formLayout.currentMode;
    } else if (subPanelObj.panelMode === 'reverse') {
        // Opposite of the parent.
        subPanelObj.currentMode = (formLayout.currentMode === 'edit' ? 'view' : 'edit');
        subPanelObj.modes = subPanelObj.panelMode;
    } else {
        // Fixed value.
        subPanelObj.currentMode = subPanelObj.panelMode;
        subPanelObj.modes = subPanelObj.panelMode;
    }
    subPanelObj.titleStyleClass = formLayout.titleStyleClass;
    subPanelObj.textStyleClass = formLayout.textStyleClass;
    
    ++Helix.Utils.nSubPanels;
    var subPanelID = formElem.id;
    if (!subPanelID) {
        subPanelID = 'subpanel' + Helix.Utils.nSubPanels;
    }
    var subPanelDiv = $('<div />').attr({
        'id' : subPanelID,
        'class' : 'hx-flex-horizontal'
    }).appendTo($fieldContainer);

    // Layout the elements in the sub-panel add a separator between elements
    // but not between items in each element.
    Helix.Utils.layoutForm(subPanelDiv, subPanelObj, page, useMiniLayout);
    
    // Determine if the sub-panel is visible based on the 'mode' field.
    if (subPanelObj.mode && subPanelObj.mode !== 'all') {
        if (subPanelObj.mode !== formLayout.currentMode) {
            // Not visible.
            $(subPanelDiv).hide();
            return;
        }
    }
    $(subPanelDiv).show();
    
    subPanelObj.DOM = subPanelObj.editDOM = subPanelObj.viewDOM = subPanelDiv;
}

function __appendSubPanel(mode, formLayout, formElem, $fieldContainer, useMiniLayout, page) {
    var subPanelObj = formElem;
    
    // The panelMode field determines if the subPanel is in a fixed mode (edit or view), or it is the same/reverse
    // of the main form.
    if (!subPanelObj.panelMode) {
        // Render in the same mode as the enclosing form.
        subPanelObj.modes = formLayout.modes;
        subPanelObj.currentMode = formLayout.currentMode;
    } else if (subPanelObj.panelMode === 'reverse') {
        // Opposite of the parent.
        subPanelObj.currentMode = (formLayout.currentMode === 'edit' ? 'view' : 'edit');
        subPanelObj.modes = subPanelObj.panelMode;
    } else {
        // Fixed value.
        subPanelObj.currentMode = subPanelObj.panelMode;
        subPanelObj.modes = subPanelObj.panelMode;
    }
    subPanelObj.titleStyleClass = formLayout.titleStyleClass;
    subPanelObj.textStyleClass = formLayout.textStyleClass;
    
    
    ++Helix.Utils.nSubPanels;
    var subPanelID = formElem.id;
    if (!subPanelID) {
        subPanelID = 'subpanel' + Helix.Utils.nSubPanels;
    }
    var subPanelDiv = $('<div />').attr({
        'id' : subPanelID
    }).appendTo($fieldContainer);

    // Layout the elements in the sub-panel add a separator between elements
    // but not between items in each element.
    Helix.Utils.layoutForm(subPanelDiv, subPanelObj, page, useMiniLayout);

    // Prepend here rather than appending before the layoutForm call because layoutForm
    // empties the parent div.
    subPanelDiv.prepend($('<h3 />').append(formElem.fieldTitle));

    // Make sure we have a dynamic page used to create new items in this 
    // subpanel.
    //var dialogId;
    if (subPanelObj.dialog &&
        (subPanelObj.dialog.activeMode === -1 ||
            mode === subPanelObj.dialog.activeMode )) {
        var dialogObj = Helix.Utils.createDialog(subPanelObj.dialog, subPanelObj.dialog.uniqueID, formElem.fieldTitle, page);

        // Add a button to open the dialog.
        $('<a />').attr({
            'href' : 'javascript:void(0)',
            'data-role' : 'button',
            'data-inline' : 'true',
            'data-theme' : 'b'
        })
        .append(subPanelObj.dialog.dialogTitle)
        .appendTo(subPanelDiv)
        .on('tap', function() {
            $.mobile.changePage(PrimeFaces.escapeClientId(dialogObj.id), {});
        })
        .button();
    }

    // Create the collapsible content.
    subPanelDiv.collapsible({
        collapsed: !subPanelObj.noCollapse,
        mini: (subPanelObj.mini ? subPanelObj.mini : (formLayout.mini ? true : false))
    });
    
    // Determine if the sub-panel is visible based on the 'mode' field.
    if (subPanelObj.mode && subPanelObj.mode !== 'all') {
        if (subPanelObj.mode !== formLayout.currentMode) {
            // Not visible.
            $(subPanelDiv).hide();
            return;
        }
    }
    $(subPanelDiv).show();
    
    subPanelObj.DOM = subPanelObj.editDOM = subPanelObj.viewDOM = subPanelDiv;
}

function __preprocessFormElement(formLayout, formElem) {
    formElem.computedFieldStyleClass = '';
    if (formElem.fieldStyleClass) {
        if (!Helix.Utils.isString(formElem.fieldStyleClass)) {
            formElem.computedFieldStyleClass = 
                (formElem.fieldStyleClass[Helix.deviceType] ?  formElem.fieldStyleClass[Helix.deviceType] : formElem.fieldStyleClass['default']);
        } else {
            formElem.computedFieldStyleClass = formElem.fieldStyleClass;
        }
        if (formElem.computedFieldStyleClass) {
            formElem.computedFieldStyleClass = ' ' + formElem.computedFieldStyleClass;
        }
    }    
    
    formElem.computedStyleClass = '';
    if (formElem.styleClass) {
        if (!Helix.Utils.isString(formElem.styleClass)) {
            formElem.computedStyleClass = 
                (formElem.styleClass[Helix.deviceType] ?  formElem.styleClass[Helix.deviceType] : formElem.styleClass['default']);
        } else {
            formElem.computedStyleClass = formElem.styleClass;
        }
    }
    
    formElem.computedStyle = '';
    if (formElem.style) {
        if (!Helix.Utils.isString(formElem.style)) {
            formElem.computedStyle = 
                (formElem.style[Helix.deviceType] ?  formElem.style[Helix.deviceType] : formElem.style['default']) + ";";
        } else {
            formElem.computedStyle = formElem.style + ";";
        }
    }

    if (formElem.width) {
        if (!Helix.Utils.isString(formElem.width)) {
            /* Mapping from device type to width. */
            formElem.computedWidth = (formElem.width[Helix.deviceType] ?  formElem.width[Helix.deviceType] : formElem.width['default']);
        } else {
            formElem.computedWidth = (formElem.width === 'full' ? '100%' : formElem.width);
        }
    } else {
        formElem.computedWidth = '';
    }
    if (!formElem.computedStyle && formElem.computedWidth) {
        formElem.computedStyle = 'width: ' + formElem.computedWidth;
    } else if (formElem.computedWidth) {
        formElem.computedStyle = formElem.computedStyle + 'width: ' + formElem.computedWidth;
    }
    
    if (!formElem.mode) {
        formElem.mode = 'all';
    }
    
    if (!formElem.value) {
        // Set to the default.
        formElem.value = formElem.defaultValue;
    }
    
    /**
     * Check if this element is disabled on this device.
     */
    if (formElem.deviceType && formElem.deviceType !== 'all') {
        if (formElem.deviceType !== Helix.Utils.deviceType) {
            formElem.disabled = true;
            return;
        }
    }
    
    formElem.disabled = false;
}

Helix.Utils.noTitleLayouts = {
    "button" : true,
    "controlset" : true,
    "radio" : true,
    "subPanel" : true,
    "horizontalBlock": true
};

Helix.Utils.fieldContainers = {
    'text' : true,
    'search' : true,
    'date' : true,
    'exactdate' : true,
    'datetime' : true,
    'pickList' : true
};

Helix.Utils.oneContainerLayouts = {
    'controlset' : true,
    'checkbox' : true
};

Helix.Utils.layoutFormElement = function(formLayout, formElem, parentDiv, page, useMiniLayout) {
    var supportedModes = formLayout.modes;
    var currentMode = formLayout.currentMode;
    var renderFn = null;
    var oneContainer = false;
    
    var separateElements = formLayout.separateElements;
    
    __preprocessFormElement(formLayout, formElem);
    
    if (formElem.disabled) {
        return;
    }
    
    if (formElem.type === 'separator') {
        if (formElem.mode === 'all') {
            formElem.viewDOM = $('<hr />').appendTo(parentDiv);
            formElem.editDOM = $('<hr />').appendTo(parentDiv);
        } else if (formElem.mode === 'view') {
            formElem.viewDOM = $('<hr />').appendTo(parentDiv);
        } else {
            formElem.editDOM = $('<hr />').appendTo(parentDiv);
        }

        if (formLayout.currentMode === 'view') {
            formElem.DOM = formElem.viewDOM;
        } else {
            formElem.DOM = formElem.editDOM;
        }

        return;
    } 
    
    var $viewFieldContainer, $editFieldContainer;
    var containerID = null;    
    if (formElem.id) {
        containerID = formElem.id + "_container";
    } else if (formElem.name) {
        containerID = formElem.name + "_container";
    } else {
        containerID = Helix.Utils.getUniqueID();
    }
    
    if (supportedModes !== 'edit' &&
        formElem.mode !== 'edit') {
        /* View mode. */
        formElem.viewDOM = $viewFieldContainer = $('<div />')
            .attr('id', containerID + "_view")
            .addClass('hx-form-container')
            .appendTo(parentDiv);
        if (formElem.type !== 'hidden') {
            formElem.viewDOM.addClass('hx-form-view-border hx-form-view-item');
        }        
        if (formLayout.computedFieldStyleClass || formElem.computedFieldStyleClass) {
            $viewFieldContainer.attr('class', formLayout.computedFieldStyleClass + formElem.computedFieldStyleClass);
        }
        if (formLayout.computedFieldStyle) {
            $viewFieldContainer.attr('style', formLayout.computedFieldStyle);
        }
        if (formLayout.computedWidth) {
            $viewFieldContainer.width(formLayout.computedWidth);
        }
        if (formElem.fieldTitle && !(formElem.type in Helix.Utils.noTitleLayouts)) {
            if (formElem.titleStyleClass) {
                $viewFieldContainer.append($('<span />').attr({
                    'class' : formElem.titleStyleClass + ' ui-input-text'
                }).append(formElem.fieldTitle));
            } else if (formLayout.titleStyleClass) {
                $viewFieldContainer.append($('<span />').attr({
                    'class' : formLayout.titleStyleClass + ' ui-input-text'
                }).append(formElem.fieldTitle));
            } else {
                $viewFieldContainer.append(formElem.fieldTitle);
            }
            if (formElem.type in Helix.Utils.fieldContainers) {
                if (formElem.mini) {
                    $viewFieldContainer.addClass('hx-mini-fieldview'); 
                } else {
                    $viewFieldContainer.addClass('hx-fieldview'); 
                }
                
                $viewFieldContainer.addClass('ui-fieldcontain'); 
                $viewFieldContainer.addClass('ui-body'); 
                $viewFieldContainer.addClass('ui-br');
            }
        }
    } 
    
    if (supportedModes !== 'view' &&
        formElem.mode !== 'view') {
        if ((formElem.type in Helix.Utils.oneContainerLayouts) &&
                $viewFieldContainer) {
            formElem.editDOM = $editFieldContainer = $viewFieldContainer;
            oneContainer = true;
        } else {
            /* Edit mode. */
            formElem.editDOM = $editFieldContainer = $('<div />').attr({
                'id' : containerID + "_edit",
                'class' : 'hx-form-container'
            }).appendTo(parentDiv);            
            if (formLayout.computedWidth) {
                $editFieldContainer.width(formLayout.computedWidth);
            }
        }
    }
    if (currentMode === 'view') {
        formElem.DOM = $viewFieldContainer;
    } else {
        formElem.DOM = $editFieldContainer;
    }
    
    if ((formElem.type === 'text')  || (formElem.type === 'search')) {
        renderFn = __appendTextBox;
    } else if (formElem.type === 'textarea') {
        renderFn = __appendTextArea;
    } else if (formElem.type === 'pickList' || formElem.type === 'picklist') {
        renderFn = __appendSelectMenu;
    } else if (formElem.type === 'checkbox') {
        renderFn = __appendCheckBox;
    } else if (formElem.type === 'controlset') {
        renderFn = __appendControlSet;
    } else if (formElem.type === 'radio') {
        renderFn = __appendRadioButtons;
    } else if (formElem.type === 'onoff') {
        renderFn = __appendOnOffSlider;
    } else if (formElem.type === 'htmlarea') {
        renderFn = __appendHTMLArea;
    } else if (formElem.type === 'htmlframe') {
        renderFn = __appendIFrame;
    } else if (formElem.type === 'button') {
        renderFn = __appendButton;
    } else if (formElem.type === 'buttonGroup') {
        renderFn = __appendButtonGroup;
    } else if (formElem.type === 'date' ||
               formElem.type === 'exactdate' ||
               formElem.type === 'datetime') {
        renderFn = __appendDate;
    } else if (formElem.type === 'tzSelector') {
        renderFn = __appendTZSelector;
    } else if (formElem.type === 'dialog') {        
        var elemIdx;
        for (elemIdx = 0; elemIdx < formElem.controls.length; ++elemIdx) {
            var subElem = formElem.controls[elemIdx];
            Helix.Utils.layoutFormElement(formLayout, subElem, parentDiv, page, useMiniLayout);
        }

        /* Add a button to submit the dialog. */
        var buttonTitle = formElem.dialogSubmitTitle;
        if (!buttonTitle) {
            buttonTitle = formElem.dialogTitle;
        }
        
        $('<div />').attr({
            'class' : 'ui-block-b'
        }).append($('<button />').attr({
            'data-theme' : 'b',
            'type' : 'submit'
            }).append(buttonTitle)
              .button()
              .on('tap', function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    if (formElem.dialogSubmit) {
                        formElem.dialogSubmit(parentDiv);
                    }
                    $.mobile.changePage(formElem.doneLink, {});
                })
        )
        .appendTo(parentDiv);
        separateElements = false;
    } else if (formElem.type === 'hidden') {
        if ($editFieldContainer) {
            /* Edit. */
            if (!formElem.name) {
                /* No field name. We cannot include this field in the form. */
                return;
            }
            
            $editFieldContainer.append($('<input />').attr({
                    'name': formElem.name,
                    'type': 'hidden',
                    'value': formElem.value
            }));
            $editFieldContainer.hide();
        }
        separateElements = false;
    } else if (formElem.type == 'upload') {
        if ($editFieldContainer) {
            /* For desktop use only! Create an HTML5 uploader. */
            var styleClass = formElem.computedStyleClass;
            if (!styleClass) {
                styleClass = '';
            }

            /* Append a span with a message indicating what the user should do. */
            $('<span/>').attr({
                'class' : styleClass
            }).append(formElem.fieldTitle)
                .appendTo($editFieldContainer);   

            var uploadId = Helix.Utils.getUniqueID();
            var uploadDiv= $('<div/>').attr({
                'id' : uploadId,
                'class' : "mh-uploads"
            }).appendTo($editFieldContainer);


            $(page).on('pagecreate', function() {
               var dropbox = $editFieldContainer;
               dropbox.filedrop(uploadDiv, {
                    // The name of the $_FILES entry:
                    paramname:'file',

                    maxfiles: 1,
                    maxfilesize: 20, // in mb
                    url: formElem.options.url,
                    headers: formElem.options.headers,
                    
                    /* '/clientws/sharepoint/upload' */
                    /*
                     * {
                        'listUUID' : currentList.uuidName,
                        'siteURL' : currentSite.siteURL
                        }
                     */

                    uploadFinished:function(i,file,response){
                        Helix.Utils.statusMessage("Upload Complete", response.msg, "info");
                    },

                    error: function(err, file) {
                        switch(err) {
                            case 'BrowserNotSupported':
                                Helix.Utils.statusMessage('Unsupported Operation', 'Your browser does not support HTML5 file uploads!', 'severe');
                                break;
                            case 'TooManyFiles':
                                Helix.Utils.statusMessage('Error', 'Too many files! Please select 1 at most!', 'severe');
                                break;
                            case 'FileTooLarge':
                                Helix.Utils.statusMessage(file.name+' is too large! Please upload files up to 2mb.');
                                break;
                            default:
                                break;
                        }
                    },

                    // Called before each upload is started
                    beforeEach: function(file){
                        if (!formElem.name) {
                            this.headers['fileName'] = file.name;
                        } else {
                            this.headers['fileName'] = formElem.name;
                        }
                    }
                });           
            });
        }   
    } else if (formElem.type === "image") {
       if ($viewFieldContainer) {
           styleClass = "";
           if (formElem.computedStyleClass) {
               styleClass = formElem.computedStyleClass;
           }
           if (!formElem.target) {
               formElem.target = "";
           }
           
           /* Only show images in view mode. */
           var surroundingDiv = $('<div/>').attr({
               'class' : styleClass
           }).appendTo($viewFieldContainer);
           
           var imgTag = $('<img/>').attr({
               'src': formElem.src,
               'width' : formElem.computedWidth,
               'height' : formElem.height,
               'style' : formElem.computedStyle,
               'alt' : formElem.name,
               'title' : formElem.name,
               'target' : formElem.target
           });
           var txtElem = $('<span/>').attr({ 'style' : 'float:left' }).append('Tap to open ' + formElem.name);
           if (formElem.link) {
               surroundingDiv.append($('<a/>').attr({
                   'href' : formElem.link
               }).append(imgTag).append(txtElem));
           } else if (formElem.click) {
               $(imgTag).on('tap', function(e) {
                   formElem.click.apply(this, [e]);
               });
               surroundingDiv.append(imgTag).append(txtElem);
           } else {
               surroundingDiv.append(imgTag).append(txtElem);
           }
           $(imgTag).load(function() {
               $(txtElem).hide();
           });
       }
    } else if (formElem.type === 'horizontalScroll') {
        renderFn = __appendHorizontalScroll;
    } else if (formElem.type === 'subPanel') {
        // Subpanels should be attached directly to the parent div, not to a surrounding
        // container. Otherwise the full screen styling won't work with subpanels because
        // the margin around the collapsible container is masked by the surrounding div.
        if ($viewFieldContainer) {
            $viewFieldContainer.remove();
        }
        if ($editFieldContainer) {
            $editFieldContainer.remove();
        }
        $viewFieldContainer = $editFieldContainer = null;
        
        __appendSubPanel.call(formElem, 0, formLayout, formElem, parentDiv, useMiniLayout, page, parentDiv);
    } else if (formElem.type === 'horizontalBlock') {
        // horizontalBlocks should be attached directly to the parent div, not to a surrounding
        // container. Otherwise the full screen styling won't work with subpanels because
        // the margin around the collapsible container is masked by the surrounding div.
        if ($viewFieldContainer) {
            $viewFieldContainer.remove();
        }
        if ($editFieldContainer) {
            $editFieldContainer.remove();
        }
        $viewFieldContainer = $editFieldContainer = null;
        
        __appendHorizontalBlockPanel.call(formElem, 0, formLayout, formElem, parentDiv, useMiniLayout, page, parentDiv);
    } else {
        separateElements = false;
    }
    
    if ($viewFieldContainer) {
        if (renderFn) {
            renderFn.call(formElem, 0, formLayout, formElem, $viewFieldContainer, useMiniLayout, page, parentDiv);
        }
        if (currentMode === 'edit' && !oneContainer) {
            $viewFieldContainer.hide();
        }
    }
    if ((!oneContainer && $editFieldContainer)) {
        if (renderFn) {
            renderFn.call(formElem, 1, formLayout, formElem, $editFieldContainer, useMiniLayout, page, parentDiv);
        }
        if (currentMode === 'view' && !oneContainer) {
            $editFieldContainer.hide();
        }
    }
    
    if (separateElements && !formElem.noSeparator) {
        formElem.SEPARATOR = $('<hr />').insertAfter(formElem.editDOM ? formElem.editDOM : formElem.viewDOM);
    }
    if (formElem.hidden && formElem.DOM) {
        $(formElem.DOM).hide();
        if (formElem.SEPARATOR) {
            // Hide the HR.
            $(formElem.SEPARATOR).hide();
        }
    } else if (formElem.DOM && formElem.type !== 'hidden') {
        $(formElem.DOM).show();
        if (formElem.SEPARATOR) {
            $(formElem.SEPARATOR).show();
        }
    }
}

function __preprocessFormLayout(formLayout) {
   formLayout.computedFieldStyleClass = '';
    if (formLayout.fieldStyleClass) {
        if (!Helix.Utils.isString(formLayout.fieldStyleClass)) {
            formLayout.computedFieldStyleClass = 
                (formLayout.fieldStyleClass[Helix.deviceType] ?  formLayout.fieldStyleClass[Helix.deviceType] : formLayout.fieldStyleClass['default']);
        } else {
            formLayout.computedFieldStyleClass = formLayout.fieldStyleClass;
        }
    }
    
    formLayout.computedFieldStyle = '';
    if (formLayout.fieldStyle) {
        if (!Helix.Utils.isString(formLayout.fieldStyle)) {
            formLayout.computedFieldStyle = 
                (formLayout.fieldStyle[Helix.deviceType] ?  formLayout.fieldStyle[Helix.deviceType] : formLayout.fieldStyle['default']);
        } else {
            formLayout.computedFieldStyle = formLayout.fieldStyle + ";";
        }
    }
    
    formLayout.computedWidth = '';
    if (formLayout.width) {
        if (!Helix.Utils.isString(formLayout.width)) {
            /* Mapping from device type to width. */
            formLayout.computedWidth = (formLayout.width[Helix.deviceType] ?  formLayout.width[Helix.deviceType] : formLayout.width['default']);
        } else {
            formLayout.computedWidth = (formLayout.width === 'full' ? "100%" : formLayout.width);
        }
    }    
    
    if (!formLayout.titleStyleClass) {
        formLayout.titleStyleClass = '';
    }
    if (!formLayout.textStyleClass) {
        formLayout.textStyleClass = '';
    }
    
    formLayout.__tabIndex = 1;
}

/**
 * 0 for view mode; 1 for edit mode.
 */
Helix.Utils.nSubPanels = 0;
Helix.Utils.dynamicDialogs = {};
Helix.Utils.layoutForm = function(parentDiv, formLayout, page, useMiniLayout) {
    __preprocessFormLayout(formLayout);
    if (!page) {
        page = $.mobile.activePage;
    }
    
    // Clear out whatever is currently inside of the parent div.
    $(parentDiv).empty();
    
    var formElem;
    var elemIdx;
    var formElements = formLayout.items;
    if (formLayout.height) {
        $(parentDiv).height(formLayout.height);
    }
    for (elemIdx = 0; elemIdx < formElements.length; ++elemIdx) {
        formElem = formElements[elemIdx];
        formElem.parentForm = formLayout;
        Helix.Utils.layoutFormElement(formLayout, formElem, parentDiv, page, useMiniLayout);
    }
}

Helix.Utils.createDialog = function(dialogFields, dialogName, dialogTitle, page, useMiniLayout) {
    var dialogId = Helix.Utils.getUniqueID();
    var dialogObj = Helix.Utils.dynamicDialogs[dialogName];
    var isCreated = false;
    if (!dialogObj) {
        dialogObj = Helix.Utils.dynamicDialogs[dialogName] = {
            'id' : dialogId,
            'page' : $('<div />').attr({
                'data-role' : 'page',
                'id' : dialogId,
                'data-history' : false
            }).append($('<div />').attr({
                'data-role' : 'header',
                'data-position' : 'fixed'
                }).append($('<h1 />')
                    .append(dialogTitle)
                ).append($('<a />').attr({
                    'data-iconpos' : 'left',
                    'data-icon' : 'back',
                    'class' : 'ui-btn-left',
                    'href' : PrimeFaces.escapeClientId($(page).attr('id'))
                    }).append('Back')
                ).append($('<a />').attr({
                    'data-iconpos' : 'right',
                    'data-icon' : 'check',
                    'data-theme' : 'b',
                    'class' : 'ui-btn-right' 
                }).on(Helix.clickEvent, function(ev) {
                    dialogFields.saveButton.onclick(ev);
                }).append(dialogFields.saveButton.title))
            ).append($('<div />').attr({
                'data-role' : 'content',
                'style' : 'overflow-y: auto;',
                'class' : 'hx-main-content'
                }).append($('<form />').attr({
                    'width': '100%',
                    'height': '100%',
                    'class': 'hx-layout-full-height'
                }))
            ),
            'fields' : dialogFields
        };
        isCreated = true;
    }
    
    if (!isCreated) {
        Helix.Utils.refreshDialogValues(dialogFields, dialogObj, null);
    } else {
        var dialogForm = $(dialogObj.page).find('form'); 
        $(dialogForm).empty();
        $(dialogForm).data("DIALOG", dialogFields);
        $(dialogForm).width('100%');
        $(dialogForm).height('100%');
        $(dialogForm).addClass('hx-layout-full-height');
        dialogFields.doneLink = PrimeFaces.escapeClientId($.mobile.activePage.attr('id'));
        dialogFields.mode = true; /* Edit mode. */
        dialogFields.separateElements = false; /* Do not separate elements. */
        $(dialogObj.page).appendTo($.mobile.pageContainer);

        //initialize the new page 
        //$.mobile.initializePage();

        $(dialogObj.page).page();
        //$(dialogObj.page).trigger("pagecreate");

        Helix.Utils.layoutForm(dialogForm, dialogFields, dialogObj.page, useMiniLayout);
    }
    
    return dialogObj;
}

Helix.Utils.refreshDialogValues = function(dialogFields, dialogObj, refreshDone) {
    var dialogForm = $(dialogObj.page).find('form');
    
    var idx = 0;
    for (idx = 0; idx < dialogFields.items.length; ++idx) {
        var formElem = dialogFields.items[idx];
        var inputElem = $(dialogForm).find("[name='" + formElem.name + "']");
        if (inputElem) {
            if (formElem.type === "htmlarea") {
                $(inputElem).editor('update', formElem.value);
            } else if (formElem.type === "date") {
                //$(inputElem).datebox('setDate', new Date(parseInt(formElem.value)));
                var dateValue;
                if (!formElem.value) {
                    dateValue = new Date();
                } else {
                    dateValue = parseInt(formElem.value);
                    dateValue = new Date(dateValue);
                }
                $(inputElem).val(dateValue.toISOString());
                //$(inputElem).trigger('datebox', {'method':'set', 'value': dateValue});
            } else if (formElem.type === "text" || formElem.type === "search" || 
                       formElem.type === "hidden") {
                $(inputElem).val(formElem.value);
            }
        }
    }
    if (refreshDone) {
        refreshDone();
    }
}

Helix.Layout.createConfirmDialog = function(options) {
    if (options.onclick && !options.onclick()) {
        return;
    }
    
    var popupId = (options.name ? options.name : Helix.Utils.getUniqueID());
    var popup = $('<div/>').attr({
        'data-role' : 'popup',
        'id' : popupId,
        'data-overlay-theme' : 'c',
        'data-theme' : 'c',
        'data-position-to' : 'window',
        'data-history' : 'false',
        'style' : 'max-width: 300px'
    });
    
    var closebtn = $('<a/>').attr({
        'href' : 'javascript:void(0)',
        'data-role' : 'button',
        'data-inline' : 'true',
        'data-theme' : 'c',
        'data-corners' : 'false',
        'style' : 'width: 90px',
        'id' : popupId + "-cancel"
    });
    if (options.dismissText) {
        $(closebtn).append(options.dismissText);
    } else {
        $(closebtn).append("Dismiss");
    }
    if (options.ondismiss) {
        $(document).on(Helix.clickEvent, PrimeFaces.escapeClientId(popupId + "-cancel"), popup, function(e) {
            e.preventDefault();
            $(e.data).popup("close");
            options.ondismiss();
            return false;
        });
    } else {
        $(document).on(Helix.clickEvent, PrimeFaces.escapeClientId(popupId + "-cancel"), popup, function(e) {
            e.preventDefault();
            $(e.data).popup("close");
            return false;
        });
    }
    
    var confirmbtn = $('<a/>').attr({
        'href' : 'javascript:void(0)',
        'data-role' : 'button',
        'data-inline' : 'true',
        'data-theme' : 'b',
        'data-corners': 'false',
        'style' : 'width: 90px',
        'id' : popupId + "-confirm"
    });
    if (options.confirmText) {
        $(confirmbtn).append(options.confirmText);
    } else {
        $(confirmbtn).append("Confirm");
    }
    if (options.onconfirm) {
        $(document).on(Helix.clickEvent, PrimeFaces.escapeClientId(popupId + "-confirm"), popup, function(e) {
            e.preventDefault();
            $(e.data).popup("close");
            options.onconfirm();
            return false;
        });
    } else {
        $(document).on(Helix.clickEvent, PrimeFaces.escapeClientId(popupId + "-confirm"), popup, function(e) {
            e.preventDefault();
            $(e.data).popup("close");
            return false;
        });
    }
    
    var titleStyleClass = options.titleStyleClass ? options.titleStyleClass : 'dialog-title';
    var header = $("<div/>").attr({
        'data-role' : 'header',
        'data-theme' : 'd',
        'class' : titleStyleClass
    }).append($('<h1/>').attr({
               'style' : 'margin-left: .5em', // remove icon empty margin
               'class' : 'ui-title'
            }).append(options.title));
        
    $(popup)
        .append(header)
        .append($('<div/>').attr({
            'data-role' : 'content',
            'style' : 'margin: .5em .5em .5em .5em',
            'data-theme' : 'd',
            'class' : 'ui-corner-bottom ui-content'
        })
            .append($('<p/>').append(options.message))
            .append(closebtn)
            .append(confirmbtn)
    );			

    // Create the popup. Trigger "pagecreate" instead of "create" because currently the framework doesn't bind the enhancement of toolbars to the "create" event (js/widgets/page.sections.js).
    $.mobile.activePage.append( popup ).trigger( "pagecreate" );
    $(popup).popup({});
    $(popup).on('popupafterclose', function() {
        $(this).remove();
    });
    $(popup).popup("open");    
    $(window).on('navigate.popup', function (e) {
        e.preventDefault();
        $(window).off('navigate.popup');
    });
};
