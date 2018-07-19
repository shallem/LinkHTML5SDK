(function ($) {

    //==============
    // jQuery Plugin
    //==============

    $.widget('helix.editor', {
        // Define the defaults used for all new cleditor instances
        options: {
            controls: // controls to add to the toolbar
                    {
                        styles: "bold italic underline strikethrough subscript superscript",
                        font: "font size color highlight",
                        formats: "bullets numbering", // | outdent indent | alignleft center alignright justify | rule",
                        actions: "undo redo"
                    }
            ,
            font: // font names in the font popup
                    "Select Font,Andale Mono,Arial,Arial Black,Calibri,Cambria,Comic Sans MS,Courier New," +
                    "Georgia,Impact,Trebuchet MS,Times New Roman,Verdana",
            tabIndex: -1,
            parentElement: null,
            defaultFont: 'Calibri',
            defaultFontSize: 11
        },
        _create: function () {
            var editor = this;

            // Init members.
            this._lastCreatedSpan = null;
            this._isDirty = false;

            // Map whose keys are the current style.
            editor.name = $(this.element).attr('id');

            this.page = $(this.element).closest('div[data-role="page"]');

            // Create the main container and append the textarea
            var $parent = editor.$parent = this.element;

            var $main = editor.$main = $(this.SECTION_TAG)
                    .attr('class', this.MAIN_CLASS + ' hx-full-height hx-full-width hx-flex-vertical')
                    .css('overflow-y', 'hidden') /* Add this to prevent long text corpuses from bleeding out of the iFrame. */
                    .appendTo($parent);

            if (this.options.parentElement) {
                /*var evName = 'hxLayoutDone.' + editor.name;
                $(this.page).off(evName).on(evName, this, function (ev) {
                    $(ev.data.$main).height($(ev.data.options.parentElement).height());
                });*/
            }

            // Add the first group to the toolbar
            var $toolbar = editor.$toolbar = $(this.HEADER_TAG)
                    .attr('class', 'ui-body-d ' + this.TOOLBAR_CLASS)
                    .attr('data-role', 'controlgroup')
                    .attr('data-type', 'horizontal');

            var doMini = 'false';
            if (Helix.deviceType !== "tablet") {
                doMini = 'true';
            }

            editor.menuPopups = {};
            editor.menuToolbar = {};
            editor.menus = {};
            editor.isFirstTyping = true;
            editor.$toolbarEnabled = true;

            this._createPopupMenu('style', 'hx-editor-style-button', $parent, $toolbar, this.options.controls.styles, doMini);
            editor.$styleMenu = editor.menus['style'];

            // Add the font commands popup to the button bar
            var defaultValues = {
                'font': this.options.defaultFont
            };
            this._createPopupMenu('font', 'hx-editor-font-button', $parent, $toolbar, this.options.controls.font, doMini, defaultValues);
            editor.$fontMenu = editor.menus['font'];

            // Add the format commands popup to the button bar
            this._createPopupMenu('format', 'hx-editor-lists-button', $parent, $toolbar, this.options.controls.formats, doMini);
            editor.$formatMenu = editor.menus['format'];

            /* The action menu is "nice-to-have". Skip it on smaller screens. */
            //this._createPopupMenu('action', 'Action', $parent, $toolbar, this.options.controls.actions, doMini);
            //editor.$actionMenu = editor.menus['action'];

            /* Attach the toolbar to the enclosing div. */
            $toolbar.appendTo($main);

            /* Instantiate the menus. */
            var popupOptions = {
                beforeposition: function () {
                    if (editor.$toolbarEnabled) {
                        editor.popupOpen = true;
                    }
                },
                afterclose: function () {
                    // Place the caret back where we found it ...
                    if (editor._lastInputRange) {
                        editor._setCaretPosition(editor._lastInputRange);
                    }
                    editor.popupOpen = false;
                },
                history: false,
                theme: 'c'
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

            // Create the editing frame - a content editable div.
            this.$editFrame = $(this.DIV_TAG)
                    .appendTo($main)
                    .attr('class', 'hx-flex-fill ui-editor-format hx-scroller-nozoom hx-no-hscroll ui-editor-default-style hx-editor')
                    .attr('contentEditable', 'true')
                    .attr('autocapitalize', 'sentences');
            this.setDefaultFont(this.options.defaultFont, this.options.defaultFontSize);

            this._attachEditFrameEvents();
        },
        //==================
        // Private Variables
        //==================

        // Misc constants
        BUTTON: "button",
        CHANGE: "change",
        DISABLED: "disabled",
        DIV_TAG: "<div/>",
        SECTION_TAG: "<section/>",
        HEADER_TAG: "<header/>",
        A_TAG: "<a />",
        SPAN_TAG: "<span />",
        LI_TAG: "<li />",
        UL_TAG: "<ul />",
        // Class name constants
        MAIN_CLASS: "ui-editor ui-widget-content", // main containing div
        TOOLBAR_CLASS: "ui-editor-toolbar", // Editor toolbar

        // Captures the style changes.
        styleChanges: [],
        // Captures the current text style
        currentStyles: {},
        //==================
        // Private Functions
        //==================

        _attachEditFrameEvents: function () {
            var lastClick = null;
            $(document).on('mousedown touchstart', function (ev) {
                lastClick = ev.target;
            });
            $(this.$editFrame).on('keypress', null, this, function (ev) {
                var typed = String.fromCharCode(ev.keyCode);
                return true;
            });

            $(document).on('selectionchange', null, this, function (ev) {
                var _self = ev.data;
                if (window.getSelection().rangeCount > 0) {
                    var _last = window.getSelection().getRangeAt(0);
                    if ($(_last.commonAncestorContainer).closest(Helix.Utils.escapeClientId(_self.name)).length) {
                        _self._lastInputRange = _last;
                    }
                }
            });

            $(this.$editFrame).on('input', null, this, function (ev) {
                var _self = ev.data;
                if (window.getSelection().rangeCount > 0) {
                    _self._lastInputRange = window.getSelection().getRangeAt(0);
                }
                if (_self.styleChanges.length) {
                    var newTextNode = null;
                    if (_self._lastInputRange && _self._lastInputRange.startContainer && _self._lastInputRange.startContainer.nodeType === Node.TEXT_NODE) {
                        newTextNode = _self._lastInputRange.startContainer.splitText(_self._lastInputRange.startContainer.length - 1);
                    }

                    _self._executeStyleActions(newTextNode);
                    _self.styleChanges = [];
                }
                _self._isDirty = true;
                $(this).trigger('change');
            });

            $(this.$editFrame).on('blur', null, this, function (ev) {
                var _self = ev.data;
                // Make sure the last click was not on a toolbar element.
                if ($(lastClick).closest('.hx-editor-button').length) {
                    return;
                }

                //_self.$toolbarEnabled = false;
                _self.popupOpen = false;
                for (var menuName in this.menuPopups) {
                    var editorName = '#' + menuName + "_" + this.name;
                    $(editorName).popup("close");
                }
                //_self.$toolbar.find('a[data-role="button"]').addClass("ui-disabled");
            });

            $(this.$editFrame).on('focus', null, this, function (ev) {
                var _self = ev.data;
                //_self.$toolbar.find('a[data-role="button"]').removeClass("ui-disabled");
                //_self.$toolbarEnabled = true;
                if (_self.isFirstTyping) {
                    // Capitalize the first letter.
                    _self.styleChanges.push(['firstcap', null]);
                    _self.isFirstTyping = false;
                }
                setTimeout(function () {
                    if (window.getSelection() && window.getSelection().focusNode) {
                        _self._lastInputNode = window.getSelection().focusNode;
                    }
                }, 1000);
            });
            
            $(this.$editFrame).on('paste', null, this, function(ev) {
                var _self = ev.data;
                $(_self.$editFrame).one('input', null, _self, function(_ev) {
                    var __self = _ev.data;
                    var re = /&lt;a href\=\"([^"]+)\"&gt;([^&]+)&lt;\/a[^&]*&gt;/g;
                    var contentDiv = __self.$editFrame;
                    var newHTML = contentDiv.html().replace(re, '<a href="$1">$2<\a>');
                    contentDiv.html(newHTML);
                });
            });
        },
        isDirty: function () {
            return this._isDirty;
        },
        eventMap: {
            'size': 'blur',
            'font': 'change',
            'color': null,
            'highlight': null
        },
        _createPopupMenu: function (menuName, buttonCSS, $parent, $toolbar, menuOptions, doMini, defaultValues) {
            var editor = this;
            if (!defaultValues) {
                defaultValues = {};
            }

            var $popup = this.menuPopups[menuName] = $(this.DIV_TAG)
                    .attr({
                        'id': menuName + "_" + editor.name,
                        'data-theme': 'a'
                    }).appendTo($parent);

            var $menu = this.menus[menuName] = $(this.UL_TAG).attr({
                'data-role': 'listview',
                'data-inset': 'true',
                'class': 'hx-editor-menu'
            }).appendTo($popup);
            var allMenuOptions = [];
            var _doMenuAction = function(_self, _nxt) {
                var args = _nxt.data('applyArgs');
                var fn = _nxt.data('apply');
                var finalArgs = args.slice(0);
                finalArgs.unshift(_self);
                fn.apply(_nxt, finalArgs);
            };
            
            $.each(menuOptions.split(" "), function (idx, buttonName) {
                var nxt = editor._addButtonToMenu($menu, $popup, buttonName, menuName, defaultValues[buttonName]);
                if (nxt.data('apply')) {
                    allMenuOptions.push(nxt);
                    var ev = editor.eventMap[buttonName];
                    if (ev === undefined) {
                        ev = Helix.clickEvent;
                    }
                    if (ev) {
                        nxt.on(ev, null, [ editor, nxt ], function(ev) {
                            var _self = ev.data[0];
                            var _nxt = ev.data[1];
                            _doMenuAction(_self, _nxt);
                            return false;
                        });
                    }
                }
            });
            var apply = editor._addButtonToMenu($menu, $popup, 'apply', menuName);
            apply.on(Helix.clickEvent, null, [ editor, allMenuOptions, $popup ], function(ev) {
                var _self = ev.data[0];
                var _allOpts = ev.data[1];
                var _popup = ev.data[2];
                
                for (var i = 0; i < _allOpts.length; ++i) {
                    var _nxt = _allOpts[i];
                    _doMenuAction(_self, _nxt);
                }
                _popup.popup('close');
                return false;
            });

            var $button = this.menuToolbar[menuName] =
                    $(this.A_TAG).attr({
                        'href': 'javascript:void(0)',
                        'class': 'ui-btn iconbutton hx-editor-icon-button'
                    }).append($('<div/>').addClass('hx-btn-inner')
                    .append($('<div/>').addClass('hx-icon ' + buttonCSS)))
                    .appendTo($toolbar)
                    .on(Helix.clickEvent, function () {
                        $popup.popup("open", {positionTo: $button});
                        return false;
                    });
                    
            $popup.on('popupafteropen', null, [this, apply], function(ev) {
                var _self = ev.data[0];
                var $apply = ev.data[1];
                
                if (_self._lastInputRange && !_self._lastInputRange.collapsed) {
                    // we have a selection. in this case, show the apply button.
                    $apply.show();
                } else {
                    $apply.hide();                    
                }                
            });
        },
        // Add a button to a popup menu.
        _addButtonToMenu: function (popupMenu, popupParent, buttonName, menuName, defaultValue) {
            if (buttonName === "")
                return null;

            // Divider
            if (buttonName === "|") {
                // Add a new divider to the group
                return $(this.LI_TAG)
                        .attr({
                            'data-role': 'divider',
                            'data-theme': 'b'
                        })
                        .appendTo(popupMenu);
            }
            // Button
            else {
                var descriptor = [menuName, buttonName];

                // Special cases for commands with an associated dropdown or ancillary action.
                switch (buttonName) {
                    case 'color':
                    case 'highlight':
                        return this._appendColorSpectrum(popupMenu, popupParent, buttonName, menuName);
                    case 'font':
                        return this._appendFontSelection(popupMenu, buttonName, menuName);
                    case 'size':
                        return this._appendFontSizeInput(popupMenu, buttonName, menuName);
                    case 'apply':
                        return $(this.LI_TAG)
                                .attr({
                                    'data-theme': 'c'
                                })
                                .appendTo(popupMenu)
                                .append('Apply');
                    default:
                        var linkName = this._capitalizeFirstLetter(buttonName);
                        descriptor.push(true)
                        return $(this.LI_TAG)
                                .appendTo(popupMenu)
                                .append(linkName)
                                .attr({
                                    'data-theme': 'c'
                                })
                                .data('apply', function(_self, descriptor) {
                                    if (!_self._executeAction.apply(_self, descriptor)) {
                                        descriptor.push(descriptor);
                                        _self._queueStyleAction.apply(_self, descriptor);
                                    }
                                    return false;                                    
                                })
                                .data('applyArgs', [ descriptor ]);
                }
            }
        },
        _executeAction: function (menuName, action, actionArg) {
            this.menuPopups[menuName].popup('close');
            switch (action) {
                case 'bullets':
                    this._appendList('<ul/>');
                    break;
                case 'numbering':
                    this._appendList('<ol/>');
                    break;
                default:
                    return false;
            }
            return true;
        },
        _appendList: function (listTag) {
            this.focus();

            var _list = $(listTag);    
            var $parent = this.$editFrame;
            var focusNode = window.getSelection().focusNode;
            if (focusNode) {
		var isCollapsed = window.getSelection().isCollapsed;
                if ($(focusNode).is('.hx-editor')) {
                    _list.prependTo($(focusNode));
                } else if (!isCollapsed || focusNode.nodeType === 3) {
                    _list.insertAfter($(focusNode));
                } else {
                    _list.prependTo($(focusNode));
		}
            } else {
		var isCollapsed = false;
                if (this._lastInputRange) {
                    $parent = $(this._lastInputRange.commonAncestorContainer);
		    isCollapsed = this._lastInputRange.collapsed;
                } else if (this._lastInputNode) {
                    $parent = $(this._lastInputNode);
                }

                if ($parent[0].nodeType === 3) {
                    _list.insertAfter($parent);
                } else if (!isCollapsed) {
                    _list.appendTo($parent);
                } else {
                    _list.prependTo($(focusNode));
                }
            }
            
            var _firstLI = $('<li/>').appendTo(_list);
            this._selectElementContents(_firstLI[0]);
        },
        _queueStyleAction: function (menuName, action, actionArg, target) {
            if (target) {
                $(target).toggleClass('ui-editor-style-selected');
            }
            if (menuName) {
                //this.menuPopups[menuName].popup('close');
            }
            this.styleChanges.push([action, actionArg]);
            if (this._lastInputRange && !this._lastInputRange.collapsed) {
                // We are not changing the style at the caret. We are changing the style of an existing
                // text selection.
                var newSpan = this._executeStyleActions();
                this.styleChanges = [];
                
                // Update the selection to now be the span we just created
                var selection = window.getSelection();
                var range = document.createRange();
                range.selectNodeContents(newSpan[0]);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        },
        _appendFontSelection: function (popupMenu, buttonName, menuName, defaultValue) {
            var _self = this;
            var inputMarkup = $('<select />')
                    .attr('data-corners', 'false')
                    .attr('data-mini', 'true')
                    .appendTo(popupMenu);
            $.each(this.options.font.split(','), function () {
                $('<option />').attr({
                    'value': this
                }).append($('<span/>').css('font-family', this).append(this)).appendTo(inputMarkup);
            })
            if (defaultValue) {
                inputMarkup.val(defaultValue);
            }
            inputMarkup.selectmenu();
            inputMarkup.data('apply', function(_self, _select) {
                var nxtFont = $(_select).find(':selected').attr('value');
                if (nxtFont === 'Select Font') {
                    return;
                }
                _self._queueStyleAction(menuName, 'font', nxtFont);                
            });
            inputMarkup.data('applyArgs', [ inputMarkup ]);
            return inputMarkup;
        },
        _appendFontSizeInput: function (popupMenu, buttonName, menuName) {
            var inputMarkup = $('<input />')
                    .attr('type', 'number')
                    .appendTo(popupMenu)
                    .val(this.options.defaultFontSize);
            $(inputMarkup).data('apply', function(_self, _input) {
                _self._queueStyleAction(null, 'size', $(_input).val());
            });
            $(inputMarkup).data('applyArgs', [ inputMarkup ]);
            return inputMarkup;
       },
        _appendColorSpectrum: function ($menu, popupParent, buttonName, menuName) {
            var _self = this;
            var title = this._capitalizeFirstLetter(buttonName);
            $(this.DIV_TAG).attr({
                'class': 'ui-color-picker',
                'style': 'width: 100%;'
            }).appendTo($menu).append(title);
            var colorInput = $('<input/>').appendTo($menu)
                    .attr({
                        'data-command': buttonName
                    })
                    .spectrum({
                        color: 'black',
                        change: function (color) {
                            _self._queueStyleAction(menuName, buttonName, color.toHexString());
                            $(this).spectrum('hide');
                        }
                    });
            colorInput.data('apply', function(_self, _spectrum) {
                var color = _spectrum.spectrum('get');
                _self._queueStyleAction(menuName, buttonName, color.toHexString());                
            });
            colorInput.data('applyArgs', [ colorInput ]);
                    
            // Add the clear button
            var restoreColor = '#000000';
            if (buttonName === 'highlight') {
                restoreColor = '#FFFFFF';
            }

            $(this.A_TAG).attr({
                'href': 'javascript:void(0);'
            })
                    .append('Clear ' + this._capitalizeFirstLetter(buttonName))
                    .appendTo($menu).buttonMarkup({
                mini: true,
                corners: false
            }).on(Helix.clickEvent, null, restoreColor, function (ev) {
                ev.stopImmediatePropagation();
                $('input[data-command="' + buttonName + '"]').spectrum("set", ev.data);
                _self._queueStyleAction(menuName, buttonName, ev.data);
                return false;
            });
            return colorInput;
        },
        // clear - clears the contents of the editor
        clear: function () {
            this.$editFrame.empty();
        },
        reset: function() {
            this.clear();
            
            // Reset all fonts, font sizes, and style settings
            this.currentStyles = {};
            this.styleChanges = [];
        },
        setDefaultFont: function(font, fontSize) {
            this.options.defaultFont = font;
            this.options.defaultFontSize = fontSize;
            if (this.options.defaultFont === 'Calibri') {
                this.$editFrame.addClass('ui-editor-default-font');
            } else {
                //this.$editFrame.css('font-family', this.options.defaultFont);
                if (this.$editFrame.children().size() > 0) {
                    this.$editFrame.children().wrap($('<div/>').css('font-family', this.options.defaultFont));
                } else {
                    this.styleChanges.push(['font', this.options.defaultFont]);
                }
            }
            if (fontSize  && !isNaN(fontSize)) {
                if (this.$editFrame.children().size() > 0) {
                    this.$editFrame.children().wrap($('<div/>').css('font-size', this.options.defaultFontSize + 'pt'));
                } else {
                    this.styleChanges.push(['size', this.options.defaultFontSize]);
                }
            }
        },
        update: function (val) {
            this.$editFrame.html(val);
            if (!val) {
                this.isFirstTyping = true;
            }

            // Repair. We cannot handle 'b' and 'i' tags
            this.$editFrame.find('b').each(function () {
                $(this).replaceWith($('<span/>').css('font-weight', 'bold').append(this.innerHTML));
            });
            this.$editFrame.find('i').each(function () {
                $(this).replaceWith($('<span/>').css('font-style', 'italic').append(this.innerHTML));
            });
        },
        focus: function () {
            this.$editFrame.focus();
        },
        // disable - enables or disables the editor
        disable: function (disabled) {
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
        _toggleStyle: function (styleName) {
            if (this.currentStyles[styleName]) {
                delete this.currentStyles[styleName];
            } else {
                this.currentStyles[styleName] = styleName;
            }
        },
        _applyStyle: function ($newSpan, isCollapsed, styleName, cssName, cssValOn, cssValOff) {
            $newSpan.find('span').css(cssName, ''); // Clear out any old values
            if (styleName in this.currentStyles) {
                $newSpan.css(cssName, cssValOn);
            } else {
                $newSpan.css(cssName, cssValOff);
            }
        },
        _executeStyleActions: function (txtToSurround) {
            var isCollapsed = this._lastInputRange.collapsed;
            var $newSpan = this._insertSpan(txtToSurround);
            var changedStyles = {};

            // Update the state of all toggle styles.
            for (var i = 0; i < this.styleChanges.length; ++i) {
                var actionName = this.styleChanges[i][0];
                var param = this.styleChanges[i][1];
                changedStyles[actionName] = true;
                switch (actionName) {
                    case 'bold':
                    case 'italic':
                    case 'strikethrough':
                    case 'underline':
                    case 'subscript':
                    case 'super':
                        this._toggleStyle(actionName);
                        break;
                    case 'firstcap':
                        if (txtToSurround) {
                            var capitalized = this._capitalizeFirstLetter(txtToSurround.wholeText);
                            txtToSurround.nodeValue = capitalized;
                            this._setCaretAtEndOfElement(txtToSurround, capitalized.length);
                        }
                        break;
                    default:
                        this.currentStyles[actionName] = param;
                        break;
                }
            }

            // Apply the appropriate style to the new span.
            for (var actionName in $.extend({}, this.currentStyles, changedStyles)) {
                var param = this.currentStyles[actionName];
                switch (actionName) {
                    case 'color':
                        $newSpan.find('span').css('color', '');
                        $newSpan.css('color', param);
                        break;
                    case 'highlight':
                        $newSpan.find('span').css('background-color', '');
                        $newSpan.css('background-color', param);
                        break;
                    case 'font':
                        $newSpan.find('span').css('font-family', '');
                        $newSpan.css('font-family', param);
                        break;
                    case 'size':
                        $newSpan.find('span').css('font-size', '');
                        $newSpan.css('font-size', param + 'pt');
                        break;
                    case 'bold':
                        $newSpan.find('span').css('font-weight', '');
                        this._applyStyle($newSpan, isCollapsed, actionName, 'font-weight', 'bold', 'normal');
                        break;
                    case 'italic':
                        $newSpan.find('span').css('font-style', '');
                        this._applyStyle($newSpan, isCollapsed, actionName, 'font-style', 'italic', 'normal');
                        break;
                    case 'strikethrough':
                        $newSpan.find('span').css('text-decoration', '');
                        this._applyStyle($newSpan, isCollapsed, actionName, 'text-decoration', 'line-through', 'none');
                        break;
                    case 'underline':
                        $newSpan.find('span').css('text-decoration', '');
                        this._applyStyle($newSpan, isCollapsed, actionName, 'text-decoration', 'underline', 'none');
                        break;
                    case 'subscript':
                        $('<sub/>').wrap($newSpan);
                        break;
                    case 'super':
                        $('<super/>').wrap($newSpan);
                        break;
                    default:
                        break;
                }
            }
            return $newSpan;
        },
        _setCaretAtEndOfElement: function (elem, pos) {
            var range = document.createRange();
            var sel = window.getSelection();
            range.setStart(elem, pos);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
        },
        _setCaretPosition: function (range) {
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        },
        _selectElementContents: function (el) {
            var range = document.createRange();

            if (el.nodeType === 3) {
                // Text node.
                range.setStart(el, 1);
            } else {
                range.selectNodeContents(el);
            }
            range.collapse(true);

            this._setCaretPosition(range);
        },
        _insertSpan: function (txtToSurround) {
            var _self = this;
            if (_self._lastInputRange) {
                var isCollapsed = _self._lastInputRange.collapsed;
                if (!isCollapsed) {
                    // https://developer.mozilla.org/en-US/docs/Web/API/Range/surroundContents
                    // See comment at the top of the link above as to why this method is better than
                    // surroundContents
                    var allNewElements = [];
                    //var frag = _self._lastInputRange.extractContents();
                    var walker = document.createTreeWalker(_self._lastInputRange.commonAncestorContainer, NodeFilter.SHOW_TEXT, null, false);
                    var textNode = walker.currentNode;
                    var doWrap = false;
                    var toWrap = [];
                    while(textNode) {
                        if (!doWrap && textNode === _self._lastInputRange.startContainer) {
                            doWrap = true;
                        }
                        if (!doWrap || !textNode.nodeValue || textNode.nodeValue.trim().length === 0) {
                            // White space
                            textNode = walker.nextNode();                        
                            continue;
                        }
                        
                        toWrap.push(textNode);
                        
                        if (textNode === _self._lastInputRange.endContainer) {
                            break;
                        }
                        textNode = walker.nextNode();
                    }
                    for (var i = 0; i < toWrap.length; ++i) {
                        var nxt = toWrap[i];
                        var newElement = document.createElement('span');
                        var oldParent = nxt.parentNode;
                        var _new = nxt;
                        if (i === 0 && _self._lastInputRange.startOffset > 0) {
                            _new = nxt.cloneNode();
                            _new.nodeValue = nxt.nodeValue.substring(_self._lastInputRange.startOffset);
                            nxt.nodeValue = nxt.nodeValue.substring(0, _self._lastInputRange.startOffset);
                            if (nxt.nextSibling) {
                                nxt = nxt.nextSibling;
                            } else {
                                newElement = oldParent.appendChild(newElement);
                                newElement.appendChild(_new);
                                allNewElements.push(newElement);
                                continue;
                            }
                        } else if (i === toWrap.length - 1 && _self._lastInputRange.endOffset < nxt.nodeValue.length) {
                            _new = nxt.cloneNode();
                            _new.nodeValue = nxt.nodeValue.substring(0, _self._lastInputRange.endOffset);
                            nxt.nodeValue = nxt.nodeValue.substring(_self._lastInputRange.endOffset);
                        }
                        newElement = oldParent.insertBefore(newElement, nxt);
                        newElement.appendChild(_new);
                        allNewElements.push(newElement);
                        /*newElement.appendChild(textNode);
                        if (oldParent.nextSibling) {
                            newElement = oldParent.parentNode.insertBefore(newElement, oldParent.nextSibling);
                        } else {
                            newElement = oldParent.parentNode.appendChild(newElement);
                        }*/
                        
                    }
                    
                    //_self._lastInputRange.insertNode(newElement)

                    //_self._lastInputRange.surroundContents(newElement);
                    // Restore the caret position.
                    _self._setCaretPosition(_self._lastInputRange);
                    return $(allNewElements);
                } else {
                    var newElement = document.createElement('span');
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
                        _self._selectElementContents(newElement.childNodes[0]);
                    } else {
                        _self._selectElementContents(newElement);
                    }
                    return $(newElement);
                }
            } else {
                var newElement = document.createElement('span');
                _self.$editFrame.wrapInner($(newElement));
                _self._selectElementContents(newElement);
                return $(newElement);
            }
        },
        _capitalizeFirstLetter: function (string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        },
        getHTML: function () {
            return '<html><body>' + this.$editFrame.html() + '</body></html>';
        },
        blur: function () {
            $(this.$editFrame).blur();
        }
    });
})(jQuery);
