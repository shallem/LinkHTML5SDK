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
             * Message to display when a search returns no results.
             */
            emptySearchMessage: "The search did not return any results from the local database.",
            
            /**
             * Action to perform if the user taps/clicks on a list item.
             */
            selectAction: null,
            
            /**
             * Action to perform if the user swipes an item left.
             */
            swipeLeftAction: null,
            
            /**
             * Action to perform if the user swipes an item right.
             */
            swipeRightAction: null,
            
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
             * Function that accepts a query collection, the contents of
             * the search box, and the current query collection and returns 
             * a filtered query collection. If null, no search box is shown.
             */
            indexedSearch: null,
            
            /**
             * Text to display in the search box when it is first rendered. Useful
             * to provide an explanation for the search functionality.
             */
            indexedSearchText: '',
            
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
             * By default we do not sort case sensitive.
             */
            sortCaseSensitive: false,
            
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
             * QueryCollection object.
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
             * When supplied, a function to call when the user pushes down on the bottom
             * of the list. This would generally be used to fetch more items.
             */
            pushToRefresh: null,
            
            /**
             * Comma-separated list of localizable strings. These can be supplied
             * when a server generates this markup using a server-side localization
             * technique. These strings are separated into an array and then passed
             * through to the rowRenderer function.
             */
            strings: null,
            
            /*
             * If true, auto dividers will be used
             */
            autodividers: false,
            
            /*
             * Function used to generate the title of each section created by
             * the auto-divider based on the content of the provided cell.
             */
            autodividersSelectorCallback: null,
            
            /*
             * Display sort buttons or not
             */
            showButtons: true,
            
            /*
             * If true, shows an arrow icon on the right hand side of each list item
             */
            showDataIcon: true,
            
            /*
             * Enables multi select.
             */
            multiSelect: false,

            /*
             * Number of rows to display in a single view of the list. The list automatically
             * paginates as the user scrolls.
             */
            itemsPerPage: 50
        },
    
        _create: function() {
            var _self = this;
            this.$wrapper = this.element;
            if (this.options.scroll) {
                this.$wrapper.addClass('pm-layout-full-height');
            }
            
            this.$page = this.$wrapper.closest('.ui-page');
            var parentId = this.$wrapper.parent().attr('id');
            if (!parentId) {
                parentId = Helix.Utils.getUniqueID();
                this.$wrapper.parent().attr('id', parentId);
            }
            
            this.$searchSortDiv = $('<div/>')
                .appendTo(this.$wrapper)
                .addClass('hx-full-width')
                .attr('id', parentId + '_list_header')
                .hide();
            this._searchSortDirty = true;
            
            this.$clearSelectionDiv = $('<div/>')
                .appendTo(this.$wrapper)
                .addClass('hx-full-width')
                .attr('id', parentId + '_clear_sel')
                .hide();
            
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
            if (this.options.multiSelect) {
                this.$parent.addClass('hxMultiSelect');
            }
            
            /**
             * Append the post hook div if we have push to refresh setup.
             */
            this.$pushDiv = null;
            if (this.options.pushToRefresh) {
                this.$pushDiv = $('<div/>').appendTo(this.$wrapper).addClass('hx-full-height-skip');
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

            if (this.options.showDataIcon === false) {
                this.showDataIcon = false;
                this.$parent.attr('data-icon', false);
            }

            var sb = true;
            
            if (this.options.showButtons === false) {
                sb = false;
            }
            
            this.showButtons = sb;
            var ad = this.options.autodividers;
            if (!ad) {
                ad = false;
            } else if (Helix.Utils.isString(ad) && (ad.toLowerCase() === 'false')) {
                ad = false;
            }
            var ads = function(elt) { 
                var callback = _self.options.autodividersSelectorCallback;

                if (callback && $(elt).is(':visible')) {
                   return callback(elt, _self.displayList, _self._currentSort);
                } 

                return null;
            };

            this.$parent.listview({
                autodividers: ad,
                autodividersSelector: ads
            });
            
            if (this.$hookDiv) {
                this.$hookDiv.hook({
                    reloadPage: false,
                    scrollTarget: listWrapper,
                    reloadEl: function() {
                        if (!_self.refreshInProgress) {
                            _self.options.pullToRefresh.call(this);
                            _self._clearGlobalFilterMenu();
                        }
                    }
                });            
            }
            if (this.$pushDiv) {
                this.$pushDiv.hook({
                    reloadPage: false,
                    scrollTarget: listWrapper,
                    isPull: false,
                    reloadEl: function() {
                        if (!_self.refreshInProgress) {
                            _self.options.pushToRefresh.call(this);
                            _self._clearGlobalFilterMenu();
                        }
                    }
                });
            }

            // Pagination setup.
            this._resetPaging();

            // Other globals.
            this.refreshInProgress = false;
            this.isLoaded = false;
            this.selected = null;
            
            // Set context menu event to taphold for touch devices, dblclick for none-touch.
            //this.contextEvent = 'taphold';
            this.contextEvent = Helix.contextEvent;
            this.tapEvent = Helix.clickEvent;
            this._cancelNextTap = false;
        
            // Default sort.
            this._currentSort = this.options.sortBy;
            this._currentSortOrder = this.options.sortOrder.toUpperCase();
            this._currentSortCase = '';
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
        
        _handleEmpty: function(nelems, msg) {
            var emptyLI = $(this.$parent).find('li[data-role="empty-message"]');
            if (nelems === 0) {                    
                if (emptyLI.length) {
                    $(emptyLI).show();
                } else if (msg) {
                    this.$parent.append($('<li />')
                        .attr('data-role', 'empty-message')
                        .append(msg));                        
                }
            } else if (emptyLI.length) {
                $(emptyLI).hide();
            }
        },
        
        /**
         * Called during scrolling to prefetch a new set of data.
         * 
         * @param direction - should be 1 for scrolling down, -1 for scrolling up.
         */
        _prefetchPage: function(direction) {
            var displayCollection = this.unfilteredList;
            displayCollection = this._resetGlobalFilters(displayCollection);

            if (this._currentSort /*&& !_self.__searchText*/) {
                displayCollection = this._applyOrdering(displayCollection);
            }

            /* Apply skip and limit. */
            this._nextRenderWindow = (this._renderWindowStart + (direction * this._itemsPerPage)) - direction;
            if (this._nextRenderWindow > 0) {
                displayCollection = displayCollection.skip(this._nextRenderWindow);
            } else if (this._nextRenderWindow < 0) {
                this._nextRenderWindow = 0;
            }
            displayCollection = displayCollection.limit(this._itemsPerPage);
            
            var _prefetchedItems = [];
            if (direction < 0) {
                this._prefetchPrev = _prefetchedItems;
                this._prefetchPrevDone = false;
            } else {
                this._prefetchNext = _prefetchedItems;
                this._prefetchNextDone = false;
            }
            
            var _self = this;
            displayCollection.newEach({
                eachFn: function(row) {
                    _prefetchedItems.push(row);
                },
                doneFn: function() {
                    if (direction < 0) {
                        _self._prefetchPrevDone = true;
                        _self.$listWrapper.trigger('prefetchPrev');
                    } else {
                        _self._prefetchNextDone = true;
                        _self.$listWrapper.trigger('prefetchNext');
                    }
                }
            });
        },
        
        /**
         * sortFilterOptions can either be a Mobile Helix enhanced PersistenceJS
         * schema (with the __hx_* fields) or a map with 3 fields - sorts, thisFilters,
         * and globalFilters with the format described in the options documentation.
         */
        refreshList: function(list,condition,sortFilterOptions,oncomplete,resetSelection) {
            var _self = this;
            
            /* itemList is the current query collection. Display list is an array
             * of the currently displayed items.
             */
            _self.originalList = _self.unfilteredList = _self.itemList = list;
        
            /* Hide the list while we are manipulating it. */
            if ((condition !== undefined) &&
                !condition) {
                /* The condition is false. Remove this entirely from the DOM. */    
                _self.$wrapper.hide();
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
                // If there is a default sort that is not returned in the list of sorts,
                // add it. (EG. It can happen if the default sort uses a combination
                // of fields).
                if ((this.options.sortBy) && (sorts[this.options.sortBy] === undefined)) {
                   sorts[this.options.sortBy] = {
                        display : "Default",
                        direction : this.options.sortOrder.toUpperCase(),
                        usecase : this.options.sortCaseSensitive
                   };
                }
                
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
            
            /* generate a clear selection button for multi select */
            _self._prependClearSelection();
            
            /**
             * Display from the beginning of the list.
             */
            _self._resetPaging();
            _self._refreshData(function() {
                _self.$parent.listview( "refresh" );
                
                /**
                 * Reset the selection if directed to do so.
                 */
                if (resetSelection) {
                    _self.selected = null;
                    _self.selectItem(true);
                }
                
                _self.$wrapper.show();
                
                /* It seems that attaching the scrolling classes after showing the list
                 * is required to make scrolling work properly on iOS.
                 */
                if (_self.options.scroll) {
                    _self.$listWrapper.removeClass('hx-scroller-nozoom');
                    _self.$listWrapper.addClass('hx-scroller-nozoom');
                    _self.$listWrapper.addClass('mh-layout-parent-height');
                    _self.$listWrapper.scroll(function(ev) {
                        var scrollPos = _self.$listWrapper.scrollTop();
                        var listHeight = _self.$parent.height();
                        var firstShowing;
                        
                        // We display a scrolling window of items. We always pull in
                        // page size * 2 items. If we are in the bottom half of the list
                        // we prepend more to the bottom of the list and remove from the
                        // top. If we are in the top half of the list we append to the end
                        // of the list and remove from the front.
                        var _refreshListOnScroll = function(oncomplete, doRescroll) {
                            $.mobile.loading('show', {});
                            _self.$parent.hide();
                            _self._refreshData(function() {
                                _self.$parent.show();
                                $.mobile.loading('hide', {});
                                    
                                _self.$parent.listview( "refresh" );
                                
                                _self._prefetchPrev = null;
                                _self._prefetchPrevDone = false;
                                _self._prefetchNext = null;
                                _self._prefetchNextDone = false;
                                
                                oncomplete(doRescroll);
                            });
                        };
                       
                       
                        if (_self._lastScrollPos > scrollPos && _self._renderWindowStart > 0) {
                            // We are scrolling up ...
                            
                            // If we are in the bottom half of the list, prefetch a page if we haven't already.
                            if ((scrollPos < (listHeight * .5)) &&
                                    (!_self._prefetchPrev)) {
                                _self._prefetchPage(-1);
                            }
                            if ((scrollPos < (listHeight * .25)) &&
                                    _self._firstElemVisible()) {
                                var _refreshUpDone = function() {
                                    _self._lastScrollPos = _self.$parent.height();
                                    _self.$listWrapper.scrollTop(_self.$parent.height());
                                    _self._renderWindowStart = (_self._renderWindowStart) - _self._itemsPerPage + 1;
                                };
                                
                                // At or very near the bottom of the list ...
                                _self._prefetchedItems = _self._prefetchPrev;
                                if (_self._prefetchPrevDone) {
                                    _refreshListOnScroll(_refreshUpDone);
                                } else {
                                    _self.$listWrapper.on('prefetchPrev', function() {
                                        _refreshListOnScroll(_refreshUpDone);
                                        _self.$listWrapper.off('prefetchPrev');
                                    });
                                }
                                _self._atDataTop = false;
                                return;
                            }
                        } else if (_self._lastScrollPos < scrollPos && !_self._atDataTop) {
                            // Scrolling down.
                            if ((scrollPos > (listHeight * .5)) &&
                                    (!_self._prefetchNext)) {
                                _self._prefetchPage(1);
                            }
                            if ((scrollPos > (listHeight * .75)) &&
                                    _self._lastElemVisible()) {
                                var _refreshDownDone = function(_rescroll) {
                                    if (_rescroll) {
                                        _self._lastScrollPos = 0;
                                        _self.$listWrapper.scrollTop(0);
                                        _self._renderWindowStart = (_self._renderWindowStart) + _self._itemsPerPage - 1;
                                    } else {
                                        _self._atDataTop = true;
                                        _self.$listWrapper.scrollTop(_self._lastScrollPos);
                                    }
                                }; 
                                
                                // At or near the top of the list.
                                _self._prefetchedItems = _self._prefetchNext;
                                var doRescroll = (_self._prefetchedItems.length > 20) ? true : false;
                                if (_self._prefetchNextDone) {
                                    _refreshListOnScroll(_refreshDownDone, doRescroll);
                                } else {
                                    _self.$listWrapper.on('prefetchNext', function() {
                                        _refreshListOnScroll(_refreshDownDone, doRescroll);
                                        _self.$listWrapper.off('prefetchNext');
                                    });
                                }
                                return;
                            }
                        }                        
                        _self._lastScrollPos = scrollPos;
                    });
                }
                _self.$listWrapper.css('-webkit-overflow-scrolling', 'touch');
                _self.isLoaded = true;
                
                if (oncomplete) {
                    oncomplete(_self);
                    _self.isDirty = false;
                }
            });
        },
        
        /**
         * Helpers for infinite scroll.
         */
        
        _firstElemVisible : function() {
            var $in = this.$listWrapper.find('li.ui-first-child').withinViewport({ 'container' : this.$listWrapper[0], 'sides' : 'topvisible bottom' });
            return ($in.length > 0);
        },
        
        _lastElemVisible : function() {
            var $in = this.$listWrapper.find('li.ui-last-child').withinViewport({ 'container' : this.$listWrapper[0], 'sides' : 'top bottomvisible' });
            return ($in.length > 0);
        },
        
        /**
         * Called when the data in the list has changed, but the list structure itself
         * has not.
         */
        refreshData: function(list,condition,oncomplete,renderWindowStart) {
            var _self = this;
            
            /* itemList is the current query collection. Display list is an array
             * of the currently displayed items.
             */
            _self.originalList = _self.unfilteredList = _self.itemList = list;
            
            /* force the search to be re-applied because the underlying data has changed */
            if (_self.__searchText) {
                _self.__searchTextDirty = true;
            }
        
            /* Hide the list while we are manipulating it. */
            if ((condition !== undefined) &&
                !condition) {
                /* The condition is false. Remove this entirely from the DOM. */    
                _self.$wrapper.hide();
                return;
            }
            
            _self._resetPaging();
            if (renderWindowStart) {
                _self.setRenderWindowStart(renderWindowStart);
            }
            _self._refreshData(function() {
                _self.$parent.listview( "refresh" );
                if (oncomplete) {
                    oncomplete(_self);
                    _self.isDirty = false;
                }
            });
        },
        
        _updateSortButtons: function() {
            if ('ascending' in this.options.sortButtons &&
                'descending' in this.options.sortButtons) {
                if (this._currentSortOrder.toUpperCase().indexOf("DESCENDING") === 0) {
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
                var nxtSort = sorts[sortFld];
                if (nxtSort.display !== "[none]") {
                    var sortItem = $('<li />').append($('<a />').attr({ 
                        'href' : 'javascript:void(0)',
                        'data-field': sortFld,
                        'data-direction' : nxtSort.direction,
                        'data-case' : nxtSort.usecase
                    }).append(nxtSort.display));
                    $(sortsList).append(sortItem);
                    
                    /* Highlight the current sort. */
                    if (sortFld === _self._currentSort) {
                        $(sortItem).addClass('hx-current-sort');
                    }
                    
                    /* Do the actual sorting ... */
                    $(sortItem).on(_self.tapEvent, function(evt) {
                        evt.stopImmediatePropagation();                       
                        var newSortField = $(evt.target).attr('data-field');
                        var defDirection = $(evt.target).attr('data-direction');
                        var caseSensitive = $(evt.target).attr('data-case');
                        
                        var found = false;
                        if (_self._currentSort) {
                            var curSortFields = _self._currentSort.split(',');
                            var curSortOrders = _self._currentSortOrder.split(',');
                            
                            for (var i = 0; i < curSortFields.length; ++i) {
                                var sortFld = curSortFields[i];
                                var sortOrder = null;
                                if (i === curSortOrders.length) {
                                    curSortOrders.push(curSortOrders[i - 1]);
                                }
                                sortOrder = curSortOrders[i];
                                
                                if (sortFld === newSortField) {
                                    // Reverse the direction.
                                    if (sortOrder.toUpperCase() === "ASCENDING") {
                                        curSortOrders[i] = "DESCENDING";
                                    } else {
                                        curSortOrders[i] = "ASCENDING";
                                    }
                                    found = true;
                                    break;
                                }
                            }
                            if (found) {
                                _self._currentSortOrder = curSortOrders.join(',');
                            }
                        }
                        // We don't append sort orders - we just reset the sort order to the
                        // new field.
                        if (!found) {
                            _self._currentSort = newSortField;
                            _self._currentSortOrder = defDirection; 
                            _self._currentSortCase = caseSensitive;
                        }
                        
                        if (_self.nElems === 0) {
                            /* Nothing to do. */
                            return false;
                        }
                        if (_self.options.onSortChange) {
                            var updatedSorts = _self.options.onSortChange(_self._currentSort, _self._currentSortOrder, newSortField);
                            if (updatedSorts) {
                                _self._currentSort = (updatedSorts.sort ? updatedSorts.sort : _self._currentSort);
                                _self._currentSortOrder = (updatedSorts.sortOrder ? updatedSorts.sortOrder : _self._currentSortOrder);
                                _self._currentSortCase = (updatedSorts.sortCase ? updatedSorts.sortCase : _self._currentSortCase);
                            }
                        }
                        _self._updateSortButtons();
                        
                        // Change the li for this sort field so that we can see it is the current sort field.
                        $(sortsList).find('li').removeClass('hx-current-sort');
                        $(this).addClass('hx-current-sort');

                        // Display from the beginning of the list.
                        _self._resetPaging();
                        _self._refreshData(function() {
                            _self.$parent.listview( "refresh" );
                            _self.$listWrapper.scrollTop(0);
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
                            _self.itemList = _self.options.doThisFilter(_self.itemList, newFilterField, _self.selected);
                            _self._resetPaging();
                            _self._refreshData(function() {
                                _self.$parent.listview( "refresh" );
                                _self.$listWrapper.scrollTop(0);
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
                    _self._resetPaging();
                    _self._refreshData(function() {
                        _self.$parent.listview( "refresh" );
                        _self.$listWrapper.scrollTop(0);
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
        
        _resetGlobalFilters: function(itemList) {
            var curCollection = (itemList ? itemList : this.unfilteredList);
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
            _self._resetPaging();
            _self._refreshData(function() {
                _self.$parent.listview( "refresh" );
            });
        },
        
        _clearGlobalFilterMenu: function() {
            for (var fField in this._filterMap) {
                $('option[data-field="' + fField + '"]').removeAttr('selected');
                $('option[value="__hx_clear"][data-field="' + fField + '"]').prop('selected', 'true');
                $('select[data-field="' + fField + '"]').selectmenu('refresh');
            }
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
                if (filterObj.values.length === 1) {
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
                _self._clearGlobalFilterMenu();
                
                _self._filterMap = {};
                _self.itemList = _self.unfilteredList;
                _self._resetPaging();
                _self._refreshData(function() {
                    _self.$parent.listview( "refresh" );
                    _self.$listWrapper.scrollTop(0);
                });
                $(_self._globalFilterContainer).popup("close");
            });
            
            filtersList.listview();
            _self._globalFilterContainer.popup();            
        },
        
        _resetPaging: function() {
            this._lastScrollPos = 0;
            this._renderWindowStart = 0;
            this._renderWindowDelta = 0;
            this._itemsPerPage = this.options.itemsPerPage;
            this._atDataTop = false; 
            this._lastUpdateScroll = 0;
            this.rescrollInProgress = false;
            this.scrollCalculationInProgress = false;
        },
                        
        
        _refreshData: function(oncomplete) {
            var _self = this;
        
            if (_self.__refreshInProgress) {
                // Do not list refreshed interleave. Finish one, then do the next one.
                $(_self.$wrapper).on('refreshdone', function(evt) {
                    _self._refreshData(evt.data);
                    return false;
                }, oncomplete);
                return;
            }
        
            //this._clearListRows();
            _self.refreshInProgress = true;
            _self.displayList = [];
        
            if (_self.options.headerText) {
                if (!_self._headerLI) {
                    _self._headerLI = $('<li />').attr({
                        'data-role' : 'list-divider'
                    }).append(_self.options.headerText)
                    .appendTo(_self.$parent);
                } else {
                    _self._headerLI.text(_self.options.headerText);
                }
            }
        
            /* List must be non-empty and it must be a query collection. */
            var displayCollection = _self.itemList;
            if (!displayCollection || !displayCollection.newEach) {
                return;            
            }
                        
            /* Apply any active search terms, then global filters. Note, we must apply 
             * search first. 
             */
            var emptyMsg = _self.options.emptyMessage;
            var __completion = function(displayCollection) {
                _self._sortAndRenderData(displayCollection, function(oncomplete) {
                    oncomplete();
                    $(_self.$wrapper).trigger('refreshdone');
                }, emptyMsg, oncomplete);
            };
            
            if (this.__searchTextDirty && this.__searchText && this.__searchText.trim()) {
                emptyMsg = this.options.emptySearchMessage;
                this.__searchTextDirty = false;
                this.options.indexedSearch(this.__searchText.trim(), function(displayCollection) {
                    _self.unfilteredList = _self.itemList = displayCollection;
                    __completion(_self.itemList);
                }, _self.originalList);
                //displayCollection = _self._applySearch(displayCollection);
            } else {
                __completion(displayCollection);
            }
        },
        
        _sortAndRenderData: function(displayCollection, oncomplete, emptyMsg, opaque) {
            var _self = this;
            var rowIndex = 0;
            var nRendered = 0;
            var LIs = [];
            var groupsToRender = [];
            if (_self.options.grouped) {
                LIs = $(_self.$parent).find('li[data-role="list-divider"]');
            } else {
                // Add not selector to make sure we handle auto dividers properly.
                LIs = $(_self.$parent).find('li').not('[data-role="list-divider"]').not('[data-role="empty-message"]');
            }            
            
            /* Functions used in processing each item. */
            var __processRow = function(curRow) {
                if (_self.options.grouped) {
                    groupsToRender.push(curRow);
                } else {
                    if (nRendered >= _self._itemsPerPage) {
                        return;
                    }

                    ++rowIndex;
                    if (_self._renderSingleRow(LIs, rowIndex - 1, _self._itemsPerPage, curRow, function() {
                        // Nothing to do.
                    })) {
                        ++nRendered;
                    }
                }
            };
            
            var __processStart = function(count) {
                _self.nElems = count;
                if (count < _self._itemsPerPage) {
                    // We did not get the full "limit" count of items requested
                    _self._atDataTop = true;
                }
            };
            
            var __renderGroup = function(groupIndex) {
                if (groupsToRender.length === 0) {
                    for (var _ridx = groupIndex; _ridx < LIs.length; ++_ridx) {
                        $(LIs[_ridx]).hide();
                    }
                    /* Call completion when all rows are done rendering. */
                    _self.refreshInProgress = false;
                    oncomplete(opaque);
                    _self._handleEmpty(nRendered, emptyMsg);
                    return;
                }

                var nxt = groupsToRender.shift();
                if (nRendered >= _self._itemsPerPage) {
                    return;
                }

                if (_self._renderSingleRow(LIs, groupIndex, _self._itemsPerPage, nxt, function() {
                    __renderGroup(groupIndex + 1);
                })) {
                    ++nRendered;
                }
            };
            
            var __processDone = function(count) {
                var _ridx;
                if (!_self.options.grouped) {
                    /* We did not render any rows. Call completion. */
                    var startIdx = nRendered;
                    for (_ridx = startIdx; _ridx < LIs.length; ++_ridx) {
                        $(LIs[_ridx]).hide();
                    }

                    _self._handleEmpty(nRendered, emptyMsg);
                     _self.refreshInProgress = false;
                    oncomplete(opaque);
                } else {
                    __renderGroup(0);
                }
            };
            
            if (_self._prefetchedItems && _self._prefetchedItems.length > 20) {
                __processStart(_self._prefetchedItems.length);
                for (var i = 0; i < _self._prefetchedItems.length; ++i) {
                    __processRow(_self._prefetchedItems[i]);
                }
                __processDone(_self._prefetchedItems.length);
                _self._prefetchedItems = [];
            } else {
                var orderby = _self._currentSort; 
                displayCollection = _self._resetGlobalFilters(displayCollection);

                if (orderby /*&& !_self.__searchText*/) {
                    displayCollection = _self._applyOrdering(displayCollection);
                }

                /* Apply skip and limit. */
                if (_self._renderWindowStart > 0) {
                    displayCollection = displayCollection.skip(_self._renderWindowStart);
                }
                displayCollection = displayCollection.limit(_self._itemsPerPage);
                
                displayCollection.newEach({
                    /* Process each element. */
                    eachFn: function(curRow) {
                        __processRow(curRow);
                    },
                    /* Called on start. */
                    startFn: function(count) {
                        if (_self.prefetchedItems) {
                            count = count + _self.prefetchedItems.length;
                        }
                        __processStart(count);
                    },
                    /* Called on done. */
                    doneFn: function(count) {
                        if (_self.prefetchedItems) {
                            for (var i = 0; i < _self._prefetchedItems.length; ++i) {
                                __processRow(_self._prefetchedItems[i]);
                                ++count;
                            }
                        }
                        __processDone(count);
                        _self._prefetchedItems = [];
                    }
                });    
            } 
        },
        
        _clearListRows: function() {
            this.$listWrapper.scrollTop(0);
            var toRemove = this.$parent.find("li").filter(":not(li[data-fixed-header='yes'])");
            toRemove.remove();
            this.$parent.find('[data-role="fieldcontain"]').remove();
        },
        
        _doSearch: function() {
            var _self = this;
            _self.__searchText = _self.$searchBox.val();
            if (_self.__searchText.length < 2) {
                // We do not do 1 letter searches ...
                return;
            }
            if (_self.__searchReadyTimeout) {
                clearTimeout(_self.__searchReadyTimeout);
            }

            _self.__searchReadyTimeout = setTimeout(function() {
                if (_self.__searchReadyTimeout) {
                    clearTimeout(_self.__searchReadyTimeout);
                }
                
                _self._resetPaging();
                _self.__searchTextDirty = true;
                _self._refreshData(function() {
                    _self.$parent.listview( "refresh" );
                });
                _self.__searchReadyTimeout = null;
            }, 3000);
        },
        
        _prependSearchBox: function() {
            var _self = this;
            var hasButtons = (_self._globalFilterContainer || _self._sortContainer) && _self.showButtons; 
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
                        widthStyle = '75%';
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
                    'data-role' : 'none',
                    'data-mini' : true,
                    'value': this.options.indexedSearchText
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
                if (this.options.indexedSearchText) {
                    this.$searchBox.on('focus', function() {
                        _self.$searchBox.val('');
                        _self.$searchBox.off('focus');
                    });    
                }
                
                $searchDiv.find('a.ui-input-clear').on(_self.tapEvent, function() {
                    _self.itemList = _self.originalList;
                    _self.__searchText = "";
                    _self.$searchBox.val(_self.__searchText);
                    _self._resetPaging();
                    _self._refreshData(function() {
                        _self.$parent.listview( "refresh" );
                        _self.$listWrapper.scrollTop(0);
                    });
                    return false;
                });
            }
            
            _self.$searchSortDiv.show();
        },
        
        _prependClearSelection: function() {
            if (!this.options.multiSelect) {
                return;
            }
            var _self = this;
            _self.$clearSelectionDiv.empty();
            _self.$clearSelectionDiv.append($('<a/>').append("Clear").buttonMarkup({
                mini: true,
                corners: false,
                shadow: false,
                icon: 'check',
                iconpos: 'left',
                inline: true
            }).on(_self.tapEvent, function() {
                _self.clearAllMultiSelect();
            }));
        },
        
        /* Apply the appropriate sort to the display collection. */
        _applyOrdering: function(displayCollection) {
            var orderby = this._currentSort; 
            var direction = this._currentSortOrder;
            var usecase = this._currentSortCase;
        
            var orderbyFields = orderby.split(",");
            var directionVals = direction.split(",");
            var caseVals = usecase.split(",");

            var oidx = 0;
            for (oidx = 0; oidx < orderbyFields.length; ++oidx) {
                var latestDirection = ( (oidx < directionVals.length) ? directionVals[oidx] : directionVals[directionVals.length - 1]);
                var nxtCase = (caseVals[oidx] === 'true' ? true : false);
                if (latestDirection.toUpperCase() === 'DESCENDING') {
                    displayCollection = displayCollection.order(orderbyFields[oidx], false, nxtCase);
                } else {
                    displayCollection = displayCollection.order(orderbyFields[oidx], true, nxtCase);
                }
            }
            return displayCollection;
        },
        _renderSingleRow: function(LIs, rowIndex, itemsPerPage, curRow, oncomplete) {
            var _self = this;
            var arrIdx = (itemsPerPage > 0) ? (rowIndex % itemsPerPage) : rowIndex;
            if (_self.options.grouped) {
                var __renderEmptyGroup = function(dividerLI) {
                    // Hide all elements in this group index.
                    _self.$parent.find('li[data-index="' + rowIndex + '"]').hide();

                    // Find the empty element, if it is there. If so, show it.
                    var $emptyElem = _self.$parent.find('li[data-index="' + rowIndex + '"][data-group-index="-1"]');
                    if ($emptyElem.length) {
                        $emptyElem.show();
                    } else {                                 
                        $('<li />').attr({
                            'class' : _self.options.rowStyleClass,
                            'data-index' : rowIndex,
                            'data-group-index' : '-1'
                        }).append(_self.options.emptyGroupMessage)
                        .insertAfter(dividerLI);
                    }
                };

                var rowObject = {
                    'group': curRow, 
                    'rows' : []
                };
                _self.displayList.push(rowObject);
          
                var groupName = _self.options.groupName(rowObject.group);
                var groupMembers = _self.options.groupMembers(rowObject.group);
                var groupIndex = 0;
                
                // Attach the group header.
                var dividerLI;
                if (arrIdx >= LIs.length) {
                    dividerLI = $('<li />').attr({
                        'data-role' : 'list-divider'
                    }).append(groupName).appendTo(_self.$parent);
                } else {
                    dividerLI = LIs[arrIdx];
                    $(dividerLI).text(groupName).show();
                }
                if (_self.options.dividerStyleClass) {
                    $(dividerLI).addClass(_self.options.dividerStyleClass);
                }
                
                if (groupMembers) {
                    // groupLIs are all LIs from dividerLI to the next divider
                    var groupLIs = $(dividerLI).nextUntil('li[data-role="list-divider"]');
                    groupMembers.forEach(
                        /* Element callback. */
                        function(groupRow) {
                            if (_self._renderRowMarkup(groupLIs, groupRow, arrIdx, groupIndex)) {
                                rowObject.rows.push(groupRow);
                                ++groupIndex;
                            }
                        },
                        /* On start. */
                        function(ct) {
                            if (ct === 0) {
                                __renderEmptyGroup(dividerLI);                                
                            }
                        },
                        /* On done. */
                        function() {
                            oncomplete();
                            for (var _gidx = groupIndex; _gidx < groupLIs.length; ++_gidx) {
                                groupLIs[_gidx].hide();
                            }
                        }
                    );
                    return true;
                } else if (groupMembers === null) {
                    __renderEmptyGroup(dividerLI);
                    oncomplete();
                    return true;
                } else {
                    oncomplete();
                    return false;
                }
            } else {
                if (_self._renderRowMarkup(LIs, curRow, _self.displayList.length)) {
                    _self.displayList.push(curRow);
                    oncomplete();
                    return true;
                }
                oncomplete();
                return false;
            }  
        },
    
        _renderRowMarkup: function(LIs, row, rowIndex, groupIndex) {
            var _self = this;
            var curRowParent = null;
            var curRowFresh = false;
            
            if (_self.options.grouped && groupIndex < LIs.length) {
                curRowParent = $(LIs[groupIndex]);
            } else if (!_self.options.grouped) {
                if (rowIndex < LIs.length) {
                    curRowParent = $(LIs[rowIndex]);
                }
            } 
            
            if (!curRowParent) {
                curRowFresh = true;
                curRowParent = $('<li />').attr({
                    'class' : _self.options.rowStyleClass
                });
            }
            
            curRowParent.attr('data-index', rowIndex);
            curRowParent.attr('data-selected', '0');
            if (_self.options.grouped) {
                curRowParent.attr('data-group-index', groupIndex);
            }
        
            if (_self.options.rowRenderer(curRowParent, _self, row, rowIndex, _self.options.strings)) {
                if (curRowFresh) {
                    curRowParent.appendTo(_self.$parent);
                } else {
                    curRowParent.show();
                }
            } else {
                return false;
            }
            
            if (_self.options.itemContextMenu) {
                if (!_self.options.itemContextMenuFilter || _self.options.itemContextMenuFilter(row)) {
                    $(curRowParent).off(this.contextEvent).on(this.contextEvent, function(event) {
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
                } else if (!curRowFresh) {
                    $(curRowParent).off(this.contextEvent);
                }
            } else if (_self.options.holdAction && curRowFresh) {
                $(curRowParent).on(_self.contextEvent, function(event) {
                    event.stopImmediatePropagation();
                    
                    if (_self.setSelected(event.target)) {
                        _self.selectItem(true);                    
                    }
                    _self.options.holdAction(_self.selected, _self.selectedGroup, _self.options.strings);
                    _self._cancelNextTap = true;
                    return false;
                }); 
            } 
            if (_self.options.selectAction && curRowFresh) {
                $(curRowParent).on(_self.tapEvent, function(event) {
                    event.stopImmediatePropagation();
                    event.stopPropagation();
                    event.preventDefault();
                    
                    if (_self.options.itemContextMenu && _self.options.itemContextMenu.active) {
                        return false;
                    }
                    if (_self._cancelNextTap) {
                        _self._cancelNextTap = false;
                        return false;
                    }
                    
                    if (_self.options.multiSelect && event.clientX < 35) {
                        $(event.target).toggleClass("hx-selected");
                        
                        // Check to see if we have anything selected - if yes, show the clear button;
                        // if not, hide it. Re-layout the page if we make a change.
                        var selectedElems = _self.getAllMultiSelectElements();
                        if (selectedElems.length === 0) {
                            _self.$clearSelectionDiv.hide();
                            Helix.Layout.layoutPage();
                        } else {
                            if (!_self.$clearSelectionDiv.is(':visible')) {
                                _self.$clearSelectionDiv.show();
                                Helix.Layout.layoutPage();
                            }                            
                        }
                    } else {
                        if (_self.setSelected(event.target)) {
                            _self.selectItem();
                        }
                    }

                    return false;
                });
            }
            if (_self.options.swipeLeftAction && curRowFresh) {
                $(curRowParent).on('swipeleft', function(event) {
                    event.stopImmediatePropagation();

                    _self.setSelected(event.target);
                    _self.options.swipeLeftAction(_self.selected);
                    return false;
                });
            }
            if (_self.options.swipeRightAction && curRowFresh) {
                $(curRowParent).on('swiperight', function(event) {
                    event.stopImmediatePropagation();

                    _self.setSelected(event.target);
                    _self.options.swipeRightAction(_self.selected);
                    return false;
                });
            }
        
            return true;
        },
    
        setSelected: function(targetElem) {
            var enclosingLI = $(targetElem).closest("li[data-index]");
            var enclosingIndex = $(enclosingLI).attr('data-index');
            var enclosingGroupIndex;
            var nxtSelection;
            if (this.options.grouped) {
                enclosingGroupIndex = $(enclosingLI).attr('data-group-index');
                nxtSelection = this.displayList[enclosingIndex].rows[enclosingGroupIndex];
            } else {
                nxtSelection = this.displayList[enclosingIndex];
            }
            
            if (this.selectedLI) {
                this.selectedLI.removeClass('ui-btn-active');
            }
            if (this.options.grouped) {
                this.selectedGroupRow = enclosingGroupIndex;
                this.selectedGroup = this.displayList[enclosingIndex].group;
            }
            this.selectedLI = enclosingLI;
            this.selectedLI.addClass('ui-btn-active');
            this.selectedIndex = enclosingIndex;
            this.selected = nxtSelection;
            
            return true;
        },
        getSelected: function() {
            return this.selected;
        },
        clearSelected: function() {
            if (this.selected) {
                this.selectedLI.removeClass('ui-btn-active');
                this.selectedLI = null;
                this.selected = null;
            }
        },
        
        removeElement: function(idx) {
            if (idx === this.getSelectedRow()) {
                this.clearSelected();
            }
            
            var row = this.$parent.find("[data-index="+idx+"]");
            
            if (row) {
                row.remove();
                this.$parent.listview( "refresh" );
                this.isDirty = true;
            }
        },

        getSelectedLI: function() {
            return this.selectedLI;
        },
    
        setSelectedByIndex: function(idx, groupIdx) {
            var targetElem;
            if (idx && groupIdx) {
                targetElem = $(this.$wrapper).find('li[data-index="' + idx +'"]').filter('[data-group-index="' + groupIdx + '"]');
                if (targetElem && targetElem.length > 0) {
                    this.setSelected(targetElem);
                }
            } else {
                targetElem = $(this.$wrapper).find('li[data-index="' + idx +'"]');
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
        
        getAllMultiSelectElements: function() {
            return $(this.element).find('li.hx-selected');
        },
        
        getAllMultiSelectItems: function() {
            var ret = [];
            var _self = this;
            $(this.element).find('li.hx-selected').each(function() {
                var enclosingLI = this;
                var enclosingIndex = $(enclosingLI).attr('data-index');
                var enclosingGroupIndex;
                var nxtSelection;
                if (_self.options.grouped) {
                    enclosingGroupIndex = $(enclosingLI).attr('data-group-index');
                    nxtSelection = _self.displayList[enclosingIndex].rows[enclosingGroupIndex];
                } else {
                    nxtSelection = _self.displayList[enclosingIndex];
                }
                ret.push(nxtSelection);
            });
            return ret;
        },
        
        clearAllMultiSelect: function() {
            $(this.element).find('li.hx-selected').removeClass('hx-selected');
            this.$clearSelectionDiv.hide();
            Helix.Layout.layoutPage();
        },
  
        createListRow: function(parentElement,rowComponents) {
            var isEnhanced = false;
            if ($(parentElement).hasClass('ui-li')) {
                // Already enhanced.
                isEnhanced = true;
            }
            
            var mainLink = null;
            if (isEnhanced) {
                mainLink = $(parentElement).find('a');
            } else {
                mainLink = $('<a />').attr({
                    'href' : 'javascript:void(0)'
                }).appendTo($(parentElement));
            }
            
            if (rowComponents.icon) {
                $(parentElement).attr('data-icon', rowComponents.icon);
                var iconMarkup = $(parentElement).find('span.ui-icon');
                if (iconMarkup.length) {
                    // Manually update the icon itself.
                    iconMarkup.removeClass()
                        .addClass('ui-icon ui-icon-' + rowComponents.icon + ' ui-icon-shadow');
                }
            } else {
                $(parentElement).removeAttr('data-icon');
            }

            var oldPfx = $(mainLink).find('[data-role="prefix"]');
            if (rowComponents.prefix) {
                if (oldPfx.length) {
                    oldPfx.replaceWith(rowComponents.prefix.attr('data-role', 'prefix'));
                } else {
                    mainLink.append($('<div/>').append(rowComponents.prefix.attr('data-role', 'prefix')));
                    mainLink = $('<div/>').appendTo(mainLink);
                }
            } else {
                oldPfx.closest('div').next().remove();
            }
            
            if (rowComponents.image) {
                var imgMarkup = $(mainLink).find('img[data-role="image"]');
                if (imgMarkup.length) {
                    imgMarkup.attr('src', rowComponents.image).show();
                } else {
                    mainLink.append($('<img />').attr({
                        'src' : rowComponents.image,
                        'data-role' : 'image'
                    }));
                }
            } else {
                $(mainLink).find('img[data-role="image"]').hide();
            }
            
            if (rowComponents.header) {
                var headerMarkup = mainLink.find('h3[data-role="itemheader"]');
                if( Object.prototype.toString.call(rowComponents.header) === '[object String]' ) {
                    if (headerMarkup.length) {
                        headerMarkup.text(Helix.Utils.escapeQuotes(rowComponents.header)).show();
                    } else {
                        mainLink.append($('<h3 />')
                            .attr('data-role', 'itemheader')
                            .text(Helix.Utils.escapeQuotes(rowComponents.header)));
                    }
                } else {
                    if (headerMarkup.length) {
                        headerMarkup.empty().append(rowComponents.header);
                    } else {
                        mainLink.append($('<h3 />')
                            .attr('data-role', 'itemheader')
                            .append(rowComponents.header));
                    }
                }
            } else {
                mainLink.find('h3[data-role="itemheader"]').hide();
            }
            
            if (rowComponents.subHeader) {
                var subheaderMarkup = mainLink.find('p[data-role="subheader"]');
                if (subheaderMarkup.length) {
                    subheaderMarkup.text(rowComponents.subHeader).show();
                } else {
                    mainLink.append($('<p />')
                        .attr('data-role', 'subheader')
                        .append($('<strong />')
                        .text(rowComponents.subHeader)));
                }
            } else {
                mainLink.find('p[data-role="subheader"]').hide();
            }
            
            if (rowComponents.body) {
                var bodyMarkup = null;
                if (rowComponents.header || rowComponents.subHeader) {
                    bodyMarkup = mainLink.find('p[data-role="body"]');
                    if (bodyMarkup.length) {
                        bodyMarkup.empty().append(rowComponents.body).show();
                    } else {
                        mainLink.append($('<p />').attr('data-role', 'body').append(rowComponents.body));
                    }
                } else {
                    bodyMarkup = mainLink.find('[data-role="body"]');
                    if (bodyMarkup.length) {
                        mainLink.empty();
                    }
                    $(rowComponents.body).attr('data-role', 'body');
                    mainLink.append(rowComponents.body);
                }
            } else {
                mainLink.find('[data-role="body"]').hide();
            }
            
            if (rowComponents.aside) {
                var asideMarkup = $('p.ui-li-aside');
                if (asideMarkup.length) {
                    asideMarkup.empty().append(rowComponents.aside).show();
                } else {
                    mainLink.append($('<p />').attr({
                        'class' : 'ui-li-aside'
                    }).append(rowComponents.aside));
                }
            } else {
                $('p.ui-li-aside').hide();
            }
            
            if (rowComponents.key) {
                $(parentElement).attr('data-key', rowComponents.key);
            }
            
            /* XXX: not supported for now. 
            if (rowComponents.splitLink) {
                if (isEnhanced) {
                    
                } else {
                    $(parentElement).append($('<a />').attr({
                        'href' : 'javascript:void(0)'
                    }).on(this.tapEvent, function(ev) {
                        rowComponents.splitLink(ev);
                    }));
                }
            }*/
        },
        selectItem: function(noSelectAction) {
            if (!this.selected) {
                if (this.options.grouped) {
                    this.setSelectedByIndex(0, 0);
                } else {
                    this.setSelectedByIndex(0);
                }
            }
            if (this.options.selectAction && !noSelectAction) {
                this.options.selectAction(this.selected, this.selectedGroup, this.strings);
            }          
        },
        selectNext: function() {
            if (!this.selectedLI) {
                this.setSelectedByIndex(0, 0);
            } else {
                var nxt = this.selectedLI;
                do {
                    nxt = nxt.next();
                } while (nxt.is('li') && !nxt.is('li[data-index]'));
                if (nxt.length) {
                    this.setSelected(nxt);
                    this.selectItem();
                }
            }
        },
        selectPrev: function() {
            if (!this.selectedLI) {
                this.setSelectedByIndex(0, 0);
            } else {
                var prev = this.selectedLI;
                do {
                    prev = prev.prev();
                } while (prev.is('li') && !prev.is('li[data-index]'));
                if (prev.length) {
                    this.setSelected(prev);
                    this.selectItem();
                }
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
        scrollToStart: function() {
            this.$listWrapper.scrollTop(0);
        },
        
        /**
         * Set the scroll position of the list element.
         * 
         * @param {int} pos
         * @returns {undefined}
         */
        setScrollPosition: function(pos) {
            this.$listWrapper.scrollTop(pos);
        },
        
        /**
         * Return the current scroll position of the list element. This is particularly useful when you want
         * to later restore the scroll position using setScrollPosition.
         * 
         * @returns {int}
         */
        getScrollPosition: function() {
            return this.$listWrapper.scrollTop();
        },
        
        /**
         * In a paginated list, return the index of the first data element that is visible. In non-paginated lists this is always 0.
         * 
         * @returns {int}
         */
        getRenderWindowStart: function() {
            return this._renderWindowStart;
        },
        
        /**
         * In a paginated list, set the start of the render window, which determines which element is visible at the very top of the list.
         * Note that this function does not refresh the list ... it is intended to be called prior to a call to refreshData/refreshList.
         * 
         * @param {int} start
         * @returns {undefined}
         */
        setRenderWindowStart: function(start) {
            this._renderWindowStart = start;
        },
        
        setHeaderText: function(txt) {
            this.options.headerText = txt;
        },
        
        openItemContextMenu: function() {
            this.options.itemContextMenu.open();
        },
        
        closeItemContextMenu: function() {
            this.options.itemContextMenu.close();
        },
        
        /**
         * Returns true after the first time the list has been loaded and laid out.
         */
        getIsLoaded: function() {
            return this.isLoaded;
        },
        
        /**
         * Update the value of the 'noSelectOnPagination' option.
         */
        setNoSelectOnPagination: function(val) {
            this.options.noSelectOnPagination = val;
        },
        
        /**
         * Get the ul element of the list.
         */
        getListElement: function() {
            return this.$parent;
        },
        
        /**
         * Clear the contents of the indexedSearch text box.
         * 
         * @returns {undefined}
         */
        clearSearchText: function() {
            if (this.$searchBox) {
                this.$searchBox.val('');
            }
            this.__searchText = '';
        },
        
        /**
         * Mark the list dirty. The dirty flag persists until the list is refreshed either
         * with refreshList or refreshData. This flag is primarily used for debugging.
         */
        markListDirty: function() {
            this.isDirty = true;
        },
        
        /**
         * Return the isDirty flag.
         */
        listIsDirty: function() {
            return this.isDirty;
        }
    });
})(jQuery);