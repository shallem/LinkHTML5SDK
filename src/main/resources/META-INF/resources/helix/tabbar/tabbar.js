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
    var bottomPadding = 0;
    
    /**
     * When a fixed position footer is showing, the keyboard will pop up the footer
     * and the footer will sit on top of the keyboard. This is both bizarre looking and
     * wrong. Instead, we hide the footer and then restore it when the keyboard 
     * appears/disappears.
     */
    $(document).on('helixinit', function() {
        $(document).on('keyboardHide', function() {
            var fixedFooters = $.mobile.activePage.find('.ui-footer[data-position="fixed"]');
            if (fixedFooters.length == 0) {
                return;
            }
            
            fixedFooters.show();
            $.mobile.activePage.css('padding-bottom', bottomPadding);
        });
        
        $(document).on('keyboardShow', function() {
            var fixedFooters = $.mobile.activePage.find('.ui-footer[data-position="fixed"]');
            if (fixedFooters.length == 0) {
                return;
            }
            
            bottomPadding = $.mobile.activePage.css('padding-bottom');
            fixedFooters.hide();
            $.mobile.activePage.css('padding-bottom', '0px'); 
        });
    });
})();
