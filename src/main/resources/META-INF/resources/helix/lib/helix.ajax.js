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
(function() {
    if (!PrimeFaces || !PrimeFaces.ajax) {
        return;
    }
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
})();

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
    
    ajaxBeanLoad : function(requestOptions,loadingOptions,syncOverrides,widgetName,widgetSchema,onComplete,itemKey,nRetries) {        
        // Make sure the DB is ready. If not, wait 5 seconds.
        if (!Helix.DB.persistenceIsReady()) {
            if (!nRetries) {
                nRetries = 1;
            }
            // Wait 2s and try again.
            if (nRetries > 3) {
                alert("Failed to prepare the synchronization layer. Please contact your administrator.");
                return;
            }
            setTimeout(function() {
                Helix.Ajax.ajaxBeanLoad(requestOptions,loadingOptions,syncOverrides,widgetName,widgetSchema,onComplete,itemKey,nRetries+1);
            }, 2000);
            return;
        }
        
        if (!requestOptions.params) {
            requestOptions.params = [];
        }
        requestOptions.params.push({
            name: "__hxLoadKey",  
            value: requestOptions.loadKey
        });

        if (!navigator.onLine) {
            // Use the key to sync from the local DB.
            if (itemKey) {
                Helix.DB.synchronizeObjectByKey(itemKey,widgetSchema,function(widget) {
                    window[widgetName] = widget;
                    onComplete(itemKey, "success");
                },syncOverrides);
            } else {
                Helix.DB.loadAllObjects(widgetSchema, function(widgetList) {
                    window[widgetName] = widgetList;
                    onComplete(itemKey, "success");
                });
            }
            return;
        }

        // Setup loader options.
        Helix.Ajax.loadOptions.pin = true;
        Helix.Ajax.setLoaderOptions(loadingOptions);

        $(document).trigger('prerequest');
        $.ajax({
            type: "POST",
            url: requestOptions.postBack,
            dataType: "json",
            data: $.param(requestOptions.params),
            success: function(data, status, xhr) {
                var responseObj = data;
                if (responseObj.error) {
                    Helix.Utils.statusMessage("AJAX Load Error", responseObj.error, "severe");
                    return;
                }

                if (widgetSchema) {
                    Helix.DB.synchronizeObject(responseObj, widgetSchema, function(finalObj, finalKey) {
                        window[widgetName] = finalObj;
                        Helix.Ajax.loadOptions.pin = false;
                        $.mobile.loading( "hide" );
                        onComplete(finalKey, "success");
                    }, itemKey, syncOverrides);
                } else {
                    onComplete(itemKey, "success");
                }
            },
            error: function(xhr, status, errorThrown) {
                Helix.Utils.statusMessage("AJAX Load Error", status, "severe");
            },
            complete: function(xhr) {
                $(document).trigger('postrequest', xhr);
            }
        });
    },
    
    ajaxFormSubmit: function(url, formSelector, statusTitle, successMsg, pendingMsg, errorMsg, actions) {
        $(document).trigger('prerequest');
        $.ajax({
            type: "POST",
            url: url,
            dataType: "json",
            contentType: "application/x-www-form-urlencoded",
            data: $(PrimeFaces.escapeClientId(formSelector)).serialize(),
            statusCode: {
                200: function(data, textStatus, jqXHR) {
                    // Show success message.
                    if (successMsg) {
                        Helix.Utils.statusMessage(statusTitle, successMsg, "info");
                    }
                    if (actions && actions.success) {
                        actions.success(data, textStatus, jqXHR);
                    }
                },
                999: function() {
                    // Container has told us we are offline.
                    if (pendingMsg) {
                        Helix.Utils.statusMessage(statusTitle, pendingMsg, "info");
                    }
                }
            },
            error: function(jqXHR,textStatus,errorThrown) {
                if (jqXHR.status != 999) {
                    // Display failMsg
                    if (errorMsg) {
                        Helix.Utils.statusMessage(statusTitle, errorMsg, "error");
                    }
                }
                if (actions && actions.error) {
                    actions.error(jqXHR,textStatus,errorThrown);
                }
            },
            complete: function(xhr) {
                $(document).trigger('postrequest', xhr);
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
    }
};