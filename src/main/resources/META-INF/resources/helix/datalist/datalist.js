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
             * For grouped lists, apply this function to each row to figure out the
             * options for that group. Right now the main supported option is the
             * search : fn option, where fn is invoked if a search icon is clicked in
             * the group header.
             */
            groupOptions: function() {
                return {};
            },
            
            /**
             * For grouped lists, apply this function to each group row to get the
             * query collection of group members.
             */
            groupMembers: null,
            
            /**
             * For grouped lists, apply this function to each group row to get the
             * renderer for this group. If this is null, then we just use the rowRenderer.
             */
            groupRenderer: null,
            
            /**
             * For grouped lists, specify a maximum count of items per group. By default there
             * is no maximum.
             */
            itemsPerGroup: -1,
            
            /**
             * When the size of a group exceeds the itemsPerGroup limit, add an element with the overflow
             * text below. When that element is clicked, the groupOverflowFn is called.
             */
            groupOverflowText: 'More ...',
            
            /**
             * CSS class to apply to the groupOverflowText element.
             */
            groupOverflowTextClass: null,
            
            /**
             * Function invoked when the overflow element is tapped. The 'this' variable is the datalist itself.
             * The group is provided as an argument.
             */
            groupOverflowFn: null,
            
            /**
             * For grouped lists, allow a separate search box in each group.
             */
            groupIndexedSearch: null,
            
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
             * Method that is called (optionally) if the list is empty.
             */
            emptyHook: null,
            
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
             * Additional arguments option of the itemContextMenu, which is used to provide
             * additional arguments to the beforeOpen method of the context menu and to its
             * tap events. This should be an array.
             */
            itemContextMenuArgs: null,
            
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
             * Function that accepts the contents of the search box and a continuation function and
             * supplies a filtered query collection (based on the search box) to that continuation function. An
             * optional 3rd argument is the results of a 'local' search, meant for cases where a 'quick-and-dirty'
             * search can be performed on the client and those results might be merged with results returned by the
             * server. If null, no search box is shown.
             */
            indexedSearch: null,
            
            /**
             * Function that executes a fast, local search for content on the client side. Arguments are a search query
             * string and a continuation function.
             */
            localIndexedSearch: null,
            
            /**
             * Text to display in the search box when it is first rendered. Useful
             * to provide an explanation for the search functionality.
             */
            indexedSearchText: '',

            /**
             * Type of box - is it a 'search' box or a 'filter' box.
             */
            indexedSearchType: 'search',

            /**
             * Called when the search is cleared.
             */
            onSearchClear: null,
            
            /**
             *  Buttons for external actions not managed by but rendered by the datalist.
             */
            externalButtonsCallback : null,
            
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
             * Field to use for grouping. Grouping is intended to be used in conjunction with
             * auto dividers, so the groupBy field should be the primary grouping field. This is a
             * single field - not a comma delimited field list.
             */
            groupBy: null,
            
            /**
             * Ordering for the groupBy field.
             */
            groupByOrder: "ASCENDING",
            
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
             * The default sort and filter buttons appear at the top left of the list. It can be moved
             * to the right by setting this option to 'right'.
             */
            buttonPos: 'left',
            
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
            showSortButton: true,
            
            /**
             * Displaye filter buttons or not
             */
            showFilterButton: true,
            
            /*
             * If true, shows an arrow icon on the right hand side of each list item
             */
            showDataIcon: true,
            
            /*
             * Enables multi select.
             */
            multiSelect: false,

            /**
             * Callback to add buttons that will appear when one more item is selected. The 'this' is the datalist
             * in the callback and the first parameter is the parent div.
             */
            selectionButtonsCallback: null,

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
                this.$wrapper.addClass('hx-full-height');
            }
            
            this._scrollerTimeout = null;
            this.$page = this.$wrapper.closest('.ui-page');
            var parentId = this.$wrapper.parent().attr('id');
            if (!parentId) {
                parentId = Helix.Utils.getUniqueID();
                this.$wrapper.parent().attr('id', parentId);
            }
            
            this.$section = $('<section/>').appendTo(this.$wrapper).addClass('hx-full-height').addClass('hx-flex-vertical').addClass('hx-full-width');
            this.$headerSection = $('<header/>').appendTo(this.$section);
            this.$searchSortDiv = $('<div/>')
                .appendTo(this.$headerSection)
                .addClass('hx-full-width')
                .addClass('hx-search-sort')
                .attr('id', parentId + '_list_header')
                .hide();
            this._searchSortDirty = true;
            
            this.$clearSelectionDiv = $('<div/>')
                .appendTo(this.$headerSection)
                .addClass('hx-full-width hx-list-selection-buttons')
                .attr('id', parentId + '_clear_sel')
                .hide();
            
                        
            /**
             * Append the data list.
             */
            var listWrapper = this.$listWrapper = $('<div/>').attr('class', 'hx-full-width hx-scroller-nozoom hx-flex-fill').appendTo(this.$section);

            /**
             * Append the footer.
             */
            this.$footerSection = $('<footer/>').appendTo(this.$section).hide();
            
            /**
             * Append the hook div if we have pull to refresh setup.
             */
            this.$hookDiv = null;
            if (this.options.pullToRefresh) {
                this.$hookDiv = $('<div/>').appendTo(listWrapper);
            }
            
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
                this.$pushDiv = $('<div/>').appendTo(listWrapper).addClass('hx-full-height-skip');
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

            var ad = this.options.autodividers;
            if (!ad) {
                ad = false;
            } else if (Helix.Utils.isString(ad) && (ad.toLowerCase() === 'false')) {
                ad = false;
            }
            var ads = function(elt) { 
                var callback = _self.options.autodividersSelectorCallback;

                if (callback && $(elt).attr('data-index')) {
                   return callback(elt, _self.displayList, _self._currentSort);
                } 

                return null;
            };

            this.$parent.listview({
                autodividers: ad,
                autodividersSelector: ads,
                dividerTheme: 'd',
                headerTheme: 'd'
            });
            
            if (this.$hookDiv) {
                this.$hookDiv.hook({
                    reloadPage: false,
                    scrollTarget: listWrapper,
                    reloadEl: function() {
                        if (!_self.refreshInProgress && _self._renderWindowStart == 0) {
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
            this._fingerOn = false;
            
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

            // Queued refershes - tracks refresh calls that occur during another refresh.
            this._queuedRefreshes = [];

            if (this.options.itemList) {
                this.refreshList(this.options.itemList,this.options.condition,null,function() {

                });
            }
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
        
        _handleEmpty: function(nelems, nextras, msg) {
            var emptyLI = $(this.$parent).find('li[data-role="empty-message"]');
            if (nelems === nextras) {                    
                if (emptyLI.length) {
                    $(emptyLI).show();
                } else if (msg) {
                    this.$parent.append($('<li />')
                        .attr('data-role', 'empty-message')
                        .append(msg)
                        .addClass('hx-empty-message'));
                }
                if (this.options.emptyHook) {
                    this.options.emptyHook.call(this);
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
            var displayCollection = this.itemList;
            
            /* Apply skip and limit. */
            this._nextRenderWindow = (this._renderWindowStart + (direction * this._itemsPerPage)) - direction;
            if (this._nextRenderWindow > 0) {
                //console.log("SKIPPING: " + this._nextRenderWindow);
                displayCollection = displayCollection.skip(this._nextRenderWindow);
            } else if (this._nextRenderWindow <= 0) {
                this._nextRenderWindow = 0;
                displayCollection = displayCollection.skip(0);
            }
            displayCollection = displayCollection.limit(this.options.itemsPerPage);
            
            var _prefetchedItems = [];
            if (direction < 0) {
                this._prefetchPrev = _prefetchedItems;
                this._prefetchPrevDone = false;
            } else {
                this._prefetchNext = _prefetchedItems;
                this._prefetchNextDone = false;
            }
            
            var _self = this;
            if(typeof Promise !== "undefined" && Promise.toString().indexOf("[native code]") !== -1) {
                var _p = new Promise(function(resolve, reject) {
                    displayCollection.newEach({
                        eachFn: function(row) {
                            _prefetchedItems.push(row);
                        },
                        doneFn: function() {
                            if (direction < 0) {
                                _self._prefetchPrevDone = true;
                            } else {
                                _self._prefetchNextDone = true;
                            }
                            resolve("done");
                        }
                    });                
                });
                if (direction < 0) {
                    _self._prefetchPrevPromise = _p;
                } else {
                    _self._prefetchNextPromise = _p;                    
                }
            } else {
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
            }
        },

        /**
         * Handlers for infinite scrolling.
         */
        _refreshListOnScroll : function(oncomplete) {
            var _self = this;
            var doRescroll = (_self._prefetchedItems.length >= 20) ? true : false;
            _self._prefetchPrev = null;
            _self._prefetchPrevDone = false;
            _self._prefetchNext = null;
            _self._prefetchNextDone = false;
            _self._prefetchNextPromise = null;
            _self._prefetchPrevPromise = null;
            
            $.mobile.loading('show', {});
            _self._refreshData(function() {
                $.mobile.loading('hide', {});
                _self.clearSelected();
                oncomplete(doRescroll);
            }, false);
        },
        
        _setScrollTimer: function() {
            this._rescrollInProgress = true;
            this.$listWrapper.removeClass('hx-scroller-nozoom');
            var _self = this;
            setTimeout(function() {
                _self.$listWrapper.addClass('hx-scroller-nozoom');
                _self._rescrollInProgress = false;
            }, 500);
        },
        
        _rescrollList : function(rescrollTarget) {
            this._lastScrollPos = rescrollTarget;
            var _self = this;
            setTimeout(function() {
                _self.$listWrapper.addClass('hx-scroller-nozoom');
                _self.$listWrapper.scrollTop(rescrollTarget);
            }, (rescrollTarget === 0 ? 0 : 100));
        },
        
        _doScrollUp: function() {
            var _self = this;
            _self._scrollerTimeout = null;
            _self._setScrollTimer();

            var __finishDoScrollUp = function() {
                var listWHeight = _self.$listWrapper.height();
                if (listWHeight === 0) {
                    // Wait some more.
                    setTimeout(__finishDoScrollUp, 100);
                } else {
                    var listHeight = _self.$parent.height() - listWHeight;
                    _self._rescrollList(listHeight);
                }
            };
            
            var _refreshUpDone = function() {
                _self._renderWindowStart = (_self._renderWindowStart) - _self._itemsPerPage + 1;
                __finishDoScrollUp();
            };

            _self._prefetchedItems = _self._prefetchPrev;
            if (_self._prefetchPrevDone) {
                _self._refreshListOnScroll(_refreshUpDone);
            } else {
                if (_self._prefetchPrevPromise) {
                    _self._prefetchPrevPromise.then(function(result) {
                        _self._refreshListOnScroll(_refreshUpDone);                    
                    }, function(err) {
                        throw "How did this happen? PrefetchPrev promise cannot fail!";
                    });
                } else {
                    _self.$listWrapper.on('prefetchPrev', function() {
                        _self._refreshListOnScroll(_refreshUpDone);
                        _self.$listWrapper.off('prefetchPrev');
                    });
                }
            }
            _self._atDataTop = false;
        },
        
        _doScrollDown: function() {
            var _self = this;
            _self._scrollerTimeout = null;
            _self._setScrollTimer();

            var _refreshDownDone = function(_rescroll) {
                //alert("RESCROLL: " + _rescroll);
                if (_rescroll) {
                    _self._rescrollList(0);
                    _self._renderWindowStart = (_self._renderWindowStart) + _self._itemsPerPage - 1;
                } else {
                    _self._atDataTop = true;
                }
            }; 

            _self._prefetchedItems = _self._prefetchNext;
            if (_self._prefetchNextDone) {
                _self._refreshListOnScroll(_refreshDownDone);
            } else {
                if (_self._prefetchNextPromise) {
                    _self._prefetchNextPromise.then(function(result) {
                        _self._refreshListOnScroll(_refreshDownDone);
                    }, function(err) {
                        throw "How did this happen? PrefetchNext promise cannot fail!";
                    });
                } else {
                    _self.$listWrapper.on('prefetchNext', function() {
                        _self._refreshListOnScroll(_refreshDownDone);
                        _self.$listWrapper.off('prefetchNext');
                    });
                }
            }
        },
        
        /**
         * sortFilterOptions can either be a Mobile Helix enhanced PersistenceJS
         * schema (with the __hx_* fields) or a map with 3 fields - sorts, thisFilters,
         * and globalFilters with the format described in the options documentation.
         */
        refreshList: function(list,condition,sortFilterOptions,oncomplete,resetSelection,extraItems,overrideOptions) {
            var _self = this;
            var _options = $.extend({}, _self.options, (overrideOptions ? overrideOptions : {}));

            // Prevent this function from being called again. Future calls should all go to refreshData.
            _self.isLoaded = true;            
        
            if ((condition !== undefined) &&
                !condition) {
                /* The condition is false. Remove this entirely from the DOM. */    
                _self.$wrapper.hide();
                return;
            }

            if (extraItems !== undefined) {
                _self.extraItems = extraItems;
            } else {
                _self.extraItems = null;
            }
            
            /* Create the sort popup */
            var sorts = null;
            if (!sortFilterOptions) {
                sorts = _options.sorts;
            } else {
                sorts = _self._getSortsFromOptions(sortFilterOptions);
            }            
            if (sorts) {
                // If there is a default sort that is not returned in the list of sorts,
                // add it. (EG. It can happen if the default sort uses a combination
                // of fields).
                if ((_options.sortBy) && (sorts[_options.sortBy] === undefined)) {
                   sorts[_options.sortBy] = {
                        display : "Default",
                        direction : _options.sortOrder.toUpperCase(),
                        usecase : _options.sortCaseSensitive
                   };
                }
                
                _self._refreshSortContainer(sorts);
            }
            /* itemList is the current query collection. Display list is an array
             * of the currently displayed items.
             */
            _self.originalList = _self.unfilteredList = _self._applyOrdering(list, _options.sortBy, _options.sortOrder, _options.sortCaseSensitive);
            
            var thisFilters = null;
            if (!sortFilterOptions) {
                thisFilters = _options.thisFilters;
            } else {
                thisFilters = _self._getThisFiltersFromOptions(sortFilterOptions);
            }
            if (thisFilters && _options.doThisFilter) {
                _self._refreshFilterContainer(thisFilters);
            }
            
            var globalFilters = null;
            if (!sortFilterOptions) {
                globalFilters = _options.globalFilters;
            } else {
                globalFilters = _self._getGlobalFiltersFromOptions(sortFilterOptions);
            }
            if (globalFilters && _options.doGlobalFilter) {
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
            _self._refreshData(function() {                
                /**
                 * Reset the selection if directed to do so.
                 */
                if (resetSelection) {
                    _self.clearSelected();
                }
                
                /* It seems that attaching the scrolling classes after showing the list
                 * is required to make scrolling work properly on iOS.
                 */
                if (_options.scroll) {
                    _self.$listWrapper.removeClass('hx-scroller-nozoom');
                    _self.$listWrapper.addClass('hx-scroller-nozoom');
                    _self.$listWrapper.addClass('hx-full-height');

                    _self.$listWrapper.on('touchstart', function() {
                        _self._fingerOn = true;
                    });
                    
                    _self.$listWrapper.on('touchend', function() {
                        _self._fingerOn = false;
                    });
                    
                    _self._inBounce = false;
                    _self.$listWrapper.scroll(function(ev) {
                        var scrollPos = _self.$listWrapper.scrollTop();
                        var lastScroll = _self._lastScrollPos;
                        var listHeight = _self.$parent.height() - _self.$listWrapper.height();
                        //console.log("SCROLL: " + scrollPos + ", LAST: " + lastScroll + ", HEIGHT: " + listHeight);
                        if (_self._rescrollInProgress) {
                            return;
                        }
                        if (!_self.$parent.is(':visible')) {
                            return;
                        }
                        if (_self._scrollerTimeout) {
                            clearTimeout(_self._scrollerTimeout);
                            _self._scrollerTimeout = null;
                        }
                        _self._lastScrollPos = scrollPos;
                        
                        if (scrollPos < 0 || scrollPos > listHeight) {
                            if (_self._inBounce === true) {
                                return;
                            }
                            _self._inBounce = true;
                            //alert("BOUNCE: " + scrollPos + ", " + _self._renderWindowStart);
                        } else {
                            /*if (_self._inBounce) {
                                alert("CLEAR " + listHeight);
                            }*/
                            _self._inBounce = false;
                        }
                        
                        // We display a scrolling window of items. We always pull in
                        // page size * 2 items. If we are in the bottom half of the list
                        // we prepend more to the bottom of the list and remove from the
                        // top. If Ifwe are in the top half of the list we append to the end
                        // of the list and remove from the front.
                       
                        //console.log("RENDER: " + _self._renderWindowStart + ", ATTOP: " + _self._atDataTop);
                        if ((lastScroll > scrollPos || scrollPos < 0) && _self._renderWindowStart > 0) {
                            // We are scrolling up ...
                            if (scrollPos < (listHeight * .5)) {
                                if (!_self._prefetchPrev) {
                                    _self._prefetchPage(-1);
                                }
                                if (scrollPos < 0) {
                                    // Bounce.
                                    _self._rescrollInProgress = true;
                                    //alert("BOUNCEUP");
                                    setTimeout($.proxy(_self._doScrollUp, _self), 200);
                                } else if (_self._firstElemVisible()) {
                                    if (_self._fingerOn) {
                                        return;
                                    }
                                    
                                    _self._scrollerTimeout = setTimeout($.proxy(_self._doScrollUp, _self), 100);
                                    return;
                                }
                            }
                        } else if ((lastScroll < scrollPos || scrollPos > listHeight) && !_self._atDataTop) {
                            // Scrolling down.
                            if (scrollPos > (listHeight * .5)) {
                                if (!_self._prefetchNext) {
                                    _self._prefetchPage(1);
                                }
                                if (scrollPos > listHeight) {
                                    // Bounce
                                    _self._rescrollInProgress = true;
                                    //alert("BOUNCEDOWN");
                                    setTimeout($.proxy(_self._doScrollDown, _self), 200);
                                } else if (_self._lastElemVisible()) {
                                    if (_self._fingerOn) {
                                        return;
                                    }
                                    _self._scrollerTimeout = setTimeout($.proxy(_self._doScrollDown, _self), 100);
                                    return;
                                }
                            }
                        }
                    });
                }
                _self.$listWrapper.css('-webkit-overflow-scrolling', 'touch');
                
                if (oncomplete) {
                    oncomplete(_self);
                    _self.isDirty = false;
                }
            }, true, extraItems, _self.originalList);
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
        refreshData: function(list,condition,oncomplete,renderWindowStart,extraItems) {
            var _self = this;
            
            /* Hide the list while we are manipulating it. */
            if ((condition !== undefined) &&
                !condition) {
                /* The condition is false. Remove this entirely from the DOM. */    
                _self.$wrapper.hide();
                return;
            }
            
            var displayCollection;
            if (list) {
                list = _self._applyOrdering(list, _self._currentSort, _self._currentSortOrder, _self._currentSortCase);
                displayCollection = _self._resetGlobalFilters(list);
            }
            _self._refreshData(function() {
                // Make sure the list selection matches the item that appears active.
                _self.$listWrapper.find('li.ui-btn-active').each(function() {
                    _self.setSelected(this);
                });
                
                if (oncomplete) {
                    oncomplete(_self);
                    _self.isDirty = false;
                }
                /* itemList is the current query collection. Display list is an array
                 * of the currently displayed items.
                 */
                if (list) {
                    _self.originalList = _self.unfilteredList = list;
                }
            }, true, extraItems, displayCollection, renderWindowStart);
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
            _self.__refreshSortContainer();
        },
        
        __refreshSortContainer: function() {
             var _self = this;
             
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
            var sorts = JSON.parse(_self._currentSortsJSON);
            var currentSortItem = null;
            for (var sortFld in sorts) {
                var nxtSort = sorts[sortFld];
                if (nxtSort.display !== "[none]") {
                    var sortItem = $('<li />').append($('<a />').attr({ 
                        'href' : 'javascript:void(0)',
                        'data-field': sortFld,
                        'data-direction' : nxtSort.direction,
                        'data-case' : nxtSort.usecase
                    }).append(nxtSort.display)).appendTo($(sortsList));
                    
                    /* Highlight the current sort. */
                    if (sortFld === _self._currentSort) {
                        currentSortItem = sortItem;
                    }
                    
                    /* Do the actual sorting ... */
                    $(sortItem).on(_self.tapEvent, function(evt) {
                        evt.stopImmediatePropagation();                       
                        var newSortField = $(evt.target).attr('data-field');
                        var defDirection = $(evt.target).attr('data-direction');
                        var caseSensitive = $(evt.target).attr('data-case');
                        
                        var newSort = _self._currentSort;
                        var newSortOrder = _self._currentSortOrder;
                        var newSortCase = _self._currentSortCase;
                        
                        var tgt = this;
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
                                }
                            }
                            if (found) {
                                newSortOrder = curSortOrders.join(',');
                            }
                        }
                        // We don't append sort orders - we just reset the sort order to the
                        // new field.
                        if (!found) {
                            newSort = newSortField;
                            newSortOrder = defDirection; 
                            newSortCase = caseSensitive;
                        }
                        
                        if (_self.nElems === 0) {
                            /* Nothing to do. */
                            return false;
                        }
                        if (_self.options.onSortChange) {
                            var updatedSorts = _self.options.onSortChange(newSort, newSortOrder, newSortField);
                            if (updatedSorts) {
                                newSort = (updatedSorts.sort ? updatedSorts.sort : newSort);
                                newSortOrder = (updatedSorts.sortOrder ? updatedSorts.sortOrder : newSortOrder);
                                newSortCase = (updatedSorts.sortCase ? updatedSorts.sortCase : newSortCase);
                            }
                        }

                        // Display from the beginning of the list.
                        _self._refreshData(function() {
                            _self.$listWrapper.scrollTop(0);
                            _self._currentSort = newSort;
                            _self._currentSortOrder = newSortOrder;
                            _self._currentSortCase = newSortCase;
                            
                            _self._updateSortButtons();
                        
                            // Change the li for this sort field so that we can see it is the current sort field.
                            $(sortsList).find('li').removeClass('hx-current-sort');
                            $(tgt).addClass('hx-current-sort');
                        }, true, undefined, _self._applyOrdering(_self.itemList.clearOrder(), newSort, newSortOrder, newSortCase));
                        $(_self._sortContainer).popup("close");
                        return false;
                    });
                }
            }
            sortsList.listview();
            if (currentSortItem) {
                $(currentSortItem).addClass('hx-current-sort');
            }
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
            _self._thisFilterField = null;
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
                            _self._refreshData(function() {
                                _self._thisFilterField = newFilterField;
                                _self.$listWrapper.scrollTop(0);
                            }, true, _self.extraItems, _self.options.doThisFilter(_self.itemList, newFilterField, _self.selected));
                            _self._filterContextMenu.close();
                        },
                        'enabled' : true
                    });
                }
            }
                    
            /* Always have a "Clear" option. */
            contextMenuItems.push({
                'display' : 'None',
                'action' : function() {
                    _self._refreshData(function() {
                        _self.$parent.listview( "refresh" );
                        _self.$listWrapper.scrollTop(0);
                    }, true, _self.extraItems, _self.unfilteredList);
                    _self._filterContextMenu.close();
                },
                'enabled' : true
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
            var curCollection = (itemList ? itemList : this._applyOrdering(this.unfilteredList, this._currentSort, this._currentSortOrder, this._currentSortCase));
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
                _self._refreshData(function() {
                    
                }, true, undefined, _self._resetGlobalFilters());
            } else {
                if (_self._filterMap[gFilterField] &&
                    _self._filterMap[gFilterField] === _filterValue) {
                    // The filter did not change ... do nothing.
                    return;
                } else if (_self._filterMap[gFilterField] &&
                           _self._filterMap[gFilterField] !== _filterValue) {
                    // The filter value changed. Apply the filter to the original list.
                    _self._filterMap[gFilterField] = _filterValue;
                    _self._refreshData(function() {
                    
                    }, true, undefined, _self._resetGlobalFilters());
                } else {
                    // Use itemList in the call below as filters can build on each other.
                    _self._filterMap[gFilterField] = _filterValue;
                    _self._refreshData(function() {
                    
                    }, true, undefined, _self.options.doGlobalFilter(_self.itemList, gFilterField, _filterValue));
                }
            }            
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
                                        'data-field' : fldName,
                                        'data-corners' : "false",
                                        'data-native-menu': "false",
                                        'data-theme': "a",
                                        'data-overlay-theme' : "a"
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
            
            /* Always have a "Clear" button to reset all global filters. */
            $('<li />').append($('<a />').attr({ 
                'href' : 'javascript:void(0)',
                'data-field': '__clear',
                'data-theme': 'a',
                'data-mini' : 'true'
            }).append("Clear All"))
              .appendTo(filtersList)
              .on(_self.tapEvent, function(evt) {
                evt.stopImmediatePropagation();
                evt.preventDefault();
                
                _self._refreshData(function() {
                    // Reset the values in the global filter popup.
                    _self._clearGlobalFilterMenu();
                    _self._filterMap = {};
                    _self.$listWrapper.scrollTop(0);
                }, true, undefined, _self._applyOrdering(_self.unfilteredList, _self._currentSort, _self._currentSortOrder, _self._currentSortCase));
                $(_self._globalFilterContainer).popup("close");
            });
            
            filtersList.listview();
            _self._globalFilterContainer.popup();            
        },
        
        _resetPaging: function() {
            this._lastScrollPos = 0;
            this._renderWindowStart = 0;
            this._itemsPerPage = this.options.itemsPerPage;
            this._atDataTop = false; 
            this._rescrollInProgress = false;
        },
                        
        
        _refreshData: function(oncomplete, noPaginate, extraItems, itemList, renderWindowStart) {
            var _self = this;
        
            if (_self.refreshInProgress) {
                //alert("HELLO2");
                // Do not list refreshed interleave. Finish one, then do the next one.
                _self._queuedRefreshes.push([ oncomplete, noPaginate, extraItems, itemList, renderWindowStart ]);
                return;
            }
        
            _self.refreshInProgress = true;
            
            if (renderWindowStart !== undefined) {
                _self.setRenderWindowStart(renderWindowStart);
            }
            if (extraItems !== undefined) {
                _self.extraItems = extraItems;
            }
        
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
        
            /* List must be non-empty and either a query collection or an array. */
            if (itemList) {
                /* The item list is new - so we reset paging. */
                _self._resetPaging();
                _self.itemList = itemList;
            } else {
                
            }
            var displayCollection = _self.itemList;
            if (!displayCollection || (!displayCollection.newEach && !$.isArray(displayCollection))) {
                _self.refreshInProgress = false;
                alert("Invalid display list.");
                return;            
            }
                        
            /* Apply any active search terms, then global filters. Note, we must apply 
             * search first. 
             */
            //this.$listWrapper.hide();
            this._sortAndRenderData(displayCollection, function(finalCompletion) {
                finalCompletion();
                _self.$listWrapper.show();
                _self.$parent.listview( "refresh" );         
                $(_self.$wrapper).trigger('refreshdone');
                _self.refreshInProgress = false;
                if (_self._queuedRefreshes.length) {
                    var refreshArgs = _self._queuedRefreshes.pop();
                    setTimeout(function() {
                        _self._refreshData(refreshArgs[0], refreshArgs[1], refreshArgs[2], refreshArgs[3], refreshArgs[4]);                    
                    }, 0);
                }
            }, this.options.emptyMessage, oncomplete, noPaginate, _self.extraItems);
        },
        
        indexedSearchDone: function(displayCollection, oncomplete) {
            var _self = this;
            if (!oncomplete) {
                oncomplete = function() {
                    _self.scrollToStart();
                };
            }
            
            if ($.isFunction(displayCollection)) {
                this.refreshInProgress = false;
                displayCollection.call(this);
            } else {
                this.unfilteredList = this.itemList = displayCollection;
                displayCollection = _self._applyOrdering(displayCollection, _self._currentSort, _self._currentSortOrder, _self._currentSortCase);
                this._refreshData(oncomplete, true, undefined, displayCollection, 0);
            }
        },
        
        _sortAndRenderData: function(displayCollection, oncomplete, emptyMsg, opaque, noPaginate, extraItems) {
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
            var nExtras = 0;
            
            /* Functions used in processing each item. */
            var __processRow = function(curRow) {
                if (_self.options.grouped) {
                    groupsToRender.push(curRow);
                } else {
                    if (nRendered >= _self._itemsPerPage) {
                        return false;
                    }

                    ++rowIndex;
                    if (_self._renderSingleRow(LIs, rowIndex - 1, _self._itemsPerPage, curRow, function() {
                        // Nothing to do.
                    })) {
                        ++nRendered;
                        return true;
                    }
                }
                return false;
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
                        $(LIs[_ridx]).hide().removeAttr('data-index');
                    }
                    /* Call completion when all rows are done rendering. */
                    oncomplete(opaque);
                    _self._handleEmpty(nRendered, nExtras, emptyMsg);
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
            
            var __processDone = function(count, startIdx) {
                var _ridx;
                if (!_self.options.grouped) {
                    /* We did not render any rows. Call completion. */
                    if (!startIdx) {
                        startIdx = nRendered;
                    } else {
                        startIdx = startIdx + nRendered;
                    }
                    for (_ridx = startIdx; _ridx < LIs.length; ++_ridx) {
                        $(LIs[_ridx]).hide().removeAttr('data-index');
                    }

                    _self._handleEmpty(nRendered, nExtras, emptyMsg);
                    // Remove all existing list dividers. The call to listview refresh in the completion method will take care of 
                    // restoring them.
                    $(_self.$parent).find('li[data-role="list-divider"]').remove();
                    oncomplete(opaque);
                } else {
                    __renderGroup(0);
                }
            };
            
            if (_self._prefetchedItems && (noPaginate !== true)) {
                // If the prefetched items list is too small, we won't be able to scroll up. Instead we just extend the list.
                var ct = _self._prefetchedItems.length;
                var startIdx = 0;
                if (_self._prefetchedItems.length < 20) {
                    _self._atDataTop = true;
                    ct = ct + _self._itemsPerPage;
                    rowIndex = _self._itemsPerPage;
                    startIdx = _self._itemsPerPage;
                } else {
                    _self.displayList = [];
                }
                
                __processStart(ct);
                for (var i = 0; i < _self._prefetchedItems.length; ++i) {
                    __processRow(_self._prefetchedItems[i]);
                }
                __processDone(ct, startIdx);
                _self._prefetchedItems = [];
            } else if ($.isArray(displayCollection)) {
                _self.displayList = [];
                __processStart(displayCollection.length);
                if (extraItems && extraItems.pre) {
                    for (var i = 0; i < extraItems.pre.length; ++i) {
                        var nxtPre = extraItems.pre[i];
                        if (nxtPre.renderCondition && !nxtPre.renderCondition.call(_self)) {
                            continue;
                        }
                        __processRow(nxtPre);
                    }
                }
                for (var i = 0; i < displayCollection.length; ++i) {
                    __processRow(displayCollection[i]);
                }
                __processDone(displayCollection.length);
            } else {
                _self.displayList = [];
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
                        if (extraItems && extraItems.pre) {
                            for (var i = 0; i < extraItems.pre.length; ++i) {
                                var nxtPre = extraItems.pre[i];
                                if (nxtPre.renderCondition && !nxtPre.renderCondition.call(_self)) {
                                    continue;
                                }
                                if (__processRow(nxtPre)) {
                                    ++nExtras;
                                }
                            }
                        }
                    },
                    /* Called on done. */
                    doneFn: function(count) {
                        if (_self.prefetchedItems) {
                            for (var i = 0; i < _self._prefetchedItems.length; ++i) {
                                __processRow(_self._prefetchedItems[i]);
                                ++count;
                            }
                            if (extraItems && extraItems.post) {
                                for (i = 0; i < extraItems.post.length; ++i) {
                                    if (__processRow(extraItems.post[i])) {
                                        ++nExtras;
                                    }
                                }
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
        
        _doRemoteSearch: function(searchText, localResultsColl) {
            var _self = this;
            _self.__searchReadyTimeout = setTimeout(function() {
                if (_self.__searchReadyTimeout) {
                    clearTimeout(_self.__searchReadyTimeout);
                }

                if (searchText) {
                    _self.options.indexedSearch.call(_self, searchText, function(displayCollection, oncomplete) {
                        _self.indexedSearchDone(displayCollection, oncomplete);
                    }, localResultsColl);
                }
                _self.__searchReadyTimeout = null;
            }, 3000);

        },
        
        _doSearch: function() {
            var _self = this;
            _self.__searchText = _self.$searchBox.val();            
            if (_self.__searchReadyTimeout) {
                clearTimeout(_self.__searchReadyTimeout);
            }
            if (_self.__searchText.length < 2) {
                // We do not do 1 letter searches ...
                return;
            } else {
                var searchText = _self.__searchText.trim();
                if (_self.options.localIndexedSearch) {
                    _self.options.localIndexedSearch.call(_self, searchText, function(res) {
                        _self.indexedSearchDone(res, function() {
                            if (_self.options.indexedSearch) {
                                _self._doRemoteSearch(searchText, res);                        
                            }
                        });
                    });
                } else {
                    _self._doRemoteSearch(searchText, _self.originalList);
                }                
            }
        },
        
        // Restore the original list contents, without any searching, sorting, or filtering.
        resetListContents: function() {
            var _self = this;
            if (_self.options.onSearchClear) {
                _self.options.onSearchClear.call(_self);
            }
            _self._refreshData(function() {
                _self.scrollToStart();
            }, true, _self.extraItems, _self.originalList);
        },
        
        _prependSearchBox: function() {
            var _self = this;
            var useControlGroup = false;
            if (!_self._searchSortDirty) {
                return;
            }
            
            _self.$searchSortDiv.empty();
            _self._searchSortDirty = false;
            if (!_self.options.showSortButton && !_self.options.showFilterButton && !_self.options.indexedSearch) {
                _self.$searchSortDiv.hide();
                return;
            }

            var _attachButtons = function() {
                if (!_self.options.showSortButton && !_self.options.showFilterButton) {
                    return;
                }
                
                if (_self.options.showSortButton && _self.options.showFilterButton) {
                    useControlGroup = true;
                }
                
                _self.$sortDiv = $('<div/>').attr({
                    'data-role' : 'none',
                    'data-type' : 'horizontal'
                }).appendTo(_self.$searchSortDiv);
                if (_self.options.showSortButton) {
                    /* Ascending/descending sort buttons. */
                    var sAscendID = Helix.Utils.getUniqueID();
                    var sDescendID = Helix.Utils.getUniqueID();
                    _self.options.sortButtons = {
                        'ascending' : PrimeFaces.escapeClientId(sAscendID),
                        'descending' : PrimeFaces.escapeClientId(sDescendID)
                    };

                    this.$sortAscending = $('<a/>').attr({
                        'id' : sAscendID,
                        'data-role' : 'none',
                        'data-icon' : 'hx-sort-asc-black',
                        'data-iconpos' : 'notext',
                        'data-theme' : 'd',
                        'data-mini' : (useControlGroup ? 'true' : 'false'),
                        'class' : 'ui-icon-alt ui-icon-nodisc hx-icon-sort-filter'
                    }).button()
                    .appendTo(_self.$sortDiv)
                    .on(_self.tapEvent, function(ev) {
                        ev.stopPropagation();
                        ev.stopImmediatePropagation();
                        ev.preventDefault();
                        
                        _self.displaySortMenu(this);
                    });
                    this.$sortDescending = $('<a/>').attr({
                        'id' : sDescendID,
                        'data-role' : 'none',
                        'data-icon' : 'hx-sort-desc-black',
                        'data-iconpos' : 'notext',
                        'data-theme' : 'd',
                        'data-mini' : (useControlGroup ? 'true' : 'false'),
                        'class' : 'ui-icon-alt ui-icon-nodisc hx-icon-sort-filter'
                    }).button()
                    .appendTo(_self.$sortDiv)
                    .on(_self.tapEvent, function(ev) {
                        ev.stopPropagation();
                        ev.stopImmediatePropagation();
                        ev.preventDefault();
                        
                        _self.displaySortMenu(this);
                    });                    
                }
                
                if (_self.options.showFilterButton) {
                    /* Filter button. */
                    var sFilterID = Helix.Utils.getUniqueID();
                    this.$filter = $('<a/>').attr({
                        'id' : sFilterID,
                        'data-role' : 'none',
                        'data-icon' : 'hx-filter-black',
                        'data-iconpos' : 'notext',
                        'data-theme' : 'd',
                        'data-mini' : (useControlGroup ? 'true' : 'false'),
                        'class' : 'ui-icon-alt hx-icon-sort-filter'
                    }).button()
                    .appendTo(_self.$sortDiv)
                    .on(_self.tapEvent, function(ev) {
                        ev.stopPropagation();
                        ev.stopImmediatePropagation();
                        ev.preventDefault();
                        
                        _self.displayGlobalFilterMenu(this);
                    });                    
                }
                
                if (this.options.externalButtonsCallback) {
                    this.options.externalButtonsCallback(_self, _self.$sortDiv, useControlGroup);
                }
                
                if (useControlGroup) {
                    _self.$sortDiv.controlgroup();
                } else {
                    _self.$sortDiv.controlgroup({ corners: false });
                }
            };
            
            var _attachSearchBox = function() {
                var $searchDiv = $('<div/>').addClass('hx-almost-full-width').appendTo(_self.$searchSortDiv);
                var sboxID = Helix.Utils.getUniqueID();
                var sboxType = 'search';
                if (this.options.indexedSearchType !== 'search') {
                    sboxType = 'text';
                }
                this.$searchBox = $('<input/>').attr({
                    'type' : sboxType,
                    'name' : 'search',
                    'id' : sboxID,
                    'data-role' : 'none',
                    'data-mini' : true,
                    'value': this.options.indexedSearchText
                }).appendTo($searchDiv);

                this.$searchLabel = $('<label/>').attr({
                    'for': sboxID
                }).append('Search').appendTo($searchDiv).hide();
                this.$searchBox.textinput({
                    clearBtn : true
                });
                if (this.__searchText) {
                    this.$searchBox.val(this.__searchText);
                }
                this.$searchBox.on('input', function() {                   
                    _self._doSearch();
                });
                if (this.options.indexedSearchText) {
                    _self.__searchClear = true;
                    this.$searchBox.on('focus', function() {
                        if (_self.__searchClear) {
                            _self.$searchBox.val('');
                        }
                        if (_self.$sortDiv) {
                            _self.$sortDiv.hide(100);
                        }
                    });
                    this.$searchBox.on('blur', function() {
                        // If we had previously searched and we then blur the search box
                        // when it is empty, restore the original list.
                        if (!_self.$searchBox.val() && _self.__searchText) {                    
                            _self.clearSearchText();
                            _self.resetListContents();
                        }
                        if (_self.$sortDiv) {
                            _self.$sortDiv.show();
                        }
                        return false;
                    });
                } else {
                    this.$searchBox.on('focus', function() {
                        if (_self.$sortDiv) {
                            _self.$sortDiv.hide(100);
                        }
                    });
                    this.$searchBox.on('blur', function() {
                        if (_self.$sortDiv) {
                            _self.$sortDiv.show();
                        }
                    });
                }
                
                var $clearBtn = $searchDiv.find('a.ui-input-clear'); 
                $clearBtn.on(_self.tapEvent, function() {
                    _self.$searchBox.val('');
                    _self.$searchBox.blur();
                    _self.clearSearchText();
                    _self.resetListContents();
                    return false;
                });
            };

            if (this.options.buttonPos === 'left') {
                _attachButtons.call(this);
                if (this.options.indexedSearch || this.options.localIndexedSearch) {
                    _attachSearchBox.call(this);
                }                
            } else {
                if (this.options.indexedSearch  || this.options.localIndexedSearch) {
                    _attachSearchBox.call(this);
                }
                _attachButtons.call(this);
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
                return false;
            }));
            
            var $controlGroup = $('<div/>').appendTo(_self.$clearSelectionDiv);
            if (this.options.selectionButtonsCallback) {
                this.options.selectionButtonsCallback.call(_self, $controlGroup);
            }
            $controlGroup.controlgroup({ 
                type: 'horizontal',
                shadow: false
            });
        },
        
        /* Apply the appropriate sort to the display collection. */
        _applyOrdering: function(displayCollection, orderby, direction, usecase) {
            // Make sure this is a query collection.
            if (displayCollection && displayCollection.clearOrder) {
                displayCollection = displayCollection.clearOrder();
                if (this.options.groupBy) {
                    if (this.options.groupByOrder.toUpperCase() === 'ASCENDING') {
                        displayCollection = displayCollection.order(this.options.groupBy, true, false);                
                    } else {
                        displayCollection = displayCollection.order(this.options.groupBy, false, false);
                    }
                }

                if (orderby) {
                    var orderbyFields = orderby.split(",");
                    var directionVals = direction.split(",");
                    var caseVals = (Helix.Utils.isString(usecase) ? usecase.split(",") : usecase.toString());

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
                            'data-index' : rowIndex,
                            'data-group-index' : '-1',
                            'data-role' : 'empty-group'
                        }).append(_self.options.emptyGroupMessage)
                        .insertAfter(dividerLI);
                    }
                };
                
                var __finishGroup = function(idx) {
                    if (_self.options.itemsPerGroup > 0 &&
                            idx > _self.options.itemsPerGroup) {
                        // Add a "More ..." item.
                        var $moreMarkup = $('<a/>').append(_self.options.groupOverflowText);
                        if (_self.options.groupOverflowTextClass) {
                            $moreMarkup.addClass(_self.options.groupOverflowTextClass);
                        }
                        if (idx < groupLIs.length) {
                            $(groupLIs[idx]).empty().append($moreMarkup);
                            idx++;
                        }
                        else {
                            groupLIs[idx] = $('<li/>').attr('data-theme', 'c').append($moreMarkup).appendTo(_self.$parent);
                            idx++;
                        }
                        $moreMarkup.on(_self.tapEvent, function(ev) {
                            ev.stopImmediatePropagation();
                            _self.options.groupOverflowFn.call(_self, rowObject.group);
                            return false;
                        });
                    }
                    oncomplete();
                    for (var _gidx = idx; _gidx < groupLIs.length; ++_gidx) {
                        $(groupLIs[_gidx]).hide().removeAttr('data-index');
                    }
                };

                var __renderGroupRow = function(groupRow, groupIndex) {
                    if (_self.options.itemsPerGroup > 0 &&
                            groupIndex > _self.options.itemsPerGroup) {
                        // Stop rendering ... we have exceeded the max number in a group.
                        return groupIndex;
                    }

                    var renderer = null;
                    if (_self.options.groupRenderer) {
                        renderer = _self.options.groupRenderer(rowObject.group);
                    }
                    if (_self._renderRowMarkup(groupLIs, groupRow, arrIdx, groupIndex, renderer)) {
                        rowObject.rows.push(groupRow);
                        ++groupIndex;
                    }
                    return groupIndex;
                };

                var rowObject = {
                    'group': curRow, 
                    'rows' : []
                };
                _self.displayList.push(rowObject);
          
                var groupName = _self.options.groupName(rowObject.group);
                var groupMembers = _self.options.groupMembers(rowObject.group);
                var groupOptions = _self.options.groupOptions(rowObject.group);
                var groupIndex = 0;
                
                // Attach the group header.
                var dividerLI;
                if (arrIdx >= LIs.length) {
                    dividerLI = $('<li />').attr({
                        'data-role' : 'list-divider'
                    }).append(groupName);
                    if (groupOptions.search) {
                        dividerLI.append($('<div/>').attr({
                            'class' : 'ui-icon ui-icon-search sh-hbutton-right',
                            'style' : 'margin-top: -.25em;'
                        }).on(Helix.clickEvent, function() {
                            groupOptions.search(rowObject.group);
                            return false;
                        }));
                    }
                    dividerLI.appendTo(_self.$parent);
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
                    if ($.isArray(groupMembers)) {
                        if (groupMembers.length === 0) {
                            __renderEmptyGroup(dividerLI);
                            __finishGroup(0);
                        } else {
                            var i;
                            for (i = 0; i < groupMembers.length; ++i) {
                                groupIndex = __renderGroupRow(groupMembers[i], groupIndex);
                            }
                            __finishGroup(groupIndex);
                        }
                    } else {
                        groupMembers.forEach(
                            /* Element callback. */
                            function(groupRow) {
                                groupIndex = __renderGroupRow(groupRow, groupIndex);
                            },
                            /* On start. */
                            function(ct) {
                                if (ct === 0) {
                                    __renderEmptyGroup(dividerLI);                                
                                }
                            },
                            /* On done. */
                            function() {
                                __finishGroup(groupIndex);
                            }
                        );
                    }
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
    
        _renderRowMarkup: function(LIs, row, rowIndex, groupIndex, renderer) {
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
                    'class' : _self.options.rowStyleClass,
                    'data-theme' : 'c'
                });
            }
            
            curRowParent.attr('data-index', rowIndex);
            curRowParent.attr('data-selected', '0');
            if (_self.options.grouped) {
                curRowParent.attr('data-group-index', groupIndex);
            }
        
            if (!renderer) {
                renderer = _self.options.rowRenderer;
            }
            if (renderer(curRowParent, _self, row, rowIndex, _self.options.strings)) {
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
                            thisArg: _self,
                            extraArgs: _self.options.itemContextMenuArgs
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
                            _self.$searchSortDiv.show();
                            Helix.Layout.layoutPage();
                        } else {
                            if (!_self.$clearSelectionDiv.is(':visible')) {
                                _self.$clearSelectionDiv.show();
                                _self.$searchSortDiv.hide();
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
                this.selectedGroup = null;
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
            this.$searchSortDiv.show();
            Helix.Layout.layoutPage();
        },
        
        clearAllListRows: function() {
            this.$parent.empty();
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
            
            if (rowComponents.subIcon) {
                // Elements to put underneath the icon.
                $(rowComponents.subIcon).attr('data-role', 'subicon').addClass('hx-subicon');
                if ($(parentElement).find('[data-role="subicon"]').length) {
                    $(parentElement).find('[data-role="subicon"]').replaceWith(rowComponents.subIcon);
                } else {
                    $(mainLink).append(rowComponents.subIcon);
                }
            } else {
                $(parentElement).find('[data-role="subicon"]').remove();
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
            return mainLink;
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
        selectNext: function(noSelectAction) {
            if (!this.selectedLI) {
                this.setSelectedByIndex(0, 0);
            } else {
                var nxt = this.selectedLI;
                do {
                    nxt = nxt.next();
                } while (nxt.is('li') && !nxt.is('li[data-index]'));
                if (nxt.length) {
                    this.setSelected(nxt);
                    this.selectItem(noSelectAction);
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
            // Prevent pagination
            this._setScrollTimer();
            this.$listWrapper.scrollTop(0);
        },
        
        /**
         * Set the scroll position of the list element.
         * 
         * @param {int} pos
         * @returns {undefined}
         */
        setScrollPosition: function(pos) {
            // Prevent pagination
            this._setScrollTimer();
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
        
        setFooterContents: function(contents) {
            this.$footerSection.empty();
            this.$footerSection.append(contents);
            this.$footerSection.show();
        },
        
        hideFooter: function() {
            this.$footerSection.hide();
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
         * Reset the isLoaded flag.
         */
        clearIsLoaded: function() {
            this.isLoaded = false;
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
                this.$searchBox.val(this.options.indexedSearchText ? this.options.indexedSearchText : '');
                this.__searchClear = true;
            }
            this.__searchText = '';
        },
        
        hideList: function() {
            this.$listWrapper.hide();
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
        },
                
        getCurrentSort : function() {
            return {
                sortBy: this._currentSort,
                direction: this._currentSortOrder,
                usecase: this._currentSortCase
            };
        },
                
        setCurrentSort : function(jsonSort, doRefresh) {
            var sort = jsonSort;
            if (Helix.Utils.isString(sort)) {
                sort = JSON.parse(sort);
            }
            
            var oldOrder = this._currentSortOrder;
            var oldSort = this._currentSort;
            var oldSortCase = this._currentSortCase;
            var newSort = (sort.sortBy ? sort.sortBy : oldSort);
            var newOrder = (sort.direction ? sort.direction  : oldOrder);
            var newCase = (sort.usecase ? sort.usecase : oldSortCase);
                                
            if ((oldSort !== newSort) || 
                    (oldOrder !== newOrder) ||
                      (oldSortCase !== newCase)) {
                 var _self = this;
                 var __sortUpdateDone = function() {
                    _self._currentSort = newSort;
                    _self._currentSortOrder = newOrder;
                    _self._currentSortCase = newCase;
                    if(_self.isLoaded) {
                        _self.__refreshSortContainer();
                        _self._updateSortButtons();
                    }
                 };
                 
                 if (doRefresh === true) {
                      _self._refreshData(function() {
                            __sortUpdateDone();
                            _self.$listWrapper.scrollTop(0);
                      }, true, this.extraItems, _self._applyOrdering(_self.itemList, newSort, newOrder, newCase));   
                 } else {
                    __sortUpdateDone();                
                 }
             }
        },
        
        /**
         * Return the list header.
         */
        getListHeader: function() {
            return this.$headerSection;
        },
        
        /**
         * Return the options object.
         */
        getOptions: function() {
            return this.options;
        },
        
        /**
         * Return the query collection of the data we are showing in the list. 
         */
        getItemList: function() {
            return this.itemList;
        },
        
        /**
         * Return the width of the list.
         */
        getListWidth: function() {
            return this.$listWrapper.width();
        },
        
        /**
         * Refresh the listview component that is the rendering of the data list.
         */
        refreshListView: function() {
            this.$parent.listview( "refresh" );         
        },
        
        /**
         * Re-render the list view if some attributes of the underlying data have changed (but not
         * the data set itself).
         */
        renderListView: function(oncomplete) {
            var _self = this;
            this._sortAndRenderData(this.itemList, function(finalCompletion) {
                if (finalCompletion) {
                    finalCompletion();
                }
                _self.$parent.listview( "refresh" );         
            }, this.options.emptyMessage, oncomplete, true, this.extraItems);
        }
    });
})(jQuery);