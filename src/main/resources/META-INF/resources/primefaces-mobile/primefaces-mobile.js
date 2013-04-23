PrimeFaces.TextInputSelector = "[type='text'],[type='tel'],[type='range'],[type='number'],[type='email'],[type='password'],[type='date'],textarea";

PrimeFaces.ajax.AjaxUtils.updateElement = function(id, content) {        
    if(id == PrimeFaces.VIEW_STATE) {
        PrimeFaces.ajax.AjaxUtils.updateState.call(this, content);
    }
    else if(id == PrimeFaces.VIEW_ROOT) {
        document.open();
        document.write(content);
        document.close();
    }
    else {
        $(PrimeFaces.escapeClientId(id)).replaceWith(content);

        //PrimeFaces Mobile
        if($.mobile) {
            var context = $(PrimeFaces.escapeClientId(id)).parent(),
            controls = context.find("input, button, a[data-role='button'], ul");

            //input text and textarea
            controls.filter(PrimeFaces.TextInputSelector).textinput();
            
            //radio-checkbox
            controls.filter("[type='radio'], [type='checkbox']").checkboxradio();
            
            //selects
            controls.filter("select:not([data-role='slider'])" ).selectmenu();
            
            //slider
            controls.filter(":jqmData(type='range')").slider();
            
            //switch
            controls.filter("select[data-role='slider']" ).slider();
            
            //lists
            controls.filter("ul[data-role='listview']").listview();
            
            //buttons
            controls.filter("button, [type='button'], [type='submit'], [type='reset'], [type='image']").button();
            controls.filter("a").buttonMarkup();
            
            //field container
            context.find(":jqmData(role='fieldcontain')").fieldcontain();
            
            //control groups
            context.find(":jqmData(role='controlgroup')").controlgroup();
            
            //panel
            context.find("div[data-role='collapsible']").collapsible();
            
            //accordion
            context.find("div[data-role='collapsibleset']").collapsibleset();
            
            //navbar
            context.find("div[data-role='navbar']").navbar();
        }
    }
}

PrimeFaces.navigate = function(to, cfg) {
    cfg.changeHash = false;
    
    //cast
    cfg.reverse = (cfg.reverse == 'true' || cfg.reverse == true) ? true : false;

    $.mobile.changePage(to, cfg);
}

/**
 * PrimeFaces InputText Widget
 */
PrimeFaces.widget.InputText = PrimeFaces.widget.BaseWidget.extend({
    
    init: function(cfg) {
        this._super(cfg);
        this.input = this.jq.is(':input') ? this.jq : this.jq.children(':input');
        
        //Client behaviors
        if(this.cfg.behaviors) {
            PrimeFaces.attachBehaviors(this.input, this.cfg.behaviors);
        }
    }
});

/**
 * PrimeFaces InputText Widget
 */
PrimeFaces.widget.InputTextarea = PrimeFaces.widget.BaseWidget.extend({
    
    init: function(cfg) {
        this._super(cfg);
        this.input = this.jq.is(':input') ? this.jq : this.jq.children(':input');
        
        this.cfg.rowsDefault = this.input.attr('rows');
        this.cfg.colsDefault = this.input.attr('cols');

        //AutoResize
        if(this.cfg.autoResize) {
            this.setupAutoResize();
        }

        //max length
        if(this.cfg.maxlength){
            this.applyMaxlength();
        }

        //Client behaviors
        if(this.cfg.behaviors) {
            PrimeFaces.attachBehaviors(this.input, this.cfg.behaviors);
        }
    },
    
    setupAutoResize: function() {
        var _self = this;

        this.input.keyup(function() {
            _self.resize();
        }).focus(function() {
            _self.resize();
        }).blur(function() {
            _self.resize();
        });
    },
    
    resize: function() {
        var linesCount = 0,
        lines = this.input.val().split('\n');

        for(var i = lines.length-1; i >= 0 ; --i) {
            linesCount += Math.floor((lines[i].length / this.cfg.colsDefault) + 1);
        }

        var newRows = (linesCount >= this.cfg.rowsDefault) ? (linesCount + 1) : this.cfg.rowsDefault;

        this.input.attr('rows', newRows);
    },
    
    applyMaxlength: function() {
        var _self = this;

        this.input.keyup(function(e) {
            var value = _self.input.val(),
            length = value.length;

            if(length > _self.cfg.maxlength) {
                _self.input.val(value.substr(0, _self.cfg.maxlength));
            }
        });
    }
});

/**
 * PrimeFaces SelectBooleanCheckbox Widget
 */
PrimeFaces.widget.SelectBooleanCheckbox = PrimeFaces.widget.BaseWidget.extend({
    
    init: function(cfg) {
        this._super(cfg);
        
        this.input = $(this.jqId + '_input');

        if(this.cfg.behaviors) {
            PrimeFaces.attachBehaviors(this.input, this.cfg.behaviors);
        }
    }
});

/**
 * PrimeFaces SelectManyCheckbox Widget
 */
PrimeFaces.widget.SelectManyCheckbox = PrimeFaces.widget.BaseWidget.extend({
    
    init: function(cfg) {
        this._super(cfg);
        
        this.inputs = this.jq.find(':checkbox:not(:disabled)');
                        
        //Client Behaviors
        if(this.cfg.behaviors) {
            PrimeFaces.attachBehaviors(this.inputs, this.cfg.behaviors);
        }
    }
});

/**
 * PrimeFaces SelectOneRadio Widget
 */
PrimeFaces.widget.SelectOneRadio = PrimeFaces.widget.BaseWidget.extend({
    
    init: function(cfg) {
        this._super(cfg);

        this.inputs = this.jq.find(':radio:not(:disabled)');
                
        //Client Behaviors
        if(this.cfg.behaviors) {
            PrimeFaces.attachBehaviors(this.inputs, this.cfg.behaviors);
        }
    }
});

/**
 * PrimeFaces InputText Widget
 */
PrimeFaces.widget.MobilePanelGroup = PrimeFaces.widget.BaseWidget.extend({
    
    init: function(cfg) {
        this._super(cfg);
        this.id = PrimeFaces.escapeClientId(cfg.id);
        this.list = cfg.itemList;
        this.renderer = cfg.renderer;
        if (cfg.strings) {
            this.strings = cfg.strings.split(",");            
        }
        
        if (this.list) {
            this.refresh(this.list,cfg.condition);
        }
    },
    refresh: function(list,condition) {
        this.list = list;
        $(this.id).empty();
        if ((condition !== undefined) &&
            (!condition)) {
            /* The condition is false. Hide this in the DOM. */
            $(this.id).hide();
            return;
        } else {
            $(this.id).show();
            if ($.isArray(this.list)) {
                var parent = this;
                $.each(this.list, function(idx, elem) {
                    var parentDiv = $('<div />').appendTo($(parent.id));
                    parent.renderer(parentDiv, elem, this.strings);
                });
            } else {
                var parentDiv = $('<div />').appendTo($(this.id));
                this.renderer(parentDiv, this.list, this.strings);
            }
        }
    }
});

/**
 * Initialize and update the iScroll scrollers
 */
PrimeFaces.scrollerSel = '.pm-scroller,.pm-scroller-nozoom,.pm-scroller-zoomonly';

PrimeFaces.isScroller = function(elem) {
    if (elem && $(elem).is(PrimeFaces.scrollerSel)) {
        return true;
    }
    return false;
}

PrimeFaces.allScrollers = {};
PrimeFaces.addScrollers = function(elem) {
    var toAdd;
    if (elem === undefined) {
        toAdd = $.mobile.activePage.find(PrimeFaces.scrollerSel);
    } else {
        toAdd = $(elem);
    }
    
    toAdd.each(function(index, value) {            
        if (this.id in PrimeFaces.allScrollers) {
            //alert("REFRESH: " + this.id);
            PrimeFaces.allScrollers[this.id].refresh();
        } else {
            // Make sure we have at least one child, otherwise there is nothing to scroll
            // and iScroll fails.
            if ($(this).children().length == 0) {
                return;
            }
            
            var doZoom = true;
            var doScroll = true;
            var doHScroll = false;
            var doVScroll = doScroll;
            
            if ($(this).hasClass('pm-scroller-zoomonly')) {
                doScroll = false;
            } else if ($(this).hasClass('pm-scroller-nozoom')) {
                doZoom = false;
            } 
            
            if ($(this).hasClass('pm-scroller-horizontal')) {
                doHScroll = doScroll;
                doVScroll = false;
            }

            PrimeFaces.allScrollers[this.id] = new iScroll(this.id, {
                hScroll        : doHScroll,
                vScroll        : doVScroll,
                hScrollbar     : false,
                vScrollbar     : false,
                fixedScrollbar : false,
                fadeScrollbar  : false,
                hideScrollbar  : false,
                bounce         : true,
                momentum       : true,
                lockDirection  : true,
                zoom           : doZoom,
                onBeforeScrollStart: function (e) {
                    var target = e.target;
                    while (target.nodeType != 1) target = target.parentNode;

                    if (target.tagName != 'SELECT' && target.tagName != 'INPUT' && target.tagName != 'TEXTAREA'){
                        e.preventDefault();
                    }
                }
            });
        }
    });
}

var idsToUpdate = {};
PrimeFaces.UpdateScrollersForID = function(updateID, oldHeight, nRetries) {
    var obj = $(updateID);
    if (obj.length > 0 ) {
        var newHeight = obj.height();
        var heightUpdated = (newHeight != oldHeight);

        if (nRetries > 3 ||
            heightUpdated) {
            // If this or a parent object matches the scrollerSel then update it.
            PrimeFaces.addScrollers($(obj).closest(PrimeFaces.scrollerSel));

            // Update scrollers in child objects.
            PrimeFaces.addScrollers($(obj).find(PrimeFaces.scrollerSel));
            
            return true;
        }
    }
    return false;
}

PrimeFaces.UpdateScrollers = function() {
    var nupdates = 0;
    var toDelete = [];
    for (var update in idsToUpdate) {
        if (idsToUpdate.hasOwnProperty(update)) {
            var updateObj = idsToUpdate[update];
            updateObj.nretries = updateObj.nretries + 1;
           
            if (PrimeFaces.UpdateScrollersForID(update, 
                    updateObj.height, 
                    updateObj.nretries)) {
                toDelete.push(update);
            } else {
                ++nupdates;
            }
        }
    }
   
    for (key in toDelete) {
        delete idsToUpdate[key];
    }
   
    if (nupdates > 0) {
        setTimeout(function() {
            PrimeFaces.UpdateScrollers();
        }, 200);
    }
}

/**
 * Override the ajax request handler to track the height of the items we are updating.
 * When the response is received, we set a timeout handler that we try 3 times at 200ms intervals 
 * to wait for the height to update. When it has updated we reset the scrollers. The 3 retries
 * prevent us from infinitely trying and retrying in the event that the downloaded update has
 * the exact same height as the current html.
 */
$(document).bind('prerequest', function(ev, cfg) {
    if (cfg.update !== undefined) {
        var updatedIDs = cfg.update.split(" ");
        for (i = 0; i < updatedIDs.length; ++i) {
            /* Escape colons because primefaces use the colon character in its naming scheme ... */
            var updateSel = PrimeFaces.escapeClientId(updatedIDs[i]);
            
            /* Save off the current height of the element we are updating so that we can
             * tell post update when the rendering of the updated element is likely done.
             */
            idsToUpdate[updateSel] = { 
                height: $(updateSel).height(), 
                nretries: 0 
            };
            
            /* 
             * Clean up all scrollers that may be deleted when this item is updated.
             */
            $(updateSel).find(PrimeFaces.scrollerSel).each(function(index, element) {
                /* Save off the height of the item we are going to update. */
                var scrollerID = $(this).attr('id'); 
                delete PrimeFaces.allScrollers[scrollerID];
            });
        }
    }
});

$(document).bind('postrequest', function(ev, responseXML) {
    PrimeFaces.resizeDynamic();
    
    var xmlDoc = $(responseXML.documentElement),
    updates = xmlDoc.find('update');
    for(var i=0; i < updates.length; i++) {
        var updateID = updates.eq(i).attr('id');
        
        /* Escape colons because primefaces use the colon character in its naming scheme ... */
        var updateSel = PrimeFaces.escapeClientId(updateID);

        /* Determine if the item we have updated has children that are scrollers. If
         * so, make sure we create those scrollers from scratch. Otherwise we may end
         * up with bogus scrollers added by the pageshow event that are then overwritten
         * by an AJAX update that happens when the page is first loading.
         */
        $(updateSel).find(PrimeFaces.scrollerSel).each(function(index, element) {
            /* Save off the height of the item we are going to update. */
            var scrollerID = $(this).attr('id'); 
            delete PrimeFaces.allScrollers[scrollerID];
        });
        
        /*
         * Trigger JQM enhancement and our own enhancement on the updated markup.
         */
        $(updateSel).trigger("create");
        
        /*
         * Trigger our own enhancement event.
         */
        $(document).trigger('pmcreate', updateSel);
    }
    
    // Placing inside of setTimeout per the advice on cubiq.org/iscroll-4
    // in the "Mastering the Refresh() method" section
    setTimeout(function() {
        PrimeFaces.UpdateScrollers();
    }, 200);
});

var origRequest = PrimeFaces.ajax.AjaxRequest;
PrimeFaces.ajax.AjaxRequest = function(cfg, ext) {
    $(document).trigger('prerequest', cfg);
    origRequest.call(this, cfg, ext);
}

/**
 * Override the ajax response handler to refresh scrolling divs.
 */
var origResponse = PrimeFaces.ajax.AjaxResponse;
PrimeFaces.ajax.AjaxResponse = function (responseXML) {
    origResponse.call(this, responseXML);
    $(document).trigger('postrequest', responseXML);
}

/**
 * Utility functions.
 */
PrimeFaces.Utils =  {
    getPosition : function (element) {
        var xPosition = 0;
        var yPosition = 0;

        while(element) {
            xPosition += (element.offsetLeft - element.scrollLeft + element.clientLeft);
            yPosition += (element.offsetTop - element.scrollTop + element.clientTop);
            element = element.offsetParent;
        }
        return { x: xPosition, y: yPosition };
    },
    
    growl : function(id, summary, msg, severity) {
        var growl = new PrimeFaces.widget.Growl({
            id: id,
            msgs: [
                { summary : summary, detail: msg, severity: severity }
            ],
            life : 30000
        });
        $(growl.jqId + '_container').on('tap', function() {
            growl.removeAll(); 
        });
        return growl;
    },
    
    statusMessage : function(summary, msg, severity) {
        if (PrimeFaces.Utils.errorGrowl) {
            PrimeFaces.Utils.errorGrowl.show([
                { summary : summary, detail: msg, severity: severity }
                ]);
            return;
        }
        PrimeFaces.Utils.errorGrowl = PrimeFaces.Utils.growl("PrimeFacesStatus", summary, msg, severity);
    },
    
    ajaxFormSubmit : function(url, formID, msgTitle, successMsg, pendingMsg, failMsg, actions) {
        $.ajax({
                url: url,
                type: "POST",
                contentType: "application/x-www-form-urlencoded",
                data: $(PrimeFaces.escapeClientId(formID)).serialize(),
                statusCode: {
                    200: function(data, textStatus, jqXHR) {
                        // Show success message.
                        if (successMsg) {
                            PrimeFaces.Utils.statusMessage(msgTitle, successMsg, "info");
                        }
                        if (actions && actions.success) {
                            actions.success(data, textStatus, jqXHR);
                        }
                    },
                    999: function() {
                        // Container has told us we are offline.
                        if (pendingMsg) {
                            PrimeFaces.Utils.statusMessage(msgTitle, pendingMsg, "info");
                        }
                    }
                },
                error: function(jqXHR,textStatus,errorThrown) {
                    if (jqXHR.status != 999) {
                        // Display failMsg
                        if (failMsg) {
                            PrimeFaces.Utils.statusMessage(msgTitle, failMsg, "error");
                        }
                    }
                    if (actions && actions.error) {
                        actions.error(jqXHR,textStatus,errorThrown);
                    }
                }  
        });
    },
    ajaxJSONLoad: function(url,key,widgetVar,oncomplete,offlineSave) {
        url = url.replace("{key}", key);
        $.mobile.showPageLoadingMsg();
        $.ajax({
            url: url,
            type: "GET",
            dataType: "json",
            success: function(data,status,jqXHR) {
                if (data.__mh_error) {
                    PrimeFaces.Utils.statusMessage("AJAX Error", data.__mh_error, "severe");
                    jqXHR.__mh_failed = true;
                    return;
                }
                
                window[widgetVar] = data;
                if (offlineSave) {
                    // Save non-array types in the key-value store.
                    // Save array types in their own tables.
                    // Let all values remain encrypted. In the future we can add
                    // a parameter that specifies which fields are decrypted.
                }
            },
            complete: function(jqXHR,textStatus) {
                $.mobile.hidePageLoadingMsg();
                if (oncomplete && !jqXHR.__mh_failed) {
                    oncomplete(jqXHR, textStatus);
                }
            }
        });
    },
    paginator: {
        
        PAGINATOR_PREV_PAGE_LINK_CLASS : "ui-paginator-prev ui-state-default ui-corner-all",
        PAGINATOR_PREV_PAGE_ICON_CLASS : "ui-icon ui-icon-seek-prev",
        PAGINATOR_NEXT_PAGE_LINK_CLASS : "ui-paginator-next ui-state-default ui-corner-all",
        PAGINATOR_NEXT_PAGE_ICON_CLASS : "ui-icon ui-icon-seek-next",
        PAGINATOR_TOP_CONTAINER_CLASS : "ui-paginator ui-paginator-top ui-widget-header ui-corner-top",
        PAGINATOR_CURRENT_CLASS : "ui-paginator-current",
        
        currentPageDefaultTemplate : "({currentPage} of {totalPages})",
        
        renderers: {
            '{CurrentPageReport}' : function(obj, params) {
                if (!params.template) {
                    params.template = PrimeFaces.Utils.paginator.currentPageDefaultTemplate;
                }
                
                var startItem = 1;
                var totalPages = Math.floor(params.totalItems / params.itemsPerPage) + 1;
                var endItem = params.itemsPerPage;
                if (params.page >= 0) {
                    startItem = (params.itemsPerPage * params.page) + 1;
                    endItem = startItem + params.itemsPerPage;
                }
                if (endItem > params.totalItems) {
                    endItem = params.totalItems;
                }
                var output = params.template.replace("{currentPage}", params.page + 1)
                    .replace("{totalPages}", totalPages)
                    .replace("{totalRecords}", params.totalItems)
                    .replace("{startRecord}", startItem)
                    .replace("{endRecord}", endItem);

                obj.append($('<span />').attr({ 
                        'class' : PrimeFaces.Utils.paginator.PAGINATOR_CURRENT_CLASS 
                    }).append(output)
                );
            },
            '{PreviousPageLink}' : function(obj, params) {
                var output = $('<span />')
                    .attr({
                        'class' : PrimeFaces.Utils.paginator.PAGINATOR_PREV_PAGE_LINK_CLASS
                    }).append($('<span />')
                        .attr({
                            'class' : PrimeFaces.Utils.paginator.PAGINATOR_PREV_PAGE_ICON_CLASS
                        }).append("p")
                    );
                $(output).on('tap', function() {
                    params.prevPage.apply(params.owner);
                });
                obj.append(output);
            },
            '{NextPageLink}' : function(obj, params) {
                var totalPages = Math.floor(params.totalItems / params.itemsPerPage) + 1;
                var output = $('<span />')
                    .attr({
                        'class' : PrimeFaces.Utils.paginator.PAGINATOR_NEXT_PAGE_LINK_CLASS
                    }).append($('<span />')
                        .attr({
                            'class' : PrimeFaces.Utils.paginator.PAGINATOR_NEXT_PAGE_ICON_CLASS
                        }).append("p")
                    );
                $(output).on('tap', function() {
                    params.nextPage.apply(params.owner, [ totalPages ]);
                });
                obj.append(output);
            }
        },
        render: function(renderer, obj, params) {
            if (PrimeFaces.Utils.paginator.renderers[renderer]) {
                PrimeFaces.Utils.paginator.renderers[renderer](obj, params);
            }
        }
    },
    layoutFullHeightComponent: function(maxHeight, component) {
        var children = $(component).children();
        var totHeight = 0;
        for (var i = 0; i < children.length - 1; ++i) {
            if ($(children[i]).is("style,script")) {
                // Skip style and script tags - see note at http://api.jquery.com/height/
                continue;
            }

            var child_i_height = $(children[i]).height();
            totHeight += child_i_height;
        }
        $(children[children.length - 1]).height(maxHeight - totHeight);
        $(children).find('.pm-layout-full-height').each(function() {
            PrimeFaces.Utils.layoutFullHeightComponent($(this).parent().height(), this);
        });
    },
    resizePages: function() {
        var height = $(window).height();
        var width = $(window).width();

        /* In our mobile framework we never let pages scroll. Elements inside can scroll
        * using the scrollingDiv. Here we just take the min-height that jQuery has assigned
        * to a particular page and turn it into the page height. 
        */
        $.mobile.activePage.height(height);

        var headerHeight = $('[data-role="header"]', $.mobile.activePage).height();
        var footerHeight = $('[data-role="footer"]', $.mobile.activePage).height();
        var contentHeight = (.99 * height) - headerHeight - footerHeight;
        $('[data-role="content"]', $.mobile.activePage).css('height', contentHeight);
        $('[data-role="content"]', $.mobile.activePage).css('width', width);
        
        return contentHeight;
    },
    layoutPageFullScreen: function(pageID) {
        var contentHeight = PrimeFaces.Utils.resizePages();
        PrimeFaces.Utils.layoutFullHeightComponent(contentHeight, 
                $('[data-role="content"]', $.mobile.activePage));
        // Placing inside of setTimeout per the advice on cubiq.org/iscroll-4
        // in the "Mastering the Refresh() method" section
        setTimeout(function() {
            PrimeFaces.addScrollers();
        }, 0);        
    }
}

/**
 * Add the icon style class as an override to all icon button icons.
 */
$(document).bind('pageinit', function() {
    $('.iconbutton').each(function(index, value) {
        var btn = $(this).find('.ui-icon');
        var iconData = $(this).jqmData('icon');
        btn.removeClass('ui-icon').addClass(iconData + ' ui-icon');
    });
});

PrimeFaces.deviceType = (function() {
    if (window.screen.width <= 480) {
        return "phone";
    } else if (window.screen.width <= 767) {
        return "phablet";
    } else {
        return "tablet";
    }
})();