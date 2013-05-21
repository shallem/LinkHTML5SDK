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
 * Options specifying the appearance of the loading message, which is displayed
 * automatically during all AJAX loads.
 */
PrimeFaces.ajax.loadOptions = {};

/**
 * Override the existing AJAX request handler to add a new pre-request trigger.
 */
PrimeFaces.ajax.origRequest = PrimeFaces.ajax.AjaxRequest;
PrimeFaces.ajax.AjaxRequest = function(cfg, ext) {
    $(document).trigger('prerequest', cfg);
    PrimeFaces.ajax.origRequest.call(this, cfg, ext);
}

/**
 * Override the existing AJAX request handler to add a new post-request trigger.
 * This allows us to trigger the event after ALL updates and callbacks are done.
 * The standard ajaxComplete event in PrimeFaces fires to early for us to properly
 * refresh scrollers, for example, using that event.
 */
PrimeFaces.ajax.origResponse = PrimeFaces.ajax.AjaxResponse;
PrimeFaces.ajax.AjaxResponse = function (responseXML) {
    PrimeFaces.ajax.origResponse.call(this, responseXML);
    $(document).trigger('postrequest', responseXML);
}

/**
 * Show a loader pre-request.
 */
$(document).bind('prerequest', function() {
    $.mobile.loading( 'show', PrimeFaces.ajax.loadOptions);
});

/**
 * Hide the loader post-request.
 */
$(document).bind('postrequest', function() {
    /* Hide the loader. */
    $.mobile.loading( "hide" );
    
    /* Clear out the load options - this is meant as a per-load set of options. */
    PrimeFaces.ajax.loadOptions = {};
});