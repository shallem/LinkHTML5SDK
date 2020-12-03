(function ($) {

    //==============
    // jQuery Plugin
    //==============

    $.widget('helix.editor', {
        // Define the defaults used for all new cleditor instances
        options: {
            defaultFont: 'Calibri',
            defaultFontSize: 11,
            placeholderText: 'Compose a rich text document',
            extraButtons: [],
            extraButtonsPhone: null,
            editorReady: null,
            tabIndex: 0,
            onSelectionChange: null,
            onContentChange: null
        },
        pendingActions: [],
        initDone: false,
        _create: function () {            
            this._isDirty = false;
            this._initialVal = '';
            var _extraButtons = this.options.extraButtons;
            if (Helix.deviceType === 'phone' && this.options.extraButtonsPhone) {
                _extraButtons = this.options.extraButtonsPhone;
            }
            var _self = this;
            var e = this.editor = new FroalaEditor('#' + this.element.attr('id'), {
                toolbarSticky: false,
                htmlUntouched: true,
                events: {
                    'contentChanged': function () {
                      // Do something here.
                      // this is the editor instance.
                      _self._isDirty = true;
                      if (_self.options.onContentChange) {
                          _self.options.onContentChange.call(_self);
                      }
                    },
                    'keydown': function(ev) {
                        var key = ev.keyCode || ev.which || ev.charCode;
                        if (key === 8 || (ev.originalEvent && ev.originalEvent.inputType === 'deleteContentBackward')) {
                            /*var sel = window.getSelection();
                            if (sel.isCollapsed &&
                                    sel.anchorNode.classList &&
                                    sel.anchorNode.classList.contains('hx-editor-start') &&
                                    sel.anchorOffset === 0) {
                                ev.stopImmediatePropagation();
                                return false;
                            }
                            if (sel.isCollapsed &&
                                    sel.anchorNode.nodeType === 3 &&
                                    sel.anchorNode.textContent.length === 1 &&
                                    sel.anchorNode.textContent.charCodeAt(1) === 8203) {
                                /sel.anchorNode.remove();
                            }*/
                        } else if (typeof key === 'number') {
                            var isHandled = false;
                            switch(key) {
                                case 39:
                                    // Right arrow.
                                    isHandled = true;
                                    _self._setCaretPosition(1);
                                    break;
                                case 37:
                                    // Left arrow.
                                    isHandled = true;
                                    _self._setCaretPosition(-1);
                                    break;
                                case 38:
                                    // Up arrow
                                    isHandled = true;
                                    _self._setCaretPosition(-_self._getArrowDownUpOffset());
                                    break;
                                case 40:
                                    _self._setCaretPosition(_self._getArrowDownUpOffset());
                                    isHandled = true;
                                    break;
                            }
                            if (isHandled === true) {
                                ev.stopImmediatePropagation();
                                return false;
                            }
                        }
                    }
                },
                tabIndex: _self.options.tabIndex,
                placeholderText: _self.options.placeholderText,
                fontFamilyDefaultSelection: _self.options.defaultFont,
                fontFamilySelection: true,
                fontSizeSelection: true,
                fontSizeDefaultSelection: _self.options.defaultFontSize.toString(),
                fontSizeUnit: 'pt',
                fontFamily: {
                    'Arial,Helvetica,sans-serif': 'Arial',
                    'Calibri,sans-serif': 'Calibri',
                    'Cambria,serif': 'Cambria',
                    'Courier New': 'Courier',
                    'Georgia,serif': 'Georgia',
                    'Impact,Charcoal,sans-serif': 'Impact',
                    'Tahoma,Geneva,sans-serif': 'Tahoma',
                    "'Times New Roman',Times,serif": 'Times New Roman',
                    'Trebuchet MS': 'Trebuchet',
                    'Verdana,Geneva,sans-serif': 'Verdana'
                },
                toolbarButtonsXS: {
                    'moreText': {
                        'buttons': ['bold', 'italic', 'underline', 'strikeThrough', 'subscript', 'superscript', 'fontFamily', 'fontSize', 'textColor', 'backgroundColor', 'clearFormatting'], // 'inlineClass', 'inlineStyle', 
                        'buttonsVisible': 0
                    },
                    'moreParagraph': {
                        'buttons': ['alignLeft', 'alignCenter', 'formatOLSimple', 'alignRight', 'alignJustify', 'formatOL', 'formatUL', 'paragraphFormat', 'paragraphStyle', 'lineHeight', 'outdent', 'indent', 'quote'],
                        'buttonsVisible': 0
                    },
                    'moreRich': {
                        'buttons': ['insertLink', 'insertTable', 'fontAwesome', 'specialCharacters', 'insertHR'], // 'insertImage', 'insertVideo', 'embedly', 'insertFile', 'emoticons', 
                        'buttonsVisible': 0
                    },
                    'moreMisc': {
                      'buttons': ['undo' ], // 'fullscreen', 'print', 'getPDF', 'html', 'help', 'spellChecker', 'selectAll'
                      'buttonsVisible': 1
                    },
                    'extraButtons': {
                        'buttons' : _extraButtons,
                        'buttonsVisible': _extraButtons.length,
                        'align': 'right'
                    }
                },
                toolbarButtons: {
                    'moreText': {
                        'buttons': ['bold', 'italic', 'underline', 'strikeThrough', 'subscript', 'superscript', 'fontFamily', 'fontSize', 'textColor', 'backgroundColor', 'clearFormatting'], // 'inlineClass', 'inlineStyle', 
                        'buttonsVisible': 0
                    },
                    'moreParagraph': {
                        'buttons': ['alignLeft', 'alignCenter', 'formatOLSimple', 'alignRight', 'alignJustify', 'formatOL', 'formatUL', 'paragraphFormat', 'paragraphStyle', 'lineHeight', 'outdent', 'indent', 'quote'],
                        'buttonsVisible': 0
                    },
                    'moreRich': {
                        'buttons': ['insertLink', 'insertTable', 'fontAwesome', 'specialCharacters', 'insertHR'], // 'insertImage', 'insertVideo', 'embedly', 'insertFile', 'emoticons', 
                        'buttonsVisible': 0
                    },
                    'moreMisc': {
                      'buttons': ['undo', 'redo', 'selectAll' ], // 'fullscreen', 'print', 'getPDF', 'html', 'help', 'spellChecker', 'selectAll'
                      'buttonsVisible': 3
                    },
                    'extraButtons': {
                        'buttons' : _self.options.extraButtons,
                        'buttonsVisible': _self.options.extraButtons.length,
                        'align': 'right'
                    }
                },
                quickInsertEnabled: false,
                colorsHEXInput: false,
                tableResizerOffset: 10,
                tableResizingLimit: 50,
                heightMin: 200,
                key: '4NC5fE4G5A3A3D3B3B-16UJHAEFZMUJOYGYQEa2d2ZJd1RAeF3C8B5A4E3C3A2G3A15A12=='
            }, function() {
                _self.initDone = true;
                e.html.set(_self._initialVal);
                _self.element.find('.fr-toolbar').addClass('hx-form-border-none');
                _self.element.find('.second-toolbar').addClass('hx-form-hidden');
                _self.element.find('.fr-view').css('font-family', _self.options.defaultFont)
                        .css('font-size', _self.options.defaultFontSize + e.opts.fontSizeUnit);
                for (var i = 0; i < _self.pendingActions.length; ++i) {
                    var _fn = _self.pendingActions[i];
                    _fn.call(_self);
                }
                if (_self.options.editorReady) {
                    _self.options.editorReady.call(_self);
                }
                
                document.addEventListener('selectionchange', $.proxy(function(ev) {
                    var sel = window.getSelection();
                    if (sel) {
                        if (sel.isCollapsed) {
                            // No selection.
                            this.getContentParent()[0].classList.remove('hx-callout-offset');
                        } else {
                            var p = sel.anchorNode.parentElement;
                            while (p) {
                                if (p.tagName && (p.tagName.toLowerCase() === 'p' || p.tagName.toLowerCase() === 'div')) {
                                    break;
                                }
                                p = p.parentElement;
                            }
                            if (p && p.offsetTop < 50) {
                                this.getContentParent()[0].classList.add('hx-callout-offset');
                            }
                        }
                    }
                    if (this.options.onSelectionChange) {
                        this.options.onSelectionChange.call(this, ev);
                    }
                }, _self));
                
                /* After pasting, try to restore the selection point to where it was before. */
                $(_self.getFrame()).on('paste', null, _self, function(ev) {
                    var _self = ev.data;
                    var sel = window.getSelection();
                    var newRange = document.createRange();
                    newRange.setStart(sel.anchorNode, sel.anchorOffset);
                    newRange.collapse(true);
                    $(_self.getFrame()).one('input', null, _self, function(_ev) {
                        sel.removeAllRanges();
                        sel.addRange(newRange);
                    });
                });
                
                /* Make the content editable body scroll. */
                if (_self.options.isScroller === true) {
                    _self.element.addClass('hx-flex-vertical hx-full-height');
                    _self.element.find('.fr-wrapper').addClass('hx-flex-fill hx-scroller-nozoom');
                }
            });
        },
        isDirty: function () {
            return this._isDirty;
        },
        runOnReady: function(fn) {
            if (this.initDone === true) {
                fn.call(this);
            } else {
                this.pendingActions.push(fn);
            }
        },
        // clear - clears the contents of the editor
        clear: function () {
            if (!this.editor.html) {
                this._initialVal = '';
                return;
            }
            this.editor.html.set('');
        },
        reset: function() {
            this.clear();
            if (this.editor.popups) {
                this.editor.popups.hideAll();
            }
        },
        setDefaultFont: function(font, fontSize) {
            this.options.defaultFont = font;
            this.options.defaultFontSize = fontSize;
        },
        update: function (val, appendP) {
            if (!val || appendP === true) {
                val = '<p class="hx-editor-start"></p>';
            }

            if (!this.editor.html) {
                this._initialVal = val;
                return;
            }
            
            this.editor.html.set(val);
            if (this.editor.core.hasFocus()) {
                this.focus();
            }
        },
        focus: function () {
            if (!this.initDone) {
                this.pendingActions.push($.proxy(function() {
                   this.editor.events.focus();
                }, this));
                return;
            }
            this.editor.events.focus();
        },
        // disable - enables or disables the editor
        disable: function (disabled) {
        },
        getHTML: function () {
            var clonedHTML = this.getContentClone();
            return clonedHTML.documentElement.outerHTML;
        },
        blur: function () {
            if (!this.initDone) {
                this.pendingActions.push($.proxy(function() {
                    this.getContentParent().blur();
                }, this));
                return;
            }
            this.getContentParent().blur();
        },
        getFrame: function() {
            return this.element;
        },
        getContentParent: function() {
            return this.getFrame().find('.fr-view');
        },
        flattenStyles: function(elem) {
            this._flattenStyles(elem[0]);
        },
        _flattenStyles: function(elem) {
            if (!elem) {
                return;
            }
            if (!elem.style) {
                return;
            }
            if (elem.tagName.toLowerCase() === 'br') {
                return;
            }
            
            var s = getComputedStyle(elem);
            if (!s) {
                return;
            }
           
            for (var k in s) {
                var prop = k.replace(/\-([a-z])/g, function(v) {
                    v[1].toUpperCase();
                });
                if (prop.indexOf('font') === 0 ||
                        prop.indexOf('border') === 0 ||
                        prop.indexOf('margin') === 0) {
                    elem.style[prop] = s[k];
                }
            }
            
            if (elem.children) {
                for (var i = 0; i < elem.children.length; ++i) {
                    this._flattenStyles(elem.children[i]);
                }
            }
        },
        getContentClone: function() {
            var contentParent = this.getContentParent()[0].cloneNode(true);
            contentParent.style.minHeight = '';
            
            var outerHTML = document.implementation.createHTMLDocument();
            var css = document.createElement('style');
            css.type = 'text/css';
            css.innerHTML = FROALA_HTML_STYLES;
            
            var wrapperDiv = document.createElement('div');
            wrapperDiv.classList.add('fr-view');
            while (contentParent.hasChildNodes()) {
                wrapperDiv.appendChild(contentParent.removeChild(contentParent.firstChild));
            }
            outerHTML.body.appendChild(wrapperDiv);
            outerHTML.getElementsByTagName('head')[0].appendChild(css);
            return outerHTML;
        },
        refreshButtons: function() {
            if (this.initDone !== true) {
                this.pendingActions.push($.proxy(function() {
                    this.refreshButtons();
                }, this));
                return;
            }
            this.editor.button.bulkRefresh();
        },
        _setCaretAtStartOfElement: function (elem, pos) {
            var range = document.createRange();
            var sel = window.getSelection();
            range.setStart(elem, 0);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
        },
        _setCaretPosition: function (delta) {
            var containerNode = this.editor.el;
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
                        } else {
                            delta -= (anchorNode.length - sel.anchorOffset);
                        }
                    } else {
                        if (sel.anchorOffset + delta >= 0) {
                            newRange = document.createRange();
                            newRange.setStart(sel.anchorNode, sel.anchorOffset + delta);
                        } else {
                            delta += sel.anchorOffset;
                        }
                    }
                    if (newRange !== null) {
                        newRange.collapse(true);
                        sel.removeAllRanges();
                        sel.addRange(newRange);
                        return;
                    }
                }
                if (newRange === null) {
                    var nxtEL = null;
                    var offset = 0;
                    var _doBreak = false;
                    var _inLI = false;
                    var _sawBR = false;
                        
                    if (delta > 0) {
                        var _start = sel.anchorNode;
                        while (delta > 0 && _start && _doBreak !== true) {
                            do {
                                nxtEL = _start.nextSibling;
                                if (nxtEL === null) {
                                    _start = _start.parentNode;
                                } else if (this._elIsButton(nxtEL) || this._elIsEmptyText(nxtEL)) {
                                    _start = nxtEL; // Skip over nxtEL.
                                } else {
                                    break;
                                }
                            } while(_start !== containerNode);
                            if (nxtEL && nxtEL.tagName) {
                                switch (nxtEL.tagName.toLowerCase()) {
                                    case 'p':
                                    case 'td':
                                    case 'div':
                                        // Don't keep iterating.
                                        _doBreak = true;
                                        break;
                                    case 'br':
                                        _sawBR = true;
                                        break;
                                    case 'li':
                                    case 'tr':
                                        _inLI = true;
                                        break;
                                }
                            }
                            while (nxtEL && nxtEL.childNodes && nxtEL.childNodes.length > 0) {
                                nxtEL = nxtEL.childNodes[0];
                                if (nxtEL && nxtEL.tagName && nxtEL.tagName.toLowerCase() === 'li') {
                                    _inLI = true;
                                }
                            }
                            if (nxtEL && nxtEL.nodeType === 3) {
                                if (_inLI) {
                                    offset = 0;
                                    delta = 0;
                                } else {
                                    offset = Math.min(delta, nxtEL.length);
                                    delta -= nxtEL.length;
                                }
                                if (_sawBR === true) {
                                    break;
                                }
                            }
                            _start = nxtEL;
                        }
                    } else {
                        var _start = sel.anchorNode;
                        while (delta < 0 && _start && _doBreak !== true) {
                            do {
                                nxtEL = _start.previousSibling;
                                if (nxtEL === null) {
                                    _start = _start.parentNode;
                                } else if (this._elIsButton(nxtEL) || this._elIsEmptyText(nxtEL)) {
                                    _start = nxtEL; // Skip over nxtEL.
                                } else {
                                    break;
                                }
                            } while(_start !== containerNode);
                            if (nxtEL && nxtEL.tagName) {
                                switch (nxtEL.tagName.toLowerCase()) {
                                    case 'p':
                                    case 'td':
                                    case 'div':
                                        // Don't keep iterating.
                                        _doBreak = true;
                                        break;
                                    case 'br':
                                        _sawBR = true;
                                        break;
                                    case 'li':
                                    case 'tr':
                                        _inLI = true;
                                        break;
                                }
                            }
                            while (nxtEL && nxtEL.childNodes && nxtEL.childNodes.length > 0) {
                                nxtEL = nxtEL.childNodes[nxtEL.childNodes.length - 1];
                                if (nxtEL && nxtEL.tagName && nxtEL.tagName.toLowerCase() === 'li') {
                                    _inLI = true;
                                }
                            }
                            if (nxtEL && nxtEL.nodeType === 3) {
                                if (_inLI) {
                                    offset = nxtEL.length;
                                    delta = 0;
                                } else {
                                    offset = Math.max(0, nxtEL.length + delta);
                                    delta += nxtEL.length;
                                }
                                if (_sawBR === true) {
                                    break;
                                }
                            }
                            _start = nxtEL;
                        }
                    }
                    if (nxtEL !== null) {
                        newRange = document.createRange();
                        if (nxtEL.nodeType !== 3) {
                            newRange.setStart(nxtEL, 0);    
                        } else {
                            newRange.setStart(nxtEL, offset);
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
        },
        _getLastChild: function(node) {
            if (!node.childNodes || node.childNodes.length === 0) {
                return node;
            }
            return this._getLastChild(node.childNodes[node.childNodes.length - 1]);
        },
        _elIsButton: function(el) {
            if (el && el.classList && el.classList.contains('iconbutton')) {
                return true;
            }
            if (el && el.tagName && el.tagName.toLowerCase() === 'a') {
                return true;
            }
            return false;
        },
        _elIsEmptyText: function(el) {
            if  (el.nodeType === 3 &&
                    (el.textContent.length === 0 ||
                        (el.textContent.length === 1 &&
                            el.textContent.charCodeAt(1) === 8203))) {
                return true;
            }
            if (el.tagName.toLowerCase() === 'p' ||
                    el.tagName.toLowerCase() === 'span') {
                if (!el.childNodes || el.childNodes.length === 0) {
                    return true;
                }
            }
 
            return false;
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
        _getArrowDownUpOffset: function(el) {
            if (!el) {
                var sel = window.getSelection();
                if (sel) {
                    var a = sel.anchorNode;
                    if (a) {
                        el = a.parentElement;
                    }
                }
                if (!el) {
                    return 0;
                }
            }
            if (!this._canvas) {
                this._canvas = document.createElement('canvas');
            }
            var context = this._canvas.getContext('2d');
            var curFont = window.getComputedStyle(el, null).getPropertyValue('font');
            context.font = curFont;
            var metrics = context.measureText('helo');
            return this.editor.el.clientWidth / (metrics.width / 4);
        }
    });

    /* https://www.fileformat.info/info/unicode/char/1f4ce/index.htm */
    var FROALA_HTML_STYLES = 
            '.clearfix::after{clear:both;display:block;content:"";height:0}.hide-by-clipping{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0, 0, 0, 0);border:0}img.fr-rounded,.fr-img-caption.fr-rounded img{border-radius:10px;-moz-border-radius:10px;-webkit-border-radius:10px;-moz-background-clip:padding;-webkit-background-clip:padding-box;background-clip:padding-box}img.fr-bordered,.fr-img-caption.fr-bordered img{border:solid 5px #CCC}img.fr-bordered{-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box}.fr-img-caption.fr-bordered img{-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box}.fr-view{word-wrap:break-word}.fr-view span[style~="color:"] a{color:inherit}.fr-view strong{font-weight:700}.fr-view table{border:none;border-collapse:collapse;empty-cells:show;max-width:100%}.fr-view table td{min-width:5px}.fr-view table.fr-dashed-borders td,.fr-view table.fr-dashed-borders th{border-style:dashed}.fr-view table.fr-alternate-rows tbody tr:nth-child(2n){background:whitesmoke}.fr-view table td,.fr-view table th{border:1px solid #DDD}.fr-view table td:empty,.fr-view table th:empty{height:20px}.fr-view table td.fr-highlighted,.fr-view table th.fr-highlighted{border:1px double red}.fr-view table td.fr-thick,.fr-view table th.fr-thick{border-width:2px}.fr-view table th{background:#ececec}.fr-view hr{clear:both;user-select:none;-o-user-select:none;-moz-user-select:none;-khtml-user-select:none;-webkit-user-select:none;-ms-user-select:none;break-after:always;page-break-after:always}.fr-view .fr-file{position:relative}.fr-view .fr-file::after{position:relative;content:"&#128206;";font-weight:normal}.fr-view pre{white-space:pre-wrap;word-wrap:break-word;overflow:visible}.fr-view[dir="rtl"] blockquote{border-left:none;border-right:solid 2px #5E35B1;margin-right:0;padding-right:5px;padding-left:0}.fr-view[dir="rtl"] blockquote blockquote{border-color:#00BCD4}.fr-view[dir="rtl"] blockquote blockquote blockquote{border-color:#43A047}.fr-view blockquote{border-left:solid 2px #5E35B1;margin-left:0;padding-left:5px;color:#5E35B1}.fr-view blockquote blockquote{border-color:#00BCD4;color:#00BCD4}.fr-view blockquote blockquote blockquote{border-color:#43A047;color:#43A047}.fr-view span.fr-emoticon{font-weight:normal;font-family:"Apple Color Emoji","Segoe UI Emoji","NotoColorEmoji","Segoe UI Symbol","Android Emoji","EmojiSymbols";display:inline;line-height:0}.fr-view span.fr-emoticon.fr-emoticon-img{background-repeat:no-repeat !important;font-size:inherit;height:1em;width:1em;min-height:20px;min-width:20px;display:inline-block;margin:-.1em .1em .1em;line-height:1;vertical-align:middle}.fr-view .fr-text-gray{color:#AAA !important}.fr-view .fr-text-bordered{border-top:solid 1px #222;border-bottom:solid 1px #222;padding:10px 0}.fr-view .fr-text-spaced{letter-spacing:1px}.fr-view .fr-text-uppercase{text-transform:uppercase}.fr-view .fr-class-highlighted{background-color:#ffff00}.fr-view .fr-class-code{border-color:#cccccc;border-radius:2px;-moz-border-radius:2px;-webkit-border-radius:2px;-moz-background-clip:padding;-webkit-background-clip:padding-box;background-clip:padding-box;background:#f5f5f5;padding:10px;font-family:"Courier New", Courier, monospace}.fr-view .fr-class-transparency{opacity:0.5}.fr-view img{position:relative;max-width:100%}.fr-view img.fr-dib{margin:5px auto;display:block;float:none;vertical-align:top}.fr-view img.fr-dib.fr-fil{margin-left:0;text-align:left}.fr-view img.fr-dib.fr-fir{margin-right:0;text-align:right}.fr-view img.fr-dii{display:inline-block;float:none;vertical-align:bottom;margin-left:5px;margin-right:5px;max-width:calc(100% - (2 * 5px))}.fr-view img.fr-dii.fr-fil{float:left;margin:5px 5px 5px 0;max-width:calc(100% - 5px)}.fr-view img.fr-dii.fr-fir{float:right;margin:5px 0 5px 5px;max-width:calc(100% - 5px)}.fr-view span.fr-img-caption{position:relative;max-width:100%}.fr-view span.fr-img-caption.fr-dib{margin:5px auto;display:block;float:none;vertical-align:top}.fr-view span.fr-img-caption.fr-dib.fr-fil{margin-left:0;text-align:left}.fr-view span.fr-img-caption.fr-dib.fr-fir{margin-right:0;text-align:right}.fr-view span.fr-img-caption.fr-dii{display:inline-block;float:none;vertical-align:bottom;margin-left:5px;margin-right:5px;max-width:calc(100% - (2 * 5px))}.fr-view span.fr-img-caption.fr-dii.fr-fil{float:left;margin:5px 5px 5px 0;max-width:calc(100% - 5px)}.fr-view span.fr-img-caption.fr-dii.fr-fir{float:right;margin:5px 0 5px 5px;max-width:calc(100% - 5px)}.fr-view .fr-video{text-align:center;position:relative}.fr-view .fr-video.fr-rv{padding-bottom:56.25%;padding-top:30px;height:0;overflow:hidden}.fr-view .fr-video.fr-rv>iframe,.fr-view .fr-video.fr-rv object,.fr-view .fr-video.fr-rv embed{position:absolute !important;top:0;left:0;width:100%;height:100%}.fr-view .fr-video>*{-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;max-width:100%;border:none}.fr-view .fr-video.fr-dvb{display:block;clear:both}.fr-view .fr-video.fr-dvb.fr-fvl{text-align:left}.fr-view .fr-video.fr-dvb.fr-fvr{text-align:right}.fr-view .fr-video.fr-dvi{display:inline-block}.fr-view .fr-video.fr-dvi.fr-fvl{float:left}.fr-view .fr-video.fr-dvi.fr-fvr{float:right}.fr-view a.fr-strong{font-weight:700}.fr-view a.fr-green{color:green}.fr-view .fr-img-caption{text-align:center}.fr-view .fr-img-caption .fr-img-wrap{padding:0;margin:auto;text-align:center;width:100%}.fr-view .fr-img-caption .fr-img-wrap img{display:block;margin:auto;width:100%}.fr-view .fr-img-caption .fr-img-wrap>span{margin:auto;display:block;padding:5px 5px 10px;font-size:14px;font-weight:initial;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;-webkit-opacity:0.9;-moz-opacity:0.9;opacity:0.9;-ms-filter:"progid:DXImageTransform.Microsoft.Alpha(Opacity=0)";width:100%;text-align:center}.fr-view button.fr-rounded,.fr-view input.fr-rounded,.fr-view textarea.fr-rounded{border-radius:10px;-moz-border-radius:10px;-webkit-border-radius:10px;-moz-background-clip:padding;-webkit-background-clip:padding-box;background-clip:padding-box}.fr-view button.fr-large,.fr-view input.fr-large,.fr-view textarea.fr-large{font-size:24px}a.fr-view.fr-strong{font-weight:700}a.fr-view.fr-green{color:green}img.fr-view{position:relative;max-width:100%}img.fr-view.fr-dib{margin:5px auto;display:block;float:none;vertical-align:top}img.fr-view.fr-dib.fr-fil{margin-left:0;text-align:left}img.fr-view.fr-dib.fr-fir{margin-right:0;text-align:right}img.fr-view.fr-dii{display:inline-block;float:none;vertical-align:bottom;margin-left:5px;margin-right:5px;max-width:calc(100% - (2 * 5px))}img.fr-view.fr-dii.fr-fil{float:left;margin:5px 5px 5px 0;max-width:calc(100% - 5px)}img.fr-view.fr-dii.fr-fir{float:right;margin:5px 0 5px 5px;max-width:calc(100% - 5px)}span.fr-img-caption.fr-view{position:relative;max-width:100%}span.fr-img-caption.fr-view.fr-dib{margin:5px auto;display:block;float:none;vertical-align:top}span.fr-img-caption.fr-view.fr-dib.fr-fil{margin-left:0;text-align:left}span.fr-img-caption.fr-view.fr-dib.fr-fir{margin-right:0;text-align:right}span.fr-img-caption.fr-view.fr-dii{display:inline-block;float:none;vertical-align:bottom;margin-left:5px;margin-right:5px;max-width:calc(100% - (2 * 5px))}span.fr-img-caption.fr-view.fr-dii.fr-fil{float:left;margin:5px 5px 5px 0;max-width:calc(100% - 5px)}span.fr-img-caption.fr-view.fr-dii.fr-fir{float:right;margin:5px 0 5px 5px;max-width:calc(100% - 5px)}'
            + /*Added by SAH*/ '.fr-view .hx-fr-ignore table td {border: inherit;}.fr-view p{ margin: auto; }'
            + /* For signatures' fonts */ ".ql-font-arial {font-family: 'Arial', sans-serif;}.ql-font-arialblack {font-family: 'Arial Black', sans-serif;}.ql-font-calibri {font-family: 'Calibri', sans-serif;}.ql-font-cambria {font-family: 'Cambria', sans-serif;}.ql-font-courier {font-family: 'Courier New', sans-serif;}.ql-font-georgia {font-family: 'Georgia', sans-serif;}.ql-font-impact {font-family: 'Impact', sans-serif;}.ql-font-tahoma {font-family: 'Tahoma', sans-serif;}.ql-font-times {font-family: 'Times New Roman', sans-serif;}.ql-font-trebuchet {font-family: 'Trebuchet MS', sans-serif;}.ql-font-verdana {font-family: 'Verdana', sans-serif;}"
            + /* For outline-style lists */ ".fr-view ol.hx-upper-alpha ol li {list-style: decimal;}.fr-view ol ol li {list-style: upper-alpha;}.fr-view ol ol ol li {list-style: lower-alpha;}.fr-view ol ol ol ol li {list-style: lower-roman;}.fr-view ol ol ol ol ol li {list-style: disc;}"
            + /* To make sure we don't get double spacing in signatures */ ".fr-view .hx-signature p{margin:0px;}"
    ;
})(jQuery);
