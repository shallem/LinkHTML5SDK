/**
 @preserve CLEditor WYSIWYG HTML Editor v1.3.0
 http://premiumsoftware.net/cleditor
 requires jQuery v1.4.2 or later

 Copyright 2010, Chris Landowski, Premium Software, LLC
 Dual licensed under the MIT or GPL Version 2 licenses.
*/

// ==ClosureCompiler==
// @compilation_level SIMPLE_OPTIMIZATIONS
// @output_file_name jquery.cleditor.min.js
// ==/ClosureCompiler==

(function($) {

    //==============
    // jQuery Plugin
    //==============

    $.cleditor = {

        // Define the defaults used for all new cleditor instances
        defaultOptions: {
            width:        500, // width not including margins, borders or padding
            height:       300, // height not including margins, borders or padding
            controls:     // controls to add to the toolbar
            {
                "default": {
                    styles: "bold italic underline strikethrough subscript superscript | sizexxsmall sizexsmall sizesmall sizenormal sizelarge sizexlarge sizexxlarge",
                    //font: "font size color highlight",
                    font: "font",
                    formats: "bullets numbering | outdent indent | alignleft center alignright justify" +
                    " | rule", /* image link unlink*/
                    actions : "undo redo" /* removeformat */,
                    color : "color highlight"
                },
                "phone" : {
                    styles: "bold italic underline strikethrough subscript superscript",
                    //font: "font size color highlight",
                    font: "font",
                    formats: "bullets numbering | outdent indent | alignleft center alignright justify",
                    actions : "undo redo" /* removeformat */,
                    color : "color highlight"
                }
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
            tabIndex: -1
        },

        // Define all usable toolbar buttons - the init string property is
        //   expanded during initialization back into the buttons object and
        //   seperate object properties are created for each button.
        //   e.g. buttons.size.title = "Font Size"
        buttons: {
            // name,title,command,popupName (""=use name)
            init:
            "bold,,|" +
        "italic,,|" +
        "underline,,|" +
        "strikethrough,,|" +
        "subscript,,|" +
        "superscript,,|" +
        "font,,fontname,|" +
        "size,,fontsize,|" +
        "style,,formatblock,|" +
        "color,Font Color,forecolor|" +
        "highlight,Text Highlight,hilitecolor|" +
        "removeformat,Remove Formatting,|" +
        "bullets,,insertunorderedlist|" +
        "numbering,,insertorderedlist|" +
        "outdent,,|" +
        "indent,,|" +
        "alignleft,Align Text Left,justifyleft|" +
        "center,,justifycenter|" +
        "alignright,Align Text Right,justifyright|" +
        "justify,,justifyfull|" +
        "undo,,|" +
        "redo,,|" +
        "rule,Insert Horizontal Rule,inserthorizontalrule|" +
        "link,Insert Hyperlink,createlink|" +
        "unlink,Remove Hyperlink,|" +
        "cut,,|" +
        "copy,,|" +
        "paste,,|" +
        "pastetext,Paste as Text,inserthtml,|" +
        "print,,|" +
        "source,Show Source,|" +
        "sizexxsmall,XX-small Text,fontsize,1|" +
        "sizexsmall,X-small Text,fontsize,2|" +
        "sizesmall,Small Text,fontsize,3|" +
        "sizenormal,Normal Text,fontsize,4|" +
        "sizelarge,Large Text,fontsize,5|" +
        "sizexlarge,X-large Text,fontsize,6|" +
        "sizexxlarge,XX-large Text,fontsize,7|"
        },
        /*"image,Insert Image,insertimage,url|" +*/

        // imagesPath - returns the path to the images folder
        imagesPath: function() {
            return imagesPath();
        }

    };

    // cleditor - creates a new editor for each of the matched textareas
    $.fn.cleditor = function(options) {

        // Create a new jQuery object to hold the results
        var $result = $([]);

        // Loop through all matching textareas and create the editors
        this.each(function(idx, elem) {
            if (elem.tagName == "TEXTAREA") {
                var data = $.data(elem, CLEDITOR);
                if (!data) data = new cleditor(elem, options);
                $result = $result.add(data);
            }
        });

        // return the new jQuery object
        return $result;

    };

    //==================
    // Private Variables
    //==================

    var

    // Misc constants
    BUTTON           = "button",
    BUTTON_NAME      = "buttonName",
    BUTTON_VALUE      = "buttonValue",
    CHANGE           = "change",
    CLEDITOR         = "cleditor",
    DISABLED         = "disabled",
    DIV_TAG          = "<div>",
    H2_TAG           = "<h2 />",
    A_TAG            = "<a />",
    SPAN_TAG            = "<span />",
    LI_TAG           = "<li />",
    UL_TAG           = "<ul />",

    // Class name constants
    MAIN_CLASS       = "ui-editor ui-widget-content",    // main containing div
    TOOLBAR_CLASS    = "ui-editor-toolbar",            // Editor toolbar
    PROMPT_CLASS     = "ui-editor-prompt",  // prompt popup divs inside body

    // Test for iPhone/iTouch/iPad
    iOS = /(iphone|ipad|ipod)/i.test(navigator.userAgent),
  
    // Popups are created once as needed and shared by all editor instances
    popups = {},

    // Local copy of the buttons object
    buttons = $.cleditor.buttons;

    var CLICK            = "click";
    if (Helix.hasTouch) {
        CLICK = "vclick";
    }

    //===============
    // Initialization
    //===============

    // Expand the buttons.init string back into the buttons object
    //   and create seperate object properties for each button.
    //   e.g. buttons.size.title = "Font Size"
    $.each(buttons.init.split("|"), function(idx, button) {
        var items = button.split(","), name = items[0];
        buttons[name] = {
            stripIndex: idx,
            name: name,
            title: items[1] === "" ? name.charAt(0).toUpperCase() + name.substr(1) : items[1],
            command: items[2] === "" ? name : items[2],
            data: items[3] === "" ? "" : items[3]
        };
    });
    delete buttons.init;

    //============
    // Constructor
    //============

    // cleditor - creates a new editor for the passed in textarea element
    cleditor = function(area, options) {

        var editor = this;

        // Get the defaults and override with options
        editor.options = options = $.extend({}, $.cleditor.defaultOptions, options);

        // Determine the set of controls based on the device type.
        editor.controls = 
            (options.controls[Helix.deviceType] ? options.controls[Helix.deviceType] : options.controls["default"]);

        // Map whose keys are the current style.
        editor.currentStyles = {};

        // Hide the textarea and associate it with this editor
        var $area = editor.$area = $(area)
        .hide()
        .height(0)
        .width(0)
        .data(CLEDITOR, editor);
        
        editor.name = $(area).attr('name');

        // Capture the page for this item.
        if (!options.page) {
            options.page = $(area).closest('div[data-role="page"]');
            if (options.page.length == 0) {
                options.page = $.mobile.activePage;
            }
        }
        editor.page = options.page;

        // Create the main container and append the textarea
        var $parent = editor.$parent = $(DIV_TAG).insertAfter($area);
        //$area.wrap($parent);

        var $main = editor.$main = $(DIV_TAG)
        .addClass(MAIN_CLASS)
        .css('overflow-y', 'hidden') /* Add this to prevent long text corpuses from bleeding out of the iFrame. */
        .width(options.width)
        .appendTo($parent);
        $main.height(options.height);
        $parent.height(options.height);

        // Add the first group to the toolbar
        var $toolbar = editor.$toolbar = $(DIV_TAG)
        .attr('class', 'ui-body-a ' + TOOLBAR_CLASS)
        .attr('data-role','controlgroup')
        .attr('data-type','horizontal');
        //.attr('data-type','vertical');
        //.attr('style', 'float: right;');
        //.insertAfter($main);

        var doMini = 'false';
        if (Helix.deviceType !== "tablet") {
            doMini = 'true';
        }

        editor.menuPopups = {};
        editor.menuToolbar = {};
        editor.menus = {};

        if (editor.controls.styles) {
            createPopupMenu.call(editor, 'style', 'Style', $parent, $toolbar, editor.controls.styles, doMini)
            editor.$styleMenu = editor.menus['style'];
        }

        if (editor.controls.font) {
            // Add the font commands popup to the button bar
            createPopupMenu.call(editor, 'font', 'Font', $parent, $toolbar, editor.controls.font, doMini)
            editor.$fontMenu = editor.menus['font'];
        }

        if (editor.controls.formats) {
            // Add the format commands popup to the button bar
            createPopupMenu.call(editor, 'format', 'Format', $parent, $toolbar, editor.controls.formats, doMini)
            editor.$formatMenu = editor.menus['format'];
        }
        
        if (editor.controls.color) {
            /* The action menu is "nice-to-have". Skip it on smaller screens. */
            createPopupMenu.call(editor, 'color', 'Color', $parent, $toolbar, editor.controls.color, doMini)
            editor.$colorMenu = editor.menus['color'];
        }
        
        if (editor.controls.actions) {
            /* The action menu is "nice-to-have". Skip it on smaller screens. */
            createPopupMenu.call(editor, 'action', 'Action', $parent, $toolbar, editor.controls.actions, doMini)
            editor.$actionMenu = editor.menus['action'];
        }
        
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
        attachKeyboardHideEvent(editor);
    
        $toolbar.controlgroup();

        // If the page is visible, create the iframe and resize the controls. Otherwise
        // wait until the page becomes visible with pageshow above.
        if ($(editor.page).is(':visible')) {
            refresh(editor);
        }
        
        $(editor.page).on("hxLayoutDone." + editor.name, function() {
            refresh(editor);
            editor.$toolbar.find('a[data-role="button"]').addClass("ui-disabled");
        });
                
        var eventName = "orientationchange." + editor.name;
        $(document).off(eventName).on(eventName, function() {
            if (editor.$main.is(':visible')) {
                refresh(editor);
            }
        });

        $(editor.$parent).on("remove", function() {
            editor.destroy();
        });

        // Save this object int the widget var in the global scope, if one is supplied.
        if (options.widget) {
            window[options.widget] = editor;
        }
        
        editor.nextAction = null;
    };

    //===============
    // Public Methods
    //===============

    var fn = cleditor.prototype,

    // Expose the following private functions as methods on the cleditor object.
    // The closure compiler will rename the private functions. However, the
    // exposed method names on the cleditor object will remain fixed.
    methods = [
    ["clear", clear],
    ["disable", disable],
    ["execCommand", execCommand],
    ["focus", focus],
    ["hidePopups", hidePopups],
    ["sourceMode", sourceMode, true],
    ["refresh", refresh],
    ["select", select],
    ["selectedHTML", selectedHTML, true],
    ["selectedText", selectedText, true],
    ["updateFrame", updateFrame],
    ["updateTextArea", updateTextArea],
    ["update", update],
    ["getHTML", getHTML],
    ["destroy", destroy],
    ["adjustHeight", adjustHeight]
    ];

    $.each(methods, function(idx, method) {
        fn[method[0]] = function() {
            var editor = this, args = [editor];
            // using each here would cast booleans into objects!
            for(var x = 0; x < arguments.length; x++) {
                args.push(arguments[x]);
            }
            var result = method[1].apply(editor, args);
            if (method[2]) return result;
            return editor;
        };
    });

    // change - shortcut for .bind("change", handler) or .trigger("change")
    fn.change = function(handler) {
        var $this = $(this);
        return handler ? $this.bind(CHANGE, handler) : $this.trigger(CHANGE);
    };

    //===============
    // Event Handlers
    //===============

    // buttonClick - click event handler for toolbar buttons
    function buttonClick(e) {
        e.preventDefault();
        e.stopImmediatePropagation();

        // note that data is attached to the enclosing li in the context menu, not
        // to the inner a tag, which may be the event target depending on where the 
        // user taps.
        var editor = this,
        buttonDiv = $(e.target).closest("li"),
        buttonName = buttonDiv.data(BUTTON_NAME),
        button = buttons[buttonName],
        menu = button.menu,
        value = buttonDiv.data(BUTTON_VALUE);

        // Fire the buttonClick event
        var data = {
            editor: editor,
            button: buttonDiv,
            buttonName: buttonName,
            value: value,
            command: button.command,
            useCSS: editor.options.useCSS
        };

        editor.nextAction = function() {
            if (button.buttonClick && button.buttonClick(e, data) === false)
                return;

            // All other buttons
            if (!execCommand(editor, data.command, data.value, data.useCSS, button)) {
                return;
            }
        };

        menu.popup("close");
        return true;
    }

    // popupClick - click event handler for popup items
    function popupClick(e) {
        var editor = this,
        buttonName = e.data.buttonName,
        value = e.data.value,
        command = e.data.command;
        var menu = e.data.menu;


        // Get the button info
        var button = buttons[buttonName],
        useCSS = editor.options.useCSS;

        // Fire the popupClick event
        var data = {
            editor: editor,
            buttonName: buttonName,
            command: command,
            value: value,
            useCSS: useCSS
        };
        
        editor.nextAction = function() {
            if (button.popupClick && button.popupClick(e, data) === false)
                return;
    
            // Execute the command
            if (data.command && !execCommand(editor, data.command, data.value, data.useCSS, button))
                return;
        };
        $(menu).popup("close");
    }

    //==================
    // Private Functions
    //==================
    
    function attachKeyboardHideEvent(editor) {
        $(document).on('keyboardHide', function() {
            if (!editor.$main.is(':visible')) {
                // This handler catches all keyboard hide events - even those that occur on a completely
                // different jQM page.
                return;
            }
            
            clearTimeout(editor.changeTimeout);
            editor.changeTimeout = null;
            updateTextArea(editor, true);
            editor.$toolbarEnabled = false;
            editor.popupOpen = false;
            for (var menuName in editor.menuPopups) {
                var editorName = '#' + menuName + "_" + editor.name;
                $(editorName).popup("close");
            }
            editor.$toolbar.find('a[data-role="button"]').addClass("ui-disabled");
        });
    }
    
    function createPopupMenu(menuName, buttonText, $parent, $toolbar, menuOptions, doMini) {
        var editor = this;
        var $popup = this.menuPopups[menuName] = $(DIV_TAG)
            .attr({
                'id' : menuName + "_" + editor.name,
                'style' : 'max-height: 200px; overflow-y: scroll'
            }).appendTo($parent);
            
        var $menu = this.menus[menuName] = $(UL_TAG).attr({
            'data-role' : 'listview',
            'data-inset' : 'true',
            'style' : 'min-width:210px;',
            'data-theme' : 'b'
        }).appendTo($popup);
        $.each(menuOptions.split(" "), function(idx, buttonName) {
            addButtonToMenu(editor, $menu, $popup, buttonName, menuName);
        });
        
        var $button = this.menuToolbar[menuName] = $(A_TAG)
        .attr({
            'href' : 'javascript:void(0)',
            'data-role' : "button",
            'data-theme' : "a",
            'data-mini' : doMini,
            'class' : 'ui-disabled'
        }).append(buttonText)
        .appendTo($toolbar)
        .on(CLICK, function() {
            $popup.popup("open", { positionTo: $button });
            return false;
        });
    }
    
    // checksum - returns a checksum using the Adler-32 method
    function checksum(text)
    {
        var a = 1, b = 0;
        for (var index = 0; index < text.length; ++index) {
            a = (a + text.charCodeAt(index)) % 65521;
            b = (b + a) % 65521;
        }
        return (b << 16) | a;
    }

    // clear - clears the contents of the editor
    function clear(editor) {
        editor.$area.val("");
        updateFrame(editor);
    }
    
    function update(editor, val) {
        editor.$area.val(val);
        refresh(editor);
    }

    // disable - enables or disables the editor
    function disable(editor, disabled) {

        // Update the textarea and save the state
        if (disabled) {
            editor.$area.attr(DISABLED, DISABLED);
            editor.disabled = true;
        }
        else {
            editor.$area.removeAttr(DISABLED);
            delete editor.disabled;
        }

        // Switch the iframe into design mode.
        try {
            editor.doc.designMode = !disabled ? "on" : "off"; 
        }
        // Firefox 1.5 throws an exception that can be ignored
        // when toggling designMode from off to on.
        catch (err) {}
    }

    // execCommand - executes a designMode command
    function execCommand(editor, command, value, useCSS, button) {
        if (command === 'removeformat' && selectionIsEmpty(editor)) {
            Helix.Utils.statusMessage("Remove Format", "The remove format command removes formatting from selected text. You must select text to use this command.", "info");
            return true;
        }
        if (command === 'createlink' && selectionIsEmpty(editor)) {
            Helix.Utils.statusMessage("Create Link", "The create link command turns the selected text into a hyperlink. You must select text to use this command.", "info");
            return true;
        }
        
        editor.$frame[0].contentWindow.focus();
        
        // Set the styling method
        if (useCSS === undefined || useCSS === null)
            useCSS = editor.options.useCSS;
        editor.doc.execCommand("styleWithCSS", 0, useCSS.toString());

        // Execute the command and check for error
        var success = true, description;
        try {
            success = editor.doc.execCommand(command, 0, value || null);
            if (success && (button.type == "font" || button.type == "style" || button.type == 'color')) {
                if (button.type === "font") {
                    editor.currentFont = value;
                    editor.$formatFrame.css('font-family', value);
                    
                    // When we set the font we must restore all styles. Only on iOS.
                    /*if (Helix.browser === 'iOS') {
                        for (var styleKey in editor.currentStyles) {
                            editor.doc.execCommand(styleKey, 0, null);
                        }
                    }*/
                } else if (button.type === "style") {
                    var styleToToggle = 'ui-editor-' + command;
                    editor.$formatFrame.toggleClass(styleToToggle);
                    // iOS bug - if you change the style after you set the font, sometimes the font is
                    // lost.
                    if (editor.currentFont) {
                        editor.doc.execCommand("fontname", 0, editor.currentFont);
                    }
                    // Track the current style.
                    if (command in editor.currentStyles) {
                        delete editor.currentStyles[command];
                    } else {
                        editor.currentStyles[command] = true;
                    }
                } else {
                    if (command === "forecolor") {
                        editor.$formatFrame.css('color', value);
                    } else if (command === "hilitecolor") {
                        editor.$formatFrame.css('background-color', value);
                    }
                }
            }
        } catch (err) {
            description = err.description;
            success = false;
        }
        if (!success) {
            if (!description) {
                description = "browser error."
            }
            Helix.Utils.statusMessage("Error", "Error executing the " + command + " command: " + description, "error");
        }

        return success;
    }

    function selectionIsEmpty(editor) {
        var selection = getSelection(editor);
        if (selection.rangeCount == 0) {
            return true;
        }
        var range = selection.getRangeAt(0);
        if (range.collapsed) {
            return true;
        }
        
        return false;
    }

    function selectText(window,doc,textElement) {
        var range, selection
        ;    
        if (doc.body.createTextRange) { //ms
            range = doc.body.createTextRange();
            range.moveToElementText(textElement);
            range.select();
        } else if (window.getSelection) { //all others
            selection = window.getSelection();        
            range = doc.createRange();
            range.selectNodeContents(textElement);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }

    // focus - sets focus to either the textarea or iframe
    function focus(editor, oncomplete) {
        if (!$(editor.page).is(':visible')) {
            // When the page is invisible we do not put the focus in the editor ...
            return;
        }
        setTimeout(function() {
            if (sourceMode(editor)) {
                editor.$area.focus();
            } else {
                if (editor.$frame) {
                    setTimeout(function() {
                        editor.$frame[0].contentWindow.focus();
                        if (oncomplete) {
                            oncomplete();
                        }
                        //editor.doc.body.click();    
                    }, 70);
                }
            }
        }, 0);
    }

    // getRange - gets the current text range object
    function getRange(editor) {
        return getSelection(editor).getRangeAt(0);
    }

    // getSelection - gets the current text range object
    function getSelection(editor) {
        return editor.$frame[0].contentWindow.getSelection();
    }

    // Returns the hex value for the passed in string.
    //   hex("rgb(255, 0, 0)"); // #FF0000
    //   hex("#FF0000"); // #FF0000
    //   hex("#F00"); // #FF0000
    function hex(s) {
        var m = /rgba?\((\d+), (\d+), (\d+)/.exec(s),
        c = s.split("");
        if (m) {
            s = ( m[1] << 16 | m[2] << 8 | m[3] ).toString(16);
            while (s.length < 6)
                s = "0" + s;
        }
        return "#" + (s.length == 6 ? s : c[1] + c[1] + c[2] + c[2] + c[3] + c[3]);
    }

    // hidePopups - hides all popups
    function hidePopups() {
        $.each(popups, function(idx, popup) {
            $(popup)
            .hide()
            .unbind(CLICK)
            .removeData(BUTTON);
        });
    }

    // imagesPath - returns the path to the images folder
    function imagesPath() {
        var cssFile = "jquery.cleditor.css",
        href = $("link[href$='" + cssFile +"']").attr("href");
        return href.substr(0, href.length - cssFile.length) + "images/";
    }

    // imageUrl - Returns the css url string for a filemane
    function imageUrl(filename) {
        return "url(" + imagesPath() + filename + ")";
    }

    // adjustHeight - changes the height of the editor.
    function adjustHeight(editor, hgt) {
        editor.options.height = hgt;
        editor.$parent.height(hgt);
        editor.$main.height(hgt);
        
        // Update hgt to account for the toolbar and the format frame.
        hgt -= editor.$toolbar.outerHeight(true);        
        hgt -= 25;
        
        editor.$frameMaster.height(hgt);
    }

    // refresh - creates the iframe and resizes the controls
    function refresh(editor) {
        var $contentParent = $(editor.$main).closest(".hx-main-content");
        if (editor.options.isFullWidth) {
            // Figure out the width available to the enclosing page tag.
            editor.options.width = $contentParent[0].clientWidth;
        }
        if (editor.options.isFullHeight) {
            var fullHeight = $contentParent.height()- 
                ($(editor.$main).offset().top - 
                    $contentParent.offset().top);
            editor.options.height = fullHeight;
        }


        var $main = editor.$main,
        options = editor.options;

        var $formatFrame = null;
        if (editor.$formatFrame) {
            $formatFrame = editor.$formatFrame;
        } else {
            $formatFrame = editor.$formatFrame = 
                $('<div/>').append("Current Text Format").addClass("ui-editor-format").hide().appendTo($main);
        }

        var frameMasterID = Helix.Utils.getUniqueID();
        var $frameMaster = null;
        if (editor.$frameMaster) {
            $frameMaster = editor.$frameMaster;
        } else {
            $frameMaster = editor.$frameMaster = $('<div/>')
                .attr('id', frameMasterID)
                .css('overflow-y', 'scroll')
                .css('-webkit-overflow-scrolling', 'touch')
                .appendTo($main);
        }
            
        // Set the height/width of the frame master before we load the iFrame.
        var hgt = options.height;
        adjustHeight(editor, hgt);
        
        // Set the width;
        // Resize the main div (which includes the toolbar).
        $main.width(options.width);
        $frameMaster.width("100%");
        $formatFrame.width("100%");
        
        var $frame = null;
        if (editor.$frame) {
            $frame = editor.$frame;
        } else {
            var frameID = Helix.Utils.getUniqueID();
            var iframeMarkup =
                '<iframe style="margin-bottom: 5px;" src="javascript:true;"' +
                ' tabindex="' + options.tabIndex + '"' +
                ' id="' + frameID + '"' +
                ' onload="Helix.Utils.sizeIFrameToFit(\'' + frameID + '\', \'' + frameMasterID + '\')"' +
                '>';
            
            $frame = editor.$frame = $(iframeMarkup)
                .hide()
                .appendTo($frameMaster);
        }
                
        // Load the iframe document content
        var contentWindow = $frame[0].contentWindow,
        doc = editor.doc = contentWindow.document,
        $doc = $(doc);

        doc.open();
        doc.write(
            options.docType +
            '<html>' +
            '<head>' +
            '<style> div { width: 100%; } </style>' +
            '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />' + 
            ((options.docCSSFile === '') ? '' : '<link rel="stylesheet" type="text/css" href="' + options.docCSSFile + '" />') +
            '</head>' +
            '<body style="' + options.bodyStyle + '"></body></html>'
            );
        doc.close();

        // Load the content
        updateFrame(editor);

        // Update the textarea when the iframe changes. But wait until the typist has stopped
        // before we do this update.
        $doc.find('body').on('keyup', function(e) {
            if (editor.changeTimeout) {
                clearTimeout(editor.changeTimeout);
                editor.changeTimeout = null;
            }
            editor.changeTimeout = setTimeout(function() {
                updateTextArea(editor, true);
            }, 500);
            e.preventDefault();
            e.stopImmediatePropagation();
        });
        // This code resolves the case where after the iOS select menu appears the iframe seems
        // to lose focus. Thereafter if the user tries to type nothing happens. This is very 
        // glitchy from the user's perspective. This helps. The only remaining glitchy behavior
        // is navigation when the user taps in the iframe. Tapping outside of any text seems to do
        // nothing of value.
        $doc.find('body').on('keydown', function(e) {
            setTimeout(function() {
                editor.$frame[0].contentWindow.focus();
            }, 100);
        });
        $doc.find('body').focus(function(e) {
            editor.$toolbar.find('a[data-role="button"]').removeClass("ui-disabled");
            editor.$toolbarEnabled = true;
            return false;
        });
        if (Helix.hasTouch) {
            $doc.find('body').blur(function(e) {
                editor.$toolbar.find('a[data-role="button"]').addClass("ui-disabled");
                editor.$toolbarEnabled = false;
            });
        }
        $doc.width("100%");
        
        // NOTE: we require that the browser supports iFrame design mode. Otherwise
        // this plugin will fail.
        $frame.show();
        $formatFrame.show();

        // Switch the iframe into design mode if enabled
        disable(editor, editor.disabled);
    
        // Put the focus on the editor. Otherwise when we try to tap it does not work.
        //focus(editor); 
        //editor.$toolbar.find('a[data-role="button"]').button("disable");
        editor.$toolbarEnabled = false;
    }

    // select - selects all the text in either the textarea or iframe
    function select(editor) {
        setTimeout(function() {
            if (sourceMode(editor)) editor.$area.select();
            else execCommand(editor, "selectall");
        }, 0);
    }

    // selectedHTML - returns the current HTML selection or and empty string
    function selectedHTML(editor) {
        var range = getRange(editor);
        var layer = $("<layer>")[0];
        layer.appendChild(range.cloneContents());
        var html = layer.innerHTML;
        layer = null;
        return html;
    }

    // selectedText - returns the current text selection or and empty string
    function selectedText(editor) {
        return getSelection(editor).toString();
    }

    function capitalizeFirstLetter(string)
    {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // Add a button to a popup menu.
    function addButtonToMenu(editor, popupMenu, menu, buttonName, buttonType) {
        if (buttonName === "") return;

        // Divider
        if (buttonName == "|") {

            // Add a new divider to the group
            var $div = $(LI_TAG)
            .attr({
                'data-role' : 'divider',
                'data-theme' : 'a' 
            })
            .appendTo(popupMenu);
        }

        // Button
        else {
            // Get the button definition
            var button = buttons[buttonName];
            button.type = buttonType;
            button.menu = menu;

            if (editor.options[button.name]) {
                var list = null;
                var renderOption = null;
                list = editor.options[button.name];
                
                if (button.name === 'font') {
                    renderOption = function(buttonDiv, font) {
                        buttonDiv
                        .append($('<font />').attr({
                            'face' : font
                        })
                        .append(font));
                    }
                }
                
                $.each(list.split(","), function(idx, val) {
                    var $linkDiv = $(A_TAG)
                        .attr({
                            'href' : 'javascript:void(0);',
                            'data-button' : buttonName
                        });
                    var $buttonDiv = $(LI_TAG).append($linkDiv).appendTo(popupMenu);
                    renderOption($linkDiv, val);
                    $buttonDiv.on(CLICK, $.proxy(buttonClick, editor));
                    $buttonDiv.data(BUTTON_NAME, buttonName);
                    $buttonDiv.data(BUTTON_VALUE, val);
                }); 
            } else if (button.name === 'color' || button.name === 'highlight') {
                $(DIV_TAG).attr({
                    'class' : 'ui-color-picker',
                    'style' : 'width: 100%;'
                }).appendTo(popupMenu).append(button.title);
                var colorInput = $('<input/>').appendTo(popupMenu)
                .attr({
                    'data-command' : button.command
                })
                .spectrum({
                    color: 'black',
                    change: function(color) {
                        popupClick.call(editor, {
                            target: colorInput, 
                            data : { 
                                buttonName: button.name,
                                command: button.command,
                                value: color.toHexString(),
                                menu: menu
                            } 
                        });
                    }
                })
                
                $(document).on('keyboardHide', function() {
                    colorInput.spectrum("hide");
                });
                var restoreColor = '#000000';
                if (button.name === 'highlight') {
                    restoreColor = '#FFFFFF';
                }
                
                $(A_TAG).attr({
                    'href' : 'javascript:void(0);'
                })
                .append('Clear ' + capitalizeFirstLetter(button.name))
                .appendTo(popupMenu).buttonMarkup({
                    mini: true
                }).on(CLICK, function(ev) {
                    $('input[data-command="' + button.command + '"]').spectrum("set", restoreColor);
                    popupClick.call(editor, {
                        target: colorInput, 
                        data : { 
                            buttonName: button.name,
                            command: button.command,
                            value: restoreColor,
                            menu: menu
                        } 
                    });
                    return false;
                });
            } else {

        
                // Add a new button to the group
                var $buttonDiv = $(LI_TAG).append(
                    $(A_TAG)
                    .attr({
                        'href' : 'javascript:void(0);',
                        'data-button' : buttonName
                    }).append(button.title)
                    ).appendTo(popupMenu);
                $buttonDiv.on(CLICK, $.proxy(buttonClick, editor));
                $buttonDiv.data(BUTTON_NAME, buttonName);
                if (button.data) {
                    $buttonDiv.data(BUTTON_VALUE, button.data);
                }

                // Prepare the button image
                var map = {};
                if (button.css) map = button.css;
                else if (button.image) map.backgroundImage = imageUrl(button.image);
                if (button.stripIndex) map.backgroundPosition = button.stripIndex * -24;
                button.onCSS = map;
            }
        }
    }

    // sourceMode - returns true if the textarea is showing
    function sourceMode(editor) {
        return editor.$area.is(":visible");
    }

    // updateFrame - updates the iframe with the textarea contents
    function updateFrame(editor, checkForChange) {
        if (!editor.doc) {
            // Have not rendered the iframe yet ...
            return;
        }


        var code = editor.$area.val(),
        options = editor.options,
        updateFrameCallback = options.updateFrame,
        $body = $(editor.doc.body);

        // Check for textarea change to avoid unnecessary firing
        // of potentially heavy updateFrame callbacks.
        if (updateFrameCallback) {
            var sum = checksum(code);
            if (checkForChange && editor.areaChecksum == sum)
                return;
            editor.areaChecksum = sum;
        }

        // Convert the textarea source code into iframe html
        var html = updateFrameCallback ? updateFrameCallback(code) : code;
        if (!html) {
            html = "<br>";
        } else {
            // Prevent script injection attacks by html encoding script tags
            html = html.replace(/<(?=\/?script)/ig, "&lt;");
        }

        // Update the iframe checksum
        if (options.updateTextArea)
            editor.frameChecksum = checksum(html);

        // Update the iframe and trigger the change event
        if (html != $body.html()) {
            $body.html(html);
            $(editor).triggerHandler(CHANGE);
        }

    }

    // updateTextArea - updates the textarea with the iframe contents
    function updateTextArea(editor, checkForChange) {

        var html = $(editor.doc.documentElement).html(),
        options = editor.options,
        updateTextAreaCallback = options.updateTextArea,
        $area = editor.$area;

        // Check for iframe change to avoid unnecessary firing
        // of potentially heavy updateTextArea callbacks.
        if (updateTextAreaCallback) {
            var sum = checksum(html);
            if (checkForChange && editor.frameChecksum == sum)
                return;
            editor.frameChecksum = sum;
        }

        // Convert the iframe html into textarea source code
        var code = updateTextAreaCallback ? updateTextAreaCallback(html) : html;

        // Update the textarea checksum
        if (options.updateFrame)
            editor.areaChecksum = checksum(code);

        // Update the textarea and trigger the change event
        if (code != $area.val()) {
            $area.val(code);
            $(editor).triggerHandler(CHANGE);
        }

    }

    function selectAll() {
        this.select();
    }

    function getHTML() {
        return this.doc.body.innerHTML;
    }

    function destroy() {
        /* Remove the popup menus from the DOM. */
        $(this.$fontMenu).closest(".ui-popup-container").prev().remove();
        $(this.$fontMenu).closest(".ui-popup-container").remove();
        $(this.$styleMenu).closest(".ui-popup-container").prev().remove();
        $(this.$styleMenu).closest(".ui-popup-container").remove();
        $(this.$formatMenu).closest(".ui-popup-container").prev().remove();
        $(this.$formatMenu).closest(".ui-popup-container").remove();
        $(this.$actionMenu).closest(".ui-popup-container").prev().remove();
        $(this.$actionMenu).closest(".ui-popup-container").remove();
    
        /* Stop listening ... */
        $(this.page).off("hxLayoutDone." + this.name);
        $(document).off("orientationchange." + this.name);
    }
})(jQuery);