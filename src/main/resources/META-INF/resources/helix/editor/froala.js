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
            defaultFontSize: 11,
            placeholderText: 'Compose a rich text document',
            extraButtons: []
        },
        _create: function () {            
            this._isDirty = false;
            this._initialVal = '';
            let _self = this;
            let e = this.editor = new FroalaEditor('#' + this.element.attr('id'), {
                toolbarSticky: false,
                events: {
                    'contentChanged': function () {
                      // Do something here.
                      // this is the editor instance.
                      _self._isDirty = true;
                    }
                },
                placeholderText: _self.options.placeholderText,
                fontFamilyDefaultSelection: _self.options.defaultFont,
                fontFamilySelection: true,
                fontSizeSelection: true,
                fontSizeDefaultSelection: _self.options.defaultFontSize.toString(),
                fontFamily: {
                    'Arial,Helvetica,sans-serif': 'Arial',
                    'Calibri,sans-serif': 'Calibri',
                    'Cambria,serif': 'Cambria',
                    'Comic Sans MS': 'Comic Sans MS',
                    'Courier New': 'Courier',
                    'Georgia,serif': 'Georgia',
                    'Impact,Charcoal,sans-serif': 'Impact',
                    'Tahoma,Geneva,sans-serif': 'Tahoma',
                    "'Times New Roman',Times,serif": 'Times New Roman',
                    'Trebuchet MS': 'Trebuchet',
                    'Verdana,Geneva,sans-serif': 'Verdana'
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
                    'extraButtons': {
                        'buttons' : _self.options.extraButtons,
                        'buttonsVisible': 3,
                        'align': 'right'
                    },
                    'moreMisc': {
                      'buttons': ['undo', 'redo' ], // 'fullscreen', 'print', 'getPDF', 'html', 'help', 'spellChecker', 'selectAll'
                      'align': 'right',
                      'buttonsVisible': 2
                    }
                },
                quickInsertEnabled: false,
                colorsHEXInput: false,
                tableResizerOffset: 10,
                tableResizingLimit: 50
            }, function() {
                e.html.set(_self._initialVal);
                _self.element.find('.fr-toolbar').addClass('hx-form-border-none');
                _self.element.find('.second-toolbar').addClass('hx-form-hidden');
                _self.element.find('.fr-view').css('font-family', _self.options.defaultFont).css('font-size', _self.options.defaultFontSize + 'px');
            });
        },
        isDirty: function () {
            return this._isDirty;
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
        },
        setDefaultFont: function(font, fontSize) {
            this.options.defaultFont = font;
            this.options.defaultFontSize = fontSize;
        },
        update: function (val) {
            if (!this.editor.html) {
                this._initialVal = val;
                return;
            }
            
            // Strip out closing br tags that cause unnecessary spaces ...
            val = val.replace(/<\/br>/g, '');
            
            this.editor.html.set(val);
        },
        focus: function () {
        },
        // disable - enables or disables the editor
        disable: function (disabled) {
        },
        getHTML: function () {
            return '<html><body>' + this.editor.html.get() + '</body></html>';
        },
        blur: function () {
        },
        getFrame: function() {
            return this.element;
        },
        getContentParent: function() {
            return this.instance.find('.fr-view');
        },
        addCustomToolButtons: function(buttons) {
            /*var $customControls = this.$toolbar.find('.hx-editor-custom-toolbar.ui-controlgroup-controls');
            if ($customControls.length === 0) {
                $customControls = $('<div/>').addClass('hx-editor-custom-toolbar ui-controlgroup-controls').prependTo(this.$toolbar);
            }
            $customControls.empty();
            for (var i = 0; i < buttons.length; ++i) {
                var buttonAction = $.proxy(function(ev) {
                    ev.stopImmediatePropagation();
                    this.action.call(this.context ? this.context : window);
                    return false;
                }, buttons[i]);
                FroalaEditor.DefineIcon('test', {NAME: 'info', SVG_KEY: 'help'});
                FroalaEditor.RegisterCommand('alert', {
                  title: 'Hello',
                  focus: false,
                  undo: false,
                  refreshAfterCallback: false,
                  callback: function () {
                    alert('Hello!');
                  }
                });
                Helix.Layout.makeIconButton(buttons[i].icon)
                        .addClass('hx-editor-icon-button hx-btn-inline')
                        .appendTo($customControls)
                        .on(Helix.clickEvent, buttonAction);
            }*/
        }
    });
})(jQuery);
