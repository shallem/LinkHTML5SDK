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

function __initHelix() {
    window.Helix = {
    
    };
}
(function() {
    if (window.Helix === undefined) {
        __initHelix();
    }
})();


Helix.Ajax = {
    
};

Helix.Utils = {
    
};

Helix.Layout = {
    
};

(function($) {
    $(document).on('ready', function() {
        /* Update the .val method on textareas to preserve newlines. See
         * http://api.jquery.com/val/
         */
        $.valHooks.textarea = {
            get: function( elem ) {
                return elem.value.replace( /\r?\n/g, "\r\n" );
            }
        };

        $(document).trigger('helixinit');
    });
})(jQuery);

