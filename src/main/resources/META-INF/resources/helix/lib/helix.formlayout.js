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
Helix.Utils.layoutFormElement = function(formElem, parentDiv, mode, separateElements, page, newScrollers) {
    var $fieldContainer;
    if (!mode) {
        /* View mode. */
        $fieldContainer = $('<div />')
        .css("clear", "both")
        .appendTo(parentDiv);
        if (formElem.styleClass) {
            $fieldContainer.attr('class', formElem.styleClass);
        }
        if (formElem.id) {
            $fieldContainer.attr('id', formElem.id);
        }
        if (formElem.style) {
            $fieldContainer.attr('style', formElem.style);
        }
        if (formElem.fieldTitle) {
            if (formElem.titleStyleClass) {
                $fieldContainer.append($('<span />').attr({
                    'class' : formElem.titleStyleClass
                }).append(formElem.fieldTitle));
            } else {
                $fieldContainer.append(formElem.fieldTitle);
            }
        }
    } else {
        /* Edit mode. */
        $fieldContainer = parentDiv;
    }
    formElem.DOM = $fieldContainer;
    
    if (formElem.type == "text") {
        if (mode) {
            /* Edit */
            if (!formElem.name) {
                /* No field name. We cannot edit this field. */
                return;
            }
            
            var inputMarkup = $('<input />').attr({
                'name': formElem.name,
                'id' : formElem.name,
                'type': 'text',
                'value': formElem.value
            });

            if (!formElem.style) {
                formElem.style = 'width: 90%';
            }
            var textContainer = $('<div />').attr({
                'data-role' : 'fieldcontain',
                'style' : formElem.style
            })
            .append($('<label />').attr({
                'for' : formElem.name
                })
                .append(formElem.fieldTitle)
            )
            .append(inputMarkup);
            $fieldContainer.append(textContainer);
            textContainer.fieldcontain();
            $(inputMarkup).textinput();
            if (formElem.fieldTitleType === 'button') {
                $(formElem.fieldTitle).button();
            }
            if (formElem.onblur) {
                $(inputMarkup).blur(function() {
                    formElem.onblur(this);
                });
            }
        } else {
            if (formElem.fieldTitle && (typeof formElem.fieldTitle == "string")) {
                $fieldContainer.append(" " + formElem.value);
            } else {
                $fieldContainer.append($('<p />').append(formElem.value));
            }
        }
    } else if (formElem.type === 'htmlarea') {
        if (mode) {
            var editorWidth = formElem.width;
            var isFullWidth = false;
            if (formElem.width === "full") {
                isFullWidth = true;
            }
            if (!formElem.name) {
                /* No field name. We cannot edit this field. */
                return;
            }
            
            var editorID = Helix.Utils.getUniqueID();
            var editorInput = $('<textarea />').attr({
                'name' : formElem.name,
                'id' : editorID + "_input"
            }).append(formElem.value);
            $fieldContainer.append($('<div />')
                .append($('<label />').attr({
                    'for' : formElem.name
                    })
                    .append(formElem.fieldTitle)
                )
                .append(editorInput)
            );
            $(editorInput).cleditor({
                'widget' : editorID + "_widget",
                'width' : (formElem.width ? formElem.width : $(parentDiv).width()),
                'isFullWidth' : isFullWidth,
                'height' : (formElem.height ? formElem.height : 250),
                'page' : page
            });
        } else {
            var htmlDiv = $('<div />').append(formElem.value);
            $fieldContainer.append(htmlDiv);
            if (formElem.isScroller) {
                var scroller = $fieldContainer.helixScrollingDiv({ width: '98%' }).data('helix-helixScrollingDiv');
                newScrollers.push(scroller);
            } else {
                $fieldContainer.width('98%');
            }
        }
    } else if (formElem.type === 'htmlframe') {
        if (!mode) {
            var frameParams = formElem.frameParams;
            var frameSrc = formElem.frameSrc;
            if (frameParams && frameParams.length > 0) {
                frameSrc = frameSrc + "?" + $.param(frameParams);
            }
            var frameStyle = "";
            if (formElem.frameStyle) {
                frameStyle = formElem.frameStyle;
            }
            
            /* This is a layout-only component - it does not make sense when editing. */
            $fieldContainer.append($('<iframe />').attr({
                'src' : frameSrc,
                'style' : frameStyle
            }));
        }
    } else if (formElem.type === 'button') {
        var $buttonLink;
        if (!formElem.title) {
            formElem.title = "";
        }
        if (formElem.iconClass) {
            $buttonLink = $('<a />').attr({
                'data-role' : 'button',
                'data-iconpos' : 'bottom',
                'data-icon' : formElem.iconClass,
                'data-iconshadow' : true,
                'class' : 'iconbutton'
            }).append(formElem.title).button();            
        } else {
            $buttonLink = $('<a />').attr({
                'data-role' : 'button',
                'data-inline' : true,
                'data-theme' : 'b'
            }).append(formElem.title).button();
        }
        if (formElem.href) {
            $buttonLink.attr('href', formElem.href);
        } else {
            $buttonLink.attr('href', 'javascript:void(0);');
        }
        $buttonLink.appendTo($fieldContainer);
        if (formElem.onclick) {
            $buttonLink.on('tap', function() {
                formElem.onclick($fieldContainer);
            });
        }
    } else if (formElem.type === 'buttonGroup') {
        var formButton;
        var formButtonIdx;

        var $buttonBar = $('<div />').attr({
            'data-role' : 'controlgroup',
            'data-type' : 'horizontal',
            'class' : 'buttonBarMaster buttonbar'
        }).appendTo($fieldContainer);
        for (formButtonIdx = 0; formButtonIdx < formElem.buttons.length; ++formButtonIdx) {
            formButton = formElem.buttons[formButtonIdx];
            var $buttonBarLink = $('<a />').attr({
                'data-role' : 'button',
                'data-iconpos' : 'bottom',
                'data-icon' : formButton.iconClass,
                'data-iconshadow' : false,
                'class' : 'iconbutton'
            });
            if (formButton.title) {
                $buttonBarLink.append(formButton.title);
            } 
            if (formButton.href) {
                $buttonBarLink.attr('href', formButton.href);
            } else {
                $buttonBarLink.attr('href', 'javascript:void(0);');
            }
            if (formButton.onclick) {
                $buttonBarLink.on('tap', function(ev) {
                    formButton.onclick(this, ev);
                });
            }
            $buttonBarLink.appendTo($buttonBar);
            $buttonBarLink.button();
        }
        $buttonBar.controlgroup({ type: "horizontal" });
    } else if (formElem.type == 'date') {
        if (mode) {
            if (!formElem.name) {
                /* No field name. We cannot edit this field. */
                return;
            }
            
            var defaultValue = false;
            var defaultValueText = "";
            if (formElem.value) {
                defaultValue = formElem.value;
                var defaultDate = new Date(Number(defaultValue));
                defaultValueText = defaultDate.getFullYear() + "-" + (defaultDate.getMonth() + 1) + "-" + defaultDate.getDate();
            }
            
            /* Edit */
            
            var dateDiv = $('<div />').attr({
                'data-role' : 'fieldcontain'
            })
            .append($('<label />').attr({
                'for' : formElem.name
                })
                .append(formElem.fieldTitle)
            ).append($('<input />').attr({
                'name': formElem.name,
                'id': formElem.name,
                'type': 'text',
                'data-role' : 'datebox',
                'style' : 'width: 50%; font-size: 16px',
                'class' : 'ui-input-text',
                'data-options' : '{"mode" : "flipbox", "useNewStyle":true, "defaultValue":' + defaultValue + '}'
            }).datebox());
            // 'value' : defaultValueText,
            $fieldContainer.append(dateDiv);
        } else {
            var dateMarkup;
            if (formElem.value) {
                var dateValue = new Date(Number(formElem.value));
                dateMarkup = $('<a />').attr({
                    'title': dateValue.toISOString()
                }).prettyDate();
            } else {
                dateMarkup = "none";
            }
            
            if (formElem.fieldTitle) {
                $fieldContainer.append(" ")
                    .append($(dateMarkup).text()); 
            } else {
                $fieldContainer.append($('<div />').append($(dateMarkup).text()));
            }

        }
    } else if (formElem.type == 'dialog') {        
        var elemIdx;
        for (elemIdx = 0; elemIdx < formElem.items.length; ++elemIdx) {
            var subElem = formElem.items[elemIdx];
            Helix.Utils.layoutFormElement(subElem, parentDiv, true, false, page);
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
    } else if (formElem.type == 'hidden') {
        if (mode) {
            /* Edit. */
            if (!formElem.name) {
                /* No field name. We cannot include this field in the form. */
                return;
            }
            
            $fieldContainer.append($('<input />').attr({
                    'name': formElem.name,
                    'id': formElem.name,
                    'type': 'hidden',
                    'value': formElem.value
            }));
        }
    } else if (formElem.type == 'upload') {
        /* For desktop use only! Create an HTML5 uploader. */
        var styleClass = formElem.styleClass;
        if (!styleClass) {
            styleClass = '';
        }
        
        /* Append a span with a message indicating what the user should do. */
        $('<span/>').attr({
            'class' : styleClass
        }).append(formElem.fieldTitle)
            .appendTo($fieldContainer);   
        
        var uploadId = Helix.Utils.getUniqueID();
        var uploadDiv= $('<div/>').attr({
            'id' : uploadId,
            'class' : "mh-uploads"
        }).appendTo($fieldContainer);

        
        $(page).on('pagecreate', function() {
           var dropbox = $fieldContainer;
           dropbox.filedrop(uploadDiv, {
                // The name of the $_FILES entry:
                paramname:'file',

                maxfiles: 1,
                maxfilesize: 20, // in mb
                url: '/clientws/sharepoint/upload',
                headers: {
                    'listUUID' : currentList.uuidName,
                    'siteURL' : currentSite.siteURL
                },

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
            
    } else if (formElem.type == "image") {
       /*
        "type" : "image",
        "src" : thumbURL,
        "link" : viewURL,
        "width" : "128px",
        "height" : "128px",
        "style" : "margin: 0 auto"
        "styleClass" : "fooClass",
        "target" : "_blank
        */
       if (!mode) {
           styleClass = "";
           if (formElem.styleClass) {
               styleClass = formElem.styleClass;
           }
           if (!formElem.target) {
               formElem.target = "";
           }
           
           /* Only show images in view mode. */
           var surroundingDiv = $('<div/>').attr({
               'class' : styleClass
           }).appendTo($fieldContainer);
           
           var imgTag = $('<img/>').attr({
               'src': formElem.src,
               'width' : formElem.width,
               'height' : formElem.height,
               'style' : formElem.style,
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
    } else if (formElem.type == 'horizontalScroll') {
        $('<div />').attr({
            'class' : 'hx-horizontal-scroller-nozoom',
            'id' : formElem.id
        }).append(formElem.contents).appendTo($fieldContainer);
    } else if (formElem.type == 'separator') {
        $('<hr />').appendTo($fieldContainer);
    } else {
        separateElements = false;
    }
    if (separateElements) {
        $('<hr />').appendTo($fieldContainer);
    }
}

/**
 * 0 for view mode; 1 for edit mode.
 */
Helix.Utils.nSubPanels = 0;
Helix.Utils.dynamicDialogs = {};
Helix.Utils.layoutForm = function(parentDiv, formLayout, page) {
    var mode = formLayout.mode;
    var newScrollers = [];
    var separateElements = formLayout.separateElements;
    if (!page) {
        page = $.mobile.activePage;
    }
    
    // Clean up any scrollers in the parent div before we empty it out.
    Helix.Layout.cleanupScrollers(parentDiv);
    
    // Clear out whatever is currently inside of the parent div.
    $(parentDiv).empty();
    
    var formElem;
    var elemIdx;
    var formElements = formLayout.items;
    for (elemIdx = 0; elemIdx < formElements.length; ++elemIdx) {
        formElem = formElements[elemIdx];
        Helix.Utils.layoutFormElement(formElem, parentDiv, mode, separateElements, page, newScrollers);
    }
    
    if (formLayout.subPanels) {
        for (var subPanelTitle in formLayout.subPanels) {
            var subPanelObj = formLayout.subPanels[subPanelTitle];
            var formSubPanelItems = subPanelObj.items;
            ++Helix.Utils.nSubPanels;
            var subPanelID = 'subpanel' + Helix.Utils.nSubPanels;
            var subPanelDiv = $('<div />').attr({
                'data-role' : 'collapsible',
                'data-content-theme' : 'c',
                'id' : subPanelID
            }).append($('<h3 />').append(subPanelTitle))
                .appendTo(parentDiv);
            
            // Layout the elements in the sub-panel add a separator between elements
            // but not between items in each element.
            for (elemIdx = 0; elemIdx < formSubPanelItems.length; ++elemIdx) {
                formElem = formSubPanelItems[elemIdx];
                Helix.Utils.layoutFormElement(formElem, subPanelDiv, mode, false, page, newScrollers);
            }
            
            // Make sure we have a dynamic page used to create new items in this 
            // subpanel.
            //var dialogId;
            if (subPanelObj.dialog &&
                (subPanelObj.dialog.activeMode == -1 ||
                    mode == subPanelObj.dialog.activeMode )) {
                var dialogObj = Helix.Utils.createDialog(subPanelObj.dialog, subPanelObj.dialog.uniqueID, subPanelTitle, page);
                
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
            subPanelDiv.collapsible();
            $(document).on("expand", PrimeFaces.escapeClientId(subPanelID), function (event, ui) {
                if (formLayout.scroller) {
                    formLayout.scroller.refreshScroller();
                }
            });
            $(document).on("collapse", PrimeFaces.escapeClientId(subPanelID), function(event,ui) {
                if (formLayout.scroller) {
                    formLayout.scroller.refreshScroller();
                }
            });
        }
    }    
    
    // Re-layout the page because we have substantially changed the DOM. Also form
    // elements may have layout directives.
    Helix.Layout.layoutPage();
    if (formLayout.scroller) {
        formLayout.scroller.refresh();
    }
    // Refresh all component scrollers in the new layout.
    var sidx = 0;
    for (sidx = 0; sidx < newScrollers.length; ++sidx) {
        var sdiv = newScrollers[sidx];
        sdiv.refresh();
    }
}

Helix.Utils.createDialog = function(dialogFields, dialogName, dialogTitle, page) {
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
                )
            ).append($('<div />').attr({
                'data-role' : 'content',
                'style' : 'overflow-y: auto;',
                'class' : 'hx-main-content'
                }).append($('<form />'))
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
        $(dialogForm).width($.mobile.activePage.width());
        dialogFields.doneLink = PrimeFaces.escapeClientId($.mobile.activePage.attr('id'));
        dialogFields.mode = true; /* Edit mode. */
        dialogFields.separateElements = false; /* Do not separate elements. */
        $(dialogObj.page).appendTo($.mobile.pageContainer);

        //initialize the new page 
        //$.mobile.initializePage();

        $(dialogObj.page).page();
        //$(dialogObj.page).trigger("pagecreate");

        Helix.Utils.layoutForm(dialogForm, dialogFields, dialogObj.page);
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
                $(inputElem).text(formElem.value);
                $(inputElem).data("cleditor").refresh();
            } else if (formElem.type === "date") {
                //$(inputElem).datebox('setDate', new Date(parseInt(formElem.value)));
                var dateValue;
                if (!formElem.value) {
                    dateValue = Date.now();
                } else {
                    dateValue = parseInt(formElem.value);
                }
                $(inputElem).trigger('datebox', {'method':'set', 'value': dateValue}).trigger('datebox', {'method':'doset'});
            } else if (formElem.type === "text" ||
                       formElem.type === "hidden") {
                $(inputElem).attr('value', formElem.value);
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
    
    var popupId = Helix.Utils.getUniqueID();
    var popup = $('<div/>').attr({
        'data-role' : 'popup',
        'id' : popupId,
        'data-overlay-theme' : 'a',
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
        'id' : popupId + "_close"
    });
    if (options.dismissText) {
        $(closebtn).append(options.dismissText);
    } else {
        $(closebtn).append("Dismiss");
    }
    if (options.ondismiss) {
        $(document).on('tap', PrimeFaces.escapeClientId(popupId + "_close"), function(e) {
            e.preventDefault();
            options.ondismiss();
            $(popup).popup("close");
        });
    } else {
        $(document).on('tap', PrimeFaces.escapeClientId(popupId + "_close"), function(e) {
            e.preventDefault();
            $(popup).popup("close");
        });
    }
    
    var confirmbtn = $('<a/>').attr({
        'href' : 'javascript:void(0)',
        'data-role' : 'button',
        'data-inline' : 'true',
        'data-theme' : 'b',
        'id' : popupId + "_open"
    });
    if (options.confirmText) {
        $(confirmbtn).append(options.confirmText);
    } else {
        $(confirmbtn).append("Confirm");
    }
    if (options.onconfirm) {
        $(document).on('tap', PrimeFaces.escapeClientId(popupId + "_open"), function(e) {
            e.preventDefault();
            options.onconfirm();
            $(popup).popup("close");
        });
    } else {
        $(document).on('tap', PrimeFaces.escapeClientId(popupId + "_open"), function(e) {
            e.preventDefault();
            $(popup).popup("close");
        });
    }
    
    var titleStyleClass = options.titleStyleClass ? options.titleStyleClass : 'dialog-title';
    var header = $("<div/>").attr({
        'data-role' : 'header',
        'class' : titleStyleClass
    }).append($('<h1/>').append(options.title));
    
    
    $(popup)
        .append(header)
        .append($('<div/>').attr({
            'data-role' : 'content',
            'data-theme' : 'd',
            'class' : 'ui-corner-bottom ui-content'
        })
            .append($('<p/>').append(options.message))
            .append(closebtn)
            .append(confirmbtn)
    );
    
    $(document).on("popupafterclose", PrimeFaces.escapeClientId(popupId), function() {
        $(this).remove();
    });				

    // Create the popup. Trigger "pagecreate" instead of "create" because currently the framework doesn't bind the enhancement of toolbars to the "create" event (js/widgets/page.sections.js).
    $.mobile.activePage.append( popup ).trigger( "pagecreate" );
    $(popup).popup("open");
    $(window).on('navigate.popup', function (e) {
        e.preventDefault();
        $(window).off('navigate.popup');
    });
}