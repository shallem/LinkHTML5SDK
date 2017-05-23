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
(function() {
    window.OfflineSave = {
        saveDoc: function ( name, lastModified, docUniqueID, thumbURL, viewURL, editURL, success, fail) {
            return cordova.exec(success, fail, "OfflineSave", "saveDoc", [name, lastModified, docUniqueID, thumbURL, viewURL, editURL]);
        },
        editDoc: function ( docID, component, success, fail ) {
            if (!component) {
                return cordova.exec(success, fail, "OfflineSave", "editDoc", [docID, 0, 0]);
            }
            var position = Helix.Utils.getPosition(component);
            return cordova.exec(success, fail, "OfflineSave", "editDoc", [docID, position.x, position.y ]);
        }
    };
    
    window.OfflinePost = {
        savePost: function ( url, contentType, postBody, jsonObj, offlineID, success, fail) {
            return cordova.exec(success, fail, "OfflinePost", "savePost", [url, contentType, postBody, jsonObj, offlineID]);
        }
    };
    
    if (window.CordovaVersion >= 3 &&
        window.CordovaRevision >= 3) {
        window.OfflinePost.clearPost = function(offlineID, success, fail) {
            return cordova.exec(success, fail, "OfflinePost", "clearPost", [ offlineID ]);
        };
        window.OfflinePost.listPosts = function(success, fail) {
            return cordova.exec(success, fail, "OfflinePost", "listPosts", []);
        };
    }
    
    window.HelixPolicy = {
        getPolicy: function ( policy, success, fail ) {
            if (Object.prototype.toString.call(policy) === '[object Array]') {
                return cordova.exec(success, fail, "Policy", "getPolicyList", [ policy ]);
            } else {
                return cordova.exec(success, fail, "Policy", "getPolicy", [ policy ]);
            }
        }
    };
        
    window.HelixServices = {
        auth: function(client, username, password, success, fail) {
            return cordova.exec(success, fail, "HelixServices", "auth", [client, username, password]);
        },
        refreshApplications: function(success, fail) {
            return cordova.exec(success, fail, "HelixServices", "refreshApplications", []);
        },
        sessionIsActive: function(success) {
            return cordova.exec(success, null, "HelixServices", "sessionIsActive", []);
        }
    };
    
    window.HelixApp = {
        getRecentClient: function(success,fail) {
            return cordova.exec(success, fail, "HelixApp", "getRecentClient", []);
        },
        getRecentUser: function(success,fail) {
            return cordova.exec(success, fail, "HelixApp", "getRecentUser", []);
        },
        getApplications: function(success, fail) {
            return cordova.exec(success, fail, "HelixApp", "getApplications", []);
        },
        logout: function(success) {
            return cordova.exec(success, null, "HelixApp", "logout", []);
        },
        isOnline: function(success) {
            return cordova.exec(success, null, "HelixApp", "isOnline", []);
        },
        lastError: function(success) {
            return cordova.exec(success, null, "HelixApp", "lastError", []);
        },
        lastInfo: function(success) {
            return cordova.exec(success, null, "HelixApp", "lastInfo", []);
        },
        refreshHome: function(success) {
            return cordova.exec(success, null, "HelixApp", "refreshHome", []);
        }
    };
    
    window.HelixSystem = {
        suspendSleep: function() {
            return cordova.exec(null, null, "HelixSystem", "suspendSleep", []);
        },
        allowSleep: function() {
            return cordova.exec(null, null, "HelixSystem", "allowSleep", []);
        },
        notifyParent: function(eventName, eventArg) {
            if (eventArg === undefined) {
                eventArg = nil;
            }
            
            return cordova.exec(null, null, "HelixSystem", "notifyParent", [ eventName, eventArg ])
        }
    };
    
    window.HelixLocalNotifications = {
        scheduleNotification: function(fireDate, uniqueID, description, minutesBefore, success, failure) {
            return cordova.exec(success, failure, "LocalNotificationScheduler", "scheduleNotification", 
                [fireDate.getTime(), uniqueID, description, minutesBefore]);
        },
        deleteNotification: function(uniqueID, success, failure) {
            return cordova.exec(success, failure, "LocalNotificationScheduler", "deleteNotification", 
                [uniqueID]);        
        }
    };
    
    if (window.CordovaVersion >= 3 &&
        window.CordovaRevision >= 1) {
        window.HelixBulkContacts = {
            queue: function(contactOpts) {
                return cordova.exec(null, null, "HelixBulkContacts", "queue", [ contactOpts ]);
            },
            saveQueued: function(success, failure) {
                return cordova.exec(success, failure, "HelixBulkContacts", "saveQueued", [ ]);
            }
        };
        
        $.extend(window.HelixSystem, {
            updateOnlineOffline: function(success) {
                return cordova.exec(success, null, "HelixSystem", "updateOnlineOffline", []);
            }
        });
    }
    
    if (window.CordovaVersion >= 3 &&
        window.CordovaRevision >= 2) {
        window.HelixBulkContacts.queue = function(contactsToQueue, done) {
            return cordova.exec(done, done, "HelixBulkContacts", "queue", [ contactsToQueue ]);
        };
    }
    
    if (window.CordovaVersion >= 3 &&
        window.CordovaRevision >= 3) {
        $.extend(window.HelixSystem, {
            exitApp : function() {
                return cordova.exec(null, null, "HelixSystem", "exitApp", []);
            },
            openApp : function(appID, action, argsObj) {
                var args = Helix.Utils.crossAppArgs(appID, action, argsObj);
                var url = 'hx://openapp?' + args;
                window.open(url);
            }
        });
    }
    
    if (window.CordovaVersion >= 3 &&
        window.CordovaRevision >= 4) {
        $.extend(window.HelixSystem, {
            updateSyncState: function(op, state, success, failure) {
                return cordova.exec(success, failure, "HelixSystem", "updateSyncState", [ op, state ]);
            },
            getRefreshData: function(op, success, failure) {
                return cordova.exec(success, failure, "HelixSystem", "getRefreshData", [ op ]);
            },
            clearAppBadge: function(success, failure) {
                return cordova.exec(success, failure, "HelixSystem", "clearAppBadge", [  ]);
            }
        });
    }

    if (window.CordovaVersion >= 3 &&
        window.CordovaRevision >= 5) {
        $.extend(window.HelixSystem, {
            getAppsForCapabilities: function(capabilityArray, success, failure) {
                return cordova.exec(success, failure, "HelixSystem", "getAppsForCapabilities", [ capabilityArray ]);
            },
            getDeviceCapabilities: function(success, failure) {
                return cordova.exec(success, failure, "HelixSystem", "getDeviceCapabilities", [ ]);
            },
            listMyFiles: function(tags, success, failure) {
                return cordova.exec(success, failure, "HelixSystem", "listMyFiles", [
                    tags
                ]);
            },
            listTags: function(success, failure) {
                return cordova.exec(success, failure, "HelixSystem", "listTags", []);
            }
        });
    }
    
    if (window.CordovaVersion >= 3 &&
            window.CordovaRevision >= 5) {
        window.HelixFiles = {
            downloadFile: function(url, docID, docName, options, success, failure) {
                if (!options) {
                    options = {};
                }
                return cordova.exec(success, failure, "DocumentDownload", "getDocument", [
                   url,
                   docID,
                   docName,
                   options
                ]);
            },
            uploadFile: function(url, docID, docName, options, success, failure) {
                if (!options) {
                    options = {};
                }
                return cordova.exec(success, failure, "DocumentDownload", "uploadDocument", [
                   url,
                   docID,
                   docName,
                   options
                ]);
            },
            openFile: function(docID, options, success, failure) {
                if (!options) {
                    options = {};
                }
                return cordova.exec(success, failure, "DocumentDownload", "openDocument", [
                   docID,
                   options
                ]);
            },
            saveFile: function(docID, docName, docTags, success, failure) {
                return cordova.exec(success, failure, "DocumentDownload", "saveDocument", [
                   docID,
                   docName,
                   docTags
                ]);
            },
            discardFile: function(docID, success, failure) {
                return cordova.exec(success, failure, "DocumentDownload", "deleteDocument", [
                   docID
                ]);
            },
            checkDocumentStatus: function(docIDs, success, failure) {
                return cordova.exec(success, failure, "DocumentDownload", "checkDocumentStatus", [
                   docIDs
                ]);                
            }
        };
    }
})();