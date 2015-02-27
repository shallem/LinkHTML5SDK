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

Helix.postInit = function(fn, thisArg, args) {
    if (!args) {
        args = [];
    }
    if (!thisArg) {
        thisArg = window;
    }
    if (Helix.ready) {
        fn.apply(thisArg, args);
    } else {
        $(document).on('helixinit', function() {
            fn.apply(thisArg, args);
        });
    }
};

Helix.ready = false;

(function($) {
    $(document).on('hxPersistenceReady', function() {
        /* Update the .val method on textareas to preserve newlines. See
         * http://api.jquery.com/val/
         */
        $.valHooks.textarea = {
            get: function( elem ) {
                return elem.value.replace( /\r?\n/g, "\r\n" );
            }
        };

        $(document).trigger('helixinit');
        Helix.ready = true;
        
        $(document).trigger('helixready');
    });

})(jQuery);

$(document).on('ready', function() {
    window.onerror = function (desc,page,line,chr) { 
        var msg = 'Captured javascript error "' + desc + '" on page "' + page + '" line "' + line + '"';
        console.log('[ERROR] ' + msg);
        if (Helix.showErrors) {
            Helix.Utils.statusMessage('Javascript Error', msg, 'severe');
        }
        if (Helix && Helix.errorHook) {
            Helix.errorHook(msg);
        }
    };
});
