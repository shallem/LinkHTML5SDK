(function($) {

    //==============
    // jQuery Plugin
    //==============

    $.widget('helix.editor', {

        // Define the defaults used for all new cleditor instances
        options: {
            controls:     // controls to add to the toolbar
            {
                styles: "bold italic underline strikethrough subscript superscript",
                font: "font size color highlight",
                formats: "bullets numbering", // | outdent indent | alignleft center alignright justify | rule",
                actions : "undo redo"
            }
            ,
            font:        // font names in the font popup
            "Arial,Arial Black,Comic Sans MS,Courier New,Narrow,Garamond," +
            "Georgia,Impact,Sans Serif,Serif,Tahoma,Trebuchet MS,Verdana",
            styles:       // styles in the style popup
            [["Paragraph", "<p>"], ["Header 1", "<h1>"], ["Header 2", "<h2>"],
            ["Header 3", "<h3>"],  ["Header 4","<h4>"],  ["Header 5","<h5>"],
            ["Header 6","<h6>"]],
            useCSS:       true, // use CSS to style HTML when possible (not supported in ie)
            docType:      // Document type contained within the editor
            //'<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">',
            '<!DOCTYPE html>',
            docCSSFile:   // CSS file used to style the document contained within the editor
            "",
            bodyStyle:    // style to assign to document body contained within the editor
            "font:10pt Arial,Verdana; cursor:text; overflow-y: scroll; overflow-x: hidden; word-wrap: break-word; margin: 0px;",
            // -webkit-transform: translate3d(0,0,0)
            tabIndex: -1,
            showFormat: false
        },

        _create: function() {
            var editor = this;

            // Init members.
            this._lastCreatedSpan = null;

            // Map whose keys are the current style.
            editor.name = $(this.element).attr('id');

            this.page = $(this.element).closest('div[data-role="page"]');

            // Create the main container and append the textarea
            var $parent = editor.$parent = this.element;

            var $main = editor.$main = $(this.SECTION_TAG)
                    .attr('class', this.MAIN_CLASS + ' hx-full-height hx-full-width hx-flex-vertical')
                    .css('overflow-y', 'hidden') /* Add this to prevent long text corpuses from bleeding out of the iFrame. */
                    .appendTo($parent);

            // Add the first group to the toolbar
            var $toolbar = editor.$toolbar = $(this.HEADER_TAG)
            .attr('class', 'ui-body-d ' + this.TOOLBAR_CLASS)
            .attr('data-role','controlgroup')
            .attr('data-type','horizontal');

            var doMini = 'false';
            if (Helix.deviceType !== "tablet") {
                doMini = 'true';
            }

            editor.menuPopups = {};
            editor.menuToolbar = {};
            editor.menus = {};

            this._createPopupMenu('style', 'Style', $parent, $toolbar, this.options.controls.styles, doMini);
            editor.$styleMenu = editor.menus['style'];

            // Add the font commands popup to the button bar
            this._createPopupMenu('font', 'Font', $parent, $toolbar, this.options.controls.font, doMini)
            editor.$fontMenu = editor.menus['font'];

            // Add the format commands popup to the button bar
            this._createPopupMenu('format', 'Format', $parent, $toolbar, this.options.controls.formats, doMini)
            editor.$formatMenu = editor.menus['format'];

            /* The action menu is "nice-to-have". Skip it on smaller screens. */
            this._createPopupMenu('action', 'Action', $parent, $toolbar, this.options.controls.actions, doMini)
            editor.$actionMenu = editor.menus['action'];

            /* Attach the toolbar to the enclosing div. */
            $toolbar.appendTo($main);

            /* Instantiate the menus. */
            var popupOptions = {
                beforeposition: function() {
                    //focus(editor);
                    if (editor.$toolbarEnabled) {
                        editor.popupOpen = true;
                    }
                },
                afterclose: function() {
                    if (editor.nextAction) {
                        focus(editor, function() {                    
                            editor.nextAction();
                            editor.nextAction = null;
                        });
                    } else {
                        if (editor.popupOpen && editor.$toolbarEnabled) {
                            focus(editor, function() {
                            });
                        }
                    }
                    editor.popupOpen = false;
                },
                history: false,
                theme: 'a'
            };

            for (var menuName in editor.menuPopups) {
                var $popup = editor.menuPopups[menuName];
                var $menu = editor.menus[menuName];
                var $button = editor.menuToolbar[menuName];
                if ($popup && $menu && $button) {
                    $menu.listview();
                    $button.button();
                    $popup.popup(popupOptions);

                    // Reduce text padding in the buttons to make them fit on smaller
                    // screens.
                    if (doMini) {
                        $button.find('.ui-btn-inner').css('padding-left', '10px');
                        $button.find('.ui-btn-inner').css('padding-right', '10px');                    
                    }
                }
            }
            $toolbar.controlgroup();
            $toolbar.find('a').css('width', '25%');

            // Create the editing frame - a content editable div.
            this.$editFrame = $(this.DIV_TAG)
                    .appendTo($main)
                    .attr('class', 'hx-flex-fill ui-editor-format hx-scroller-nozoom')
                    .attr('contentEditable', 'true');

            this._attachEditFrameEvents();
        },
        
        //==================
        // Private Variables
        //==================

        // Misc constants
        BUTTON : "button",
        BUTTON_NAME : "buttonName",
        BUTTON_VALUE : "buttonValue",
        CHANGE : "change",
        DISABLED: "disabled",
        DIV_TAG : "<div/>",
        SECTION_TAG : "<section/>",
        HEADER_TAG : "<header/>",
        A_TAG : "<a />",
        SPAN_TAG : "<span />",
        LI_TAG : "<li />",
        UL_TAG : "<ul />",

        // Class name constants
        MAIN_CLASS : "ui-editor ui-widget-content",    // main containing div
        TOOLBAR_CLASS : "ui-editor-toolbar",            // Editor toolbar
        PROMPT_CLASS : "ui-editor-prompt",  // prompt popup divs inside body
  
        // Captures the style changes.
        styleChanges : [],
  
        // Captures the current text style
        currentStyles : {},
  
        //==================
        // Private Functions
        //==================

        _attachEditFrameEvents: function() {
            var _self = this;
            var lastClick = null;
            $(document).on('mousedown touchstart', function(ev) {
                lastClick = ev.target;
            });
            $(this.$editFrame).on('keypress', function(ev) {
                var typed = String.fromCharCode(ev.keyCode);
                return true;
            });
            
            $(document).on('selectionchange', function() {
                if (window.getSelection().rangeCount > 0) {
                    _self._lastInputRange = window.getSelection().getRangeAt(0);
                }
            });
            
            $(this.$editFrame).on('input', function() {
                if (window.getSelection().rangeCount > 0) {
                    _self._lastInputRange = window.getSelection().getRangeAt(0);
                }
                if (_self.styleChanges.length) {
                    var newTextNode = null;
                    if (_self._lastInputRange && _self._lastInputRange.startContainer) {
                        newTextNode = _self._lastInputRange.startContainer.splitText(_self._lastInputRange.startContainer.length - 1);
                    }
                    
                    _self._executeStyleActions(newTextNode);
                    _self.styleChanges = [];
                }
            });
            
            $(this.$editFrame).on('blur', function() {
                // Make sure the last click was not on a toolbar element.
                if ($(lastClick).closest('.hx-editor-button').length) {
                    return;
                }
                
                _self.$toolbarEnabled = false;
                _self.popupOpen = false;
                for (var menuName in this.menuPopups) {
                    var editorName = '#' + menuName + "_" + this.name;
                    $(editorName).popup("close");
                }
                _self.$toolbar.find('a[data-role="button"]').addClass("ui-disabled");
            });

            $(this.$editFrame).on('focus', function() {
                _self.$toolbar.find('a[data-role="button"]').removeClass("ui-disabled");
                _self.$toolbarEnabled = true;
            });
        },
    
        _createPopupMenu: function(menuName, buttonText, $parent, $toolbar, menuOptions, doMini) {
            var editor = this;
            var $popup = this.menuPopups[menuName] = $(this.DIV_TAG)
                .attr({
                    'id' : menuName + "_" + editor.name
                }).appendTo($parent);

            var $menu = this.menus[menuName] = $(this.UL_TAG).attr({
                'data-role' : 'listview',
                'data-inset' : 'true',
                'data-theme' : 'c'
            }).appendTo($popup);
            $.each(menuOptions.split(" "), function(idx, buttonName) {
                editor._addButtonToMenu($menu, $popup, buttonName, menuName);
            });

            var $button = this.menuToolbar[menuName] = 
                    $(this.A_TAG)
                        .attr({
                            'href' : 'javascript:void(0)',
                            'data-role' : "button",
                            'data-theme' : "d",
                            'data-mini' : doMini,
                            'class' : 'ui-disabled hx-editor-button'
                        }).append(buttonText)
                        .appendTo($toolbar)
                        .on(Helix.clickEvent, function() {
                            $popup.popup("open", { positionTo: $button });
                            return false;
                        });
        },

        // Add a button to a popup menu.
        _addButtonToMenu: function(popupMenu, popupParent, buttonName, menuName) {
            var _self = this;
            if (buttonName === "") return;

            // Divider
            if (buttonName == "|") {
                // Add a new divider to the group
                $(this.LI_TAG)
                    .attr({
                        'data-role' : 'divider',
                        'data-theme' : 'b' 
                    })
                    .appendTo(popupMenu);
            }
            // Button
            else {
                var descriptor = [ menuName, buttonName ];
                
                // Special cases for commands with an associated dropdown or ancillary action.
                switch(buttonName) {
                    case 'color':
                    case 'highlight':
                        this._appendColorSpectrum(popupMenu, buttonName, menuName);
                        break;
                    case 'font':
                        this._appendFontSelection(popupMenu, buttonName, menuName);
                        break;
                    case 'size':
                        break;
                    default:
                        var linkName = this._capitalizeFirstLetter(buttonName);
                        descriptor.push(true)
                        $(this.LI_TAG)
                                .appendTo(popupMenu)
                                .append(linkName)
                                .on(Helix.clickEvent, null, descriptor, function(ev) {
                                    if (!_self._executeAction.apply(_self, ev.data)) {
                                        _self._queueStyleAction.apply(_self, ev.data);                                    
                                    }
                                    return false;
                        });
                        break;
                }
            }
        },
        
        _executeAction: function(menuName, action, actionArg) {
            switch(action) {
                case 'undo':
                case 'redo':
                    document.execCommand(action, false, null);
                    break;
                default:
                    return false;
            }
            this.menuPopups[menuName].popup('close');
            return true;
        },
        
        _queueStyleAction: function(menuName, action, actionArg) {
            this.menuPopups[menuName].popup('close');
            this.$editFrame.focus();
            this.styleChanges.push([action, actionArg]);
            if (!this._lastInputRange.collapsed) {
                // We are not changing the style at the caret. We are changing the style of an existing
                // text selection.
                this._executeStyleActions();
                this.styleChanges = [];
            } else {
                // Place the caret back where we found it ...
                this._setCaretPosition(this._lastInputRange);
            }
        },
        
        _appendFontSelection: function(popupMenu, buttonName, menuName) {
            var _self = this;
            var inputMarkup = $('<select />')
                    .attr('data-corners', 'false')
                    .appendTo(popupMenu);
            $.each(this.options.font.split(','), function() {
                $('<option />').attr({
                    'value': this
                }).append($('<span/>').css('font-family', this).append(this)).appendTo(inputMarkup);
            })
            inputMarkup.selectmenu();
            $(inputMarkup).change(function() {
                _self._queueStyleAction(menuName, 'font', $(this).find(':selected').attr('value'));
            });
        },
        
        _appendColorSpectrum: function($menu, buttonName, menuName) {
            var _self = this;
            var title = this._capitalizeFirstLetter(buttonName);
            $(this.DIV_TAG).attr({
                'class' : 'ui-color-picker',
                'style' : 'width: 100%;'
            }).appendTo($menu).append(title);
            var colorInput = $('<input/>').appendTo($menu)
                .attr({
                    'data-command' : buttonName
                })
                .spectrum({
                    color: 'black',
                    change: function(color) {
                        _self._queueStyleAction(menuName, buttonName, color.toHexString());
                    }
                });

            $(_self.$editFrame).on('blur', function() {
                colorInput.spectrum("hide");
            });
            var restoreColor = '#000000';
            if (buttonName === 'highlight') {
                restoreColor = '#FFFFFF';
            }

            $(this.A_TAG).attr({
                'href' : 'javascript:void(0);'
            })
            .append('Clear ' + this._capitalizeFirstLetter(buttonName))
            .appendTo($menu).buttonMarkup({
                mini: true,
                corners: false
            }).on(Helix.clickEvent, function(ev) {
                $('input[data-command="' + buttonName + '"]').spectrum("set", restoreColor);
                _self._executeAction(buttonName, restoreColor);
                _self.menuPopups[menuName].popup('close');
                return false;
            });
        },

        // clear - clears the contents of the editor
        clear: function() {
            this.$editFrame.empty();
        },
    
        update: function(val) {
            this.$editFrame.html(val);
        },

        // disable - enables or disables the editor
        disable: function(disabled) {
            // Update the textarea and save the state
            if (disabled) {
                this.$editFrame.attr(this.DISABLED, this.DISABLED);
                this.$editFrame.removeAttr('contentEditable');
                this.disabled = true;
            }
            else {
                this.$editFrame.removeAttr(this.DISABLED);
                this.$editFrame.attr('contentEditable', 'true');
                this.disabled = false;
            }
        },

        _applyStyle: function($newSpan, isCollapsed, styleName, cssName, cssValOn, cssValOff) {
            if (!isCollapsed) {
                // Apply to non-empty selected text. Should not influence the current state of bold/not.
                $newSpan.css(cssName, cssValOn);
            } else {
                if (this.currentStyles[styleName]) {
                    delete this.currentStyles[styleName];
                    $newSpan.css(cssName, cssValOff);
                } else {
                    this.currentStyles[styleName] = true;
                    $newSpan.css(cssName, cssValOn);
                }                            
            }
        },
        
        _executeStyleActions: function(txtToSurround) {
            var isCollapsed = this._lastInputRange.collapsed;
            var $newSpan = this._insertSpan(txtToSurround);
            for (var i = 0; i < this.styleChanges.length; ++i) {
                var actionName = this.styleChanges[i][0];
                var param = this.styleChanges[i][1];
                switch(actionName) {
                    case 'color':
                        $newSpan.css('color', param);
                        break;
                    case 'highlight':
                        $newSpan.css('background-color', param);                    
                        break;
                    case 'font':
                        $newSpan.css('font-family', param);                    
                        break;
                    case 'bold':
                        this._applyStyle($newSpan, isCollapsed, actionName, 'font-weight', 'bold', 'normal');
                        break;
                    case 'italic':
                        this._applyStyle($newSpan, isCollapsed, actionName, 'font-style', 'italic', 'normal');
                        break;
                    case 'strikethrough':
                        this._applyStyle($newSpan, isCollapsed, actionName, 'text-decoration', 'line-through', 'none');                    
                        break;
                    case 'underline':
                        this._applyStyle($newSpan, isCollapsed, actionName, 'text-decoration', 'underline', 'none');
                        break;
                    case 'subscript': 
                        $newSpan.append('<sub/>');
                        break;
                    case 'super':
                        $newSpan.append('<super/>');
                        break;
                    default:
                        break;
                }
            }
        },
        
        _setCaretPosition: function(range) {
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        },
        
        _selectElementContents: function(el) {
            var range = document.createRange();
            range.setStart(el, 1);
            range.collapse(true);

            this._setCaretPosition(range);
        },
        
        _insertSpan: function(txtToSurround) {
            var _self = this;
            var isCollapsed = _self._lastInputRange.collapsed;
            var newElement = document.createElement('span');
            this.$editFrame.focus();
            if(_self._lastInputRange) {
                if (!isCollapsed) {
                    _self._lastInputRange.surroundContents(newElement);
                    // Restore the caret position.
                    _self._setCaretPosition(_self._lastInputRange);
                } else {
                    // See if we are in another styling span. If so, add the new span after the old one.
                    // If not, just add the span to the range.
                    var $parentSpan = $(_self._lastInputRange.endContainer).closest('span');
                    if ($parentSpan.length) {
                        $(newElement).insertAfter($parentSpan);
                    } else {
                        _self._lastInputRange.insertNode(newElement);
                    }
                    if (txtToSurround !== undefined && txtToSurround !== null) {
                        $(newElement).append(txtToSurround);
                    }
                    _self._selectElementContents(newElement);
                }
            } else {
                _self.$editFrame.wrapInner($(newElement));
                _self._selectElementContents(newElement);
            }
            return $(newElement);
        },

        _capitalizeFirstLetter: function(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        },

        getHTML: function() {
            return '<html><body>' + this.$editFrame.html() + '</body></html>';
        }
    });
})(jQuery);