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
(function($) {
    /**
     * Private constants.
     */
    var CONTENT_CLASS_MOBILE = "ui-datagrid-content ui-widget-content hx-scroller-nozoom mh-layout-parent-height";
    var EMPTY_CONTENT_CLASS = "ui-datagrid-content ui-datagrid-content-empty ui-widget-content mh-layout-parent-height";
    var TABLE_CLASS = "ui-datagrid-data";
    var TABLE_ROW_CLASS = "ui-datagrid-row";
    var TABLE_COLUMN_CLASS = "ui-datagrid-column";
    
    $.widget("helix.helixDatagrid", {        
        
        options: {
            /**
             * Number of rows/cols in the datagrid. Specify as either an integral value or
             * a CSV string with at least 2 comma-separated values. The first is the
             * number of rows on a phone, the second a phablet, and the (optional)
             * third a tablet. If the third dimension is not specified then tablets and
             * phablets will use the same dimensions.
             */
            rows: 3,
            cols: 3,
            
            /**
             * String indicating the structure of the paginator. The default is
             * {PreviousPageLink} {CurrentPageReport} {NextPageLink}, which has
             * a left arrow link, the current page number (e.g., 1 of 3) and a
             * right arrow link.
             */
            paginatorTemplate: '{PreviousPageLink} {CurrentPageReport} {NextPageLink}',
            
            /**
             * The itemList is either an array of items to display in the grid or a 
             * QueryCollection. This is often null on initial load, and may be
             * specified on a subsequent refresh call.
             */
            itemList : null,
            
            /**
             * The renderer is a function used to render a single element in the
             * grid. This callback is executed on each element each time the
             * datagrid is refreshed. The cellDOM parameter is the parent of the
             * cell's DOM. All rendered elements should be appended to cellDOM. dataElem
             * is the current cell's data item, obtained from the itemList. stringsArray
             * is a list of strings supplied as configuration, which is used to
             * integrate with a framework like JSF's internationalization features.
             */
            renderer: function(cellDOM, dataElem, stringsArray) {
                
            },
            
            /**
             * Context menu that appears on either tap-hold (for touch devices)
             * or double click on the grid container itself. This is a different
             * menu from the context menu that can be attached to each individual
             * grid item. This should be a standard jQuery Mobile popup menu.
             */
            defaultContextMenu: null,
            
            /**
             * Context menu that is attached to individual grid elements. This
             * should be a standard jQuery Mobile popup menu.
             */
            itemContextMenu: null,
            
            /**
             * Message to display in the grid body if the grid is empty.
             */
            emptyMessage: 'There are no items to display.',
            
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
            // Private variables.
            this.currentPage = 0;

            if (typeof this.options.rows === 'string') {
                this.options.rows = this._getDimensionForDeviceType(this.options.rows);
            }
            if (typeof this.options.cols === 'string') {
                this.options.cols = this._getDimensionForDeviceType(this.options.cols);
            }
            this.itemsPerPage = (this.options.rows * this.options.cols);
            this.id = this.element.attr('id');
            if (!this.id) {
                this.id = Helix.Utils.getUniqueID();
            }
            this.contentId = this.id + '_content';
            this.paginatorId = this.id + '_paginator';
            this.list = this.options.itemList;
            this.renderer = this.options.renderer;
            this.defaultContextMenu = this.options.defaultContextMenu;
            this.itemContextMenu = this.options.itemContextMenu;
            this.emptyMessage = this.options.emptyMessage;
            if (this.options.strings) {
                this.strings = this.options.strings.split(",");            
            }
        
            this.parent = this.element;
            this.refresh(this.list, this.options.condition);
            this._setupEvents();
        },
    
        /**
         * Render the grid using the list of items supplied as the first parameter.
         * Condition is a dynamic, JavaScript expression that dictates if this
         * component is rendered at all. oncomplete is called when rendering is
         * done. oncomplete accepts a single argument, the number of items in
         * the grid.
         */
        refresh: function(list, condition, oncomplete) {
            if (!oncomplete && condition && typeof(condition) === 'function') {
                oncomplete = condition;
                condition = true;
            }
        
            this.list = list;
            if ((condition !== undefined) &&
                !condition) {
                /* The condition is false. Remove this entirely from the DOM. */
                $(this.parent).hide();
                return;
            } else {
                $(this.parent).show();
            }
        
            var _self = this;
            var refreshDone = function() {
                /* Create the scroller on the content container. */
                //Helix.Layout.addScrollers(_self.contentContainer);
                
                /* Attach the context menu to the grid header. */
                if (_self.defaultContextMenu) {
                    var cMenu = _self.defaultContextMenu;
                    var evName;
                    evName = 'taphold';
                    $(_self.parent).on(evName, function(event) {
                        event.preventDefault();
                        event.stopImmediatePropagation();
                        $(PrimeFaces.escapeClientId(cMenu)).popup( "open" );
                    });
                } 
                if (oncomplete) {
                    oncomplete(_self.itemCount);
                }
            };
            if ($.isArray(_self.list)) {
                /* Array. */
                _self.itemCount = _self.list.length;
                _self._refreshPaginatorContainer(_self.list.length);
                _self._refreshData(_self.list.length, refreshDone);
            } else if (_self.list && _self.list.forEach) {
                /* Query collection. */
                _self.list.count(function(ct) {
                    _self.itemCount = ct;
                    _self._refreshPaginatorContainer(ct);
                    _self._refreshData(ct, refreshDone);
                })
            } else {
                _self._refreshPaginatorContainer(0);
                _self._refreshData(0, refreshDone);
            }
        },
    
        _refreshPaginatorContainer: function(nElems) {
            var paginatorContainer = $(PrimeFaces.escapeClientId(this.paginatorId));
            if (paginatorContainer.length == 0) {
                paginatorContainer = $('<div />').attr({
                        'id' : this.paginatorId,
                        'class': Helix.Utils.paginator.PAGINATOR_TOP_CONTAINER_CLASS
                    }).appendTo($(this.parent));
            } else {
                // Clear out all children of the paginator so that we can refresh it.
                $(paginatorContainer).empty();
            }
            var parent = this;
            $.each(this.options.paginatorTemplate.split(" "), function(idx, obj) {
                Helix.Utils.paginator.render(obj, paginatorContainer, {
                    'page' : parent.currentPage,
                    'totalItems' : nElems,
                    'itemsPerPage' : parent.itemsPerPage,
                    'nextPage' : parent.nextPage,
                    'prevPage' : parent.prevPage,
                    'owner' : parent
                });
            });
        },
    
        _createRefreshState: function(nElems) {
            var startElem = this.currentPage * this.itemsPerPage;
            var endElem = startElem + this.itemsPerPage;
            if (endElem > nElems) {
                endElem = nElems;
            }

            return {
                'curRow' : null,
                'parent' : this,
                'startElem' : startElem,
                'endElem' : endElem
            };
        },
    
        _createOneElement: function(tableBody, curState, idx, elem) {
            // Determine if we need to start a new row.
            if (!curState.curRow || (idx % curState.parent.options.cols) == 0) {
                curState.curRow = $('<tr />').attr({
                        'class' : TABLE_ROW_CLASS
                    })
                .appendTo(tableBody);
            }

            var nxtCol = $('<td />').attr({
                'class' : TABLE_COLUMN_CLASS,
                'data-index' : curState.startElem + idx
            }).appendTo(curState.curRow);
            curState.parent.renderer(nxtCol, elem, curState.parent.strings);
            if (curState.parent.itemContextMenu) {
                $(nxtCol).on('taphold', function(event) {
                    // This allows the container to have taphold context menus that are not
                    // triggered when this event is triggered.
                    event.stopImmediatePropagation();
                    curState.parent.selectedIndex = $(event.target).closest("td").attr('data-index');
                    //curState.parent.selected = curState.parent.list[curState.parent.selectedIndex];
                    curState.parent.selected = elem;
                    $(PrimeFaces.escapeClientId(curState.parent.itemContextMenu)).popup( "open", { positionTo: event.target });
                });
            } 
        },
    
        _refreshData: function(nElems, oncomplete) {
            var _self = this;
            var gridBody, tableBody, curState;        

            var contentContainer = _self.contentContainer = $(PrimeFaces.escapeClientId(this.contentId));
            if (contentContainer.length == 0) {
                contentContainer = $('<div />').attr({
                    'id' : this.contentId
                }).append($('<div/>')).appendTo(this.parent);
            } else {
                $(contentContainer).children('div').empty();
            }
            var contentParent = $(contentContainer).children('div');
            var doneFn = function(b) {
                $(contentParent).append(b);
                oncomplete();
            };
            if (nElems > 0) {
                if ($.isArray(this.list)) {
                    $(contentContainer).attr('class', CONTENT_CLASS_MOBILE);

                    /* Generate the actual data for the current page. */
                    tableBody = $('<tbody />');
                    curState = this._createRefreshState(this.list.length);
                    $.each(this.list.slice(curState.startElem, curState.endElem), function(idx, elem) {
                        _self._createOneElement(tableBody, curState, idx, elem);
                    });
                    gridBody = $('<table />').attr({
                                'class' : TABLE_CLASS
                                }).append(tableBody);
                    doneFn(gridBody);
                } else if (this.list.forEach) {
                    $(contentContainer).attr('class', CONTENT_CLASS_MOBILE);

                    /* Generate the actual data for the current page. */
                    tableBody = $('<tbody />');
                    var _list = this.list;

                    var _idx = 0;
                    curState = _self._createRefreshState(nElems);
                    _list.skip(curState.startElem);
                    _list.limit(curState.endElem - curState.startElem);
                    _list.each(function(elem) {
                        _self._createOneElement(tableBody, curState, _idx, elem);
                        ++_idx;
                    }, 
                    function() {

                    },
                    function() {
                        gridBody = $('<table />').attr({
                                'class' : TABLE_CLASS
                                }).append(tableBody);                    
                        doneFn(gridBody);
                    });
                } else {
                    gridBody = "Invalid item list type.";
                    doneFn(gridBody);
                }
            } else {
                $(contentContainer).attr('class', EMPTY_CONTENT_CLASS);
                gridBody = this.options.emptyMessage;
                doneFn(gridBody);
            }
        },
    
        nextPage: function(nPages, oncomplete) {
            if (this.currentPage < (nPages - 1)) {
                this.currentPage++;
                this.refresh(this.list, this.condition, oncomplete);
            }
        },
        prevPage : function(oncomplete) {
            if (this.currentPage > 0) {
                this.currentPage--;
                this.refresh(this.list, this.condition, oncomplete);
            }
        },
        _setupEvents: function() {
            if (Helix.hasTouch) {
                $(this.contentId).on('swiperight', function() {
                    this.prevPage();
                });
                $(this.contentId).on('swipeleft', function() {
                    this.prevPage();
                });
            }
        },
        _getDimensionForDeviceType: function(dimensionString) {
            var rowsOptions = dimensionString.split(",");
            if (Helix.deviceType == 'phone') {
                return rowsOptions[0];
            } else if (Helix.deviceType == 'phablet') {
                return rowsOptions[1];
            } else {
                return rowsOptions[rowsOptions.length - 1];
            }
        },
        refreshScroller: function() {
            if (this.contentContainer) {
                //Helix.Layout.updateScrollers(this.contentContainer);
            }
        },
        destroy: function() {
            if (this.contentContainer) {
                //Helix.Layout.cleanupScrollers(this.parent);
            }
        },
        closeItemPopup: function() {
            $(PrimeFaces.escapeClientId(this.options.itemContextMenu)).popup( "close" );
        }
    });
}( jQuery ));