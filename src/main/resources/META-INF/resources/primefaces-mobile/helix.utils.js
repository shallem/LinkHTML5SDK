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

/**
 * Utility functions.
 * 
 * @author Seth Hallem
 */
Helix.Utils =  {
    currentUniqueID : 0,
    
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
        if (Helix.Utils.errorGrowl) {
            Helix.Utils.errorGrowl.show([
                { summary : summary, detail: msg, severity: severity }
                ]);
            return;
        }
        Helix.Utils.errorGrowl = Helix.Utils.growl("PrimeFacesStatus", summary, msg, severity);
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
                            Helix.Utils.statusMessage(msgTitle, successMsg, "info");
                        }
                        if (actions && actions.success) {
                            actions.success(data, textStatus, jqXHR);
                        }
                    },
                    999: function() {
                        // Container has told us we are offline.
                        if (pendingMsg) {
                            Helix.Utils.statusMessage(msgTitle, pendingMsg, "info");
                        }
                    }
                },
                error: function(jqXHR,textStatus,errorThrown) {
                    if (jqXHR.status != 999) {
                        // Display failMsg
                        if (failMsg) {
                            Helix.Utils.statusMessage(msgTitle, failMsg, "error");
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
                    Helix.Utils.statusMessage("AJAX Error", data.__mh_error, "severe");
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
                    params.template = Helix.Utils.paginator.currentPageDefaultTemplate;
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
                        'class' : Helix.Utils.paginator.PAGINATOR_CURRENT_CLASS 
                    }).append(output)
                );
            },
            '{PreviousPageLink}' : function(obj, params) {
                var output = $('<span />')
                    .attr({
                        'class' : Helix.Utils.paginator.PAGINATOR_PREV_PAGE_LINK_CLASS
                    }).append($('<span />')
                        .attr({
                            'class' : Helix.Utils.paginator.PAGINATOR_PREV_PAGE_ICON_CLASS
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
                        'class' : Helix.Utils.paginator.PAGINATOR_NEXT_PAGE_LINK_CLASS
                    }).append($('<span />')
                        .attr({
                            'class' : Helix.Utils.paginator.PAGINATOR_NEXT_PAGE_ICON_CLASS
                        }).append("p")
                    );
                $(output).on('tap', function() {
                    params.nextPage.apply(params.owner, [ totalPages ]);
                });
                obj.append(output);
            }
        },
        render: function(renderer, obj, params) {
            if (Helix.Utils.paginator.renderers[renderer]) {
                Helix.Utils.paginator.renderers[renderer](obj, params);
            }
        }
    },
    getUniqueID : function() {
        ++Helix.Utils.currentUniqueID;
        return "pm_idt" + Helix.Utils.currentUniqueID;
    }
}