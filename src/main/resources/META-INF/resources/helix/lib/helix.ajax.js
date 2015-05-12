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
 * Show a loader pre-request.
 */
$(document).on('prerequest', function(ev, url, suspendSleep) {
    if (!Helix.Ajax.loadOptions.async) {
        $.mobile.loading( 'show', Helix.Ajax.loadOptions);
    } else {
        if (!Helix.Ajax.loadOptions.color) {
            Helix.Ajax.loadOptions.color = "#FF8000";
        }

        var header = $.mobile.activePage.find('[data-role="header"]');
        var origBG = $(header).css('background');
        var animateColor = function(doReverse) {
            $(header).animate({
                'background': (doReverse ? origBG : Helix.Ajax.loadOptions.color)
            }, {
                duration: 1200,
                complete: function() {
                    if (Helix.Ajax.loadCt >  0) {
                        animateColor(!doReverse);
                    } else {
                        $(header).css('background', '');
                    }
            }});
        };
        animateColor(false);
    }
    if (window.CordovaInstalled && suspendSleep) {
        window.HelixSystem.suspendSleep();
    }
    Helix.Ajax.loadCt++;
});

/**
 * Hide the loader post-request.
 */
$(document).on('postrequest', function(ev, url, resumeSleep) {
    if (!Helix.Ajax.loadOptions.pin) {
        if (!Helix.Ajax.loadOptions.async) {
            /* Hide the loader. */
            $.mobile.loading( "hide" );
        }
        if (window.CordovaInstalled && resumeSleep) {
            window.HelixSystem.allowSleep();
        }
    }

    /* Clear out the load options - this is meant as a per-load set of options. */
    Helix.Ajax.loadOptions = {};
    Helix.Ajax.loadCt--;
});

/**
 *
 */
$(document).ready(function() {
    if (Helix.Ajax.loadCt > 0) {
        $.mobile.loading( 'show', Helix.Ajax.loadOptions);
    }
});

/**
 * Capture offline/online transitions driven by the Cordova container.
 */
$(document).on('__hxOnline', function() {
    window.__hxOnLine = true;
});

$(document).on('__hxOffline', function() {
    window.__hxOnLine = false;
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
     * Count of on-going loads.
     */
    loadCt : 0,

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

    isDeviceOnline : function() {
        if (Helix.Ajax.forceDeviceOffline) {
            return false;
        }
        if (Helix.Ajax.forceDeviceOnline) {
            return true;
        }

        //alert("ONLINE2: " + window.__hxOnLine);
        if (window.__hxOnLine !== undefined) {
            return window.__hxOnLine;
        }

        return navigator.onLine;
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

    refreshLoader: function() {
        Helix.Ajax.hideLoader();
        $.mobile.loading( 'show', Helix.Ajax.loadOptions);
    },

    /*
     * Helper used to set loader options.
     */
    setLoaderOptions: function(loadingOptions) {
        if (!loadingOptions.theme) {
            loadingOptions.theme = "a";
        }
        if (!loadingOptions.async) {
            if (loadingOptions.message) {
                Helix.Ajax.loadOptions= {
                    aync: false,
                    text: loadingOptions.message,
                    textVisible: true,
                    theme: loadingOptions.theme,
                    textonly: false
                };
            } else {
                Helix.Ajax.loadOptions = {
                    async: false,
                    textVisible: false,
                    theme: loadingOptions.theme
                };
            }
        } else {
            Helix.Ajax.loadOptions = {
                async : true,
                color : loadingOptions.color
            };
        }
    },

    defaultOnError: function(errorObj) {
        Helix.Utils.statusMessage("Load Failed", errorObj.msg, "error");
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

        // Make sure we have schema objects for each load command.
        var schemaFactories = [];
        for (var i = 0; i < nObjsToSync; ++i) {
            var commandToLaunch = loadCommandOptions.commands[i].name;
            var commandConfig = Helix.Ajax.loadCommands[commandToLaunch];
            if (!commandConfig.schema) {
                schemaFactories.push(commandConfig);
            }
        }
        
        // If all schemas are already generated, we can just proceed here.
        if (schemaFactories.length === 0) {
            Helix.Ajax._executeAggregateLoad(loadCommandOptions);
            return;
        }
        
        // Only sync 1 schema at a time. We never want multiple threads in schemaSync at the same time.
        var __doSchema = function() {
            if (schemaFactories.length === 0) {
                Helix.Ajax._executeAggregateLoad(loadCommandOptions);
                return;
            }
            var nxtConfig = schemaFactories.pop();
            nxtConfig.schemaFactory(function(schema, cfg) {
                cfg.schema = schema;
                __doSchema();
            }, [nxtConfig], (schemaFactories.length > 0 ? true : false) /* No schema sync unless this is the last item. */);
        };
        __doSchema();
    },

    _executeAggregateLoad: function(loadCommandOptions) {
        // Execute the aggregate load.
        var nObjsToSync = loadCommandOptions.commands.length;
        var keyMap = {};
        var globalOnComplete = loadCommandOptions.oncomplete;

        loadCommandOptions.oncomplete = function(finalKey, name, obj, isAggregate, param) {
            for (var syncComponent in obj) {
                if (syncComponent === "__hx_schema") {
                    continue;
                }

                var config = Helix.Ajax.loadCommands[syncComponent];
                window[config.name] = obj[syncComponent];
                var componentObj = obj[syncComponent];
                if (componentObj.error) {
                    if (config.onerror) {
                        var error = Helix.Ajax.ERROR_AJAX_LOAD_FAILED;
                        if (componentObj.error.msg) {
                            error.msg = componentObj.error.msg;
                        }
                        if (componentObj.error.status) {
                            error.code = componentObj.error.status;
                        }
                        config.onerror(error);
                    }
                } else if (config.oncomplete) {
                    config.oncomplete(keyMap[config.name], config.name, componentObj, true, param[syncComponent]);
                }
            }
            if (globalOnComplete) {
                globalOnComplete(finalKey, name, obj, true, param); // The 'true' means this is an aggregate load
            }
        };
        if (Helix.Ajax.isDeviceOnline()) {
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
            var completions = [];

            // Run each item individually and synchronously.
            var syncComplete = function(idx) {
                if (idx < nObjsToSync) {
                    commandToLaunch = loadCommandOptions.commands[idx].name;
                    commandConfig = Helix.Ajax.loadCommands[commandToLaunch];
                    var itemKey = loadCommandOptions.commands[idx].key;
                    var completeObj = {
                        fn: loadCommandOptions.oncomplete,
                        thisArg: loadCommandOptions
                    };
                    loadCommandOptions.oncomplete = function(finalKey, name, finalObj) {
                        completeObj.args = [ finalKey, name, finalObj ];
                        completions.push(completeObj);
                        loadCommandOptions.oncomplete = completeObj.fn;
                    };
                    Helix.Ajax.synchronousBeanLoad(commandConfig,itemKey,syncComplete,++idx);
                } else {
                    for (var i = 0; i < nObjsToSync; ++i) {
                        if (completions.length > i && completions[i].fn) {
                            completions[i].fn.apply(completions[i].thisArg, completions[i].args);
                        }
                    }
                }
            };

            syncComplete(0);
        }
    },

    synchronousBeanLoad: function(loadCommandOptions, itemKey, onComplete, opaque) {
        var origOncomplete = loadCommandOptions.oncomplete;
        loadCommandOptions.oncomplete = function(finalKey, name, finalObj) {
            if (origOncomplete) {
                origOncomplete(finalKey, name, finalObj);
            }
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
        if (loadCommandOptions.onstart) {
            loadCommandOptions.onstart(loadCommandOptions.name);
        }

        // Setup loader options and show the loader.
        Helix.Ajax.setLoaderOptions(loadCommandOptions.loadingOptions);
        //$.mobile.loading( 'show', Helix.Ajax.loadOptions);

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
            if (loadCommandOptions.params) {
                loadCommandOptions.requestOptions.params = loadCommandOptions.params;
            } else {
                loadCommandOptions.requestOptions.params = [];            
            }
        }
        if (!loadCommandOptions.requestOptions.params.push) {
            // the request options are not an array ...
            loadCommandOptions.onerror(Helix.Ajax.ERROR_INVALID_PARAMS);
            return;
        }
        loadCommandOptions.requestOptions.params.push({
            name: "__hxLoadKey",
            value: loadCommandOptions.requestOptions.loadKey
        });
        loadCommandOptions.requestOptions.params.push({
            name: "__hxLoadMethod",
            value: loadCommandOptions.requestOptions.loadMethod
        });
        loadCommandOptions.requestOptions.params.push({
            name: "__hxGetMethod",
            value: loadCommandOptions.requestOptions.getMethod
        });

        if (!Helix.Ajax.isDeviceOnline()) {
            // Use the key to sync from the local DB.
            if (itemKey) {
                Helix.DB.synchronizeObjectByKey(itemKey,loadCommandOptions.schema,function(widget) {
                    window[loadCommandOptions.name] = widget;
                    loadCommandOptions.oncomplete(itemKey, loadCommandOptions.name, widget);
                },loadCommandOptions.syncOverrides);
            } else if (itemKey === null) {
                /* An explicit null means load all objects. */
                Helix.DB.loadAllObjects(loadCommandOptions.schema, function(widgetList) {
                    window[loadCommandOptions.name] = widgetList;
                    loadCommandOptions.oncomplete(null, loadCommandOptions.name, widgetList);
                });
            } else {
                /* itemKey is undefined. Nothing we can do when we are offline. */
                loadCommandOptions.onerror(Helix.Ajax.ERROR_OFFLINE_ACCESS);
            }
            return;
        }

        $(document).trigger('prerequest', [ loadCommandOptions.requestOptions.postBack, true ]);
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
                        if (responseObj.error.msg) {
                            error.msg = responseObj.error.msg;
                        } else if (Helix.Utils.isString(responseObj.error)) {
                            error.msg = responseObj.error;
                        }
                        if (responseObj.error.status) {
                            error.code = responseObj.error.status;
                        } else {
                           error.code = -1;
                        }                       
                        loadCommandOptions.onerror(error);
                        return;
                    }

                    Helix.Ajax.loadOptions.pin = true;

                    var syncObject = null;
                    var paramObject = null;
                    if (responseObj.__hx_type === 1004) {
                        syncObject = responseObj.sync;
                        paramObject = responseObj.param;
                    } else {
                        syncObject = responseObj;
                    }

                    if (loadCommandOptions.schema || (syncObject && syncObject.__hx_type === 1003)) {
                        if (loadCommandOptions.syncingOptions) {
                            Helix.Utils.statusMessage("Sync in progress", loadCommandOptions.syncingOptions.message, "info");
                        }
                        if (syncObject) {
                            // Add setTimeout to allow the message to display
                            setTimeout(Helix.DB.synchronizeObject(syncObject, loadCommandOptions.schema, function(finalObj, o) {
                                var finalKey = o.key;
                                $.mobile.loading( "hide" );
                                window[loadCommandOptions.name] = finalObj;
                                Helix.Ajax.loadOptions.pin = false;
                                loadCommandOptions.oncomplete(finalKey, loadCommandOptions.name, finalObj, false, (o.params ? o.params : paramObject));
                                if (window.CordovaInstalled) {
                                    window.HelixSystem.allowSleep();
                                }
                            }, { key: itemKey }, loadCommandOptions.syncOverrides), 0);
                        } else {
                            Helix.Ajax.loadOptions.pin = false;
                            loadCommandOptions.oncomplete(null, loadCommandOptions.name, null, false, paramObject);
                            if (window.CordovaInstalled) {
                                window.HelixSystem.allowSleep();
                            }
                        }
                    } else if (paramObject) {
                        Helix.Ajax.loadOptions.pin = false;
                        loadCommandOptions.oncomplete(itemKey, loadCommandOptions.name, null, false, paramObject);
                        if (window.CordovaInstalled) {
                            window.HelixSystem.allowSleep();
                        }
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
                    $(document).trigger('postrequest', [ loadCommandOptions.requestOptions.postBack, true ]);
                }
            });
        }, 0);
    },

    ajaxFormSubmit: function(url, formSelector, statusTitle, successMsg, pendingMsg, errorMsg, actions) {
        $(document).trigger('prerequest', [ url, false ]);
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
                    if (data.status === 0) {
                        if (successMsg) {
                            Helix.Utils.statusMessage(statusTitle, successMsg, "info");
                        }
                        if (actions && actions.success) {
                            actions.success(data, textStatus, jqXHR);
                        }
                    } else {
                        if (errorMsg) {
                            Helix.Utils.statusMessage("Error", errorMsg + ": " + data.msg, "severe");
                        } else {
                            Helix.Utils.statusMessage("Error", data.msg, "severe");
                        }
                        if (actions && actions.error) {
                            actions.error.call(window, data);
                        }
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
                $(document).trigger('postrequest', [ url, false ]);
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

    ajaxPost: function(params, callbacks) {
        Helix.Ajax.loadOptions = {
            async: (params.async !== undefined) ? params.async : true
        };
        $(document).trigger('prerequest', [ params.url, false ]);
        var didSucceed = false;
        if (Helix.Ajax.isDeviceOnline()) {
            $.ajax({
                url: params.url,
                type: 'POST',
                data: params.body,
                contentType: 'application/x-www-form-urlencoded',
                success: function(returnObj,textStatus,jqXHR) {
                    if (returnObj.status === 0) {
                        didSucceed = true;
                        if (params.success) {
                            Helix.Utils.statusMessage("Success", params.success, "info");
                        }

                        if (callbacks.success) {
                            callbacks.success.call(window, returnObj);
                        }
                    } else {
                        if (params.error) {
                            Helix.Utils.statusMessage("Error", params.error + ": " + returnObj.msg, "severe");
                        } else {
                            Helix.Utils.statusMessage("Error", returnObj.msg, "severe");
                        }
                        if (callbacks.error) {
                            callbacks.error.call(window, returnObj);
                        }
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    if (params.fatal) {
                        Helix.Utils.statusMessage("Error", params.fatal + ": " + errorThrown, "severe");
                    } else {
                        Helix.Utils.statusMessage("Error", errorThrown, "severe");
                    }
                    if (callbacks.fatal) {
                        callbacks.fatal.call(window, textStatus, errorThrown, jqXHR.status);
                    }
                },
                complete: function() {
                    if (callbacks.complete) {
                        callbacks.complete.call(window);
                    }
                    $(document).trigger('postrequest', [ params.url, false ]);
                },
                dataType: 'json'
            });
        } else {
            // Queue a post for the next time the container is online.
            if (params.disableOffline) {
                Helix.Utils.statusMessage('Offline', 'This operations is not available offline.', 'info');
            } else if (!window.CordovaInstalled) {
                alert("This device is offline and the browser does not support JavaScript extensions. Please try save this contact when you are online.");
            } else {
                // Collect the data we will need to continue this offline draft. Not always used or applicable.
                var refreshValues = null;
                if (params.form) {
                    refreshValues = params.form.getValues();
                    if (params.type) {
                        refreshValues['__type'] = params.type;
                    }
                }

                window.OfflinePost.savePost(params.url,
                    'application/x-www-form-urlencoded',
                    params.body,
                    refreshValues ? JSON.stringify(refreshValues) : '',
                    function() {
                        if (params.offlineSuccess) {
                            Helix.Utils.statusMessage("Action Queued", params.offlineSuccess, "info");
                        } else {
                            Helix.Utils.statusMessage("Action Queued",
                                "This action will be completed the next time you login to Link online.", "info");
                        }
                        if (callbacks.offlineSuccess) {
                            callbacks.offlineSuccess.call(window);
                        }
                        if (callbacks.complete) {
                            callbacks.complete.call(window);
                        }
                    },
                    function(msg) {
                        if (callbacks.fatal) {
                            callbacks.fatal.call(window, "Action Save Error", msg);
                        }
                        if (callbacks.complete) {
                            callbacks.complete.call(window);
                        }
                    }
                );
            }
            Helix.Ajax.hideLoader();
        }
    }
};