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
     * Error codes
     */
    ERROR_OFFLINE_ACCESS : { code: 0, msg: "Cannot load this object while offline." },
    ERROR_INVALID_PARAMS : { code : 1, msg: "Parameters to an AJAX bean load must be an array of objects, each of the form { name:'<name>', value:<value> }." },
    ERROR_AJAX_LOAD_FAILED : { code : 2, msg : "AJAX load error." },

    /**
     * Options specifying the appearance of the loading message, which is displayed
     * automatically during all AJAX loads.
     */
    loadOptions: {
        pin : false
    },
    
    /**
     * Global map that maintains all config for each load command. This allows us to
     * easily create aggregate load commands.
     */
    loadCommands: {
        
    },
    
    /**
     * Show a loader with a text message.
     * 
     * @param msg Text message to show.
     * @param theme jQuery Mobile theme (optional, defaults to "a")
     */
    showLoader: function(msg, theme) {
        if (!theme) {
            theme = "a";
        }
        $.mobile.loading('show', {
            text: msg, 
            textVisible: true,
            theme: theme,
            textonly: false
        });
    },
    
    /**
     * Helper companion to showLoader. Hides the loader.
     */
    hideLoader: function() {
        $.mobile.loading('hide');
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
    
    defaultOnError: function(errorObj) {
      Helix.Utils.statusMessage("Load Failed", errorObj.msg, "severe");  
    },
    
    /**
     * Used to run a single load command that turns the results of multiple other load commands.
     * 
     * @param loadCommandOptions Parameters for this load command, including request options, loading
     * options, and commands - an array of objects each of which has a 'name' and an optional 'key' field.
     * The name is the name of the load command. The key is the itemKey used to synchronize this particular
     * item when the browser is offline.
     */
    ajaxAggregateLoad : function(loadCommandOptions) {
        var nObjsToSync = loadCommandOptions.commands.length;
        var nSchemasReady = 0;
        var schemaDone = function(schema, cfg) {
            cfg.schema = schema;
            if (nSchemasReady == nObjsToSync) {
                Helix.Ajax._executeAggregateLoad(loadCommandOptions);
            }
        };
        
        // Make sure we have schema objects for each load command.
        for (var i = 0; i < nObjsToSync; ++i) {
            var commandToLaunch = loadCommandOptions.commands[i].name;
            var commandConfig = Helix.Ajax.loadCommands[commandToLaunch];
            if (!commandConfig.schema) {
                commandConfig.schemaFactory(function(schema, cfg) {
                    ++nSchemasReady;
                    schemaDone(schema, cfg);
                }, [commandConfig]);
            } else {
                ++nSchemasReady;
                schemaDone(commandConfig.schema, commandConfig);
            }
        }
    },
    
    _executeAggregateLoad: function(loadCommandOptions) {
        // Execute the aggregate load.
        var nObjsToSync = loadCommandOptions.commands.length;
        var keyMap = {};
        loadCommandOptions.oncomplete = function(finalKey, name, obj) {
            for (var syncComponent in obj) {
                if (syncComponent == "__hx_schema") {
                    continue;
                }
                
                var config = Helix.Ajax.loadCommands[syncComponent];
                window[config.name] = obj[syncComponent];
                if (config.oncomplete) {
                    config.oncomplete(keyMap[config.name], config.name, obj[syncComponent]);
                }
            }
        };
        if (navigator.onLine) {
            loadCommandOptions.syncOverrides = {};
            loadCommandOptions.syncOverrides.schemaMap = {};
            for (var i = 0; i < nObjsToSync; ++i) {
                var commandToLaunch = loadCommandOptions.commands[i].name;
                keyMap[commandToLaunch] = loadCommandOptions.commands[i].key;
                
                var commandConfig = Helix.Ajax.loadCommands[commandToLaunch];
                loadCommandOptions.syncOverrides.schemaMap[commandToLaunch] = commandConfig;
            }
            Helix.Ajax.ajaxBeanLoad(loadCommandOptions);
        } else {
            // Run each item individually and synchronously.
            var syncComplete = function(idx) {
                if (idx < nObjsToSync) {
                    commandToLaunch = loadCommandOptions.commands[i].name;
                    commandConfig = Helix.Ajax.loadCommands[commandToLaunch];
                    var itemKey = loadCommandOptions.commands[i].key;
                    Helix.Ajax.synchronousBeanLoad(commandConfig,itemKey,syncComplete,++idx);
                }
            };

            syncComplete(0);
        }
    },
    
    synchronousBeanLoad: function(loadCommandOptions, itemKey, onComplete, opaque) {
        var origOncomplete = loadCommandOptions.oncomplete;
        loadCommandOptions.oncomplete = function(finalKey, name, finalObj) {
            origOncomplete(finalKey, name, finalObj);
            onComplete(opaque);
            loadCommandOptions.oncomplete = origOncomplete;
        };
        Helix.Ajax.ajaxBeanLoad(loadCommandOptions, itemKey);
    },
    
    ajaxBeanLoad : function(loadCommandOptions,itemKey,nRetries) {        
        // Set a default error handler if we do not have one.
        if (!loadCommandOptions.onerror) {
            loadCommandOptions.onerror = Helix.Ajax.defaultOnError;
        }
        
        // Setup loader options and show the loader.
        Helix.Ajax.loadOptions.pin = true;
        Helix.Ajax.setLoaderOptions(loadCommandOptions.loadingOptions);
        $.mobile.loading( 'show', Helix.Ajax.loadOptions);
        
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
                Helix.Ajax.ajaxBeanLoad(loadCommandOptions,itemKey,nRetries+1);
            }, 1000);
            return;
        }
        
        if (!loadCommandOptions.requestOptions.params) {
            loadCommandOptions.requestOptions.params = [];
        }
        if (!loadCommandOptions.requestOptions.params.push) {
            // the request options are not an array ...
            loadCommandOptions.onerror(Helix.Ajax.ERROR_INVALID_PARAMS)
            return;
        }
        loadCommandOptions.requestOptions.params.push({
            name: "__hxLoadKey",  
            value: loadCommandOptions.requestOptions.loadKey
        });

        if (!navigator.onLine) {
            // Use the key to sync from the local DB.
            if (itemKey) {
                Helix.DB.synchronizeObjectByKey(itemKey,loadCommandOptions.schema,function(widget) {
                    window[loadCommandOptions.name] = widget;
                    loadCommandOptions.oncomplete(itemKey, loadCommandOptions.name, widget);
                },loadCommandOptions.syncOverrides);
            } else if (itemKey == null) {
                /* An explicit null means load all objects. */
                Helix.DB.loadAllObjects(loadCommandOptions.schema, function(widgetList) {
                    window[loadCommandOptions.name] = widgetList;
                    loadCommandOptions.oncomplete(null, loadCommandOptions.name, widgetList);
                });
            } else {
                /* itemKey is undefined. Nothing we can do when we are offline. */
                loadCommandOptions.onerror(Helix.Ajax.ERROR_OFFLINE_ACCESS)
            }
            return;
        }

        $(document).trigger('prerequest');
        /* Give the browser a change to handle the event and show the loader. */
        setTimeout(function() {
            $.ajax({
                type: "POST",
                url: loadCommandOptions.requestOptions.postBack,
                dataType: "json",
                data: $.param(loadCommandOptions.requestOptions.params),
                success: function(data, status, xhr) {
                    var responseObj = data;
                    if (responseObj.error) {
                        var error = Helix.Ajax.ERROR_AJAX_LOAD_FAILED;
                        if (responseObj.error) {
                            error.msg = responseObj.error;
                        }
                        loadCommandOptions.onerror(error);
                        return;
                    }

                    if (loadCommandOptions.schema || responseObj.__hx_type == 1003) {
                        Helix.DB.synchronizeObject(responseObj, loadCommandOptions.schema, function(finalObj, finalKey) {
                            window[loadCommandOptions.name] = finalObj;
                            Helix.Ajax.loadOptions.pin = false;
                            loadCommandOptions.oncomplete(finalKey, loadCommandOptions.name, finalObj);
                            $.mobile.loading( "hide" );
                        }, itemKey, loadCommandOptions.syncOverrides);
                    } else {
                        loadCommandOptions.oncomplete(itemKey, "success");
                    }
                },
                error: function(xhr, status, errorThrown) {
                    var error = Helix.Ajax.ERROR_AJAX_LOAD_FAILED;
                    error.msg = status;
                    loadCommandOptions.onerror(error);
                },
                complete: function(xhr) {
                    $(document).trigger('postrequest', xhr);
                }
            });
        }, 0);
    },
    
    ajaxFormSubmit: function(url, formSelector, statusTitle, successMsg, pendingMsg, errorMsg, actions) {
        $(document).trigger('prerequest');
        if (actions && actions.beforeSubmit) {
            actions.beforeSubmit();
        }
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