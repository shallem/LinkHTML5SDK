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

$(document).on('cordovaReady', function() {
    document.addEventListener('pause', function() {
        // The native app will kill all in progress network requests when it receives the pause event.
        Helix.Ajax.loadCt = 0;
        $('.hx-loading').removeClass('hx-loading'); 
    }, false);    
});

/**
 * Show a loader pre-request.
 */
$(document).on('prerequest', function(ev, page, url, suspendSleep, loadingDelegate, loadingMessage, loadingOptions) {
    if (loadingDelegate) {
        if (loadingDelegate === true) {
            return;
        }
        loadingDelegate.startLoading(loadingMessage);
    } else {
        if (!loadingOptions) {
            loadingOptions = {
                async: true
            };
        }
        
        if (!loadingOptions.silent) {
            if (!loadingOptions.async) {
                $.mobile.loading( 'show', loadingOptions);
            } else {
                if (!loadingOptions.color) {
                    loadingOptions.color = "#FF8000";
                }

                Helix.Ajax.loadCt++;
                if (Helix.compatibility.animation) {
                    page.find('[data-role="header"]').addClass('hx-loading');
                } else {
                    var header = page.find('[data-role="header"]');
                    var origBG = $(header).css('background');
                    var animateColor = function(doReverse) {
                        $(header).animate({
                            'background': (doReverse ? origBG : loadingOptions.color)
                        }, {
                            duration: 1200,
                            complete: function() {
                                if (Helix.Ajax.loadCt >  0 || loadingOptions.pin) {
                                    animateColor(!doReverse);
                                } else {
                                    $(header).css('background', '');
                                }
                        }});
                    };
                    animateColor(false);
                }
            }
        }
    }
    if (window.CordovaInstalled && suspendSleep) {
        window.HelixSystem.suspendSleep();
    }
});

/**
 * Hide the loader post-request.
 */
$(document).on('postrequest', function(ev, page, url, resumeSleep, loadingDelegate, loadingOptions) {
    if (loadingDelegate) {
        if (loadingDelegate === true) {
            return;
        }
        loadingDelegate.stopLoading();
    } else {
        if (!loadingOptions) {
            loadingOptions = {
                async: true
            };
        }
        if (!loadingOptions.silent) {
            if (!loadingOptions.async) {
                if (!loadingOptions.pin) {
                    /* Hide the loader. */
                    Helix.Ajax.hideLoader();
                }
            } else {
                Helix.Ajax.loadCt--;
                /* Clear out the load options - this is meant as a per-load set of options. */
                if (Helix.compatibility.animation && Helix.Ajax.loadCt <=  0 && !loadingOptions.pin) {
                    $('.hx-loading').removeClass('hx-loading');
                }
            }
        }
    }
    
    if (window.CordovaInstalled && resumeSleep) {
        window.HelixSystem.allowSleep();
    }
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
 * For when Cordova is not installed, create a database for caching offline actions that will be flushed
 * to the network when the app is activated.
 */
$(document).on('hxGenerateSchemas', function() {
    if (!window.cordovaInstalled) {
        Helix.Ajax.offlineNetworkQueue =  Helix.DB.createSchemaForTable('OfflineNetworkQueue', {
            url: "TEXT",
            body: "TEXT",
            json: "TEXT",
            status: "TEXT",
            error: "TEXT"
        }, [], '');
    }
});

$(document).on('helixready', function() {
    if (Helix.Ajax.isDeviceOnline()) {
        Helix.Ajax.failedOfflineActions = [];
        if (!window.CordovaInstalled) {
            // Execute any queued posts.
            var nQueuedActions = 0;
            var doneQueuedActions = 0;
            Helix.Ajax.offlineNetworkQueue.all().noFlush().newEach({
                startFn: function(ct) {
                    nQueuedActions = ct;
                },
                eachFn: function(elem) {
                    Helix.Ajax.ajaxPost({
                        silentMode: true,
                        url: elem.url,
                        body: elem.body
                    }, {
                        success: function() {
                            if (Helix.Ajax.postedOfflineActionsCallback) {
                                Helix.Ajax.postedOfflineActionsCallback(elem);
                            }
                            persistence.remove(elem);
                        },
                        error: function(obj) {
                            elem.status = obj.code;
                            elem.error = obj.msg;
                            if (obj.code === -3) {
                                // this is a non-fatal error, so we still remove this action from the DB.
                                persistence.remove(elem);
                            }
                            Helix.Ajax.failedOfflineActions.push(elem);
                        },
                        fatal: function(textStatus, errorThrown, xhrStatus) {
                            elem.status = xhrStatus;
                            elem.error = errorThrown;
                            Helix.Ajax.failedOfflineActions.push(elem);
                        },
                        complete: function() {
                            ++doneQueuedActions;
                            if (doneQueuedActions === nQueuedActions) {
                                // We have processed all actions. See if there are errors and, if so, print a message.
                                if (Helix.Ajax.failedOfflineActions.length > 0) {
                                    //Helix.Utils.statusMessage("Failed to execute offline actions", "One or more queued actions that were queued while you were offline failed to execute.", "error");
                                    if (Helix.Ajax.failedOfflineActionsCallback) {
                                        Helix.Ajax.failedOfflineActionsCallback.call(window, Helix.Ajax.failedOfflineActions);
                                    }
                                }
                            }
                            persistence.flush();
                        }
                    });              
                }
            });
        } else {
            if (window.OfflinePost.listPosts) {
                window.OfflinePost.listPosts(function(postsList) {
                    for (var i = 0; i < postsList.length; ++i) {
                        var nxt = postsList[i];                        
                        var elem = {
                            'json' : nxt.json,
                            'id' : nxt.id,
                            'status': nxt.status,
                            'error': nxt.error
                        };
                        
                        switch(elem.status) {
                            case -3:
                                window.OfflinePost.clearPost(elem.id, function() {}, function() {});
                                break;
                            case 0:
                                // Success;
                                if (Helix.Ajax.postedOfflineActionsCallback) {
                                   Helix.Ajax.postedOfflineActionsCallback(elem);
                                }
                                window.OfflinePost.clearPost(elem.id, function() {}, function() {});
                                break;
                            default:
                                Helix.Ajax.failedOfflineActions.push(elem);
                                break;
                        }
                    }
                    if (Helix.Ajax.failedOfflineActions.length > 0) {
                        //Helix.Utils.statusMessage("Failed to execute offline actions", "One or more queued actions that were queued while you were offline failed to execute.", "error");
                        if (Helix.Ajax.failedOfflineActionsCallback) {
                            Helix.Ajax.failedOfflineActionsCallback.call(window, Helix.Ajax.failedOfflineActions);
                        }
                    }
                });
            }
        }
    }
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
    ERROR_AJAX_LOAD_TIMEOUT : { code: 3, msgTitle: 'Network Unreachable' , msg: 'Sorry! We are unable to reach the network right now. Please try again in a few moments.', severity: 'warn' },

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
    
    /**
     * List of offline actions that failed to execute when this app came back to life online.
     * 
     * @type Array
     */
    failedOfflineActions: [],
    
    /**
     * Function to be invoked with a list of offline actions that failed.
     * @param {type} arr
     * @returns {undefined}
     */
    failedOfflineActionsCallback: function(arr) {
        
    },

    /**
     * Function to be invoked with each offline action that succeeds. By default it 
     * assumes that a type, key, and value have been provided for the offline element and, using
     * these values, deletes the item from the database.
     * 
     * @param {type} elem
     * @returns {undefined}
     */
    postedOfflineActionsCallback: function(elem) {
        if (elem.docid) {
            /* Ignore for now. */
        } else if (elem.json) {
            try {
                var refreshObj = $.parseJSON(elem.json);
                if (refreshObj.type) {
                    var schema = Helix.DB.getSchemaForTable(refreshObj.type);
                    schema.all().filter(refreshObj.key, '=', refreshObj.value).destroyAll();
                }
            } catch(e) {
                // Something was unexpected in the format of the object from the native layer. Ignore.
            }
        }
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
        $.mobile.activePage.find('[data-role="header"]').removeClass('hx-loading');
    },

    refreshLoader: function() {
        Helix.Ajax.hideLoader();
        $.mobile.loading( 'show', Helix.Ajax.loadOptions);
    },

    /*
     * Helper used to set loader options.
     */
    setLoaderOptions: function(loadingOptions) {
        var loaderOptions;
        if (!loadingOptions.theme) {
            loadingOptions.theme = "a";
        }
        if (!loadingOptions.async) {
            if (loadingOptions.message) {
                loaderOptions= {
                    aync: false,
                    text: loadingOptions.message,
                    textVisible: true,
                    theme: loadingOptions.theme,
                    textonly: false
                };
            } else {
                loaderOptions = {
                    async: false,
                    textVisible: false,
                    theme: loadingOptions.theme
                };
            }
        } else {
            loaderOptions = {
                async : true,
                color : loadingOptions.color
            };
        }
        if (loadingOptions.pin) {
            loaderOptions.pin = true;
        }
        if (loadingOptions.silent) {
            loaderOptions.silent = true;
        } else {
            loaderOptions.silent = false;
        }
        Helix.Ajax.loadOptions = loaderOptions;
        return loaderOptions;
    },

    defaultOnError: function(errorObj, isSilentMode) {
        if (isSilentMode) {
            return;
        }
        
        var title = errorObj.msgTitle ? errorObj.msgTitle : 'An unexpected error has occured';
        var severity = errorObj.severity ? errorObj.severity : 'error';
        Helix.Utils.statusMessage(title, errorObj.msg, severity);
    },

    getSchemaForCommand: function(commandConfig, oncomplete) {
        if (commandConfig.schema) {
            oncomplete(commandConfig.schema, commandConfig);
        } else {
            commandConfig.schemaFactory(function(schema, command) {
                command.schema = schema;
                oncomplete(schema, command);
            }, [ commandConfig ]);
        }
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
            Helix.Ajax.getSchemaForCommand(nxtConfig, function(schema, cfg) {
                __doSchema();
            }, [nxtConfig], (schemaFactories.length > 1 ? true : false) /* No schema sync unless this is the last item. */);
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
                        var error = $.extend({}, Helix.Ajax.ERROR_AJAX_LOAD_FAILED, componentObj.error);
                        error.code = error.status;
                        config.onerror(error);
                    }
                } else if (config.oncomplete) {
                    var _p = param;
                    if (param === undefined) {
                        _p = null;
                    } else if (param && syncComponent in param) {
                        _p = param[syncComponent];
                    }
                    config.oncomplete(keyMap[syncComponent], config.name, componentObj, true, _p, loadCommandOptions);
                }
            }
            if (globalOnComplete) {
                globalOnComplete(finalKey, name, obj, true, param, loadCommandOptions); // The 'true' means this is an aggregate load
            }
        };
        loadCommandOptions.syncOverrides = {};
        loadCommandOptions.syncOverrides.schemaMap = {};
        if (Helix.Ajax.isDeviceOnline()) {
            for (var i = 0; i < nObjsToSync; ++i) {
                var commandToLaunch = loadCommandOptions.commands[i].name;
                keyMap[commandToLaunch] = loadCommandOptions.commands[i].key;

                var commandConfig = Helix.Ajax.loadCommands[commandToLaunch];
                loadCommandOptions.syncOverrides.schemaMap[commandToLaunch] = commandConfig;
            }
            Helix.Ajax.ajaxBeanLoad(loadCommandOptions);
        } else {
            var completions = [];
            var resultsObj = {};
            // No pulsating header or loaders when offline.
            Helix.Ajax.loadOptions.silent = true;

            // Run each item individually and synchronously.
            var syncComplete = function(idx) {
                if (idx < nObjsToSync) {
                    commandToLaunch = loadCommandOptions.commands[idx].name;
                    keyMap[commandToLaunch] = loadCommandOptions.commands[idx].key;
    
                    commandConfig = Helix.Ajax.loadCommands[commandToLaunch];
                    loadCommandOptions.syncOverrides.schemaMap[commandToLaunch] = commandConfig;
    
                    var itemKey = loadCommandOptions.commands[idx].key;
                    var completeObj = {
                        fn: commandConfig.oncomplete,
                        thisArg: commandConfig
                    };
                    commandConfig.oncomplete = function(finalKey, name, finalObj) {
                        resultsObj[commandToLaunch] = finalObj;
                        completeObj.args = [ finalKey, name, finalObj, true, null, loadCommandOptions ];
                        completions.push(completeObj);
                        commandConfig.oncomplete = completeObj.fn;
                    };
                    Helix.Ajax.synchronousBeanLoad(commandConfig,itemKey,syncComplete,++idx);
                } else {
                    for (var i = 0; i < nObjsToSync; ++i) {
                        if (completions.length > i && completions[i].fn) {
                            completions[i].fn.apply(completions[i].thisArg, completions[i].args);
                        }
                    }
                    if (globalOnComplete) {
                        globalOnComplete(null, loadCommandOptions.name, resultsObj, true, null, loadCommandOptions);
                    }
                    Helix.Ajax.loadOptions.silent = false;
                }
            };

            syncComplete(0);
        }
    },

    synchronousBeanLoad: function(loadCommandOptions, itemKey, onComplete, opaque) {
        var origOncomplete = loadCommandOptions.oncomplete;
        loadCommandOptions.oncomplete = function(finalKey, name, finalObj) {
            loadCommandOptions.oncomplete = origOncomplete;
            if (origOncomplete) {
                origOncomplete(finalKey, name, finalObj);
            }
            onComplete(opaque);
        };
        Helix.Ajax.ajaxBeanLoad(loadCommandOptions, itemKey);
    },

    loadInProgress: function(name) {
        if (name in Helix.Ajax.inProgressLoads) {
            return true;
        }
        
        return false;
    },

    inProgressLoads : {},

    ajaxBeanLoad: function(loadCommandOptions,itemKey,nRetries) {
        // Set a default error handler if we do not have one.
        if (!loadCommandOptions.onerror) {
            loadCommandOptions.onerror = Helix.Ajax.defaultOnError;
        }
        if (loadCommandOptions.onstart) {
            loadCommandOptions.onstart(loadCommandOptions.name);
        }
        Helix.Ajax.inProgressLoads[loadCommandOptions.name] = loadCommandOptions;

        // Setup loader options and show the loader.
        var loadingOptions = Helix.Ajax.setLoaderOptions($.extend(
            {}, 
            loadCommandOptions.loadingOptions, 
            { 
                silent: (loadCommandOptions.silentMode !== undefined) ? loadCommandOptions.silentMode : false 
            }
        ));

        // Make sure the DB is ready. If not, wait 5 seconds.
        if (!Helix.DB.persistenceIsReady()) {
            if (!nRetries) {
                nRetries = 1;
            }
            // Wait 2s and try again.
            if (nRetries > 3) {
                alert("Failed to prepare the synchronization layer. Please contact your administrator.");
                delete Helix.Ajax.inProgressLoads[loadCommandOptions.name];
                return;
            }
            setTimeout(function() {
                Helix.Ajax.ajaxBeanLoad(loadCommandOptions,itemKey,nRetries+1);
            }, 1000);
            return;
        }

        loadCommandOptions.requestOptions.params = [];  
        if (loadCommandOptions.params) {
            if (!loadCommandOptions.params.push) {
                // the request options are not an array ...
                loadCommandOptions.onerror(Helix.Ajax.ERROR_INVALID_PARAMS);
                delete Helix.Ajax.inProgressLoads[loadCommandOptions.name];
                return;
            }
            loadCommandOptions.requestOptions.params = loadCommandOptions.params;
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
        
        if (loadCommandOptions.requestOptions.suspendSleep === undefined) {
            loadCommandOptions.requestOptions.suspendSleep = false;
        }

        if (!Helix.Ajax.isDeviceOnline()) {
            // Use the key to sync from the local DB.
            if (itemKey) {
                Helix.DB.synchronizeObjectByKey(itemKey,loadCommandOptions.schema,function(widget) {
                    window[loadCommandOptions.name] = widget;
                    
                    delete Helix.Ajax.inProgressLoads[loadCommandOptions.name];
                    loadCommandOptions.oncomplete(itemKey, loadCommandOptions.name, widget);
                },loadCommandOptions.syncOverrides);
            } else if (itemKey === null) {
                /* An explicit null means load all objects. */
                Helix.DB.loadAllObjects(loadCommandOptions.schema, function(widgetList) {
                    window[loadCommandOptions.name] = widgetList;
                    
                    delete Helix.Ajax.inProgressLoads[loadCommandOptions.name];
                    loadCommandOptions.oncomplete(null, loadCommandOptions.name, widgetList);
                });
            } else {
                /* itemKey is undefined. Nothing we can do when we are offline. */
                delete Helix.Ajax.inProgressLoads[loadCommandOptions.name];
                loadCommandOptions.onerror(Helix.Ajax.ERROR_OFFLINE_ACCESS);
            }
            return;
        }

        var page = $.mobile.activePage;
        $(document).trigger('prerequest', [ page, 
            loadCommandOptions.requestOptions.postBack, 
            loadCommandOptions.requestOptions.suspendSleep,
            loadCommandOptions.loadingDelegate,
            loadCommandOptions.loadingMessage,
            loadingOptions
        ]);
        /* Give the browser a change to handle the event and show the loader. */
        $.ajax({
            type: "POST",
            url: loadCommandOptions.requestOptions.postBack,
            dataType: "json",
            data: $.param(loadCommandOptions.requestOptions.params),
            headers: loadCommandOptions.headers ? loadCommandOptions.headers : {},
            success: function(data, status, xhr) {
                if (!data) {
                    // We go nothing back from the server. This happens when the network request is killed
                    // by the client (e.g., because the app was put to sleep).
                    delete Helix.Ajax.inProgressLoads[loadCommandOptions.name];
                    return;
                }
                
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
                    if (responseObj.error.objects) {
                        error.objects =  responseObj.error.objects;
                    }
                    loadCommandOptions.onerror(error);
                    delete Helix.Ajax.inProgressLoads[loadCommandOptions.name];
                    return;
                }
				
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
			Helix.DB.synchronizeObject(syncObject, loadCommandOptions.schema, function(finalObj, o) {
                            var finalKey = o.key;
                            window[loadCommandOptions.name] = finalObj;
                            delete Helix.Ajax.inProgressLoads[loadCommandOptions.name];
                            if (loadCommandOptions.oncomplete) {
                                loadCommandOptions.oncomplete(finalKey, loadCommandOptions.name, finalObj, false, (o.params !== undefined ? o.params : paramObject), loadCommandOptions);
                            }
                            if (window.CordovaInstalled) {
				window.HelixSystem.allowSleep();
                            }
			}, { key: itemKey, params: paramObject }, loadCommandOptions.syncOverrides);
                    } else {
                        delete Helix.Ajax.inProgressLoads[loadCommandOptions.name];
			loadCommandOptions.oncomplete(null, loadCommandOptions.name, null, false, paramObject);
			if (window.CordovaInstalled) {
                            window.HelixSystem.allowSleep();
			}
                    }
		} else if (paramObject) {
                    delete Helix.Ajax.inProgressLoads[loadCommandOptions.name];
                    loadCommandOptions.oncomplete(itemKey, loadCommandOptions.name, null, false, paramObject);
                    if (window.CordovaInstalled) {
			window.HelixSystem.allowSleep();
                    }
		} else {
                    delete Helix.Ajax.inProgressLoads[loadCommandOptions.name];
                    loadCommandOptions.oncomplete(itemKey, "success");
		}
            },
            error: function(jqXHR, status, errorThrown) {
                delete Helix.Ajax.inProgressLoads[loadCommandOptions.name];
                if (Helix.ignoreErrors) {
                    return;
                }
                if (jqXHR.status < 0 || jqXHR.status >= 600) {
                    // Not valid HTTP response codes. Means something is going on inside the container that we should ignore.
                    return;
                }
                var error;
                if (jqXHR.status === 404 || jqXHR.status === 408) {
                    // This generally happens because of a network error.
                    error = Helix.Ajax.ERROR_AJAX_LOAD_TIMEOUT;
                } else {
                    error = Helix.Ajax.ERROR_AJAX_LOAD_FAILED;
                    error.msg = status;
                }
                loadCommandOptions.onerror(error, loadCommandOptions.silentMode);
            },
            complete: function(xhr) {
                $(document).trigger('postrequest', 
                    [   page, 
                        loadCommandOptions.requestOptions.postBack, 
                        loadCommandOptions.requestOptions.suspendSleep,
                        loadCommandOptions.loadingDelegate,
                        loadingOptions
                    ]);
            }
        });
    },

    ajaxFormSubmit: function(url, formSelector, statusTitle, successMsg, pendingMsg, errorMsg, actions) {
        var page = $.mobile.activePage;
        $(document).trigger('prerequest', [ page, url, false, null, null, null ]);
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
                $(document).trigger('postrequest', [ page, url, false ]);
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

    _ajaxGetPrepareArgs: function(params) {
        var args = '';
        for (var key in params.params) {
            var nxtArg = null;
            if ($.isArray(params.params[key])) {
                var _arr = params.params[key];
                nxtArg = '';
                for (var i = 0; i < _arr.length; ++i) {
                    if (i > 0) {
                        nxtArg = nxtArg + '&';
                    }
                    nxtArg = nxtArg + key + '=' +  encodeURIComponent(_arr[i]);
                }
            } else {
                nxtArg = key + '=' + encodeURIComponent(params.params[key]);
            }
            if (args) {
                args = args + '&' + nxtArg;
            } else {
                args = nxtArg;
            }
        }
        return args;
    },
    
    _ajaxPrepareLoader: function(params, page) {
        var loadingOptions = Helix.Ajax.setLoaderOptions({
            async: (params.async !== undefined) ? params.async : true,
            silent: (params.silentMode !== undefined) ? params.silentMode : false,
            message : params.loadingMessage ? params.loadingMessage : ''
        });
        if (Helix.Ajax.isDeviceOnline()) {
            $(document).trigger('prerequest', [ page, params.url, false, params.loadingDelegate, params.loadingMessage, loadingOptions ]);
        }
        return loadingOptions;
    },

    _ajaxFinishLoader: function(params, page, loadingOptions) {
        $(document).trigger('postrequest', [ page, params.url, false, params.loadingDelegate, loadingOptions ]);
    },
    
    _ajaxHandleXHRError: function(params, jqXHR, textStatus, errorThrown) {
        if (Helix.ignoreErrors) {
            return;
        }
        if (jqXHR.status < 0 || jqXHR.status >= 600) {
            // Not valid HTTP response codes. Means something is going on inside the container that we should ignore.
            return;
        }
        if (jqXHR.status === 404 || jqXHR.status === 408) {
            // This generally happens because of a network error.
            Helix.Utils.statusMessage("Error", "Sorry! We are unable to reach the network right now. Please try again in a few moments.", 'warn');
            return;
        }

        if (!params.silentMode) {
            if (params.fatal) {
                Helix.Utils.statusMessage("Error", params.fatal + ": " + errorThrown, "severe");
            } else if (!callbacks.fatal) {
                Helix.Utils.statusMessage("Error", errorThrown, "severe");
            }
        }
    },
    
    _handlePostPutXHRError: function(params, callbacks, jqXHR, textStatus, errorThrown) {
        if (jqXHR.status < 0 || jqXHR.status >= 600) {
            // Not valid HTTP response codes. Means something is going on inside the container that we should ignore.
            return;
        }

        if (jqXHR.status === 408 ||
                jqXHR.status === 407) {
            // Specifically a timeout or the end of the session.
            if (params.allowOfflineQueue !== false) {
                Helix.Ajax.ajaxOfflineQueue(params, callbacks);                        
                return;
            }
        }

        if (!params.silentMode) {
            if (params.fatal) {
                Helix.Utils.statusMessage("Error", params.fatal + ": " + errorThrown, "fatal");
            } else if (!callbacks.fatal) {
                Helix.Utils.statusMessage("Error in POST", errorThrown ? errorThrown : 'Failed to contact ' + params.url, "fatal");
            }
        } 

        if (callbacks.fatal) {
            callbacks.fatal.call(window, textStatus, errorThrown, jqXHR.status);
        } else {
            // In the absence of any other handling, queue operations that fail to be retried again later.
            if (jqXHR.status >= 400 &&
                jqXHR.status < 600) {
                // Something went wrong on the server. Rather than just drop a potentially important operation,
                // treat this is if we are offline ...
                Helix.Ajax.ajaxOfflineQueue(params, callbacks);
            }
        }
    },

    ajaxUpload: function(params, callbacks) {
        var page = $.mobile.activePage;
        var loadingOptions = Helix.Ajax._ajaxPrepareLoader(params, page);
        if (Helix.Ajax.isDeviceOnline()) {
            var ret = {
                isCancelled : false,
                cancel: function() {
                    this.isCancelled = true;
                    this._xhr.abort();
                }
            };
            ret._xhr = $.ajax({
                context: ret,
                url: params.url,
                type: 'POST',
                data: params.body,
                contentType: 'application/x-www-form-urlencoded',
                headers: params.headers ? params.headers : {},
                success: function(returnObj,textStatus,jqXHR) {
                    Helix.Ajax._ajaxFinishLoader(params, page, loadingOptions);

                    if (this.isCancelled) {
                        return;
                    }
                    if (callbacks.success) {
                        callbacks.success.call(window, returnObj);
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    Helix.Ajax._ajaxFinishLoader(params, page, loadingOptions);
                    
                    if (this.isCancelled) {
                        return;
                    }
                    if (Helix.ignoreErrors) {
                        return;
                    }
                    Helix.Ajax._handlePostPutXHRError(params, callbacks, jqXHR, textStatus, errorThrown);
                },
                complete: function() {
                    if (callbacks.complete) {
                        callbacks.complete.call(window);
                    }
                }
            });
            return ret;
        } else {
            if (params.allowOfflineQueue !== false) {
                Helix.Ajax.ajaxOfflineQueue(params, callbacks);
            }
            Helix.Ajax.hideLoader();
        }
        return null;
    },

    ajaxHTMLGet: function(params, callbacks) {
        var page = $.mobile.activePage;
        var loadingOptions = Helix.Ajax._ajaxPrepareLoader(params, page);
        var args = Helix.Ajax._ajaxGetPrepareArgs(params);
        var xhr = $.ajax({
            url: params.url + (args ? '?' : '') + args,
            type: 'GET',
            headers: params.headers ? params.headers : {
                'X-No-Script-Injection' : 1
            },
            success: function(returnObj,textStatus,jqXHR) {
                if (!returnObj) {
                    // We go nothing back from the server. This happens when the network request is killed
                    // by the client (e.g., because the app was put to sleep).
                    return;
                }
                
                // If we get back any html at all, just send it to the callback
                if (callbacks.success) {
                    callbacks.success.call(window, returnObj);
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                Helix.Ajax._ajaxHandleXHRError(params, jqXHR, textStatus, errorThrown);
                if (callbacks.fatal) {
                    callbacks.fatal.call(window, textStatus, errorThrown, jqXHR.status);
                }
            },
            complete: function() {
                if (callbacks.complete) {
                    callbacks.complete.call(window);
                }
                Helix.Ajax._ajaxFinishLoader(params, page, loadingOptions);
            },
            dataType: 'html'
        });
        return xhr;
    },

    ajaxGet: function(params, callbacks) {
        var loadingOptions = Helix.Ajax.setLoaderOptions({
            async: (params.async !== undefined) ? params.async : true,
            silent: (params.silentMode !== undefined) ? params.silentMode : false,
            message : params.loadingMessage ? params.loadingMessage : ''
        });
        var page = $.mobile.activePage;
        $(document).trigger('prerequest', [ page, params.url, false, params.loadingDelegate, params.loadingMessage, loadingOptions ]);
        var args = '';
        for (var key in params.params) {
            var nxtArg = null;
            if ($.isArray(params.params[key])) {
                var _arr = params.params[key];
                nxtArg = '';
                for (var i = 0; i < _arr.length; ++i) {
                    if (i > 0) {
                        nxtArg = nxtArg + '&';
                    }
                    nxtArg = nxtArg + key + '=' +  encodeURIComponent(_arr[i]);
                }
            } else {
                nxtArg = key + '=' + encodeURIComponent(params.params[key]);
            }
            if (args) {
                args = args + '&' + nxtArg;
            } else {
                args = nxtArg;
            }
        }
        
        var xhr = $.ajax({
            url: params.url + (args ? '?' : '') + args,
            type: 'GET',
            success: function(returnObj,textStatus,jqXHR) {
                if (!returnObj) {
                    // We go nothing back from the server. This happens when the network request is killed
                    // by the client (e.g., because the app was put to sleep).
                    return;
                }
                
                var retCode = (returnObj.status !== undefined ? returnObj.status : returnObj.code);
                if (Number(retCode) === 0) {
                    if (params.success && !params.silentMode) {
                        Helix.Utils.statusMessage("Success", params.success, "info");
                    }

                    if (callbacks.success) {
                        callbacks.success.call(window, returnObj);
                    }
                } else {
                    if (!params.silentMode) {
                        if (params.error) {
                            Helix.Utils.statusMessage("Error", params.error + ": " + returnObj.msg, "severe");
                        } else if (!callbacks.error) {
                            Helix.Utils.statusMessage("Error in GET", returnObj.msg ? returnObj.msg : "Accessing url " + params.url, "severe");
                        }
                    }

                    if (callbacks.error) {
                        callbacks.error.call(window, returnObj);
                    }
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                if (Helix.ignoreErrors) {
                    return;
                }
                if (jqXHR.status < 0 || jqXHR.status >= 600) {
                    // Not valid HTTP response codes. Means something is going on inside the container that we should ignore.
                    return;
                }
                if (jqXHR.status === 404 || jqXHR.status === 408) {
                    // This generally happens because of a network error.
                    Helix.Utils.statusMessage("Error", "Sorry! We are unable to reach the network right now. Please try again in a few moments.", 'warn');
                    return;
                }
                
                if (!params.silentMode) {
                    if (params.fatal) {
                        Helix.Utils.statusMessage("Error", params.fatal + ": " + errorThrown, "severe");
                    } else if (!callbacks.fatal) {
                        Helix.Utils.statusMessage("Error", errorThrown, "severe");
                    }
                }
                if (callbacks.fatal) {
                    callbacks.fatal.call(window, textStatus, errorThrown, jqXHR.status);
                }
            },
            complete: function() {
                if (callbacks.complete) {
                    callbacks.complete.call(window);
                }
                $(document).trigger('postrequest', [ page, params.url, false, params.loadingDelegate, loadingOptions ]);
            },
            dataType: 'json'
        });
        return xhr;
    },

    ajaxOfflineQueue: function(params, callbacks) {
        // Collect the data we will need to continue this offline draft. Not always used or applicable.
        var refreshValues = null;
        if (params.form) {
            refreshValues = params.form.getValues();
            if (params.type) {
                refreshValues['__type'] = params.type;
            }
        } else if (params.lookup) {
            refreshValues = params.lookup;
        }

        // Queue a post for the next time the container is online.
        if (params.disableOffline) {
            Helix.Utils.statusMessage('Offline', 'This operations is not available offline.', 'info');
        } else if (!window.CordovaInstalled) {
            if (params.id) {
                Helix.Ajax.offlineNetworkQueue.all().filter('id', '=', params.id).one(function(obj) {
                    if (obj) {
                        obj.url = params.url;
                        obj.body = params.body;
                        obj.json = refreshValues ? JSON.stringify(refreshValues) : '';
                    } else {
                        obj = new Helix.Ajax.offlineNetworkQueue({
                            'url': params.url,
                            'body': params.body,
                            'json' : refreshValues ? JSON.stringify(refreshValues) : ''
                        });
                        persistence.add(obj);
                    }
                    persistence.flush(function() {
                        if (callbacks && callbacks.offlineSuccess) {
                            callbacks.offlineSuccess.call(window, obj.id);
                        }
                    });
                });
            } else {
                var offlineOp = new Helix.Ajax.offlineNetworkQueue({
                    'url': params.url,
                    'body': params.body,
                    'json' : refreshValues ? JSON.stringify(refreshValues) : ''
                });
                persistence.add(offlineOp);
                persistence.flush(function() {
                    if (callbacks && callbacks.offlineSuccess) {
                        callbacks.offlineSuccess.call(window, offlineOp.id);
                    }
                });
            }
        } else {
            window.OfflinePost.savePost(params.url,
                'application/x-www-form-urlencoded',
                params.body,
                refreshValues ? JSON.stringify(refreshValues) : '',
                params.id ? params.id : 0,
                function(rowid) {
                    if (!params.silentMode) {
                        if (params.offlineSuccess) {
                            Helix.Utils.statusMessage("Action Queued", params.offlineSuccess, "info");
                        } else {
                            Helix.Utils.statusMessage("Action Queued",
                                "This action will be completed the next time you login to Link online.", "info");
                        }
                    }
                    if (callbacks.offlineSuccess) {
                        callbacks.offlineSuccess.call(window, rowid ? Number(rowid) : 0);
                    }
                    if (callbacks.complete) {
                        callbacks.complete.call(window);
                    }
                },
                function(msg) {
                    if (!params.silentMode && !callbacks.fatal) {
                        if (params.fatal) {
                            //Helix.Utils.statusMessage("Error", params.fatal + ": " + msg, 'error');
                        } else if (!callbacks.fatal) {
                            //Helix.Utils.statusMessage("Error in Offline Queue", msg, 'error');
                        }
                    }
                    if (callbacks.fatal) {
                        callbacks.fatal.call(window, "Error in Offline Queue", msg);
                    }
                    if (callbacks.complete) {
                        callbacks.complete.call(window);
                    }
                }
            );
        }
    },

    ajaxPost: function(params, callbacks) {
        var loadingOptions = Helix.Ajax.setLoaderOptions({
            async: (params.async !== undefined) ? params.async : true,
            silent: (params.silentMode !== undefined) ? params.silentMode : false,
            message: params.loadingMessage
        });
        if (Helix.Ajax.isDeviceOnline()) {
            var page = $.mobile.activePage;
            $(document).trigger('prerequest', [ page, params.url, false, params.loadingDelegate, params.loadingMessage, loadingOptions ]);
            var ret = {
                isCancelled : false,
                cancel: function() {
                    this.isCancelled = true;
                    this._xhr.abort();
                }
            };
            ret._xhr = $.ajax({
                context: ret,
                url: params.url,
                type: 'POST',
                data: params.body,
                contentType: 'application/x-www-form-urlencoded',
                headers: params.headers ? params.headers : {},
                success: function(returnObj,textStatus,jqXHR) {
                    if (!returnObj) {
                        // We go nothing back from the server. This happens when the network request is killed
                        // by the client (e.g., because the app was put to sleep).
                        this.isCancelled = true;
                    }
                    
                    // Call postrequest before any callbacks are called. Otherwise we can overwrite the loading options
                    // with a new AJAX request triggered in a callback.
                    $(document).trigger('postrequest', [ page, params.url, false, params.loadingDelegate, loadingOptions ]);

                    if (this.isCancelled) {
                        return;
                    }
                    var retCode = (returnObj.status !== undefined ? returnObj.status : returnObj.code);
                    if (retCode === 0) {
                        if (params.success && !params.silentMode) {
                            Helix.Utils.statusMessage("Success", params.success, "info");
                        }

                        if (callbacks.success) {
                            callbacks.success.call(window, returnObj);
                        }
                    } else {
                        if (!params.silentMode) {
                            if (params.error) {
                                Helix.Utils.statusMessage("Error", params.error + ": " + returnObj.msg, "error");
                            } else if (!callbacks.error) {
                                Helix.Utils.statusMessage("Error", returnObj.msg, "error");
                            }
                        }
                        
                        if (callbacks.error) {
                            callbacks.error.call(window, returnObj);
                        }
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    // Call postrequest before any callbacks are called. Otherwise we can overwrite the loading options
                    // with a new AJAX request triggered in a callback.
                    $(document).trigger('postrequest', [ page, params.url, false, params.loadingDelegate, loadingOptions ]);
                    
                    if (this.isCancelled) {
                        return;
                    }
                    if (Helix.ignoreErrors) {
                        return;
                    }
                    if (jqXHR.status < 0 || jqXHR.status >= 600) {
                        // Not valid HTTP response codes. Means something is going on inside the container that we should ignore.
                        return;
                    }
                    
                    if (jqXHR.status === 408 ||
                            jqXHR.status === 407) {
                        // Specifically a timeout or the end of the session.
                        if (params.allowOfflineQueue !== false) {
                            Helix.Ajax.ajaxOfflineQueue(params, callbacks);                        
                            return;
                        }
                    }
                    
                    if (!params.silentMode) {
                        if (params.fatal) {
                            Helix.Utils.statusMessage("Error", params.fatal + ": " + errorThrown, "fatal");
                        } else if (!callbacks.fatal) {
                            Helix.Utils.statusMessage("Error in POST", errorThrown ? errorThrown : 'Failed to contact ' + params.url, "fatal");
                        }
                    } 
                    
                    if (callbacks.fatal) {
                        callbacks.fatal.call(window, textStatus, errorThrown, jqXHR.status);
                    } else {
                        // In the absence of any other handling, queue operations that fail to be retried again later.
                        if (jqXHR.status >= 400 &&
                            jqXHR.status < 600) {
                            // Something went wrong on the server. Rather than just drop a potentially important operation,
                            // treat this is if we are offline ...
                            Helix.Ajax.ajaxOfflineQueue(params, callbacks);
                        }
                    }
                },
                complete: function() {
                    if (callbacks.complete) {
                        callbacks.complete.call(window);
                    }
                },
                dataType: 'json'
            });
            return ret;
        } else {
            if (params.allowOfflineQueue !== false) {
                Helix.Ajax.ajaxOfflineQueue(params, callbacks);
            }
            Helix.Ajax.hideLoader();
        }
        return null;
    },
    
    deleteOfflinePost: function(postID, success, fail) {
        if (window.CordovaInstalled) {
            if (window.OfflinePost.clearPost) {
                window.OfflinePost.clearPost(postID, success, fail);
            }
        } else {
            Helix.Ajax.offlineNetworkQueue.all().filter('id', '=', postID).one(function(obj) {
                if (obj) {
                    persistence.remove(obj);
                    persistence.flush();
                    success.call(window);
                } else {
                    fail.call(window, "Could not find the offline queued network action with id " + postID);
                }
            });
        }
    }
};
