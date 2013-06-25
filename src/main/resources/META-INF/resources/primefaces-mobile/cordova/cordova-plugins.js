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