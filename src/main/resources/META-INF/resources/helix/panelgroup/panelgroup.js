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
 * Mobile Helix PanelGroup Widget
 */
(function($) {
    
    $.widget("helix.helixPanelgroup", {
        
        options: {
            /**
             * The renderer is a function used to render a single element in the
             * panel group. This callback is executed on each element each time the
             * panel group is refreshed. The cellDOM parameter is the parent of the
             * cell's DOM. All rendered elements should be appended to cellDOM. dataElem
             * is the current cell's data item, obtained from the itemList. stringsArray
             * is a list of strings supplied as configuration, which is used to
             * integrate with a framework like JSF's internationalization features.
             */
            renderer: function(cellDOM, dataElem, stringsArray) {
                
            },
            
            /**
             * The itemList is either an array of items to display in the grid or a 
             * QueryCollection. This is often null on initial load, and may be
             * specified on a subsequent refresh call.
             */
            itemList: null,
            
            /**
             * Comma-separated list of strings which are passed through to the
             * grid item renderer. This list is generally used for internationalization.
             * If a CSV list is specified, it is parsed into an array of strings
             * before being passed to a renderer.
             */
            strings: '',
            
            /**
             * JavaScript expression that dictates if this component is rendered.
             * When the expression is true, the component is rendered. When either
             * undefined or otherwise evaluating to false the component is not
             * rendered.
             */
            condition: true
        },
    
        _create: function() {
            this._parent = this.element;
            if (this.options.strings) {
                this._strings = this.options.strings.split(",");            
            } else {
                this._strings = [];
            }

            if (this.options.itemList) {
                this.refresh(this.options.itemList,this.options.condition);
            }
        },
        refresh: function(list,condition,oncomplete) {
            this._renderer = this.options.renderer;
            this._list = list;
            this._parent.empty();
            if ((condition !== undefined) &&
                (!condition)) {
                /* The condition is false. Hide this in the DOM. */
                this._parent.hide();
                if (oncomplete) {
                    oncomplete();
                }
                return;
            } else {
                this._parent.show();
                var _self = this;
                if ($.isArray(_self._list)) {
                    $.each(_self._list, function(idx, elem) {
                        var parentDiv = $('<div />').appendTo(_self._parent);
                        _self._renderer(parentDiv, elem, _self._strings);
                    });
                    if (oncomplete) {
                        oncomplete();
                    }
                } else if (_self._list.forEach) {
                    /* This is a QueryCollection. */
                    _self._list.forEach(function(elem) {
                        var parentDiv = $('<div />').appendTo(_self._parent);
                        _self._renderer(parentDiv, elem, _self._strings);
                    },
                    function() {

                    },
                    function(ct) {
                        if (oncomplete) {
                            oncomplete();
                        }
                    });
                } else {
                    var parentDiv = $('<div />').appendTo(_self._parent);
                    _self._renderer(parentDiv, _self._list, _self._strings);
                    if (oncomplete) {
                        oncomplete();
                    }
                }
            }
        }
    
    });
}( jQuery ));