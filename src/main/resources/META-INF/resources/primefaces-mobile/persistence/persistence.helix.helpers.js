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

Helix.DB.Utils = {
    
    /**
     * Check if a numeric value is an integer. Used to infer data types for
     * object schema.
     */
    isInt: function(n) {
        return n % 1 === 0;
    },
    
    /**
     * Default sync fields override. Just return false, which means that the framework
     * should handle the field sync.
     * 
     * @param persistentObjSetter The persistent object's setter for this field.
     * @param newObj The new object we are synchronizing against the DB.
     * @param fieldName The name of the field we are synchronizing.
     * @return true if this routine handled the sync; false if not
     */
    defaultFieldSync: function(persistentObjSetter, newObj, fieldName) {
        return false;
    }
};