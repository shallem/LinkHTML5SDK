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

        this.refresh();
        
        this.$mainDiv.popup();
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
      ["refresh", refresh]
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
    function show(dialog,formElems) {
        if (dialog.options.hasForm && formElems) {
            /* Layout the form dynamically. */
            Helix.Utils.layoutForm($(dialog.form), formElems);
        }
        $(dialog.$mainDiv).popup( "open", { 
            positionTo : dialog.options.positionTo
        });
    }
    
    function hide() {
        $(this.$mainDiv).popup( "close" );
    }
    
    function refresh() {
        this.$mainDiv.empty();
        
        if (this.options.hasForm) {
            this.$mainDiv.attr('data-theme', 'a');
            this.$mainDiv.append($('<div/>').attr({
                'style' : 'padding: 10px 20px;'
            }));
        } else {
            this.$mainDiv.attr('data-theme', 'c');
            this.$mainDiv.attr('data-overlay-theme', 'a');
        }
    
        encodeHeader(this, this.$mainDiv);
        encodeContent(this, this.$mainDiv);
    }

    function encodeHeader(dialog,$mainDiv) {
        
        if (dialog.options.hasForm) {
            $mainDiv.append($('<h3/>').append(dialog.options.title));
        } else {
            $mainDiv.append($('<div/>').attr({
                'data-role' : 'header',
                'data-theme' : 'a',
                'class' : dialog.titleStyleClass + ' ui-corner-top'
            }).append($('<h1/>').append(dialog.options.title)));            
        }
    }
    
    function encodeContent(dialog,$mainDiv) {
        var dialogContentClass = dialog.options.contentStyleClass;
        if (dialog.options.hasForm) {
            dialogContentClass = dialogContentClass + " ui-corner-bottom ui-content";
        }
        var $contentDiv = $('<div/>').attr({
            'class' : dialogContentClass,
            'id' : dialog.options.id + "_content"
        });
        
        if (!dialog.options.hasForm) {
            $contentDiv.attr('data-role', 'content');
            $contentDiv.attr('data-theme', 'd');
        
            if (dialog.options.bodyHeader) {
                $contentDiv.append($('<h3/>').append(dialog.options.bodyHeader));
            }
            if (dialog.options.bodyContent) {
                $contentDiv.append($('<p/>').append(dialog.options.bodyContent));
            }
        } else {
            dialog.form = $('<form/>').attr({
                'id' : dialog.options.id + "_form"
            });
            $contentDiv.append(dialog.form);
        }
        
        /* Cancel button. */
        $contentDiv.append($('<a/>').attr({
            'href' : 'javascript:void(0)',
            'data-role' : 'button',
            'data-inline' : 'true',
            'data-theme' : 'c'
        }).append(dialog.options.dismissTitle)
            .on('tap', function(ev) {
                ev.stopImmediatePropagation();
                if (dialog.options.onDismiss) {
                    dialog.options.onDismiss.call(dialog);
                }
                $(dialog.$mainDiv).popup( "close" );
                return false;
            }).button()
        );
        
        /* Confirm button. */
        $contentDiv.append($('<a/>').attr({
            'href' : 'javascript:void(0)',
            'data-role' : 'button',
            'data-inline' : 'true',
            'data-theme' : 'b',
            'data-transition' : 'flow'
        }).append(dialog.options.confirmTitle)
            .on('tap', function(ev) {
                ev.preventDefault();
                if (dialog.options.hasForm && dialog.form) {
                    dialog.options.onConfirm.call(dialog, $(dialog.form).serialize());
                } else {
                    dialog.options.onConfirm.call(dialog);
                }
                $(dialog.$mainDiv).popup( "close" );
                return false;
            }).button()
        );

        $mainDiv.append($contentDiv);
    }
    
})(jQuery);