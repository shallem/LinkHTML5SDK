/**
 * Undo widget.
 * 
 * Displays a stylized box in the bottom right of the screen allowing a user to undo an action.
 * When the undo is displayed, two callbacks are required, an "undo" action and a "do" action. After
 * a specified timeout, the undo box is hidden and the "do" action is invoked. If the user taps the
 * box, the "undo" action is invoked and the box is hidden.
 */
(function($) {
    $.widget("helix.helixUndo", {
        options: {
            /**
             * A message to display to the user.
             */
            msg: '',
            
            /**
             * Time (in milliseconds) after which the undo disappears. The default is 4 seconds.
             */
            life: 4000,
            
            /**
             * doAction - callback to invoke if the user does not tap to undo.
             */
            doAction: null,
            
            /**
             * undoAction - callback to invoke if the user does tap to undo.
             */
            undoAction: null
            
        },
    
        _create: function() {
            this.id = Helix.Utils.getUniqueID();
            this.element.attr('id', this.id);
            this.jqId = PrimeFaces.escapeClientId(this.id);

            this.render();
        
            $(this.jqId + '_s').remove();
        },
    
        refresh: function() {
            this.show(this.options.msg, this.options.doAction, this.options.undoAction);
        },
    
        show: function(msg, doAction, undoAction, lifetime, args) {
            this.element.css('z-index', ++PrimeFaces.zindex);

            //clear previous messages
            if (this._timeout) {
                // Before we clear the old timeout, invoke the action (not the undo ...)
                clearTimeout(this._timeout);
                this._timeout = 0;
                doAction.apply(this, this.__doActionArgs);
            }
            this.removeAll();

            this.renderMessage(msg, doAction, undoAction, lifetime, args);
        },
    
        removeAll: function() {
            this.element.children('div.ui-hx-undo-item-container').remove();
        },
    
        render: function() {
            //create container
            this.element.addClass('ui-hx-undo');
            this.element.appendTo($(document.body));

            //render messages
            this.show(this.options.msg, this.options.doAction, this.options.undoAction, this.options.life, this.options.callbackArgs);
        },
    
        renderMessage: function(msg, doAction, undoAction, lifetime, args) {
            if (!doAction) {
                doAction = this.options.doAction;
            }
            if (!undoAction) {
                undoAction = this.options.undoAction;
            }
            
            var markup = '<div class="ui-hx-undo-item-container ui-corner-all ui-helper-hidden hx-full-width">';
            markup += '<div class="ui-hx-undo-item">';
            markup += '<div class="ui-icon ui-icon-close-white hx-display-inline" />';
            markup += '<div class="ui-hx-undo-message"/>';
            markup += '<div class="hx-undo-button hx-btn-border iconbutton hx-no-webkit-select"><div class="hx-undo-button-text">Undo</div></div>'
            markup += '</div></div></div>';

            var message = $(markup);
            var btn = message.find('.iconbutton');
            var msgEL = message.find('div.ui-hx-undo-message');
            msgEL.html(msg);

            message.appendTo(this.element);
            this.bindEvents(message, btn, doAction, undoAction, lifetime, args);
        },
    
        bindEvents: function(message, btn, doAction, undoAction, lifetime, args) {
            var _self = this;
            this._timeout = this.setRemovalTimeout(doAction, lifetime, args);

            //remove message on click of close icon
            var _bindTo = Helix.hasTouch ? 'touchstart' : Helix.clickEvent;
            btn.one(_bindTo, [this._timeout, args], function(ev) {
                _self.removeAll();
                undoAction.apply(_self, ev.data[1]);
                clearTimeout(ev.data[0]);
                _self._timeout = 0;

                ev.stopImmediatePropagation();
                return false;
            });
            message.one(_bindTo, function(ev) {
                _self.removeAll();
                ev.stopImmediatePropagation();
                return false;
            });
        },
    
        setRemovalTimeout: function(doAction, lifetime, args) {
            var _self = this;

            this.__doActionArgs = args;
            var timeout = setTimeout(function() {
                _self.removeAll();
                _self._timeout = 0;
                doAction.apply(_self, args);
            }, lifetime);

            return timeout;
        }
    });
}( jQuery ));