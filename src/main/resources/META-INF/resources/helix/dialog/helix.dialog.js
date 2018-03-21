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
            confirmText: "Confirm",
            dismissText: "Dismiss",
            positionTo: 'origin',
            noOpen: true,
            oncomplete: null /* called whenever the user dismisses the dialog, even if done by tapping outside the dialog. */
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
        this.isReady = false;
    };
    
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
        if (!this.isReady) {
            this.refresh(true);
            this.isReady = true;
        }
        
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
    
    function refresh(dialog, isCreate) {
        this.$mainDiv.empty();
        if (this.options.hasForm) {
            this.form = $('<form/>').attr({
                'id' : this.name + "-form"
            });
        }
        
        if (isCreate) {
            this.$mainDiv.popup({
                theme: 'd',
                overlayTheme: 'd',
                corners: true
            });
            this.$mainDiv.width('300px');
        }
        
        var _self = this;
        var onclose = function() {
            if (_self.options.onDismiss) {
                _self.options.onDismiss.call(_self);
            }
        };
        var closebtn = Helix.Layout._createButton(this.name + '-cancel', '90', 'c', this.$mainDiv, this.options.dismissText ? this.options.dismissText : 'Dismiss', onclose);
        
        var onconfirm = function() {
            var args = [];
            if (_self.options.hasForm && _self.form) {
                args.push($(_self.form).serialize());
                $(_self.form).find('input').blur();
            } else if (_self._callbackThis) {
                args.push(_self);
            }
            if (_self._callbackArgs) {
                args = args.concat(_self._callbackArgs);
            }
            _self.options.onConfirm.apply(_self._callbackThis ? _self._callbackThis: _self, args);
        };
        var confirmbtn = Helix.Layout._createButton(this.name + '-confirm', '90', 'b', this.$mainDiv, this.options.confirmText ? this.options.confirmText : 'Confirm', onconfirm);
        
        this.options.titleStyleClass = 'ui-header';
        var popup = Helix.Layout._layoutPopup(this.$mainDiv, this.options, [ confirmbtn, closebtn ], this.form);
        if (this.form) {
            $(this.form).on('submit', function(ev) {
                ev.stopImmediatePropagation();
                var args = [];
                args.push($(_self.form).serialize());
                if (_self._callbackArgs) {
                    args = args.concat(_self._callbackArgs);
                }
                $(_self.form).find('input').blur();
                _self.options.onConfirm.apply(_self._callbackThis ? _self._callbackThis: _self, args);
                $(_self.$mainDiv).popup( "close" );
                return false;
            });
        }
        if (this.options.oncomplete) {
            $(popup).on('popupafterclose', this.options.oncomplete);
        }
        
        _self.$mainDiv.trigger('create');
    }

    function updateBody(dialog,newBody) {
        this.options.bodyContent = newBody;
        this.refresh(false);
    }
    
})(jQuery);