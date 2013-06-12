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
            confirmId: null,
            dismissId: null,
            formId: null,
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

        helixDialog.refresh();
        
        /* Create all jQuery components inside of the container. */
        $(parent).trigger("create");
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
    function show(formElems) {
        if (this.options.hasForm && this.options.formId && formElems) {
            /* Layout the form dynamically. */
            PrimeFaces.Utils.layoutForm($(this.options.formId), formElems);
        }
        this.popup.popup( "open", { 
            positionTo : this.options.positionTo
        });
    }
    
    function hide() {
        this.popup.popup( "close" );
    }
    
    function refresh() {
        $(PrimeFaces.escapeClientId(this.options.id)).empty();
        var $mainDiv = this.popup = $('<div/>').attr({
            'id' : PrimeFaces.Utils.getUniqueID(),
            'data-role' : 'popup',
            'class' : this.options.styleClass + " ui-corner-all",
            'style' : this.options.style
        });
        if (this.options.hasForm) {
            $mainDiv.attr('data-theme', 'a');
            $mainDiv.append($('<div/>').attr({
                'style' : 'padding: 10px 20px;'
            }));
        } else {
            $mainDiv.attr('data-theme', 'c');
            $mainDiv.attr('data-overlay-theme', 'a');
        }
                
        encodeHeader(this, $mainDiv);
        encodeContent(this, $mainDiv);
    }

    function encodeHeader(dialog,$mainDiv) {
        
        if (dialog.hasForm) {
            $mainDiv.append($('<h3/>').append(dialog.title));
        } else {
            $mainDiv.append($('<div/>').attr({
                'data-role' : 'header',
                'data-theme' : 'a',
                'class' : dialog.titleStyleClass + ' ui-corner-top'
            }).append($('<h1/>').append(dialog.title)));            
        }
    }
    
    function encodeContent(dialog,$mainDiv) {
        var dialogContentClass = dialog.contentStyleClass;
        if (dialog.hasForm) {
            dialogContentClass = dialogContentClass + " ui-corner-bottom ui-content";
        }
        var $contentDiv = $('<div/>').attr({
            'class' : dialogContentClass,
            'id' : dialog.options.id + "_content"
        });
        
        if (!dialog.hasForm) {
            $contentDiv.attr('data-role', 'content');
            $contentDiv.attr('data-theme', 'd');
        
            $contentDiv.append($('<h3/>').append(dialog.bodyHeader));
            $contentDiv.append($('<p/>').append(dialog.bodyContent));
        } else {
            $contentDiv.append($('<form/>').attr({
                'id' : dialog.options.id + "_form"
            }));
        }
        
        /* Cancel button. */
        $contentDiv.append($('<a/>').attr({
            'href' : 'javascript:void(0)',
            'data-role' : 'button',
            'data-inline' : 'true',
            'data-theme' : 'c'
        }).append(dialog.dismissTitle)
            .on('tap', function(ev) {
                ev.preventDefault();
                dialog.popup.popup( "close" );
            }
        ));
        
        /* Confirm button. */
        $contentDiv.append($('<a/>').attr({
            'href' : 'javascript:void(0)',
            'data-role' : 'button',
            'data-inline' : 'true',
            'data-them' : 'b',
            'data-transition' : 'flow'
        }).append(dialog.confirmTitle)
            .on('tap', function(ev) {
                ev.stopPropagation();
                ev.preventDefault();
                if (dialog.options.hasForm && dialog.options.formId) {
                    dialog.options.onConfirm.call(dialog, $.serialize(dialog.options.formId));
                } else {
                    dialog.options.onConfirm.call(dialog);
                }
                dialog.popup.popup( "close" );
            })
        );

        $mainDiv.append($contentDiv);
    }
    
})(jQuery);