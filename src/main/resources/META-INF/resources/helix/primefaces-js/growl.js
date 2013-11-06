/**
 * PrimeFaces Growl Widget
 * 
 * Converted into a jQuery plugin by Mobile Helix.
 */
(function($) {
    $.widget("helix.helixGrowl", {
        options: {
            /**
             * An array of messages to display in growl boxes. Each message is represented
             * by an object with three fields. The first, 'summary', is the header
             * of the growl box. The second, 'detail', is a more detailed message
             * in the growl box. The third, 'severity', is one of info, warn, error,
             * or fatal, and it dictates the status image shown in the growl box.  
             */
            msgs: [],
            
            /**
             * Indicate if the growl messages are text or raw HTML. true means
             * text, in which case the messages are escaped before rendering.
             */
            escape: true,
            
            /**
             * Indicate if this growl is sticky - i.e. it must display until the
             * user closes it manually. Otherwise it will close after the timeout
             * specified with the 'life' option. Default is false.
             */
            sticky: false,
            
            /**
             * Time (in milliseconds) after which the growl disappears. Note that
             * this option is only used if sticky is false. The default is 6 seconds.
             */
            life: 6000
            
        },
    
        _create: function() {
            this.id = Helix.Utils.getUniqueID();
            this.element.attr('id', this.id);
            this.jqId = PrimeFaces.escapeClientId(this.id);

            this.render();
        
            $(this.jqId + '_s').remove();
        },
    
        //Override
        refresh: function() {
            this.show(this.options.msgs);
        },
    
        show: function(msgs) {
            var _self = this;
        
            this.element.css('z-index', ++PrimeFaces.zindex);

            //clear previous messages
            this.removeAll();

            $.each(msgs, function(index, msg) {
                _self.renderMessage(msg);
            }); 
        },
    
        removeAll: function() {
            this.element.children('div.ui-growl-item-container').remove();
        },
    
        render: function() {
            //create container
            this.element.addClass('ui-growl');
            this.element.addClass('ui-widget');
            this.element.appendTo($(document.body));

            //render messages
            this.show(this.options.msgs);
        },
    
        renderMessage: function(msg) {
            var markup = '<div class="ui-growl-item-container ui-state-highlight ui-corner-all ui-helper-hidden ui-shadow">';
            markup += '<div class="ui-growl-item">';
            markup += '<div class="ui-growl-icon-close ui-icon ui-icon-delete" style="display:none"></div>';
            markup += '<span class="ui-growl-image ui-growl-image-' + msg.severity + '" />';
            markup += '<div class="ui-growl-message">';
            markup += '<span class="ui-growl-title"></span>';
            markup += '<p></p>';
            markup += '</div><div style="clear: both;"></div></div></div>';

            var message = $(markup),
            summaryEL = message.find('span.ui-growl-title'),
            detailEL = summaryEL.next();
        
            if(this.options.escape) {
                summaryEL.text(msg.summary);
                detailEL.text(msg.detail);
            }
            else {
                summaryEL.html(msg.summary);
                detailEL.html(msg.detail);
            }

            this.bindEvents(message);

            message.appendTo(this.element).fadeIn();
        },
    
        bindEvents: function(message) {
            var _self = this,
            sticky = this.options.sticky;

            message.mouseover(function() {
                var msg = $(this);

                //visuals
                if(!msg.is(':animated')) {
                    msg.find('div.ui-growl-icon-close:first').show();
                }
            })
            .mouseout(function() {        
                //visuals
                $(this).find('div.ui-growl-icon-close:first').hide();
            });

            //remove message on click of close icon
            message.find('div.ui-growl-icon-close').click(function(ev) {
                _self.removeMessage(message);

                //clear timeout if removed manually
                if(!sticky) {
                    clearTimeout(message.data('timeout'));
                }
                ev.stopPropagation();
                ev.stopImmediatePropagation();
                ev.preventDefault();
            });

            //hide the message after given time if not sticky
            if(!sticky) {
                this.setRemovalTimeout(message);
            }
        },
    
        removeMessage: function(message) {
            message.fadeTo('normal', 0, function() {
                message.slideUp('normal', 'easeInOutCirc', function() {
                    message.remove();
                });
            });
        },
    
        setRemovalTimeout: function(message) {
            var _self = this;

            var timeout = setTimeout(function() {
                _self.removeMessage(message);
            }, this.options.life);

            message.data('timeout', timeout);
        }
    });
}( jQuery ));