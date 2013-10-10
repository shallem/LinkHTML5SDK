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
 window.ExternalFileUtil = {
        openWith: function ( name, editURL, component, success, fail) {
            if (component === undefined) {
                return cordova.exec(success, fail, "ExternalFileUtil", "openWith", [name, editURL, 0, 0]);
            }
            var position = Helix.Utils.getPosition(component);
            return cordova.exec(success, fail, "ExternalFileUtil", "openWith", [name, editURL, position.x, position.y ]);
        }
    };
})();

(function() {
 window.OfflineSave = {
        openWith: function ( name, thumbURL, viewURL, editURL, success, fail) {
            return cordova.exec(success, fail, "OfflineSave", "openWith", [name, thumbURL, viewURL, editURL]);
        }
    };
})();

(function() {
 window.DocumentUpload = {
    getDocument: function(success, fail) {
        return cordova.exec(success, fail, "DocumentUpload", "getDocument", []);
    },
    clearDocument: function(docid, success, fail) {
        return cordova.exec(success, fail, "DocumentUpload", "clearDocument", [ docid ]);
    }
 };
})();

(function() {
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
})();

(function() {
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
})();