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
    var userAgent = (__hxUserAgent !== undefined && __hxUserAgent)  ? __hxUserAgent : navigator.userAgent;
    window.CordovaANDROID = userAgent.match(/\[LINK_ANDROID ([^.]*)\.([^\]]*)\]/);
    window.CordovaIOS34 = userAgent.match(/\[CORDOVA-3\.4\.([^\]]*)\]/);
    
    window.CordovaVersion = 2;
    window.CordovaRevision = 0;
    if (window.CordovaANDROID ||
        window.CordovaIOS34 ) {
        window.CordovaInstalled = true;
        if (window.CordovaIOS34) {
            window.CordovaVersion = 3;
            window.CordovaRevision = parseInt(window.CordovaIOS34[1]);
        } else {
	    window.CordovaVersion = parseInt(window.CordovaANDROID[1]);
	    window.CordovaRevision = parseInt(window.CordovaANDROID[2]);
	}
    } else {
        window.CordovaInstalled = false;
    }   
    
    $(document).on('ready', function() {
        if (window.CordovaIOS34) {
            cordova_ios_34_init();
            cordova_helix_init();
        } else if (window.CordovaANDROID) {
            cordova_android_init();
            cordova_helix_init();	    
	}
        
        // If we have it, ask the container to update our online/offline status.
        if (window.CordovaInstalled && window.HelixSystem.updateOnlineOffline) {
            window.HelixSystem.updateOnlineOffline(function() {
                $(document).trigger('cordovaReady');
            });
        } else {
            $(document).trigger('cordovaReady');
        }
    });
})();
