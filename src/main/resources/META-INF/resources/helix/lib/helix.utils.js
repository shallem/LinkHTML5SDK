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
    
    growl : function(summary, msg, severity, lifetime, doEscape) {
        if (!lifetime) {
            lifetime = 10000;
        }
        
        var growlContainer = $('<div/>');
        var growl = growlContainer.helixGrowl({
            msgs: [
                { summary : summary, detail: msg, severity: severity }
            ],
            life : lifetime,
            escape: (doEscape ? true : false)
        }).data('helix-helixGrowl');
        $(growlContainer).on('tap swipe', function(ev) {
            ev.stopImmediatePropagation();
            $(growlContainer).off('tap swipe');
            growl.removeAll(); 
            return false;
        });
        return growl;
    },
    
    successMessage: function() {
        Helix.Utils.statusMessage('', '', 'success', 4000);
    },
    
    statusMessage : function(summary, msg, severity, lifetime) {
        if (Helix.Utils.errorGrowl) {
            if (lifetime) {
                Helix.Utils.errorGrowl.options.life = lifetime;
            }
            Helix.Utils.errorGrowl.show([
                { summary : summary, detail: msg, severity: severity }
                ]);
        } else {
            Helix.Utils.errorGrowl = Helix.Utils.growl(summary, msg, severity, lifetime);
        }
    },

    undoMessage: function(msg, doAction, undoAction, lifetime, args) {
        if (!lifetime) {
            lifetime = 4000;
        }
        if (Helix.Utils.undoBox) {
            Helix.Utils.undoBox.show(msg, doAction, undoAction, lifetime, args);
        } else {
            Helix.Utils.undoBox = $('<div/>').helixUndo({
                msg : msg,
                doAction: doAction,
                undoAction: undoAction,
                life: lifetime,
                callbackArgs: args
            }).data('helix-helixUndo');
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
    sizeIFrameToFit: function(frameID, parentID, sizeContentsToFit, clearOnLoad) {
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
        if (clearOnLoad) {
            frame.onload = null;
        }
    },
    isPhone: function() {
        if (Helix.Utils._isPhone === undefined) {
            if (navigator.userAgent.toLowerCase().match(/iphone/)) {
                Helix.Utils._isPhone = true;
            } else {
                // XXX: need to extend to more phones as we support them.
                Helix.Utils._isPhone = false;
            }
        }
        
        return Helix.Utils._isPhone;
    },
    escapeClientId : function(id) {
        return "#" + id.replace(/:/g,"\\:");
    },

    isImageLoaded: function(img) {
        if ($.isArray(img)) {
            if (!img.length) {
                return false;
            }
            
            img = img[0];
        }
        
        // During the onload event, IE correctly identifies any images that
        // weren’t downloaded as not complete. Others should too. Gecko-based
        // browsers act like NS4 in that they report this incorrectly.
        if (!img.complete) {
            return false;
        }

        // No other way of checking: assume it’s ok.
        return true;
    },
    
    crossAppArgs: function(appID, action, argsObj) {
        return 'appid=' + encodeURIComponent(appID) +
                    '&action=' + encodeURIComponent(action) +
                    '&args=' + encodeURIComponent(JSON.stringify(argsObj));
    },
    
    getURLParameters : function() {
        var sPageURL = window.location.search.substring(1),
        sURLVariables = sPageURL.split('&'),
        i,
        ret = {};

        for (i = 0; i < sURLVariables.length; i++) {
            var nxt = sURLVariables[i].split('=');
            ret[decodeURIComponent(nxt[0])] = decodeURIComponent(nxt[1]);
        }
        return ret;
    },
    
    getParameterByName: function(name, url) {
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
                results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    },
    
    throttle: function(fn, threshhold, scope, queueThrottled) {
        threshhold || (threshhold = 250);
        var last,
                deferTimer;
        return function() {
            var context = scope || this;
            var now = +new Date,
                    args = arguments;
            if (last && now < last + threshhold) {
                if (queueThrottled === true) {
                    clearTimeout(deferTimer);
                    deferTimer = setTimeout(function() {
                        last = now;
                        fn.apply(context, args);
                    }, threshhold + last - now);
                }
            } else {
                last = now;
                fn.apply(context, args);
            }
        };
    }
};
