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
    
    $.widget("helix.helixDatalist", {
        options: {
            /**
             * Determines if the list has the jQuery Mobile 'inset' style.
             */
            inset: true,
            
            /**
             * Determines if the list contents should scroll using native-style
             * scrolling.
             */
            scroll: true,
            
            /**
             * Text to display at the top of the list. Shows up as a divider but it
             * is not associated with the grouping mechanism in any way.
             */
            headerText: null,
            
            /**
             * Determines if the list is grouped. Groups are divided using a 
             * jQuery Mobile list divider. If the list is grouped, then the groupName
             * and groupMembers options must be provided.
             */
            grouped: false,
            
            /**
             * For grouped lists, apply this function to each row to get the group
             * name of that row. The query collection supplied to this object is
             * the collection of groups, not group rows.
             */
            groupName: null,
            
            /**
             * For grouped lists, apply this function to each group row to get the
             * query collection of group members.
             */
            groupMembers: null,
            
            /**
             * Style class applied to each divider row.
             */
            dividerStyleClass: null,
            
            /**
             * Style class applied to each non-divider row.
             */
            rowStyleClass: null,
            
            /**
             * JavaScript condition that indicates if this data list is currently
             * visible.
             */
            condition: true,
            
            /**
             * Message to display in the list if the entire list is empty.
             */
            emptyMessage: "There are no items to display.",
            
            /**
             * Message to display in the list if a group has no rows.
             */
            emptyGroupMessage: "There are no items to display in this group.",
            
            /**
             * Items per page, if the list is paginated.
             */
            itemsPerPage: null,
            
            /**
             * Paginator format. The default is to show a previous button,
             * the current page count (e.g., 1 of 3), and a next button. This
             * only applies if itemsPerPage is non-null.
             */
            paginatorTemplate: '{PreviousPageLink} {CurrentPageReport} {NextPageLink}',
            
            /**
             * Action to perform if the user taps/clicks on a list item.
             */
            selectAction: null,
            
            /**
             * Context menu to display if the user tap-holds (for touch devices)
             * or double clicks (for non-touch devices) on a list item. When 
             * both this option and holdAction are specified, this option takes
             * precedence. Specify either a jQuery object or a select to uniquely
             * identify the jQuery Mobile popup to open.
             */
            itemContextMenu: null,
            
            /**
             * Action to perform if the user tap-holds (for touch devices) or 
             * double clicks (for non-touch devices) on a list item.
             */
            holdAction: null,
            
            /**
             * Function that accepts a query collection and the contents of
             * the search box and returns a filtered query collection. If null,
             * no search box is shown.
             */
            indexedSearch: null,
            
            /**
             * List of fields to allow the user to selectively sort by. This option
             * is specified as an object mapping field names for rows in the
             * underlying QueryCollection object to a user-friendly name that is
             * displayed in the sort popup menu. e.g.,
             *     {
             *          'firstName' : 'First Name',
             *          'lastName'  : 'Last Name'
             *     }
             */
            sorts: null,
            
            /**
             * Comma-delimited, ordered list of fields to sort by.
             */
            sortBy: null,
            
            /**
             * Comma-delimited, ordered list of sort directions. Each direction is
             * either ASCENDING or DESCENDING. If this list is shorter than the
             * sortBy list, then the final value in this list will apply to all
             * non-matching fields in the sortBy list.
             */
            sortOrder: "ASCENDING",
            
            /**
             * Callback to execute when the sort order changes. The first argument
             * is the new sort field. The second is either ASCENDING or DESCENDING
             * to specify the new sort order. This callback is invoked before
             * the list is refreshed.
             */
            onSortChange: null,
            
            /**
             * List of fields to filter by. These fields are specified as a map
             * similar to the sorts field.
             */
            filters: null,
            
            /**
             * Callback that is invoked to do the actual filtering. The input to
             * this callback is the current query collection for all items in
             * the list, the field name from the filters list, and the
             * currently selected row. E.g.,
             *     doFilter(allItemsCollection, fieldName, selectedRow)
             */
            doFilter: null,
            
            /**
             * List of data to display in the list. Must be a PersistenceJS
             * QueryCollectin object.
             */
            itemList: null,
            
            /**
             * Specify the icon for a split icon layout if one is going to be
             * used for the list items. See jQuery Mobile documentation of the
             * listview plugin for further detail on what a split icon layout
             * means.
             */
            splitIcon: null,
            
            /**
             * Specify the theme for the split button. This item is ignored unless
             * splitIcon is non-null.
             */
            splitTheme: null,
            
            /**
             * Function used to render a single data row (i.e. a non-group-name
             * row). If a list row should be skipped the renderer should return
             * false. Otherwise, to include a row in the list it must return
             * true. Options to this function are the parent div of the row markup,
             * a reference to this list object, the row data, the row index, and
             * the array of strings supplied with the strings option. E.g.,:
             *      renderRow(curRowParent, list, rowData, rowIndex, strings)
             */
            rowRenderer: null,
            
            /**
             * Comma-separated list of localizable strings. These can be supplied
             * when a server generates this markup using a server-side localization
             * technique. These strings are separated into an array and then passed
             * through to the rowRenderer function.
             */
            strings: null
        },
    
        _create: function() {
            this.$wrapper = this.element;
            if (this.options.scroll) {
                this.element.addClass('hx-scroller-nozoom');
            }
            
            /**
             * Append the data list.
             */
            this.$parent = $('<ul/>').attr({
                'data-role' : 'listview',
                'class' : 'hx-listview'
            }).appendTo(this.$wrapper);
            if (this.options.inset) {
                this.$parent.attr('data-inset', true);
            }
            
            /**
             * Split icons, if appropriate.
             */
            if (this.options.splitIcon) {
                this.$parent.attr('data-split-icon', this.options.splitIcon);
            }
            if (this.options.splitTheme) {
                this.$parent.attr('data-split-theme', this.options.splitTheme);
            }

            this.$parent.listview();

            // Column setup.
            this._currentPage = 0;
            
            // Set context menu event to taphold for touch devices, dblclick for none-touch.
            //this.contextEvent = 'taphold';
            if (Helix.hasTouch) {
                this.contextEvent = 'taphold';
                this.tapEvent = 'tap';
            } else {
                this.contextEvent = 'taphold';
                //this.contextEvent = 'dblclick';
                this.tapEvent = 'click';
            }
        
            // Default sort.
            this._currentSort = this.options.sortBy;
            this._currentSortOrder = this.options.sortOrder.toUpperCase();
        
            if (this.options.strings) {
                this.strings = this.options.strings.split(",");            
            }
            var _self = this;
            this.refreshList(this.options.itemList,this.options.condition,null,null,function() {
                //Helix.Layout.addScrollers(_self.$wrapper);
                setTimeout(function() {
                    //Helix.Layout.updateScrollers(_self.$wrapper);
                }, 0);
            });
        },
        refreshList: function(list,condition,sorts,filters,oncomplete) {
            /* List must be non-empty and it must be a query collection. */
            if (!list || !list.forEach) {
                return;            
            }
        
            var _self = this;
            
            /* itemList is the current query collection. Display list is an array
             * of the currently displayed items.
             */
            _self.unfilteredList = _self.itemList = list;
        
            if ((condition !== undefined) &&
                !condition) {
                /* The condition is false. Remove this entirely from the DOM. */
                _self.$wrapper.hide();
                return;
            } else {
                _self.$wrapper.show();
            }
            
            /* Create the sort popup */
            if (!sorts) {
                sorts = _self.options.sorts;
            }
            if (sorts) {
                _self._refreshSortContainer(sorts);
            }
            
            if (!filters) {
                filters = _self.options.filters;
            }
            if (filters && _self.options.doFilter) {
                _self._refreshFilterContainer(filters);
            }
            
            _self._currentPage = 1;
            _self._refreshData(function() {
                if (_self.nElems == 0) {
                    _self.$parent.empty();
                    _self.$parent.append($('<li />').append(_self.options.emptyMessage));
                } else {
                    /* Update the scroller. */
                    if (_self.options.scroll) {
                        //Helix.Layout.updateScrollers(_self.$wrapper);
                    }
                }
                _self.$parent.listview( "refresh" );
                if (oncomplete) {
                    oncomplete(_self);            
                }
            });
            /**
             * Must go after the _refreshData call because we need to compute the
             * list we are actually going to display before we paginate it.
             */
            _self._refreshPaginatorContainer();
        },
        _refreshSortContainer: function(sorts) {
            var _self = this;
            /* we are only called if sorts is non-null. */
            if (_self._sortContainer) {
                /* Remove the old context menu ... */
                _self._sortContainer.remove();
            }
            
            _self._sortContainer = $('<div/>').attr({
                'data-role' : 'popup',
                'id' : Helix.Utils.getUniqueID(),
                'data-theme' : 'a',
                'data-position-to' : 'origin',
                'data-history': 'false'
            }).appendTo(_self.$wrapper);
            var sortsList = $('<ul />').attr({ 
                'data-role' : 'listview',
                'data-inset' : 'true',
                'data-theme' : 'b'
            }).appendTo(_self._sortContainer);
            for (var sortFld in sorts) {
                if (sorts[sortFld] !== "[none]") {
                    var sortItem = $('<li />').append($('<a />').attr({ 
                        'href' : 'javascript:void(0)',
                        'data-field': sortFld
                    }).append(sorts[sortFld]));
                    $(sortsList).append(sortItem);
                    $(sortItem).on('tap', function(evt) {
                        evt.stopImmediatePropagation();                        
                        var newSortField = $(evt.target).attr('data-field');
                        if (newSortField == _self._currentSort) {
                            if (_self._currentSortOrder === "ASCENDING") {
                                _self._currentSortOrder = "DESCENDING";
                            } else {
                                _self._currentSortOrder = "ASCENDING";
                            }
                        } else {
                            _self._currentSort = newSortField;
                            _self._currentSortOrder = "ASCENDING";
                        }
                        if (_self.nElems == 0) {
                            /* Nothing to do. */
                            return;
                        }
                        if (_self.options.onSortChange) {
                            _self.options.onSortChange(_self._currentSort, _self._currentSortOrder);
                        }

                        _self._refreshData(function() {
                            _self.$parent.listview( "refresh" );
                        });
                    });
                }
            }
            sortsList.listview();
            _self._sortContainer.popup();            
        },
        _refreshFilterContainer: function(filters) {
            var _self = this;
            /* we are only called if filters is non-null. */
            if (_self._filterContainer) {
                /* Remove the old filter menu ... */
                _self._filterContainer.remove();
            }
            
            _self._filterContainer = $('<div/>').attr({
                'data-role' : 'popup',
                'id' : Helix.Utils.getUniqueID(),
                'data-theme' : 'a',
                'data-position-to' : 'origin',
                'data-history': 'false'
            }).appendTo(_self.$wrapper);
            var filtersList = $('<ul />').attr({ 
                'data-role' : 'listview',
                'data-inset' : 'true',
                'data-theme' : 'b'
            }).appendTo(_self._filterContainer);
            for (var filterFld in filters) {
                if (filters[filterFld] !== "[none]") {
                    var filterItem = $('<li />').append($('<a />').attr({ 
                        'href' : 'javascript:void(0)',
                        'data-field': filterFld
                    }).append(filters[filterFld]));
                    filtersList.append(filterItem);
                    filterItem.on('tap', function(evt) {
                        evt.stopImmediatePropagation();                        
                        var newFilterField = $(evt.target).attr('data-field');
                        _self.itemList = _self.options.doFilter(_self.unfilteredList, newFilterField, _self.selected);
                        _self._refreshData(function() {
                            _self.$parent.listview( "refresh" );
                        });
                    });
                }
            }
            /* Always have a "Clear" option. */
            $('<li />').append($('<a />').attr({ 
                'href' : 'javascript:void(0)',
                'data-field': '__clear'
            }).append("Clear"))
              .appendTo(filtersList)
              .on('tap', function(evt) {
                evt.stopImmediatePropagation();                        
                _self.itemList = _self.unfilteredList;
                _self._refreshData(function() {
                    _self.$parent.listview( "refresh" );
                });
            });
            
            filtersList.listview();
            _self._filterContainer.popup();            
        },
        _refreshPaginatorContainer: function() {
            var _self = this;
            if (!_self.options.itemsPerPage) {
                return;
            }
        
            if (!_self._paginatorContainer) {
                _self._paginatorContainer = $('<div />').attr({
                    'class': Helix.Utils.paginator.PAGINATOR_TOP_CONTAINER_CLASS
                }).insertBefore(_self.$parent);
            } else {
                _self._paginatorContainer.empty();
            }
            
            $.each(this.options.paginatorTemplate.split(" "), function(idx, obj) {
                Helix.Utils.paginator.render(obj, _self._paginatorContainer, {
                    'page' : _self._currentPage,
                    'totalItems' : _self.displayList.length,
                    'itemsPerPage' : _self.options.itemsPerPage,
                    'nextPage' : _self.nextPage,
                    'prevPage' : _self.prevPage,
                    'owner' : _self
                });
            });
        },
        _refreshData: function(oncomplete) {
            var _self = this;
            var orderby = _self._currentSort; 
            var displayCollection = _self.itemList;
        
            this._clearListRows();
            _self.displayList = [];
        
            /* Generate the actual data for the current page. */
            if (_self.options.indexedSearch) {
                _self._prependSearchBox();
            }

            if (_self.options.headerText) {
                $('<li />').attr({
                    'data-role' : 'list-divider'
                }).append(_self.options.headerText)
                .appendTo(_self.$parent);
            }
        
            if (_self.options.itemsPerPage && _self.options.itemsPerPage > 0) {
                if (_self.currentPage > 1) {
                    displayCollection = displayCollection.skip((_self.currentPage - 1) * _self.options.itemsPerPage);
                }
                displayCollection = displayCollection.limit(_self.options.itemsPerPage);
                /* XXX: Determine if there is a next page. If not, disable the next button. */
            }
            if (orderby) {
                displayCollection = _self._applyOrdering(displayCollection);
            }

            var rowIndex = 0;
            displayCollection.each(
                /* Process each element. */
                function(curRow) {
                    if (_self._renderSingleRow(curRow, rowIndex, function(finishedIdx) {
                        if (_self.options.grouped && (finishedIdx == (_self.nElems - 1))) {
                            /* Call completion when all rows are done rendering. */
                            oncomplete();
                        }
                    })) {
                        ++rowIndex;
                    }
                },
                /* Called on start. */
                function(count) {
                    _self.nElems = count;
                },
                /* Called on done. */
                function(count) {
                    if (rowIndex == 0 || (!_self.options.grouped)) {
                        /* We did not render any rows. Call completion. */
                        oncomplete();
                    }
                }
            );
        },
        _clearListRows: function() {
            var toRemove = this.$parent.find("li").filter(":not(li[data-fixed-header='yes'])");
            toRemove.remove();
            this.$parent.find('[data-role="fieldcontain"]').remove();
        },
        _prependSearchBox: function() {
            if (this.$searchBox) {
                this.$wrapper.prev().remove();
            }
            
            var sboxID = Helix.Utils.getUniqueID();
            this.$searchBox = $('<input/>').attr({
                'type' : 'search',
                'name' : 'search',
                'id' : sboxID,
                'value' : ''
            }).insertBefore(this.$wrapper);
            
            this.$searchLabel = $('<label/>').attr({
                'for': sboxID
            }).append('Search').insertBefore(this.$searchBox).hide();
            this.$searchBox.textinput();
        },
        /* Apply the appropriate sort to the display collection. */
        _applyOrdering: function(displayCollection) {
            var orderby = this._currentSort; 
            var direction = this._currentSortOrder;
        
            var orderbyFields = orderby.split(",");
            var directionVals = direction.split(",");

            var oidx = 0;
            for (oidx = 0; oidx < orderbyFields.length; ++oidx) {
                var latestDirection = ( (oidx < directionVals.length) ? directionVals[oidx] : directionVals[directionVals.length - 1]);
                if (latestDirection == "DESCENDING") {
                    displayCollection = displayCollection.order(orderbyFields[oidx], false);
                } else {
                    displayCollection = displayCollection.order(orderbyFields[oidx], true);
                }
            }
            return displayCollection;
        },
        _renderSingleRow: function(curRow, rowIndex, oncomplete) {
            var _self = this;
            if (_self.options.grouped) {
                var rowObject = {
                    'group': curRow, 
                    'rows' : []
                };
                _self.displayList.push(rowObject);
          
                var groupName = _self.options.groupName(rowObject.group);
                var groupMembers = _self.options.groupMembers(rowObject.group);
                var groupIndex = 0;
                if (groupMembers) {
                    groupMembers.forEach(
                        /* Element callback. */
                        function(groupRow) {
                            if (_self._renderRowMarkup(groupRow, rowIndex, groupIndex)) {
                                rowObject.rows.push(groupRow);
                                ++groupIndex;
                            }
                        },
                        /* On start. */
                        function(ct) {
                            // Attach the group header.
                            var dividerLI = $('<li />').attr({
                                'data-role' : 'list-divider'
                            }).append(groupName).appendTo(_self.$parent);
                            if (_self.options.dividerStyleClass) {
                                $(dividerLI).attr('class', _self.options.dividerStyleClass);
                            }
                            if (ct == 0) {
                                $('<li />').attr({
                                    'class' : _self.options.rowStyleClass
                                }).append(_self.options.emptyGroupMessage)
                                .insertAfter(dividerLI);
                            }
                        },
                        /* On done. */
                        function() {
                            oncomplete(rowIndex);
                        }
                    );
                } else {
                    $('<li />').attr({
                        'class' : _self.options.rowStyleClass
                    }).append(_self.emptyGroupMessage)
                    .insertAfter(dividerLI);
                }
                return true;
            } else {
                if (_self._renderRowMarkup(curRow, rowIndex)) {
                    _self.displayList.push(curRow);
                    oncomplete(rowIndex);
                    return true;
                }
                oncomplete(rowIndex);
                return false;
            }  
        },
    
        _renderRowMarkup: function(row, rowIndex, groupIndex) {
            var _self = this;
            
            var curRowParent = $('<li />').attr({
                'class' : _self.options.rowStyleClass,
                'data-index' : rowIndex
            });
            if (_self.options.grouped) {
                curRowParent.attr('data-group-index', groupIndex);
            }
        
            if (_self.options.rowRenderer(curRowParent, _self, row, rowIndex, _self.options.strings)) {
                curRowParent.appendTo(_self.$parent);
            } else {
                return false;
            }
            
            if (_self.options.itemContextMenu) {
                $(curRowParent).on(this.contextEvent, function(event) {
                    // This allows the container to have taphold context menus that are not
                    // triggered when this event is triggered.
                    event.stopImmediatePropagation();
                    _self.setSelected(event.target);
                    $(PrimeFaces.escapeClientId(_self.options.itemContextMenu)).popup( "open", {
                        positionTo: event.target
                    });
                });
            } else if (_self.options.holdAction) {
                $(curRowParent).on(_self.contextEvent, function(event) {
                    _self.setSelected(event.target);
                    _self.options.holdAction(_self.selected, _self.selectedGroup, _self.options.strings);
                    event.stopPropagation();
                }); 
            } 
            if (_self.options.selectAction) {
                $(curRowParent).on(_self.tapEvent, function(event) {
                    _self.setSelected(event.target);
                    _self.selectItem();
                    event.stopImmediatePropagation();
                    event.preventDefault();
                });
            }
        
            return true;
        },
    
        setSelected: function(targetElem) {
            var enclosingLI = $(targetElem).closest("li[data-index]");
            if (this.selectedLI) {
                this.selectedLI.removeClass('ui-btn-active');
            }
            this.selectedLI = enclosingLI;
            this.selectedLI.addClass('ui-btn-active');
        
            this.selectedIndex = $(enclosingLI).attr('data-index');
            if (this.options.grouped) {
                this.selectedGroupRow = $(enclosingLI).attr('data-group-index');
                this.selected = this.displayList[this.selectedIndex].rows[this.selectedGroupRow];
                this.selectedGroup = this.displayList[this.selectedIndex].group;
            } else {
                this.selected = this.displayList[this.selectedIndex];
            }
        },
        getSelected: function() {
            return this.selected;
        },
    
        setSelectedByIndex: function(idx, groupIdx) {
            var targetElem;
            if (idx && groupIdx) {
                targetElem = $('li[data-index=' + idx +']').filter('[data-group-index=' + groupIdx + ']');
                if (targetElem && targetElem.length > 0) {
                    this.setSelected(targetElem);
                }
            } else {
                targetElem = $('li[data-index=' + idx +']');
                if (targetElem && targetElem.length > 0) {
                    this.setSelected(targetElem);
                }
            }
        },
        getSelectedRow: function() {
            return this.selectedIndex;
        },
    
        getSelectedGroupRow: function() {
            return this.selectedGroupRow;
        },
  
        createListRow: function(parentElement,rowComponents) {
            var mainLink = $('<a />').attr({
                'href' : 'javascript:void(0)'
            }).appendTo($(parentElement));
            
            if (rowComponents.image) {
                mainLink.append($('<img />').attr({
                    'src' : rowComponents.image
                }));
            }
            if (rowComponents.header) {
                if( Object.prototype.toString.call(rowComponents.header) == '[object String]' ) {
                    mainLink.append($('<h3 />').text(Helix.Utils.escapeQuotes(rowComponents.header)));
                } else {
                    mainLink.append($('<h3 />').append(rowComponents.header));
                }
            }
            if (rowComponents.subHeader) {
                mainLink.append($('<p />')
                .append($('<strong />')
                .text(rowComponents.subHeader)
            )
            );
            }
            if (rowComponents.body) {
                if (rowComponents.header || rowComponents.subHeader) {
                    mainLink.append($('<p />').append(rowComponents.body));
                } else {
                    mainLink.append(rowComponents.body);
                }
            }
            if (rowComponents.aside) {
                mainLink.append($('<p />').attr({
                    'class' : 'ui-li-aside'
                }).append(rowComponents.aside));
            }
            if (rowComponents.splitLink) {
                $(parentElement).append($('<a />').attr({
                    'href' : 'javascript:void(0)'
                }).on(this.tapEvent, function(ev) {
                    rowComponents.splitLink(ev);
                }));
            }
        },
        selectItem: function() {
            if (!this.selected) {
                this.setSelectedByIndex(0, 0);
            }
            this.options.selectAction(this.selected, this.selectedGroup, this.strings);          
        },
        holdItem: function() {
            if (!this.selected) {
                this.setSelectedByIndex(0, 0);
            }
            this.options.holdAction(this.selected, this.selectedGroup, this.strings);          
        },
        displaySortMenu: function(selector) {
            this._sortContainer.popup('open', { positionTo: selector });
        },
        displayFilterMenu: function(selector) {
            this._filterContainer.popup('open', { positionTo: selector });
        },
        setWrapperHeight: function(hgt) {
            this.$wrapper.height(hgt);
        },
        /**
         * Refresh the scroller surrounding the datalist contents.
         */
        refreshScroller: function() {
            //Helix.Layout.updateScrollers(this.$wrapper);
        },
        
        setHeaderText: function(txt) {
            this.options.headerText = txt;
        }
    
    });
})(jQuery);