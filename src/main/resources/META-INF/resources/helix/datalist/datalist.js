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
             * precedence. Specify either a jQuery object or a selector to uniquely
             * identify the jQuery Mobile popup to open.
             */
            itemContextMenu: null,
            
            /**
             * Filter to apply to determine whether or not a particular item has
             * the context menu attached to it. By default, all list items have the
             * context menu attached. If a function returning a boolean value is 
             * specified for this option, then when that function returns true
             * the item context menu is attached, and when the function returns false
             * it is not. This function accepts a single argument, which is the row
             * record from the itemList specified as an option at create time or in a
             * call to refreshList.
             */
            itemContextMenuFilter: null,
            
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
             * A common behavior is to have a visual cue that changes when the sort
             * is ascending vs. descending. This component implements this behavior
             * by automatically toggling between alternative buttons when the 
             * direction changes. This behavior is enabled by providing an object
             * for the sortButtons option that has an ascending and descending field,
             * each of whose value is a selector to find the appropriate button that
             * should be turned on/off. By default this behavior is disabled.
             */
            sortButtons : { },
            
            /**
             * List of fields to use as "this filters." This filters allow the user
             * to filter the list to the value of the currently selected item. Since
             * selecting an item often navigates away from the screen displaying the list,
             * it is recommended that the "this filters" list appears on tap-hold, using the
             * itemContextMenu. These fields are specified as a map similar to the sorts field.
             * The map's keys are field names which are present in each object in the list. The
             * map's values are display strings used to present the filter options to the user
             * in a popup list. Unlike sorts and global filters, no button is rendered to display
             * this filters. Instead, call displayFilterMenu from your own context menus supplied
             * as a selector value to the itemContextMenu option. NOTE, that because nested popups
             * are NOT permitted in jQuery Mobile, you must call popup("close") on the context
             * menu before calling displayFilterMenu! The argument to displayFilterMenu should
             * be the event target (i.e. what was clicked to pop up this menu).
             */
            thisFilters: null,
            
            /**
             * Callback that is invoked to do the actual filtering for this filters. 
             * The input to this callback is the current query collection for all items in
             * the list, the field name from the filters list, and the
             * currently selected row. E.g.,
             *     doThisFilter(allItemsCollection, fieldName, selectedRow)
             * The callback should return a filtered query collection object.
             */
            doThisFilter: null,
            
            /**
             * Map of global filters, which allow the user to narrow down the list to a particular
             * value for a field present in each object in the list. Global filters, if present,
             * are also displayed in a popup menu. That menu is opened via a sort button that is
             * placed next to the sort button and search box. Each global filter is represented as
             * an object, with fields 'display', for a string used to describe the filter in the
             * popup menu, 'values', for a list of potential values for the field, and 'valueNames'
             * for a list of descriptive names corresponding to those values. The globalFilters field
             * itself is, much like thisFilters, a map from field names to global filter objects.
             */
            globalFilters: null,
            
            /**
             * Callback that is invoked to do the actual filtering for global filters. The 
             * input to this callback is the current query collection for all items in
             * the list, the field name from the filters list, and the
             * currently selected row. E.g.,
             *     doThisFilter(allItemsCollection, fieldName, selectedVal)
             * The callback should return a filtered query collection object.
             */
            doGlobalFilter: null,
            
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
             * When supplied, a function to call on pull-to-refresh. When null,
             * pull to refresh is disabled.
             */
            pullToRefresh: null,
            
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
                this.$wrapper.addClass('pm-layout-full-height');
            }
            
            this.$page = this.$wrapper.closest('.ui-page');
            
            this.$searchSortDiv = $('<div/>')
                .appendTo(this.$wrapper)
                .addClass('hx-full-width')
                .hide();
            this._searchSortDirty = true;
            
            this.$paginatorDiv = null;
            if (this.options.itemsPerPage) {
                this.$paginatorDiv = $('<div/>')
                    .appendTo(this.$wrapper)
                    .addClass(Helix.Utils.paginator.PAGINATOR_TOP_CONTAINER_CLASS)
                    .hide();
            }
            
            /**
             * Append the hook div if we have pull to refresh setup.
             */
            this.$hookDiv = null;
            if (this.options.pullToRefresh) {
                this.$hookDiv = $('<div/>').appendTo(this.$wrapper);
            }
            
            /**
             * Append the data list.
             */
            var listWrapper = this.$listWrapper = $('<div/>').appendTo(this.$wrapper);
            this.$parent = $('<ul/>').attr({
                'data-role' : 'listview',
                'class' : 'hx-listview'
            }).appendTo(listWrapper);
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
            
            var _self = this;
            if (this.$hookDiv) {
                this.$hookDiv.hook({
                    reloadPage: false,
                    scrollTarget: listWrapper,
                    reloadEl: function() {
                        _self.options.pullToRefresh.call(this);
                    }
                });            
            }

            // Column setup.
            this._currentPage = 0;
            
            // Set context menu event to taphold for touch devices, dblclick for none-touch.
            //this.contextEvent = 'taphold';
            if (Helix.hasTouch) {
                this.contextEvent = 'taphold';
                this.tapEvent = 'tap';
            } else {
                this.contextEvent = 'contextmenu';
                this.tapEvent = 'click';
            }
        
            // Default sort.
            this._currentSort = this.options.sortBy;
            this._currentSortOrder = this.options.sortOrder.toUpperCase();
            this._updateSortButtons();
        
            if (this.options.strings) {
                this.strings = this.options.strings.split(",");            
            }

            this.refreshList(this.options.itemList,this.options.condition,null,function() {
                
            });
        },
        
        _getSortsFromOptions: function(sortFilterOptions) {
            if (sortFilterOptions.__hx_sorts) {
                return sortFilterOptions.__hx_sorts;
            }
            
            return sortFilterOptions.sorts;
        },
        
        _getThisFiltersFromOptions: function(sortFilterOptions) {
            if (sortFilterOptions.__hx_filters) {
                return sortFilterOptions.__hx_filters;
            }
            
            return sortFilterOptions.thisFilters;
        },
        
        _getGlobalFiltersFromOptions: function(sortFilterOptions) {
            if (sortFilterOptions.__hx_global_filters) {
                return sortFilterOptions.__hx_global_filters;
            }
            
            return sortFilterOptions.globalFilters;
        },
        
        /**
         * sortFilterOptions can either be a Mobile Helix enhanced PersistenceJS
         * schema (with the __hx_* fields) or a map with 3 fields - sorts, thisFilters,
         * and globalFilters with the format described in the options documentation.
         */
        refreshList: function(list,condition,sortFilterOptions,oncomplete) {
            /* List must be non-empty and it must be a query collection. */
            if (!list || !list.forEach) {
                return;            
            }
        
            var _self = this;
            
            /* itemList is the current query collection. Display list is an array
             * of the currently displayed items.
             */
            _self.unfilteredList = _self.itemList = list;
        
            /* Hide the list while we are manipulating it. */
            _self.$wrapper.hide();
            if ((condition !== undefined) &&
                !condition) {
                /* The condition is false. Remove this entirely from the DOM. */    
                return;
            }   
            
            /* Create the sort popup */
            var sorts = null;
            if (!sortFilterOptions) {
                sorts = _self.options.sorts;
            } else {
                sorts = _self._getSortsFromOptions(sortFilterOptions);
            }
            if (sorts) {
                _self._refreshSortContainer(sorts);
            }
            
            var thisFilters = null;
            if (!sortFilterOptions) {
                thisFilters = _self.options.thisFilters;
            } else {
                thisFilters = _self._getThisFiltersFromOptions(sortFilterOptions);
            }
            if (thisFilters && _self.options.doThisFilter) {
                _self._refreshFilterContainer(thisFilters);
            }
            
            var globalFilters = null;
            if (!sortFilterOptions) {
                globalFilters = _self.options.globalFilters;
            } else {
                globalFilters = _self._getGlobalFiltersFromOptions(sortFilterOptions);
            }
            if (globalFilters && _self.options.doGlobalFilter) {
                _self._refreshGlobalFilterContainer(globalFilters);
            }
            
            /* Generate the actual data for the current page. */
            _self._prependSearchBox();
            _self._updateSortButtons();
            
            _self._refreshData(function() {
                if (_self.nElems == 0) {
                    _self.$parent.empty();
                    _self.$parent.append($('<li />').append(_self.options.emptyMessage));
                }
                _self.$parent.listview( "refresh" );
                /**
                 * Must go after the _refreshData call because we need to compute the
                 * list we are actually going to display before we paginate it.
                 */
                _self._resetPaging();
                _self.$wrapper.show();
                
                /* It seems that attaching the scrolling classes after showing the list
                 * is required to make scrolling work properly on iOS.
                 */
                if (_self.options.scroll) {
                    _self.$listWrapper.removeClass('hx-scroller-nozoom');
                    _self.$listWrapper.addClass('hx-scroller-nozoom');
                    _self.$listWrapper.addClass('mh-layout-parent-height');
                }
                if (_self.options.pullToRefresh) {
                    _self.$listWrapper.css('-webkit-overflow-scrolling', 'touch');
                }
                if (oncomplete) {
                    oncomplete(_self);            
                }
            });
        },
        _updateSortButtons: function() {
            if ('ascending' in this.options.sortButtons &&
                'descending' in this.options.sortButtons) {
                if (this._currentSortOrder === "DESCENDING") {
                    // Show the descending button, reflecting the CURRENT order.
                    $(this.options.sortButtons.descending).show();
                    $(this.options.sortButtons.ascending).hide();
                } else {
                    $(this.options.sortButtons.ascending).show();                            
                    $(this.options.sortButtons.descending).hide();
                }
            }
        },
        
        _refreshSortContainer: function(sorts) {
            var _self = this;
            
            /* See if the contents of the sorts has changed. */
            var newSortsJSON = JSON.stringify(sorts);
            if (_self._currentSortsJSON) {
                if (newSortsJSON === _self._currentSortsJSON) {
                    // No change.
                    return;
                }
            }
            _self._currentSortsJSON = newSortsJSON;
            /* Need to refresh the search/sort area. */
            _self._searchSortDirty = true;
            
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
                    
                    /* Highlight the current sort. */
                    if (sortFld === _self._currentSort) {
                        $(sortItem).addClass('hx-current-sort');
                    }
                    
                    /* Do the actual sorting ... */
                    $(sortItem).on(_self.tapEvent, function(evt) {
                        evt.stopImmediatePropagation();                       
                        var newSortField = $(evt.target).attr('data-field');
                        if (newSortField === _self._currentSort) {
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
                            return false;
                        }
                        if (_self.options.onSortChange) {
                            _self.options.onSortChange(_self._currentSort, _self._currentSortOrder);
                        }
                        _self._updateSortButtons();
                        
                        // Change the li for this sort field so that we can see it is the current sort field.
                        $(sortsList).find('li').removeClass('hx-current-sort');
                        $(this).addClass('hx-current-sort');

                        _self._refreshData(function() {
                            _self._resetPaging();
                            _self.$parent.listview( "refresh" );
                        });
                        $(_self._sortContainer).popup("close");
                        return false;
                    });
                }
            }
            sortsList.listview();
            _self._sortContainer.popup();            
        },
        
        _refreshFilterContainer: function(filters) {
            var _self = this;
            
            /* See if the contents of the filters has changed. */
            var newFiltersJSON = JSON.stringify(filters);
            if (_self._currentFiltersJSON) {
                if (newFiltersJSON === _self._currentFiltersJSON) {
                    // No change.
                    return;
                }
            }
            _self._currentFiltersJSON = newFiltersJSON;
            
            /* we are only called if filters is non-null. */
            if (_self._filterContainer) {
                /* Remove the old filter menu ... */
                _self._filterContainer.remove();
            }
            
            _self._filterContainer = $('<div/>').appendTo(_self.$wrapper);
            
            var contextMenuItems = [];
            for (var filterFld in filters) {
                if (filters[filterFld] !== "[none]") {
                    var filterItem = $('<li />').append($('<a />').attr({ 
                        'href' : 'javascript:void(0)',
                        'data-field': filterFld
                    }).append());
                    contextMenuItems.push({
                        'display': filters[filterFld],
                        'data': filterFld,
                        'action': function(newFilterField) {
                            _self.itemList = _self.options.doThisFilter(_self.unfilteredList, newFilterField, _self.selected);
                            _self._refreshData(function() {
                                _self._resetPaging();
                                _self.$parent.listview( "refresh" );
                            });
                            _self._filterContextMenu.close();
                        }
                    });
                }
            }
                    
            /* Always have a "Clear" option. */
            contextMenuItems.push({
                'display' : 'Clear',
                'action' : function() {
                    _self.itemList = _self.unfilteredList;
                    _self._refreshData(function() {
                        _self._resetPaging();
                        _self.$parent.listview( "refresh" );
                    });
                    _self._filterContextMenu.close();
                }
            });
            _self._filterContextMenu = $(_self._filterContainer).helixContextMenu({
                items: contextMenuItems
            }).data('helix-helixContextMenu');
        },
        
        _normalizeFilterValue: function(val) {
            var intValue = parseInt(val);
            if (intValue === NaN) {
                return val;
            } else {
                return intValue;
            }
        },
        
        _resetGlobalFilters: function() {
            var curCollection = this.unfilteredList;
            for (var filteredFld in this._filterMap) {
                curCollection = this.options.doGlobalFilter(curCollection, filteredFld, this._filterMap[filteredFld]);
            }
            return curCollection;
        },
        
        _doGlobalFilter: function(gFilterField, gFilterValue) {
            var _self = this;
            var _filterValue = this._normalizeFilterValue(gFilterValue);
            if (gFilterValue === '__hx_clear') {
                // Clear out this field, then starting from the unfiltered list re-instate all
                // remaining fields.
                delete _self._filterMap[gFilterField];
                _self.itemList = this._resetGlobalFilters();
            } else {
                if (_self._filterMap[gFilterField] &&
                    _self._filterMap[gFilterField] === _filterValue) {
                    // The filter did not change ... do nothing.
                    return;
                } else if (_self._filterMap[gFilterField] &&
                           _self._filterMap[gFilterField] !== _filterValue) {
                    // Start over.
                    _self._filterMap[gFilterField] = _filterValue;
                    _self.itemList = this._resetGlobalFilters();
                } else {
                    // Use itemList in the call below as filters can build on each other.
                    _self._filterMap[gFilterField] = _filterValue;
                    _self.itemList = _self.options.doGlobalFilter(_self.itemList, gFilterField, _filterValue);
                }
            }
            _self._refreshData(function() {
                _self._resetPaging();
                _self.$parent.listview( "refresh" );
            });
        },
        
        _refreshGlobalFilterContainer: function(filters) {
            var _self = this;
            
            /* See if the contents of the filters has changed. */
            var newFiltersJSON = JSON.stringify(filters);
            if (_self._currentGlobalFiltersJSON) {
                if (newFiltersJSON === _self._currentGlobalFiltersJSON) {
                    // No change.
                    return;
                }
            }
            _self._currentGlobalFiltersJSON = newFiltersJSON;
            /* Need to refresh the search/sort area. */
            _self._searchSortDirty = true;
            
            /* we are only called if filters is non-null. */
            if (_self._globalFilterContainer) {
                /* Remove the old filter menu ... */
                _self._globalFilterContainer.remove();
            }
            if (!_self._filterMap) {
                _self._filterMap = {};
            }
            
            _self._globalFilterContainer = $('<div/>').attr({
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
            }).appendTo(_self._globalFilterContainer);
            for (var fldName in filters) {
                var filterObj = filters[fldName];
                var filterItem = null;
                if (filterObj.values.length == 1) {
                    filterItem = $('<li />').append($('<a />').attr({ 
                        'href' : 'javascript:void(0)',
                        'data-field': fldName,
                        'data-value': filterObj.values[0]
                    }).append(filterObj.valueNames[0]));
                    filtersList.append(filterItem);
                    
                    // Execute the global filter.
                    filterItem.on(_self.tapEvent, function(evt) {
                        evt.stopImmediatePropagation();
                        evt.preventDefault();
                        var newFilterField = $(evt.target).attr('data-field');
                        var newFilterValue = $(evt.target).attr('data-value');
                        
                        _self._doGlobalFilter(newFilterField, newFilterValue);
                        $(_self._globalFilterContainer).popup("close");
                    });
                } else {
                    var selectID = Helix.Utils.getUniqueID();
                    $('<label/>').attr({ 
                        'for' : selectID
                    }).append(filterObj.display).appendTo(filtersList);
                    filterItem = $('<select/>')
                                    .attr({
                                        'name' : selectID,
                                        'id': selectID,
                                        'data-field' : fldName
                                    })
                                    .appendTo(filtersList);
                    for (var i = 0; i < filterObj.values.length; ++i) {
                        var filterName = filterObj.valueNames[i];
                        if (!filterName || !filterName.trim()) {
                            continue;
                        }
                        
                        $('<option/>').attr({
                            'value' : filterObj.values[i],
                            'data-field' : fldName
                        })
                        .append(filterName)
                        .appendTo(filterItem);
                    }
                    // add a special 'clear' value, which is the default value.
                    $('<option/>').attr({
                        'value' : '__hx_clear',
                        'data-field' : fldName,
                        'selected' : 'true'
                    }).append('Clear')
                    .appendTo(filterItem);
                    
                    filterItem.selectmenu({ mini: true });
                    
                    filterItem.change(function(evt) {
                        evt.stopImmediatePropagation();
                        evt.preventDefault();
                        $(this).find("option:selected").each(function() {
                            var gFilterField = $(this).attr('data-field');
                            var gFilterValue = $(this).val();
                            _self._doGlobalFilter(gFilterField, gFilterValue);
                            $(_self._globalFilterContainer).popup("close");
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
              .on(_self.tapEvent, function(evt) {
                evt.stopImmediatePropagation();
                evt.preventDefault();
                
                // Reset the values in the global filter popup.
                for (var fField in _self._filterMap) {
                    $('option[data-field="' + fField + '"]').removeAttr('selected');
                    $('option[value="__hx_clear"][data-field="' + fField + '"]').prop('selected', 'true');
                    $('select[data-field="' + fField + '"]').selectmenu('refresh');
                }
                
                _self._filterMap = {};
                _self.itemList = _self.unfilteredList;
                _self._refreshData(function() {
                    _self._resetPaging();
                    _self.$parent.listview( "refresh" );
                });
                $(_self._globalFilterContainer).popup("close");
            });
            
            filtersList.listview();
            _self._globalFilterContainer.popup();            
        },
        
        _refreshPaginatorContainer: function() {
            var _self = this;
            if (!_self.options.itemsPerPage) {
                return;
            }
        
            _self.$paginatorDiv.empty().hide();
            
            var totalPages = Math.floor(_self.nElems / _self.options.itemsPerPage) + 1;            
            $.each(this.options.paginatorTemplate.split(" "), function(idx, obj) {
                if (_self._currentPage == 0 &&
                    obj === '{PreviousPageLink}') {
                    // No prev page.
                    return;
                }
                
                if (_self._currentPage == (totalPages - 1) &&
                    obj === '{NextPageLink}') {
                    // No next page.
                    return;
                }
                
                Helix.Utils.paginator.render(obj, _self.$paginatorDiv, {
                    'page' : _self._currentPage,
                    'totalItems' : _self.nElems,
                    'itemsPerPage' : _self.options.itemsPerPage,
                    'nextPage' : _self.nextPage,
                    'prevPage' : _self.prevPage,
                    'owner' : _self
                });
                _self.$paginatorDiv.show();
            });
        },
        
        _resetPaging: function() {
            this._currentPage = 0;
            this._refreshPaginatorContainer();
        },
        
        nextPage: function() {
            this._currentPage++;
            var _self = this;
            this._refreshData(function() {
                _self.$parent.listview( "refresh" );
                _self._refreshPaginatorContainer();
            });
        },
        
        prevPage: function() {
            if (this._currentPage == 0) {
                return;
            }
            this._currentPage--;
            var _self = this;
            this._refreshData(function() {
                _self.$parent.listview( "refresh" );
                _self._refreshPaginatorContainer();
            });            
        },
        
        _refreshData: function(oncomplete) {
            var _self = this;
            var orderby = _self._currentSort; 
            var displayCollection = _self.itemList;
        
            this._clearListRows();
            _self.displayList = [];
        
            if (_self.options.headerText) {
                $('<li />').attr({
                    'data-role' : 'list-divider'
                }).append(_self.options.headerText)
                .appendTo(_self.$parent);
            }
        
            var startIndex = 0;
            var itemsPerPage = 0;
            if (_self.options.itemsPerPage && _self.options.itemsPerPage > 0) {
                if (_self._currentPage > 0) {
                    startIndex = (_self._currentPage) * _self.options.itemsPerPage;
                }
                itemsPerPage = _self.options.itemsPerPage;
                //displayCollection = displayCollection.limit(_self.options.itemsPerPage);
                /* XXX: Determine if there is a next page. If not, disable the next button. */
            }
            if (orderby /*&& !_self.__searchText*/) {
                displayCollection = _self._applyOrdering(displayCollection);
            }

            var rowIndex = 0;
            var nRendered = 0;
            displayCollection.each(
                /* Process each element. */
                function(curRow) {
                    ++rowIndex;
                    if (itemsPerPage > 0 && nRendered >= itemsPerPage) {
                        return;
                    }
                    if (itemsPerPage > 0 && rowIndex < startIndex) {
                        return;
                    }
                    
                    if (_self._renderSingleRow(curRow, nRendered, function(finishedIdx) {
                        if (_self.options.grouped && (finishedIdx == (_self.nElems - 1))) {
                            /* Call completion when all rows are done rendering. */
                            oncomplete();
                        }
                    })) {
                        ++nRendered;
                    }
                },
                /* Called on start. */
                function(count) {
                    _self.nElems = count;
                },
                /* Called on done. */
                function(count) {
                    if (nRendered == 0 || (!_self.options.grouped)) {
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
        
        _doSearch: function() {
            var _self = this;
            _self.__searchText = _self.$searchBox.val();
            if (_self.__searchReadyTimeout) {
                clearTimeout(_self.__searchReadyTimeout);
            }

            _self.__searchReadyTimeout = setTimeout(function() {
                _self.itemList = _self.options.indexedSearch(_self.__searchText);
                _self._refreshData(function() {
                    _self._resetPaging();
                    _self.$parent.listview( "refresh" );
                });
                _self.__searchReadyTimeout = null;
            }, 1000);
        },
        
        _prependSearchBox: function() {
            var _self = this;
            var hasButtons = _self._globalFilterContainer || _self._sortContainer; 
            var useControlGroup = false;
            if (!_self._searchSortDirty) {
                return;
            }
            
            _self.$searchSortDiv.empty();
            _self._searchSortDirty = false;

            if (hasButtons) {
                if (_self._sortContainer && _self._globalFilterContainer) {
                    useControlGroup = true;
                }
                
                var $sortDiv = $('<div/>').attr({
                    'class' : 'hx-display-inline',
                    'data-role' : 'none',
                    'data-type' : 'horizontal'
                }).appendTo(_self.$searchSortDiv);
                if (_self._sortContainer) {
                    /* Ascending/descending sort buttons. */
                    var sAscendID = Helix.Utils.getUniqueID();
                    var sDescendID = Helix.Utils.getUniqueID();
                    this.options.sortButtons = {
                        'ascending' : PrimeFaces.escapeClientId(sAscendID),
                        'descending' : PrimeFaces.escapeClientId(sDescendID)
                    };

                    this.$sortAscending = $('<a/>').attr({
                        'id' : sAscendID,
                        'data-role' : 'none',
                        'data-icon' : 'arrow-u',
                        'data-iconpos' : 'notext',
                        'data-theme' : 'b',
                        'data-mini' : (useControlGroup ? 'true' : 'false')
                    }).button()
                    .appendTo($sortDiv)
                    .on(_self.tapEvent, function(ev) {
                        ev.stopPropagation();
                        ev.stopImmediatePropagation();
                        ev.preventDefault();
                        
                        _self.displaySortMenu(this);
                    });
                    this.$sortDescending = $('<a/>').attr({
                        'id' : sDescendID,
                        'data-role' : 'none',
                        'data-icon' : 'arrow-d',
                        'data-iconpos' : 'notext',
                        'data-theme' : 'b',
                        'data-mini' : (useControlGroup ? 'true' : 'false')
                    }).button()
                    .appendTo($sortDiv)
                    .on(_self.tapEvent, function(ev) {
                        ev.stopPropagation();
                        ev.stopImmediatePropagation();
                        ev.preventDefault();
                        
                        _self.displaySortMenu(this);
                    });                    
                }
                
                if (_self._globalFilterContainer) {
                    /* Filter button. */
                    var sFilterID = Helix.Utils.getUniqueID();
                    this.$filter = $('<a/>').attr({
                        'id' : sFilterID,
                        'data-role' : 'none',
                        'data-icon' : 'filter',
                        'data-iconpos' : 'notext',
                        'data-theme' : 'b',
                        'data-mini' : (useControlGroup ? 'true' : 'false')
                    }).button()
                    .appendTo($sortDiv)
                    .on(_self.tapEvent, function(ev) {
                        ev.stopPropagation();
                        ev.stopImmediatePropagation();
                        ev.preventDefault();
                        
                        _self.displayGlobalFilterMenu(this);
                    });                    
                }
                
                if (useControlGroup) {
                    $sortDiv.controlgroup();
                } else {
                    $sortDiv.controlgroup({ corners: false });
                }
            }
            if (this.options.indexedSearch) {
                var styleClass = 'hx-display-inline';
                var widthStyle = null;
                if (!hasButtons) {
                    styleClass = styleClass + ' hx-full-width';
                } else {
                    if (useControlGroup) {
                        widthStyle = '60%';
                    } else {
                        widthStyle = '80%';
                    }
                }
                var $searchDiv = $('<div/>').attr({
                    'class' : styleClass
                }).appendTo(_self.$searchSortDiv);
                var sboxID = Helix.Utils.getUniqueID();
                this.$searchBox = $('<input/>').attr({
                    'type' : 'search',
                    'name' : 'search',
                    'id' : sboxID,
                    'value' : '',
                    'data-role' : 'none',
                    'data-mini' : true
                }).appendTo($searchDiv);
                if (widthStyle) {
                    $searchDiv.css('width', widthStyle);
                }

                this.$searchLabel = $('<label/>').attr({
                    'for': sboxID
                }).append('Search').appendTo($searchDiv).hide();
                this.$searchBox.textinput();
                if (this.__searchText) {
                    this.$searchBox.val(this.__searchText);
                }
                this.$searchBox.on('input', function() {
                    _self._doSearch();
                });
                $searchDiv.find('a.ui-input-clear').on(_self.tapEvent, function() {
                    _self.itemList = _self.unfilteredList;
                    _self._refreshData(function() {
                        _self._resetPaging();
                        _self.$parent.listview( "refresh" );
                    });
                });
            }
            
            _self.$searchSortDiv.show();
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
                if (!_self.options.itemContextMenuFilter || _self.options.itemContextMenuFilter(row)) {
                    $(curRowParent).on(this.contextEvent, function(event) {
                        // This allows the container to have taphold context menus that are not
                        // triggered when this event is triggered.
                        event.stopImmediatePropagation();
                        event.stopPropagation();
                        event.preventDefault();

                        _self.setSelected(event.target);
                        _self.options.itemContextMenu.open({
                            positionTo: event.target,
                            thisArg: _self
                        });
                    });

                }
            } else if (_self.options.holdAction) {
                $(curRowParent).on(_self.contextEvent, function(event) {
                    event.stopImmediatePropagation();
                    event.stopPropagation();
                    event.preventDefault();
                    
                    _self.setSelected(event.target);
                    _self.selectItem();
                    _self.options.holdAction(_self.selected, _self.selectedGroup, _self.options.strings);
                }); 
            } 
            if (_self.options.selectAction) {
                $(curRowParent).on(_self.tapEvent, function(event) {
                    event.stopImmediatePropagation();
                    event.stopPropagation();
                    event.preventDefault();
                    
                    if (_self.options.itemContextMenu && _self.options.itemContextMenu.active) {
                        return false;
                    }

                    _self.setSelected(event.target);
                    _self.selectItem();
                    return false;
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
        
        getSelectedLI: function() {
            return this.selectedLI;
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
        
        updateSelectedRow: function(rowComponents) {
            var parentElement = $(this.element).find('[data-index="'+this.getSelectedRow()+'"]');
            if (rowComponents.icon) {
                var oldIcon = $(parentElement).attr('data-icon');
                $(parentElement).attr('data-icon', rowComponents.icon);
                $(parentElement).find('span')
                    .removeClass('ui-icon-'+oldIcon)
                    .addClass('ui-icon-'+rowComponents.icon);
            }
            if (rowComponents.updateFn) {
                rowComponents.updateFn.call(this, parentElement);
            }
        },
  
        createListRow: function(parentElement,rowComponents) {
            var mainLink = $('<a />').attr({
                'href' : 'javascript:void(0)'
            }).appendTo($(parentElement));
            
            if (rowComponents.icon) {
                $(parentElement).attr('data-icon', rowComponents.icon);
            }
            
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
            if (this.options.selectAction) {
                this.options.selectAction(this.selected, this.selectedGroup, this.strings);
            }          
        },
        holdItem: function() {
            if (!this.selected) {
                this.setSelectedByIndex(0, 0);
            }
            this.options.holdAction(this.selected, this.selectedGroup, this.strings);          
        },
        
        /* Display sort and filter menus. */
        displaySortMenu: function(selector) {
            this._sortContainer.popup('open', { positionTo: selector });
        },
        displayFilterMenu: function(selector) {
            this._filterContextMenu.open({
                positionTo: selector
            });
        },
        displayGlobalFilterMenu: function(selector) {
            this._globalFilterContainer.popup('open', { positionTo: selector });
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
        },
        
        closeItemContextMenu: function() {
            this.options.itemContextMenu.close();
        }
    });
})(jQuery);