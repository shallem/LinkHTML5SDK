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
    
    growl : function(summary, msg, severity, lifetime) {
        if (!lifetime) {
            lifetime = 10000;
        }
        
        var growlContainer = $('<div/>');
        var growl = growlContainer.helixGrowl({
            msgs: [
                { summary : summary, detail: msg, severity: severity }
            ],
            life : lifetime
        }).data('helix-helixGrowl');
        $(growlContainer).on('tap', function() {
            growl.removeAll(); 
        });
        return growl;
    },
    
    statusMessage : function(summary, msg, severity, lifetime) {
        if (Helix.Utils.errorGrowl) {
            Helix.Utils.errorGrowl.show([
                { summary : summary, detail: msg, severity: severity }
                ]);
        } else {
            Helix.Utils.errorGrowl = Helix.Utils.growl(summary, msg, severity, lifetime);
        }
        if (severity == 'error') {
            console.log('[ERROR] ' + msg);
        }
        $(document).trigger(severity, msg);
    },
    paginator: {
        
        PAGINATOR_PREV_PAGE_LINK_CLASS : "ui-paginator-prev ui-state-default ui-corner-all",
        PAGINATOR_PREV_PAGE_ICON_CLASS : "ui-icon ui-icon-back",
        PAGINATOR_NEXT_PAGE_LINK_CLASS : "ui-paginator-next ui-state-default ui-corner-all",
        PAGINATOR_NEXT_PAGE_ICON_CLASS : "ui-icon ui-icon-forward",
        PAGINATOR_TOP_CONTAINER_CLASS : "ui-paginator ui-paginator-top ui-widget-header",
        PAGINATOR_CURRENT_CLASS : "ui-paginator-current",
        
        currentPageDefaultTemplate : "({currentPage} of {totalPages})",
        
        renderers: {
            '{CurrentPageReport}' : function(obj, params) {
                if (!params.template) {
                    params.template = Helix.Utils.paginator.currentPageDefaultTemplate;
                }
                
                var startItem = 1;
                var totalPages = params.totalPages;
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
                    }).append($('<div />')
                        .attr({
                            'class' : Helix.Utils.paginator.PAGINATOR_PREV_PAGE_ICON_CLASS
                        }).append("&nbsp;")
                    );
                $(output).on(Helix.clickEvent, function(ev) {
                    ev.stopImmediatePropagation();
                    params.prevPage.apply(params.owner);
                    return false;
                });
                obj.append(output);
            },
            '{NextPageLink}' : function(obj, params) {
                var totalPages = Math.floor(params.totalItems / params.itemsPerPage) + 1;
                var output = $('<span />')
                    .attr({
                        'class' : Helix.Utils.paginator.PAGINATOR_NEXT_PAGE_LINK_CLASS
                    }).append($('<div />')
                        .attr({
                            'class' : Helix.Utils.paginator.PAGINATOR_NEXT_PAGE_ICON_CLASS
                        }).append("&nbsp;")
                    );
                $(output).on(Helix.clickEvent, function(ev) {
                    ev.stopImmediatePropagation();
                    params.nextPage.apply(params.owner, [ totalPages ]);
                    return false;
                });
                obj.append(output);
            }
        },
        render: function(renderer, obj, params) {
            // Compute total pages if it is not supplied.
            if (!params.totalPages) {
                if ((params.totalItems % params.itemsPerPage) == 0) {
                    params.totalPages = params.totalItems / params.itemsPerPage;
                } else {
                    params.totalPages = Math.floor(params.totalItems / params.itemsPerPage) + 1;
                }
            }
            if (Helix.Utils.paginator.renderers[renderer]) {
                Helix.Utils.paginator.renderers[renderer](obj, params);
            }
        }
    },
    getUniqueID : function() {
        ++Helix.Utils.currentUniqueID;
        return "pm_idt" + Helix.Utils.currentUniqueID;
    },
    escapeQuotes : function(str) {
        return str.replace(/"/g, "&quot;");
    },
    isString: function(x) {
        return typeof x == "string" || (typeof x == "object" && x.constructor === String);
    },
    objectsEqual: function(obj1, obj2) {
        for (var x in obj1) {
            if (!(x in obj2)) {
                return false;
            }
            if (obj1[x] != obj2[x]) {
                return false;
            }
        }
        
        // At this point, all properties in obj1 are in obj2 and all are equivalent
        // We need to make sure obj2 doesn't have any fields not in obj1.
        for (x in obj2) {
            if (!(x in obj1)) {
                return false;
            }
        }
        
        return true;
    },
    endsWith: function(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    },
    sizeIFrameToFit: function(frameID, parentID, sizeContentsToFit) {
        // Rewrite all links in the message body to open a new tab.
        var frame = document.getElementById(frameID);
        if (!frame) {
            return;
        }
        var frameHeight = null;
        var screenWidth = null;
        
        if (parentID) {
            var parent = document.getElementById(parentID);
            frameHeight = parent.clientHeight;
            screenWidth = parent.clientWidth;
        } else {
            frameHeight = frame.contentWindow.document.body.scrollHeight;
            screenWidth = screen.width;
        }

        // First resize the iframe.
        var frameWidth = frame.contentWindow.document.body.scrollWidth;

        // Now scale it if the width is greater than the screen width.
        if (frameWidth > screen.width && sizeContentsToFit) {
            var scalingFactor = screen.width / frameWidth;
            $(frame.contentWindow.document.body).closest('html')
                .css('-webkit-transform-origin', '0 0')
                .css('-webkit-transform', 'scale(' + scalingFactor + ')');
            frame.height = (frameHeight * scalingFactor * 1.01) + "px";
        } else {
            frame.height= (frameHeight) + "px";
        }
        frame.width= (screenWidth) + "px";
    },
    isPhone: function() {
        if (Helix.Utils._isPhone !== undefined) {
            return Helix.Utils._isPhone;
        }
        
        if (navigator.userAgent.toLowerCase().match(/iphone/)) {
            Helix.Utils._isPhone = true;
        }
        // XXX: need to extend to more phones as we support them.
        Helix.Utils._isPhone = false;
    }
}