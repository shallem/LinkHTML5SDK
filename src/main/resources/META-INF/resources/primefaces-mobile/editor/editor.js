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
                styles: "bold italic underline strikethrough subscript superscript",
                font: "font size color highlight",
                formats: "bullets numbering | outdent indent | alignleft center alignright justify" +
                " | rule link unlink", /* image */
                actions : "undo redo removeformat"
            }
            ,
            colors:       // colors in the color popup
            "FFF FCC FC9 FF9 FFC 9F9 9FF CFF CCF FCF " +
            "CCC F66 F96 FF6 FF3 6F9 3FF 6FF 99F F9F " +
            "BBB F00 F90 FC6 FF0 3F3 6CC 3CF 66C C6C " +
            "999 C00 F60 FC3 FC0 3C0 0CC 36F 63F C3C " +
            "666 900 C60 C93 990 090 399 33F 60C 939 " +
            "333 600 930 963 660 060 366 009 339 636 " +
            "000 300 630 633 330 030 033 006 309 303",
            fonts:        // font names in the font popup
            "Arial,Arial Black,Comic Sans MS,Courier New,Narrow,Garamond," +
            "Georgia,Impact,Sans Serif,Serif,Tahoma,Trebuchet MS,Verdana",
            sizes:        // sizes in the font size popup
            "1,2,3,4,5,6,7",
            styles:       // styles in the style popup
            [["Paragraph", "<p>"], ["Header 1", "<h1>"], ["Header 2", "<h2>"],
            ["Header 3", "<h3>"],  ["Header 4","<h4>"],  ["Header 5","<h5>"],
            ["Header 6","<h6>"]],
            useCSS:       false, // use CSS to style HTML when possible (not supported in ie)
            docType:      // Document type contained within the editor
            '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">',
            docCSSFile:   // CSS file used to style the document contained within the editor
            "",
            bodyStyle:    // style to assign to document body contained within the editor
            "margin:4px; font:10pt Arial,Verdana; cursor:text"
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
        "size,Font Size,fontsize,|" +
        "style,,formatblock,|" +
        "color,Font Color,forecolor,|" +
        "highlight,Text Highlight,hilitecolor,color|" +
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
        "source,Show Source"
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
    BACKGROUND_COLOR = "backgroundColor",
    BUTTON           = "button",
    BUTTON_NAME      = "buttonName",
    CHANGE           = "change",
    CLEDITOR         = "cleditor",
    CLICK            = "tap click",
    DISABLED         = "disabled",
    DIV_TAG          = "<div>",
    H2_TAG           = "<h2 />",
    A_TAG            = "<a />",
    SPAN_TAG            = "<span />",
    LI_TAG           = "<li />",
    UL_TAG           = "<ul />",
    TRANSPARENT      = "transparent",
    UNSELECTABLE     = "unselectable",

    // Class name constants
    MAIN_CLASS       = "ui-editor ui-widget-content",    // main containing div
    FORMATBAR_CLASS  = "ui-editor-toolbar", // toolbar above main div showing current format commands
    TOOLBAR_CLASS    = "ui-editor-toolbar",            // Editor toolbar
    GROUP_CLASS      = "ui-editor-group",   // group divs inside the toolbar div
    BUTTON_CLASS     = "ui-editor-button",  // button divs inside group div
    DISABLED_CLASS   = "ui-editor-disabled",// disabled button divs
    DIVIDER_CLASS    = "ui-editor-divider", // divider divs inside group div
    POPUP_CLASS      = "ui-editor-popup",   // popup divs inside body
    LIST_CLASS       = "ui-editor-list",    // list popup divs inside body
    COLOR_CLASS      = "ui-editor-color",   // color popup div inside body
    PROMPT_CLASS     = "ui-editor-prompt",  // prompt popup divs inside body
    MSG_CLASS        = "ui-editor-message", // message popup div inside body

    // Test for ie
    ie = $.browser.msie,
    ie6 = /msie\s6/i.test(navigator.userAgent),

    // Test for iPhone/iTouch/iPad
    iOS = /(iphone|ipad|ipod)/i.test(navigator.userAgent),
  
    // Popups are created once as needed and shared by all editor instances
    popups = {},

    // Used to prevent the document click event from being bound more than once
    documentClickAssigned,

    // Local copy of the buttons object
    buttons = $.cleditor.buttons;

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
            popupName: items[3] === "" ? name : items[3]
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

        // Hide the textarea and associate it with this editor
        var $area = editor.$area = $(area)
        .hide()
        .data(CLEDITOR, editor)
        .blur(function() {
            // Update the iframe when the textarea loses focus
            updateFrame(editor, true);
        });
        
        editor.name = $(area).attr('name');

        // Create the main container and append the textarea
        var $parent = editor.$parent = $(DIV_TAG);
        var $main = editor.$main = $(DIV_TAG)
        .addClass(MAIN_CLASS)
        .width(options.width)
        .appendTo($parent);
        if (!iOS) {
            $main.height(options.height);
        }

        // Add the main div to the DOM and append the textarea
        $parent.insertBefore($area)
        $parent.append($area);

        // Add the first group to the toolbar
        var $toolbar = editor.$toolbar = $(DIV_TAG)
        .attr('class', 'ui-body-a ' + TOOLBAR_CLASS)
        .attr('data-role','controlgroup')
        .attr('data-type','vertical')
        .attr('style', 'float: right;');
        //.insertAfter($main);

        // Add the styling commands popup to the button bar
        var $styleCommands = $(A_TAG)
        .attr({
            'href' : '#stylesPopup',
            'data-rel' : "popup",
            'data-role' : "button",
            'data-theme' : "a"
        }).append("Styles")
        .appendTo($toolbar);

        // Add the font commands popup to the button bar
        var $fontCommands = $(A_TAG)
        .attr({
            'href' : '#fontsPopup',
            'data-rel' : "popup",
            'data-role' : "button",
            'data-theme' : "a"
        }).append("Font")
        .appendTo($toolbar);

        // Add the format commands popup to the button bar
        var $formatCommands = $(A_TAG)
        .attr({
            'href' : '#formatsPopup',
            'data-rel' : "popup",
            'data-role' : "button",
            'data-theme' : "a"
        }).append("Format")
        .appendTo($toolbar);
       
        // Add the actions commands popup to the button bar
        var $actionCommands = $(A_TAG)
        .attr({
            'href' : '#actionPopup',
            'data-rel' : "popup",
            'data-role' : "button",
            'data-theme' : "a"
        }).append("Actions")
        .appendTo($toolbar);

        // Now add in the actual popups
        var $fontMenu = editor.$fontMenu = $(UL_TAG).attr({
            'data-role' : 'listview',
            'data-inset' : 'true',
            'style' : 'min-width:210px;',
            'data-theme' : 'b'
        });
        var $fontMenuPopup = $(DIV_TAG)
        .attr({
            'data-role' : 'popup',
            'data-history': 'false',
            'data-theme' : 'a',
            'id' : 'fontsPopup'
        }).append($fontMenu)
        .appendTo($parent);
        $.each(options.controls.font.split(" "), function(idx, buttonName) {
            addButtonToMenu(editor, $fontMenu, $fontMenuPopup, buttonName, "font");
        });
    
        var $styleMenuPopup = $(DIV_TAG)
        .attr({
            'data-role' : 'popup',
            'data-history': 'false',
            'data-theme' : 'a',
            'id' : 'stylesPopup'
        }).appendTo($parent);
        var $styleMenu = editor.$styleMenu = $(UL_TAG).attr({
            'data-role' : 'listview',
            'data-inset' : 'true',
            'style' : 'min-width:210px;',
            'data-theme' : 'b'
        }).appendTo($styleMenuPopup);
        $.each(options.controls.styles.split(" "), function(idx, buttonName) {
            addButtonToMenu(editor, $styleMenu, $styleMenuPopup, buttonName, "style");
        });

        var $formatMenuPopup = $(DIV_TAG)
        .attr({
            'data-role' : 'popup',
            'data-history': 'false',
            'data-theme' : 'a',
            'id' : 'formatsPopup'
        }).appendTo($parent);
        var $formatMenu = editor.$formatMenu = $(UL_TAG).attr({
            'data-role' : 'listview',
            'data-inset' : 'true',
            'style' : 'min-width:210px;',
            'data-theme' : 'b'
        }).appendTo($formatMenuPopup);
        $.each(options.controls.formats.split(" "), function(idx, buttonName) {
            addButtonToMenu(editor, $formatMenu, $formatMenuPopup, buttonName, "format");
        });

        var $actionMenuPopup = $(DIV_TAG)
        .attr({
            'data-role' : 'popup',
            'data-history': 'false',
            'data-theme' : 'a',
            'id' : 'actionPopup'
        }).appendTo($parent);
        var $actionMenu = editor.$actionMenu = $(UL_TAG).attr({
            'data-role' : 'listview',
            'data-inset' : 'true',
            'style' : 'min-width:210px;',
            'data-theme' : 'b'
        }).appendTo($actionMenuPopup);
        $.each(options.controls.actions.split(" "), function(idx, buttonName) {
            addButtonToMenu(editor, $actionMenu, $actionMenuPopup, buttonName, "action");
        });        
        $toolbar.appendTo($parent);
        
        $styleMenu.listview();
        $formatMenu.listview();
        $fontMenu.listview()
        $actionMenu.listview();
        
        $styleCommands.button();
        $fontCommands.button();
        $actionCommands.button();
        $formatCommands.button();
        
        $fontMenuPopup.popup();
        $styleMenuPopup.popup();
        $formatMenuPopup.popup();
        $actionMenuPopup.popup();
    
        $toolbar.controlgroup();
    
        // Bind the window resize event when the width or height is auto or %
        if (/auto|%/.test("" + options.width + options.height))
            $(window).resize(function() {
                refresh(editor);
            });


        // Capture the page for this item.
        if (!options.page) {
            options.page = $(area).closest('div[data-role="page"]');
            if (options.page.length == 0) {
                options.page = $.mobile.activePage;
            }
        }
        editor.page = options.page;

        // If the page is visible, create the iframe and resize the controls. Otherwise
        // wait until the page becomes visible with pageshow above.
        if ($(editor.page).is(':visible')) {
            refresh(editor);
        }

        var eventName = 'pageshow.' + editor.name;
        $(editor.page).off(eventName).on(eventName, function() {
            refresh(editor);
        });
        
        $(editor.$main).on("remove", function() {
            $(editor.page).off(eventName);
            editor.destroy();
        });
        
        // Save this object int he widget var in the global scope, if one is supplied.
        if (options.widget) {
            window[options.widget] = editor;
        }
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
    ["getHTML", getHTML],
    ["destroy", destroy]
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
        e.stopImmediatePropagation();

        // note that data is attached to the enclosing li in the context menu, not
        // to the inner a tag, which may be the event target depending on where the 
        // user taps.
        var editor = this,
        buttonDiv = $(e.target).closest("li"),
        buttonName = buttonDiv.data(BUTTON_NAME),
        button = buttons[buttonName],
        popupName = button.popupName,
        popup = popups[popupName],
        menu = button.menu;

        // Check if disabled
        if (editor.disabled || $(buttonDiv).attr(DISABLED) == DISABLED)
            return false;

        // If this click is on the link button make sure we have a selection.
        var value;
        if (getSelection(editor).toString()) {
            value = getRange(editor);
        }
        if ((buttonName == "link" || buttonName == "unlink") && !value) {
            alert("You cannot insert or remove hyperlinks without selecting a URL in the text editor.");
            return false;
        }

        // Fire the buttonClick event
        var data = {
            editor: editor,
            button: buttonDiv,
            buttonName: buttonName,
            popup: popup,
            value: value,
            popupName: popupName,
            command: button.command,
            useCSS: editor.options.useCSS
        };

        if (button.buttonClick && button.buttonClick(e, data) === false)
            return false;
  
        // All other buttons
        if (!execCommand(editor, data.command, data.value, data.useCSS, button)) {
            return false;
        }

        menu.popup("close");
        return true;
    }

    // popupClick - click event handler for popup items
    function popupClick(e) {
        var editor = this,
        popup = e.data.popup,
        target = e.target;

        // Check for message and prompt popups
        if (popup === popups.msg || $(popup).hasClass(PROMPT_CLASS))
            return false;

        // Get the button info
        var buttonDiv = $(popup),
        buttonName = buttonDiv.data(BUTTON_NAME),
        button = buttons[buttonName],
        command = button.command,
        value,
        useCSS = editor.options.useCSS;

        // Get the command value
        if (buttonName == "font") {
            value = $(target).find("font").html();
        // Opera returns the fontfamily wrapped in quotes
        // value = target.style.fontFamily.replace(/"/g, "");
        } else if (buttonName == "size") {
            value = $(target).find("font").html();
        }
        else if (buttonName == "style")
            value = "<" + target.tagName + ">";
        else if (buttonName == "color")
            value = hex(target.style.backgroundColor);
        else if (buttonName == "highlight") {
            value = hex(target.style.backgroundColor);
            if (ie) command = 'backcolor';
            else useCSS = true;
        }

        // Fire the popupClick event
        var data = {
            editor: editor,
            button: buttonDiv,
            buttonName: buttonName,
            popup: popup,
            popupName: button.popupName,
            command: command,
            value: value,
            useCSS: useCSS
        };

        if (button.popupClick && button.popupClick(e, data) === false)
            return false;
    
        // Execute the command
        if (data.command && !execCommand(editor, data.command, data.value, data.useCSS, button))
            return false;

        return true;
    }

    //==================
    // Private Functions
    //==================
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

    // createPopup - creates a popup and adds it to the body
    function createPopup(editor, button, selectName, popupDiv, menu) {

        // Create the popup
        var $popup = null;
        if (button.popupName == "color") {
            $popup = $(DIV_TAG).attr({
                'class' : 'ui-color-picker'
            }).appendTo(popupDiv);
        } else {
            $popup = $('<select />')
            .attr('name', selectName)
            .appendTo(popupDiv);
        }

        // Custom popup
        if (button.popupContent) {
            $popup.html(button.popupContent);
        }
        // Color
        else if (button.popupName == "color") {
            var colorPicker = $popup;
            var colorDiv = $(DIV_TAG).attr({
                'style' : 'background-color: #ffffff; color: #000000'
            }).append("Select a Color").appendTo(colorPicker);
            $(colorPicker).ColorPicker({
                color: '#ffffff',
                eventName: 'tap',
                onShow: function (colpkr) {
                    $(colpkr).fadeIn(500);
                    /* Bring in front of the popup. */
                    $(colpkr).css('zIndex', 9999);
                    return false;
                },
                onHide: function (colpkr) {
                    $(colpkr).fadeOut(500);
                    return false;
                },
                onChange: function (hsb, hex, rgb) {
                    var updateDiv = $(colorPicker).find('div');
                    updateDiv.css('backgroundColor', '#' + hex);
                    popupClick.call(editor, {
                        target: updateDiv[0], 
                        data : { 
                            popup: popupDiv 
                        } 
                    });
                }
            });
        }

        // Font
        else if (button.popupName == "font") {
            $.each(editor.options.fonts.split(","), function(idx, font) {
                var fontItem = $('<option />').append($(SPAN_TAG)
                    .append($('<font />').attr({
                        'face' : font
                    })
                    .append(font))
                    ).appendTo($popup);
            });
            $popup.change(function() {
                $(this).find("option:selected").each(function() {
                    popupClick.call(editor, {
                        target: this, 
                        data : { 
                            popup: popupDiv 
                        } 
                    });
                });
                $(menu).popup("close");
            });
        }
        // Size
        else if (button.popupName == "size") {
            $.each(editor.options.sizes.split(","), function(idx, size) {
                var sizeItem = $('<option />').append($(SPAN_TAG)
                    .html("<font size=" + size + ">" + size + "</font>")
                    ).appendTo($popup);
            });
            $popup.change(function() {
                $(this).find("option:selected").each(function() {
                    popupClick.call(editor, {
                        target: this, 
                        data : { 
                            popup: popupDiv 
                        } 
                    });
                });
                $(menu).popup("close");
            });
        }
        // Style
        else if (button.popupName == "style") {
            $.each(editor.options.styles, function(idx, style) {
                var styleItem = $('<option />').append($(SPAN_TAG)
                    .html(style[1] + style[0] + style[1].replace("<", "</"))
                    ).appendTo($popup);
                styleItem.bind(CLICK, {
                    popup: popupDiv
                }, function() {
                    $.proxy(popupClick, editor);
                    $(menu).popup("close"); 
                });
            });
        }

        // Add the unselectable attribute to all items
        if (ie) {
            $popup.attr(UNSELECTABLE, "on")
            .find("div,font,p,h1,h2,h3,h4,h5,h6")
            .attr(UNSELECTABLE, "on");
        }

        $(popupDiv).trigger('create');

        // Add the popup to the array and return it
        popups[button.popupName] = $popup[0];
        return $popup[0];
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
        // ie6 does not support designMode.
        // ie7 & ie8 do not properly support designMode="off".
        try {
            if (ie) editor.doc.body.contentEditable = !disabled;
            else {
                editor.doc.designMode = !disabled ? "on" : "off";
                editor.formatDoc.designMode = !disabled ? "on" : "off";
                // Make the format document read only.
                editor.formatDoc.execCommand("contentReadOnly", 0, null);
            } 
        }
        // Firefox 1.5 throws an exception that can be ignored
        // when toggling designMode from off to on.
        catch (err) {}
    }

    // execCommand - executes a designMode command
    function execCommand(editor, command, value, useCSS, button) {

        // Restore the current ie selection
        restoreRange(editor);

        // Set the styling method
        if (!ie) {
            if (useCSS === undefined || useCSS === null)
                useCSS = editor.options.useCSS;
            editor.doc.execCommand("styleWithCSS", 0, useCSS.toString());
        }

        // Execute the command and check for error
        var success = true, description;
        if (ie && command.toLowerCase() == "inserthtml")
            getRange(editor).pasteHTML(value);
        else {
            try {
                editor.$frame[0].contentWindow.focus();
                success = editor.doc.execCommand(command, 0, value || null);
                if (success && (button.type == "font" || button.type == "style")) {
                    selectText(editor.$formatFrame[0].contentWindow.window, editor.formatDoc, editor.formatDoc.body.childNodes[0]);
                    editor.formatDoc.execCommand(command, 0, value);
                    editor.$formatFrame[0].contentWindow.window.getSelection().removeAllRanges();
                }
            } catch (err) {
                description = err.description;
                success = false;
            }
            if (!success) {
                if (!description) {
                    description = "browser error."
                }
                PrimeFaces.Utils.statusMessage("Error", "Error executing the " + command + " command: " + description, "error");
            }
        }

        return success;
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
    function focus(editor) {
        setTimeout(function() {
            if (sourceMode(editor)) {
                editor.$area.focus();
            } else {
                editor.$frame[0].contentWindow.focus();
            }
        }, 0);
    }

    // getRange - gets the current text range object
    function getRange(editor) {
        if (ie) return getSelection(editor).createRange();
        return getSelection(editor).getRangeAt(0);
    }

    // getSelection - gets the current text range object
    function getSelection(editor) {
        if (ie) return editor.doc.selection;
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

    // refresh - creates the iframe and resizes the controls
    function refresh(editor) {
        if (editor.options.isFullWidth) {
            // Figure out the width available to the enclosing page tag.
            var hxMain = $(editor.$main).closest(".hx-main-content");
            editor.options.width = hxMain[0].clientWidth;
        }
        if (editor.options.isFullHeight) {
            var fullHeight = $(editor.$main).closest(".ui-content").height()- 
            ($(editor.$main).offset().top - 
                $(editor.$main).closest(".ui-content").offset().top);
            editor.options.height = fullHeight;
        }


        var $main = editor.$main,
        $parent = editor.$parent,
        options = editor.options;

        // Remove the old iframe
        if (editor.$frame)
            editor.$frame.remove();
        if (editor.$formatFrame)
            editor.$formatFrame.remove();

        // Create an iFrame that we will use to show the current format
        var $formatFrame = editor.$formatFrame = $('<iframe frameborder="1" src="javascript:true;" style="overflow:hidden; height:25px;">')
        .hide()
        .appendTo($main);
        var formatWindow = $formatFrame[0].contentWindow;
        if (!formatWindow) {
            /* This editor is not yet attached to the main DOM. We can't do the rest of the refresh. */
            return;
        }
    
        var formatDoc = editor.formatDoc = formatWindow.document,
        $formatDoc = $(formatDoc);
        formatDoc.open();
        formatDoc.write(
            options.docType +
            '<html>' +
            '<body style="overflow: hidden; border: 1px solid black;' + options.bodyStyle + '">Current Format</body></html>'
            );
        formatDoc.close();
    
        // Create a new iframe
        var $frame = editor.$frame = $('<iframe frameborder="1" src="javascript:true;" style="overflow-x:hidden;">')
        .hide()
        .appendTo($main);

        // Load the iframe document content
        var contentWindow = $frame[0].contentWindow,
        doc = editor.doc = contentWindow.document,
        $doc = $(doc);

        doc.open();
        doc.write(
            options.docType +
            '<html>' +
            ((options.docCSSFile === '') ? '' : '<head><link rel="stylesheet" type="text/css" href="' + options.docCSSFile + '" /></head>') +
            '<body style="' + options.bodyStyle + '"></body></html>'
            );
        doc.close();

        // Work around for bug in IE which causes the editor to lose
        // focus when clicking below the end of the document.
        if (ie)
            $doc.click(function() {
                focus(editor);
            });

        // Load the content
        updateFrame(editor);

        // Bind the ie specific iframe event handlers
        if (ie) {

            // Save the current user selection. This code is needed since IE will
            // reset the selection just after the beforedeactivate event and just
            // before the beforeactivate event.
            $doc.bind("beforedeactivate beforeactivate selectionchange keypress", function(e) {

                // Flag the editor as inactive
                if (e.type == "beforedeactivate")
                    editor.inactive = true;

                // Get rid of the bogus selection and flag the editor as active
                else if (e.type == "beforeactivate") {
                    if (!editor.inactive && editor.range && editor.range.length > 1)
                        editor.range.shift();
                    delete editor.inactive;
                }

                // Save the selection when the editor is active
                else if (!editor.inactive) {
                    if (!editor.range)
                        editor.range = [];
                    editor.range.unshift(getRange(editor));

                    // We only need the last 2 selections
                    while (editor.range.length > 2)
                        editor.range.pop();
                }

            });

            // Restore the text range when the iframe gains focus
            $frame.focus(function() {
                restoreRange(editor);
            });

        }

        // Update the textarea when the iframe loses focus
        ($.browser.mozilla ? $doc : $(contentWindow)).blur(function(e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            updateTextArea(editor, true);
        });
        ($.browser.mozilla ? $doc : $(contentWindow)).focus(function(e) {
            //e.preventDefault();
            //e.stopImmediatePropagation();
        });
    
        // NOTE: we require that the browser supports iFrame design mode. Otherwise
        // this plugin will fail.
        $frame.show();
        $formatFrame.show();

        var $toolbar = editor.$toolbar,
        wid = options.width - ($toolbar.width() * 1.05),
        hgt;
        
        /* On iOS we cannot have independent scrollers inside a single page. The better
         * option is to let the iFrame expand to the full height of the content, which
         * is what this code is doing.
         */
        if (!iOS) {
            hgt = Math.max(options.height, $toolbar.outerHeight(true));
        }
        
    
        // Resize the main div.
        $main.width(wid);
        if (hgt) {
            $main.height(hgt);
        }

        // Resize the toolbar.
        //$toolbar.width(wid);

        // Resize the format frame.
        $formatFrame.width(wid);

        // Resize the iframe
        $frame.width(wid);
        if (hgt) {
            // Subtract 25 accounting for the formatFrame
            $frame.height(hgt - 25);
        }

        // Resize the textarea. IE6 textareas have a 1px top
        // & bottom margin that cannot be removed using css.
        editor.$area.width(wid);
        if (hgt) {
            editor.$area.height(ie6 ? hgt - 2 : hgt);
        }

        // Switch the iframe into design mode if enabled
        disable(editor, editor.disabled);
    
        // Put the focus on the editor. Otherwise when we try to top it does not work.
        focus(editor);
    }

    // restoreRange - restores the current ie selection
    function restoreRange(editor) {
        if (ie && editor.range)
            editor.range[0].select();
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
        restoreRange(editor);
        var range = getRange(editor);
        if (ie)
            return range.htmlText;
        var layer = $("<layer>")[0];
        layer.appendChild(range.cloneContents());
        var html = layer.innerHTML;
        layer = null;
        return html;
    }

    // selectedText - returns the current text selection or and empty string
    function selectedText(editor) {
        restoreRange(editor);
        if (ie) return getRange(editor).text;
        return getSelection(editor).toString();
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

            if (button.popupName) {
                var $popupDiv = $(DIV_TAG).attr({
                    'data-role' : 'fieldcontain'
                })
                .append($('<label />').attr({
                    'for' : buttonName + "-select",
                    'class' : 'select'
                }).append(button.title))
                .appendTo(popupMenu);
                $popupDiv.data(BUTTON_NAME, buttonName);
                createPopup(editor,
                    button,
                    buttonName + "-select",
                    $popupDiv,
                    menu);
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

                // Prepare the button image
                var map = {};
                if (button.css) map = button.css;
                else if (button.image) map.backgroundImage = imageUrl(button.image);
                if (button.stripIndex) map.backgroundPosition = button.stripIndex * -24;
                button.onCSS = map;

                // Add the unselectable attribute for ie
                if (ie)
                    $buttonDiv.attr(UNSELECTABLE, "on");
            }
        }
    }

    // showPopup - shows a popup
    function showPopup(editor, popup, button) {

        var offset, left, top, $popup = $(popup);

        // Determine the popup location
        if (button) {
            var $button = $(button);
            offset = $button.offset();
            left = --offset.left;
            top = offset.top + $button.height();
        }
        else {
            var $toolbar = editor.$toolbar;
            offset = $toolbar.offset();
            left = Math.floor(($toolbar.width() - $popup.width()) / 2) + offset.left;
            top = offset.top + $toolbar.height() - 2;
        }

        // Position and show the popup
        hidePopups();
        $popup.css({
            left: left, 
            top: top
        })
        .show();

        // Assign the popup button and click event handler
        if (button) {
            $popup.data(BUTTON, button);
            $popup.bind(CLICK, {
                popup: popup
            }, $.proxy(popupClick, editor));
        }

        // Focus the first input element if any
        setTimeout(function() {
            //$popup.find(":text,textarea").eq(0).focus().select();
            }, 100);

    }

    // sourceMode - returns true if the textarea is showing
    function sourceMode(editor) {
        return editor.$area.is(":visible");
    }

    // updateFrame - updates the iframe with the textarea contents
    function updateFrame(editor, checkForChange) {

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

        // Prevent script injection attacks by html encoding script tags
        html = html.replace(/<(?=\/?script)/ig, "&lt;");

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

        var html = $(editor.doc.body).html(),
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
        $(this.$fontMenu).closest(".ui-popup-container").next().remove();
        $(this.$fontMenu).closest(".ui-popup-container").remove();
        $(this.$styleMenu).closest(".ui-popup-container").next().remove();
        $(this.$styleMenu).closest(".ui-popup-container").remove();
        $(this.$formatMenu).closest(".ui-popup-container").next().remove();
        $(this.$formatMenu).closest(".ui-popup-container").remove();
        $(this.$actionMenu).closest(".ui-popup-container").next().remove();
        $(this.$actionMenu).closest(".ui-popup-container").remove();

        $(this.$fontMenu).find(".ui-color-picker").each(function() {
            var colorPickerId = $(this).data("colorpickerId");
            if (colorPickerId) {
                $('#' + colorPickerId).remove();
            }
        })
    }
})(jQuery);