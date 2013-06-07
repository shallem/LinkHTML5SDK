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
 * PrimeFaces PanelGroup Widget
 */
PrimeFaces.widget.MobilePanelGroup = PrimeFaces.widget.BaseWidget.extend({
    
    init: function(cfg) {
        this._super(cfg);
        this.id = PrimeFaces.escapeClientId(cfg.id);
        this.list = cfg.itemList;
        this.renderer = cfg.renderer;
        if (cfg.strings) {
            this.strings = cfg.strings.split(",");            
        }
        
        if (this.list) {
            this.refresh(this.list,cfg.condition);
        }
    },
    refresh: function(list,condition,oncomplete) {
        this.list = list;
        $(this.id).empty();
        if ((condition !== undefined) &&
            (!condition)) {
            /* The condition is false. Hide this in the DOM. */
            $(this.id).hide();
            if (oncomplete) {
                oncomplete();
            }
            return;
        } else {
            $(this.id).show();
            var _self = this;
            if ($.isArray(this.list)) {
                $.each(_self.list, function(idx, elem) {
                    var parentDiv = $('<div />').appendTo($(_self.id));
                    _self.renderer(parentDiv, elem, _self.strings);
                });
                if (oncomplete) {
                    oncomplete();
                }
            } else if (this.list.forEach) {
                /* This is a QueryCollection. */
                this.list.each(function(elem) {
                    var parentDiv = $('<div />').appendTo($(_self.id));
                    _self.renderer(parentDiv, elem, _self.strings);
                },
                function() {
                    
                },
                function(ct) {
                    if (oncomplete) {
                        oncomplete();
                    }
                });
            } else {
                var parentDiv = $('<div />').appendTo($(_self.id));
                _self.renderer(parentDiv, _self.list, _self.strings);
                if (oncomplete) {
                    oncomplete();
                }
            }
        }
    }
});