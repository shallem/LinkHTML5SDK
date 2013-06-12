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
 * Ajax functions.
 * 
 * @author Seth Hallem
 */

/**
 * Override the existing AJAX request handler to add a new pre-request trigger.
 */
PrimeFaces.ajax.origRequest = PrimeFaces.ajax.AjaxRequest;
PrimeFaces.ajax.AjaxRequest = function(cfg, ext) {
    $(document).trigger('prerequest', cfg);
    
    /**
     * Override the existing AJAX oncomplete handler to add a new post-request trigger.
     * This allows us to trigger the event after ALL updates and callbacks are done.
     */
    var origComplete;
    if (ext) {
        origComplete = ext.oncomplete;        
    } else {
        ext = {};
    }
    ext.oncomplete = function(xhr, status, args) {
        if (origComplete) {
            origComplete.call(this, xhr, status, args);
        }
        $(document).trigger('postrequest', xhr);
    };
    PrimeFaces.ajax.origRequest.call(this, cfg, ext);
}

/**
 * Show a loader pre-request.
 */
$(document).bind('prerequest', function() {
    $.mobile.loading( 'show', Helix.Ajax.loadOptions);
});

/**
 * Hide the loader post-request.
 */
$(document).bind('postrequest', function() {
    if (!Helix.Ajax.loadOptions.pin) {
        /* Hide the loader. */
        $.mobile.loading( "hide" );
    }
    
    /* Clear out the load options - this is meant as a per-load set of options. */
    Helix.Ajax.loadOptions = {};
});


/**
* Execute an AJAX load from a backing bean. This command is specifically used to
* load a JSON-serialized object using the new PrimeFaces "ClientData" annotations.
* These objects, once loaded, are synchronized to local storage. If the browser
* is offline when this function is invoked, then the objects are automatically
* loaded from local storage rather than going back to the server.
*/
Helix.Ajax = {
    /**
     * Options specifying the appearance of the loading message, which is displayed
     * automatically during all AJAX loads.
     */
    loadOptions: {
       pin : false
    },
    
    /*
     * Helper used to set loader options.
     */
    setLoaderOptions: function(loadingOptions) {
        if (!loadingOptions.theme) {
            loadingOptions.theme = "a";
        }
        if (loadingOptions.message) {
            Helix.Ajax.loadOptions= {
                text: loadingOptions.message, 
                textVisible: true,
                theme: loadingOptions.theme,
                textonly: false
            };
        } else {
            Helix.Ajax.loadOptions = {
                textVisible: false,
                theme: loadingOptions.theme
            };
        }
    },
    
    ajaxBeanLoad : function(requestOptions,loadingOptions,syncOverrides,widgetName,widgetSchema,onComplete,itemKey) {
        if (!requestOptions.params) {
            requestOptions.params = [];
        }
        requestOptions.params.push({
            name: requestOptions.id + "_reload",  
            value: true
        });

        if (!navigator.onLine) {
            // Use the key to sync from the local DB.
            if (itemKey) {
                PrimeFaces.DB.synchronizeObjectByKey(itemKey,widgetSchema,function(widget) {
                    window[widgetName] = widget;
                    onComplete(itemKey, "success");
                },syncOverrides);
            } else {
                PrimeFaces.DB.loadAllObjects(widgetSchema, function(widgetList) {
                    window[widgetName] = widgetList;
                    onComplete(itemKey, "success");
                });
            }
            return;
        }

        var options = {
            source: requestOptions.formId,
            update: requestOptions.id,
            formId: requestOptions.formId,
            process: requestOptions.formId,
            params: requestOptions.params,
            async: true
        };

        var _self = this;
        options.onsuccess = function(responseXML) {
            var responseObj;
            var xmlDoc = $(responseXML.documentElement),
            updates = xmlDoc.find("update");

            for(var i=0; i < updates.length; i++) {
                var update = updates.eq(i),
                updateid = update.attr('id'),
                content = update.text();

                if(updateid == requestOptions.id){
                    // Strip the script tag.
                    try {
                        responseObj = $.parseJSON(content);
                        if (responseObj.error) {
                            PrimeFaces.Utils.statusMessage("AJAX Load Error", responseObj.error, "severe");
                            return true;
                        }

                        if (widgetSchema) {
                            PrimeFaces.DB.synchronizeObject(responseObj, widgetSchema, function(finalObj, finalKey) {
                                window[widgetName] = finalObj;
                                Helix.Ajax.loadOptions.pin = false;
                                $.mobile.loading( "hide" );
                                onComplete(finalKey, "success");
                            }, itemKey, syncOverrides);
                        } else {
                            onComplete(itemKey, "success");
                        }
                        return true;
                    } catch(e) {
                        PrimeFaces.Utils.statusMessage("AJAX Load Error", e.message, "severe");
                        onComplete(itemKey, "error");
                        return true;
                    }
                }
                else {
                    PrimeFaces.ajax.AjaxUtils.updateElement.call(this, requestOptions.id, content);
                }
            }

            // Call the user's oncomplete function
            onComplete(itemKey, "success");
            return true;
        };

        options.onerror = function(xhr, status, errorThrown) {
            PrimeFaces.Utils.statusMessage("AJAX Load Error", status, "severe");
        };

        // Setup loader options.
        Helix.Ajax.loadOptions.pin = true;
        Helix.Ajax.setLoaderOptions(loadingOptions);

        PrimeFaces.ajax.AjaxRequest(options); 
    }
};