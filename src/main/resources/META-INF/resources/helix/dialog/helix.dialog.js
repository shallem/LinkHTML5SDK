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

    $.helixDialog = {
        // Define the defaults used for all new dialog instances
        defaultOptions: {
            hasForm: false,
            onConfirm: null,
            onDismiss: null,
            confirmTitle: "Confirm",
            dismissTitle: "Dismiss",
            positionTo: 'origin'
        }
    };
    
    // cleditor - creates a new editor for each of the matched textareas
    $.fn.helixDialog = function(options) {
      // Create a dialog on the element supplied.
      var elem = this[0];
      var data = $.data(elem, HXDIALOG);
      if (!data) {
          data = new helixDialog(elem, options);
          $(elem).data(HXDIALOG, data);
      }

      return data;

    };
    
    //==================
    // Private Variables
    //==================

    var
      HXDIALOG = "HXDIALOG";
  
  
    //============
    // Constructor
    //============

    // cleditor - creates a new editor for the passed in textarea element
    helixDialog = function(parent, options) {
        this.options = options = $.extend({}, $.helixDialog.defaultOptions, options);        
        this.$mainDiv = $(parent);
        this.name = options.name ? options.name : Helix.Utils.getUniqueID();

        this.refresh(true);
    }
    
    //===============
    // Public Methods
    //===============

    var fn = helixDialog.prototype,

    // Expose the following private functions as methods on the cleditor object.
    // The closure compiler will rename the private functions. However, the
    // exposed method names on the cleditor object will remain fixed.
    methods = [
      ["show", show],
      ["hide", hide],
      ["refresh", refresh],
      ["updateBody", updateBody],
      ["getForm", getForm, true]
    ];

    $.each(methods, function(idx, method) {
      fn[method[0]] = function() {
        var hxDialog = this, args = [hxDialog];
        // using each here would cast booleans into objects!
        for(var x = 0; x < arguments.length; x++) {args.push(arguments[x]);}
        var result = method[1].apply(hxDialog, args);
        if (method[2]) return result;
        return hxDialog;
      };
    });

    /**
     * Call this function to show the dialog.
     */
    function show(dialog,formElems,callbackThis,callbackArgs) {
        if (dialog.options.hasForm && formElems) {
            /* Layout the form dynamically. */
            Helix.Utils.layoutForm($(dialog.form), formElems);
            $(dialog.form).find('input,textarea').on(Helix.clickEvent, function(ev) {
                $(ev.target).focus();
                return false;
            });
        }
        $(dialog.$mainDiv).popup( "open", { 
            positionTo : dialog.options.positionTo
        });
        
        if (callbackThis) {
            this._callbackThis = callbackThis;
        }
        if (callbackArgs) {
            this._callbackArgs = callbackArgs;
        }
    }
    
    function getForm(dialog) {
        return dialog.form;
    }
    
    function hide() {
        $(this.$mainDiv).popup( "close" );
    }
    
    function refresh(isCreate) {
        this.$mainDiv.empty();
            
        encodeHeader(this, this.$mainDiv);
        encodeContent(this, this.$mainDiv);
        
        if (!isCreate) {
            this.$mainDiv.popup('refresh');
        } else {
            if (this.options.hasForm) {
                this.$mainDiv.popup({
                    theme: 'c',
                    corners: true
                });
                this.$mainDiv.append($('<div/>').attr({
                    'style' : 'padding: 10px 20px;'
                }));
            } else {
                this.$mainDiv.popup({
                    theme: 'c',
                    overlayTheme: 'c',
                    corners: true
                });
            }
        }
    }

    function updateBody(dialog,newBody) {
        this.options.bodyContent = newBody;
        this.refresh(false);
    }

    function encodeHeader(dialog,$mainDiv) {
        
        if (dialog.options.hasForm) {
            $mainDiv.append($('<h3/>').append(dialog.options.title));
        } else {
            // Apply classes manually because jQM enhancement of headers/footers only happens
            // on page create
            $mainDiv.append($('<div/>').attr({
             'data-role' : 'header',
             'data-theme' : 'd',
             'class' : (dialog.titleStyleClass ? dialog.titleStyleClass : '') + ' ui-corner-top ui-header ui-bar-a'
            }).append($('<h1/>').attr({
                'style' : 'margin-left: .5em', // remove icon empty margin
                'class' : 'ui-title'
            }).append(dialog.options.title)));            
        }
    }
    
    function encodeContent(dialog,$mainDiv) {
        var _self = dialog;
        var dialogContentClass = dialog.options.contentStyleClass;
        if (dialog.options.hasForm) {
            dialogContentClass = dialogContentClass + " ui-corner-bottom ui-content";
        } else {
            dialogContentClass = dialogContentClass + " ui-corner-bottom ui-content ui-body-d";
        }
        var $contentDiv = $('<div/>').attr({
            'class' : (dialogContentClass ? dialogContentClass : ''),
            'id' : dialog.options.id + "_content"
        });
        
        if (dialog.options.bodyHeader ||
                dialog.options.bodyContent) {
            $contentDiv.attr('data-role', 'content');
            $contentDiv.attr('data-theme', 'd');
            $contentDiv.attr('style', 'margin: .5em .5em .5em .5em');
        
            if (dialog.options.bodyHeader) {
                $contentDiv.append($('<p/>').attr({
                    'class' : 'ui-title'
                }).append(dialog.options.bodyHeader));
            }
            if (dialog.options.bodyContent) {
                $contentDiv.append($('<p/>').append(dialog.options.bodyContent));
            }
        } 
        
        if (dialog.options.hasForm) {
            dialog.form = $('<form/>').attr({
                'id' : dialog.name + "-form"
            });
            $contentDiv.append(dialog.form);
            $(dialog.form).on('submit', function(ev) {
                ev.preventDefault();
                var args = [];
                args.push($(dialog.form).serialize());
                if (_self._callbackArgs) {
                    args = args.concat(_self._callbackArgs);
                }
                $(dialog.form).find('input').blur();
                dialog.options.onConfirm.apply(_self._callbackThis ? _self._callbackThis: dialog, args);
                $(dialog.$mainDiv).popup( "close" );
                return false;
            });
        }
        
        /* CONFIRM first */

        /* Confirm button. */
        $contentDiv.append($('<a/>').attr({
            'href' : 'javascript:void(0)',
            'data-role' : 'button',
            'data-inline' : 'true',
            'data-theme' : 'b',
            'data-transition' : 'flow',
            'data-corners' : 'false',
            'style' : 'width: 90px',
            'id' : dialog.name + '-confirm'
        }).append(dialog.options.confirmTitle)
            .on(Helix.clickEvent, function(ev) {
                ev.preventDefault();
                var args = [];
                if (dialog.options.hasForm && dialog.form) {
                    args.push($(dialog.form).serialize());
                    $(dialog.form).find('input').blur();
                } else if (_self._callbackThis) {
                    args.push(dialog);
                }
                if (_self._callbackArgs) {
                    args = args.concat(_self._callbackArgs);
                }
                dialog.options.onConfirm.apply(_self._callbackThis ? _self._callbackThis: dialog, args);
                $(dialog.$mainDiv).popup( "close" );
                return false;
            }).button()
        );
        
        /* Cancel button. */
        $contentDiv.append($('<a/>').attr({
            'href' : 'javascript:void(0)',
            'data-role' : 'button',
            'data-inline' : 'true',
            'data-theme' : 'c',
            'data-corners' : 'false',
            'style' : 'width: 90px',
            'id' : dialog.name + '-cancel'
        }).append(dialog.options.dismissTitle)
            .on(Helix.clickEvent, function(ev) {
                ev.stopImmediatePropagation();
                if (dialog.options.onDismiss) {
                    dialog.options.onDismiss.call(dialog);
                }
                $(dialog.$mainDiv).popup( "close" );
                return false;
            }).button()
        );

        $mainDiv.append($contentDiv);
    }
    
})(jQuery);