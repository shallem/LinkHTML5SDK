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
var globalDataListID = -1;
(function ($) {

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
             * Text to display in the footer when data is loading.
             */
            footerLoadingText: null,
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
            groupOptions: function () {
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
            rowStyleClass: '',
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
             * Action to perform is the split button is clicked. To render split buttons, supply icon
             * class (ui-icon-<supply this class>) as the splitLink member of the object provided to
             * createListRow. Whenever that split button is tapped, this function will be called after
             * setting the list selection.
             */
            splitAction: null,
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
             * Text to set the first time (and only the first time) the search box is displayed.
             */
            defaultSearchText: '',
            /**
             * Type of box - is it a 'search' box or a 'filter' box.
             */
            indexedSearchType: 'search',
            /**
             * Called when the search is cleared.
             */
            onSearchClear: null,
            /**
             * Called after the list refresh triggered by a search clear is done.
             */
            afterSearchClear: null,
            /**
             *  Buttons for external actions not managed by but rendered by the datalist.
             */
            externalButtonsCallback: null,
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
            sortOrder: "ASC",
            /**
             * Field to use for grouping. Grouping is intended to be used in conjunction with
             * auto dividers, so the groupBy field should be the primary grouping field. This is a
             * single field - not a comma delimited field list.
             */
            groupBy: null,
            /**
             * Ordering for the groupBy field.
             */
            groupByOrder: "ASC",
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
            sortButtons: {},
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
             * Function to call when a filtering operation is done.
             */
            filterDone: function () {

            },
            /**
             * List of data to display in the list. Must be a PersistenceJS
             * QueryCollection object.
             */
            itemList: null,
            /**
             * 
             */

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
             * "This" arg for the row renderer. If this is null then the list itself is used.
             */
            rowRendererContext: null,
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
            itemsPerPage: 50,
            
            /*
             * Size of the window of preloaded data (in pages).
             */
            preloadPageCt: 6
        },
        _create: function () {
            var _self = this;
            this.dataListID = ++globalDataListID;
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
                    .addClass('hx-full-width hx-search-sort hx-toggleable')
                    .attr('id', parentId + '_list_header')
                    .hide();
            this._searchSortDirty = true;

            this.$clearSelectionDiv = $('<div/>')
                    .appendTo(this.$headerSection)
                    .addClass('hx-full-width hx-list-selection-buttons hx-toggleable hx-toggled')
                    .attr('id', parentId + '_clear_sel')
                    .hide();


            /**
             * Append the data list.
             */
            var listWrapper = this.$listWrapper = $('<div/>').attr('class', 'hx-full-width hx-scroller-nozoom hx-flex-fill hx-no-hscroll').appendTo(this.$section);

            // Set context menu event to taphold for touch devices, dblclick for none-touch.
            this.contextEvent = Helix.contextEvent;
            this.tapEvent = (Helix.hasTouch ? 'tap' : 'click'); //Helix.clickEvent;
            this._cancelNextTap = false;
            if (Helix.hasTouch) {
                this._installTouchActionHandlers();
            } else {
                this._installNoTouchActionHandlers();
            }

            /**
             * Append the footer.
             */
            this.$footerSection = $('<footer/>').addClass('hx-no-webkit-select').appendTo(this.$section).hide();

            /**
             * Append the hook div if we have pull to refresh setup.
             */
            this.$hookDiv = null;
            if (this.options.pullToRefresh) {
                this.$hookDiv = $('<div/>').appendTo(listWrapper);
            }

            this.$parent = $('<ul/>').attr({
                'data-role': 'listview',
                'class': 'hx-listview'
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
             * Action icon, if enabled.
             */
            if (this.options.showDataIcon === false) {
                this.showDataIcon = false;
                this.$parent.attr('data-icon', false);
            }

            var ad = this.options.autodividers;
            if (!ad) {
                ad = false;
            } else if (Helix.Utils.isString(ad)) {
                if (ad.toLowerCase() === 'false') {
                    ad = false;
                } else {
                    ad = true;
                }
            }
            this.hasAutodividers = ad;

            var ads = function (elt) {
                var callback = _self.options.autodividersSelectorCallback;

                var obj = $(elt).data('data');
                if (callback && obj && $(elt).attr('data-deleted') !== 'true') {
                    return callback(elt, _self.displayList, _self._currentSort, obj);
                }

                return null;
            };
            this.autodividerSelector = ads;

            this.$parent.listview({
                //autodividers: ad,
                //autodividersSelector: ads,
                dividerTheme: 'd',
                headerTheme: 'd'
            });

            if (this.$hookDiv) {
                this.$hookDiv.hook({
                    reloadPage: false,
                    scrollTarget: listWrapper,
                    reloadEl: function () {
                        if (!_self.refreshInProgress && _self._renderWindowStart === 0) {
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
                    reloadEl: function () {
                        if (!_self.refreshInProgress) {
                            _self.options.pushToRefresh.call(this);
                            _self._clearGlobalFilterMenu();
                        }
                    }
                });
            }

            // Pagination setup.
            this._resetPaging();

            // The underlying data.
            this.displayList = [];
            this.prevPage = [];
            this.nextPage = [];
            this.displayLIs = [];

            // Other globals.
            this.isLoaded = false;
            this.selected = null;
            this._fingerOn = false;

            // Default sort.
            this.setDefaultSort();

            if (this.options.strings) {
                this.strings = this.options.strings.split(",");
            }

            // Queued refershes - tracks refresh calls that occur during another refresh.
            this._queuedRefreshes = [];
            this.refreshInProgress = false;
            
            $(document).on('active', null, this, function (ev) {
                // Make sure a paused/interrupted refresh (due to the app going to sleep) does not leave
                // the datalist stuck.
                var _me = ev.data;
                _me.refreshInProgress = false;
                _me._queuedRefreshes = [];
            });
            if (this.options.itemList) {
                this.refreshList(this.options.itemList, this.options.condition, null, function () {

                });
            }
        },
        _refreshDividers: function () {
            if (!this.hasAutodividers) {
                return;
            }
            this.$parent.find("li:jqmData(role='list-divider')").remove();

            var lis = this.$parent.find('li'),
                    lastDividerText = null, li, dividerText;

            for (var i = 0; i < lis.length; i++) {
                li = lis[i];
                dividerText = this.autodividerSelector($(li));

                if (dividerText && lastDividerText !== dividerText) {
                    var divider = document.createElement('li');
                    divider.appendChild(document.createTextNode(dividerText));
                    divider.setAttribute('data-' + $.mobile.ns + 'role', 'list-divider');
                    divider.classList.add('ui-li-divider', 'ui-bar-d', 'hx-no-webkit-select');
                    li.parentNode.insertBefore(divider, li);
                }
                // SAH - blank means ignore
                if (dividerText) {
                    lastDividerText = dividerText;
                }
            }
        },
        setDefaultSort: function () {
            this._currentSort = this.options.sortBy;
            this._currentSortOrder = this.options.sortOrder.toUpperCase();
            this._currentSortCase = '';
            this._updateSortButtons();
        },
        _getSortsFromOptions: function (sortFilterOptions) {
            if (sortFilterOptions.__hx_sorts) {
                return sortFilterOptions.__hx_sorts;
            }
            if (sortFilterOptions.sortBy) {
                return sortFilterOptions;
            }

            return sortFilterOptions.sorts;
        },
        _getThisFiltersFromOptions: function (sortFilterOptions) {
            if (sortFilterOptions.__hx_filters) {
                return sortFilterOptions.__hx_filters;
            }

            return sortFilterOptions.thisFilters;
        },
        _getGlobalFiltersFromOptions: function (sortFilterOptions) {
            if (sortFilterOptions.__hx_global_filters) {
                return sortFilterOptions.__hx_global_filters;
            }

            return sortFilterOptions.globalFilters;
        },
        _handleEmpty: function (nelems, nextras, msg, hook) {
            var emptyLI = $(this.$parent).find('li[data-role="empty-message"]');
            if (nelems === nextras) {
                if (emptyLI.length) {
                    $(emptyLI).show();
                    $(emptyLI).text(msg);
                } else if (msg) {
                    this.$parent.append($('<li />')
                            .attr('data-role', 'empty-message')
                            .append(msg)
                            .addClass('hx-empty-message'));
                }
                if (hook) {
                    hook.call(this);
                }
            } else if (emptyLI.length) {
                $(emptyLI).hide();
            }
        },
        _preloadPage: function (direction, pageCt) {
            if (this.options.grouped) {
                // No preloading when we are dealing with a grouped list ...
                return;
            }

            var displayCollection = this.itemList;
            if ($.isArray(displayCollection)) {
                // No preloading an array.
                return;
            }
            if (this._preloadHitDataTop === true) {
                if (direction > 0) {
                    return;
                } else {
                    this._preloadHitDataTop = false;
                }
            }
            if (this._preloadWindowStart === 0 && direction < 0) {
                return;
            }

            var nElems = 0;
            var skip = 0;
            if (direction !== 0) {
                // We are sliding the window of preloaded data ...
                nElems = pageCt * this._itemsPerPage;
                if (direction < 0) {
                    skip = Math.max(0, this._preloadWindowStart - nElems);
                } else if (direction > 0) {
                    skip = this._preloadWindowStart + this._prefetchedData.length;
                }
            } else {
                // We are setting up the initial preload window.
                nElems = this.options.preloadPageCt * this._itemsPerPage;
            }
            displayCollection = displayCollection.limit(nElems);
            displayCollection = displayCollection.skip(skip);

            var _self = this;
            _self._preloadPromise = new Promise(function (resolve, reject) {
                var _prefetchedItems = [];
                displayCollection.newEach({
                    startFn: function (ct) {
                        // if we don't get the full number of elems we asked for, we have run out of
                        // data
                        if (ct < nElems) {
                            _self._preloadHitDataTop = true;
                        }
                    },
                    eachFn: function (row) {
                        _prefetchedItems.push(row);
                    },
                    doneFn: function (ct) {
                        if (direction === 0) {
                            _self._prefetchedData = _prefetchedItems;
                        } else if (direction < 0) {
                            var remainder = Math.max(0, ct - _self._preloadWindowStart);
                            _self._preloadWindowStart = Math.max(0, _self._preloadWindowStart - ct);
                            // Keep the first ct elems of the existing prefetched array.
                            _self._prefetchedData = _prefetchedItems.concat(_self._prefetchedData.slice(remainder, ct + remainder));
                        } else {
                            // Negative slice means slice ct elems off the start
                            _self._prefetchedData = _self._prefetchedData.slice(ct).concat(_prefetchedItems);
                            _self._preloadWindowStart += ct;
                        }
                        resolve();
                        _self._preloadPromise = null;
                    }
                });
            });
        },
        /**
         * Called during scrolling to prefetch a new set of data.
         * 
         * @param direction - should be 1 for scrolling down, -1 for scrolling up.
         */
        _forceRerender: function() {
            /*
            this.$listWrapper[0].style.display = 'none';
            var _ignore = this.$listWrapper[0].offsetHeight;
            this.$listWrapper[0].style.display = 'block';
            return _ignore; // Without this our JS compressor optimizes _ignore away
            */
        },
 
        _updateScrollTop: function(newScrollTop) {
            var node = this.$listWrapper[0];
            node.style['-webkit-overflow-scrolling'] = 'auto';
            node.scrollTop = newScrollTop;
            node.style['-webkit-overflow-scrolling'] = 'touch';
        },
        
        _nextPage: function (direction, oncomplete) {
            var _self = this;
            if (this.options.grouped) {
                // Grouped lists do not scroll
                return;
            }
            if (direction < 0) {
                var _addToBottom = function () {
                    var toReverse = Math.floor(_self._itemsPerPage / 3);
                    var preloadStartIdx = _self._renderWindowStart - _self._preloadWindowStart;
                    var startIdx = preloadStartIdx - toReverse;
                    if (startIdx < 0) {
                        // Either: (1), we have no more data.
                        // (2) We need to wait for more data.
                        // (3) We need to get more data and wait for it.
                        if (_self._renderWindowStart === 0) {
                            // No data
                            oncomplete();
                            return;
                        } else {
                            if (!_self._preloadPromise) {
                                _self._preloadPage(-1, 2);
                            }
                            if (_self._preloadPromise) {
                                _self._preloadPromise.then(_addToBottom);
                                return;
                            } else if (preloadStartIdx) {
                                startIdx = 0;
                            } else {
                                oncomplete();
                                return;
                            }
                        }
                    }

                    if (startIdx >= 0) {
                        var lastLI = null;
                        var i;
                        for (i = 0; i < _self.displayLIs.length; ++i) {
                            lastLI = _self.displayLIs[i];
                            if (lastLI && ('data-id' in lastLI.attributes)) {
                                break;
                            }
                        }
                        if (!lastLI) {
                            // We are caught mid-refresh ... otherwise this should never happen.
                            oncomplete();
                            return;
                        }
                        var lastID = lastLI.attributes['data-id'].nodeValue;
                        _self._sortAndRenderData(_self._prefetchedData.slice(startIdx, startIdx + _self._itemsPerPage), function (tgtID) {
                            _self._renderWindowStart -= toReverse;
                            if (!_self._preloadPromise && (startIdx < _self._itemsPerPage * 2)) {
                                _self._preloadPage(-1, 2);
                            }

                            _self._refreshDividers();
                            var i;
                            var delta = 0;
                            for (i = 0; i < _self.displayLIs.length; ++i) {
                                var nxt = _self.displayLIs[i];
                                if (('data-id' in nxt.attributes) &&
                                        tgtID === nxt.attributes['data-id'].nodeValue) {
                                    delta = nxt.offsetTop - _self.displayLIs[0].offsetTop;
                                    break;
                                }
                            }

                            _self._updateScrollTop(delta);
                            setTimeout(function () {
                                _self._forceRerender();
                                oncomplete();
                            }, 15);
                        }, _self.options.emptyMessage, lastID, true, _self.extraItems, _self.options);
                        return;
                    } else {
                        oncomplete();
                    }
                };
                _addToBottom();
            } else {
                var _addToEnd = function () {
                    var toAdd = Math.floor(_self._itemsPerPage / 3);
                    var windowSize = _self._itemsPerPage;
                    var preloadStartIdx = _self._renderWindowStart - _self._preloadWindowStart;
                    var startIdx = preloadStartIdx + toAdd;
                    
                    if ((startIdx + windowSize) >= _self._prefetchedData.length) {
                        if (_self._preloadHitDataTop) {
                            toAdd = (_self._prefetchedData.length - (preloadStartIdx + windowSize));
                            startIdx = preloadStartIdx + toAdd;
                        } else{
                            if (!_self._preloadPromise) {
                                // We need more data;
                                _self._preloadPage(1, 2);                                
                            }
                            if (_self._preloadPromise) {
                                // Wait for more data.
                                _self._preloadPromise.then(_addToEnd);
                            } else {
                                oncomplete();
                            }
                            return;
                        }
                    }
                    if (toAdd <= 0) {
                        // We have hit the top of the list ... no more data.
                        oncomplete();
                        return;
                    }
                    
                    if (startIdx <= _self._prefetchedData.length) {
                        var lastLI = null;
                        var i;
                        for (i = _self.displayLIs.length - 1; i >= 0; --i) {
                            lastLI = _self.displayLIs[i];
                            if (lastLI && ('data-id' in lastLI.attributes)) {
                                break;
                            }
                        }
                        if (!lastLI) {
                            // We are caught mid-refresh ... otherwise this should never happen.
                            oncomplete();
                            return;
                        }
                        if (i >= 0) {
                            var lastTop = _self.displayLIs[i].offsetTop;
                            var lastID = lastLI.attributes['data-id'].nodeValue;
                            _self._sortAndRenderData(_self._prefetchedData.slice(startIdx, startIdx + windowSize), function (args) {
                                var tgtID = args[0];
                                var origTop = args[1];
                                _self._renderWindowStart += toAdd;
                                if (!_self._preloadPromise && (startIdx > (_self._itemsPerPage * 2))) {
                                    _self._preloadPage(1, 2);
                                }

                                _self._refreshDividers();
                                var delta = 0;
                                for (i = _self.displayLIs.length - 1; i > 0; --i) {
                                    var nxt = _self.displayLIs[i];
                                    if (('data-id' in nxt.attributes) &&
                                            tgtID === nxt.attributes['data-id'].nodeValue) {
                                        delta = _self.displayLIs[i].offsetTop - origTop;
                                        break;
                                    }
                                }

                                _self._updateScrollTop(_self.$listWrapper[0].scrollTop + delta);
                                setTimeout(function () {
                                    _self._forceRerender();
                                    oncomplete();
                                }, 100);
                            }, _self.options.emptyMessage, [lastID, lastTop], true, _self.extraItems, _self.options);
                            return;
                        }
                    } else {
                        oncomplete();
                    }
                };
                _addToEnd();
            }
        },
        
        _setScrollTimer: function (scrollAction) {
            this._cancelAllScrolls = true;
            scrollAction();
            var _self = this;
            setTimeout(function () {
                _self._cancelAllScrolls = false;
            }, 500);
        },
 
        scrollHandler: function (ev) {
            var _self = this;
            if (_self._cancelAllScrolls) {
                return;
            }

            var scrollPos = _self.$listWrapper.scrollTop();
            var lastScroll = _self._lastScrollPos;
            var listHeight = _self.$parent.height() - _self.$listWrapper.height();
            if (listHeight <= 0) {
                // This can happen when the list is in the process of being refreshed.
                return;
            }
            
            _self._lastScrollPos = scrollPos;
            if (lastScroll === Number.MIN_VALUE) {
                return;
            }

            if (scrollPos <= 0 && _self._renderWindowStart > 0) {
                // stop tracking scroll events
                _self._stopScrollHandler();
                _self._lastScrollPos = Number.MIN_VALUE;
                _self._nextPage(-1, function() {
                    _self._restoreScrollEvent();
                });
            } else if (scrollPos >= listHeight) {
                // Scrolling down.
                _self._stopScrollHandler();
                _self._lastScrollPos = Number.MIN_VALUE;
                _self._nextPage(1, function() {
                    _self._restoreScrollEvent();
                });
            }
        },
        /**
         * sortFilterOptions can either be a Mobile Helix enhanced PersistenceJS
         * schema (with the __hx_* fields) or a map with 3 fields - sorts, thisFilters,
         * and globalFilters with the format described in the options documentation.
         */
        refreshList: function (list, condition, sortFilterOptions, oncomplete, resetSelection, extraItems, overrideOptions, keepOverrides) {
            var _self = this;
            var _options = $.extend({}, _self.options, (overrideOptions ? overrideOptions : {}));
            if (keepOverrides) {
                _self.options = _options;
            }

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
                if ((_self._currentSort) && (sorts[_self._currentSort] === undefined)) {
                    sorts[_options.sortBy] = {
                        display: "Default",
                        direction: _self._currentSortOrder.toUpperCase(),
                        usecase: _self._currentSortCase
                    };
                }

                _self._refreshSortContainer(sorts);
            }
            /* itemList is the current query collection. Display list is an array
             * of the currently displayed items.
             */
            _self.originalList = _self.unfilteredList = _self._applyOrdering(list, _self._currentSort, _self._currentSortOrder, _self._currentSortCase);

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
            _self._searchSortDirty = true;
            _self._prependSearchBox(_options);
            _self._updateSortButtons();

            /* generate a clear selection button for multi select */
            _self._prependClearSelection();

            /* Set scrolling styles */
            if (_options.scroll) {
                _self.$listWrapper.addClass('hx-scroller-nozoom');
                _self.$listWrapper.addClass('hx-full-height');
            }

            /**
             * Display from the beginning of the list.
             */
            _self._refreshData(function () {
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
                    _self.$listWrapper.on('touchstart', function () {
                        _self._fingerOn = true;
                    });

                    _self.$listWrapper.on('touchend', function () {
                        _self._fingerOn = false;
                    });

                    _self._installScrollHandler();
                }

                if (oncomplete) {
                    oncomplete(_self);
                    _self.isDirty = false;
                }
            }, true, extraItems, _self.originalList, undefined, _options);
        },
        
        _installScrollHandler: function() {
            var __scrollHandler = $.proxy(function (ev) {
                this.scrollHandler(ev);
            }, this);
            this.$listWrapper.off('scroll').scroll(__scrollHandler);
            this._cancelAllScrolls = false;
        },
        
        _restoreScrollEvent: function () {
            this._cancelAllScrolls = false;
        },
        _stopScrollHandler: function () {
            this._cancelAllScrolls = true;
        },
        /**
         * Helpers for infinite scroll.
         */

        _firstElemVisible: function () {
            var $in = this.$listWrapper.find('li.ui-first-child').withinViewport({'container': this.$listWrapper[0], 'sides': 'topvisible bottom'});
            return ($in.length > 0);
        },
        _lastElemVisible: function () {
            var $in = this.$listWrapper.find('li.ui-last-child').withinViewport({'container': this.$listWrapper[0], 'sides': 'top bottomvisible'});
            return ($in.length > 0);
        },
        /**
         * Called when the data in the list has changed, but the list structure itself
         * has not.
         */
        refreshData: function (list, condition, oncomplete, renderWindowStart, extraItems, overrideOptions) {
            var _self = this;
            var _options = $.extend({}, _self.options, (overrideOptions ? overrideOptions : {}));

            /* Hide the list while we are manipulating it. */
            if ((condition !== undefined) &&
                    !condition) {
                /* The condition is false. Remove this entirely from the DOM. */
                _self.$wrapper.hide();
                return;
            } else {
                _self.$wrapper.show();
            }

            var displayCollection;
            if (list) {
                list = _self._applyOrdering(list, _self._currentSort, _self._currentSortOrder, _self._currentSortCase);
                displayCollection = _self._resetGlobalFilters(list);
            }
            var selectedID = _self.$listWrapper.find('li.ui-btn-active').attr('data-id');
            _self._refreshData(function () {
                if (selectedID) {
                    var selected = _self.$listWrapper.find('li[data-id="' + selectedID + '"]');
                    if (selected.length === 0) {
                        _self.clearSelected();
                    }
                } else {
                    _self.clearSelected();
                }

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
            }, true, extraItems, displayCollection, renderWindowStart, _options);
        },
        _updateSortButtons: function () {
            if ('ascending' in this.options.sortButtons &&
                    'descending' in this.options.sortButtons) {
                if (this._currentSortOrder.toUpperCase().indexOf("DSC") === 0) {
                    // Show the descending button, reflecting the CURRENT order.
                    $(this.options.sortButtons.descending).show();
                    $(this.options.sortButtons.ascending).hide();
                } else {
                    $(this.options.sortButtons.ascending).show();
                    $(this.options.sortButtons.descending).hide();
                }
            }
        },
        _refreshSortContainer: function (sorts) {
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
        __refreshSortContainer: function () {
            var _self = this;

            /* Need to refresh the search/sort area. */
            _self._searchSortDirty = true;

            /* we are only called if sorts is non-null. */
            if (_self._sortContainer) {
                /* Remove the old context menu ... */
                _self._sortContainer.remove();
            }

            _self._sortContainer = $('<div/>').attr({
                'data-role': 'popup',
                'id': Helix.Utils.getUniqueID(),
                'data-theme': 'd',
                'data-position-to': 'origin',
                'data-history': 'false',
                'data-icon': 'false'
            }).appendTo(_self.$wrapper);
            var sortsList = $('<ul />').attr({
                'data-role': 'listview',
                'data-inset': 'true',
                'data-theme': 'd'
            }).appendTo(_self._sortContainer);
            var sorts = JSON.parse(_self._currentSortsJSON);
            var currentSortItem = null;
            for (var sortFld in sorts) {
                var nxtSort = sorts[sortFld];
                if (nxtSort.display !== "[none]") {
                    var sortItem = $('<li />').append($('<a />').attr({
                        'href': 'javascript:void(0)',
                        'data-field': sortFld,
                        'data-direction': nxtSort.direction,
                        'data-case': nxtSort.usecase
                    }).append(nxtSort.display)).appendTo($(sortsList));

                    /* Highlight the current sort. */
                    if (sortFld === _self._currentSort) {
                        currentSortItem = sortItem;
                    }

                    /* Do the actual sorting ... */
                    $(sortItem).on(_self.tapEvent, function (evt) {
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
                                    if (sortOrder.toUpperCase() === "ASC") {
                                        curSortOrders[i] = "DSC";
                                    } else {
                                        curSortOrders[i] = "ASC";
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
                        _self._refreshData(function () {
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
        _refreshFilterContainer: function (filters) {
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
                        'href': 'javascript:void(0)',
                        'data-field': filterFld
                    }).append());
                    contextMenuItems.push({
                        'display': filters[filterFld],
                        'data': filterFld,
                        'action': function (newFilterField) {
                            _self._refreshData(function () {
                                _self._thisFilterField = newFilterField;
                                _self.$listWrapper.scrollTop(0);
                            }, true, _self.extraItems, _self.options.doThisFilter(_self.itemList, newFilterField, _self.selected));
                            _self._filterContextMenu.close();
                        },
                        'enabled': true
                    });
                }
            }

            /* Always have a "Clear" option. */
            contextMenuItems.push({
                'display': 'None',
                'action': function () {
                    _self._refreshData(function () {
                        //_self.$parent.listview("refresh");
                        _self.$listWrapper.scrollTop(0);
                    }, true, _self.extraItems, _self.unfilteredList);
                    _self._filterContextMenu.close();
                },
                'enabled': true
            });
            _self._filterContextMenu = $(_self._filterContainer).helixContextMenu({
                items: contextMenuItems
            }).data('helix-helixContextMenu');
        },
        _normalizeFilterValue: function (val) {
            var intValue = parseInt(val);
            if (intValue === NaN) {
                return val;
            } else {
                return intValue;
            }
        },
        _resetGlobalFilters: function (itemList) {
            var curCollection = (itemList ? itemList : this._applyOrdering(this.unfilteredList, this._currentSort, this._currentSortOrder, this._currentSortCase));
            for (var filteredFld in this._filterMap) {
                curCollection = this.options.doGlobalFilter(curCollection, filteredFld, this._filterMap[filteredFld]);
            }
            return curCollection;
        },
        _doGlobalFilter: function (gFilterField, gFilterValue) {
            var _self = this;
            var _filterValue = this._normalizeFilterValue(gFilterValue);
            if (gFilterValue === '__hx_clear') {
                // Clear out this field, then starting from the unfiltered list re-instate all
                // remaining fields.
                delete _self._filterMap[gFilterField];
                _self._refreshData(_self.options.filterDone, true, undefined, _self._resetGlobalFilters());
            } else {
                if (gFilterField in _self._filterMap) {
                    if (_self._filterMap[gFilterField] === _filterValue) {
                        // The filter did not change ... do nothing.
                        return;
                    } else {
                        // The filter value changed. Apply the filter to the original list.
                        _self._filterMap[gFilterField] = _filterValue;
                        _self._refreshData(_self.options.filterDone, true, undefined, _self._resetGlobalFilters());
                    }
                } else {
                    // Use itemList in the call below as filters can build on each other.
                    _self._filterMap[gFilterField] = _filterValue;
                    _self._refreshData(_self.options.filterDone, true, undefined, _self.options.doGlobalFilter(_self.itemList, gFilterField, _filterValue));
                }
            }
        },
        _clearGlobalFilterMenu: function () {
            for (var fField in this._filterMap) {
                this._globalFilterContainer.find('input[data-field="' + fField + '"]').prop('checked', false).checkboxradio('refresh');
                this._globalFilterContainer.find('input[data-field="' + fField + '"][data-value="__hx_clear"]').prop('checked', true).checkboxradio('refresh');
            }
        },
        _makeFilterRadioDOM: function (filtersList, filterObj, fldName) {
            var radioMarkup = $('<li />').addClass('hx-full-width');
            var formMarkup = $("<form />").addClass('hx-full-width').appendTo(radioMarkup);
            var wrapperMarkup = $('<fieldset/>').appendTo(formMarkup).addClass('hx-full-width');
            var _self = this;

            for (var i = 0; i < filterObj.values.length; ++i) {
                var filterName = filterObj.valueNames[i];
                if (!filterName || !filterName.trim()) {
                    continue;
                }

                var inputID = Helix.Utils.getUniqueID();
                $('<label />').attr({
                    'for': inputID,
                    'data-corners': 'false'
                }).append(filterName)
                        .appendTo(wrapperMarkup);
                var inputMarkup = $('<input/>').attr({
                    'name': fldName,
                    'id': inputID,
                    'type': 'radio',
                    'tabindex': -1,
                    'data-corners': 'false',
                    'data-value': filterObj.values[i],
                    'data-field': fldName
                }).appendTo(wrapperMarkup);
                $(inputMarkup).change(function (evt) {
                    if (this.checked === true) {
                        var gFilterField = $(this).attr('data-field');
                        _self._doGlobalFilter(gFilterField, Number($(this).attr('data-value')));
                    }
                    $(_self._globalFilterContainer).popup("close");
                    evt.stopImmediatePropagation();
                    return false;
                });
            }
            $('<input/>').attr({
                'name': fldName,
                'id': 'clear',
                'type': 'radio',
                'tabindex': -1,
                'data-corners': 'false',
                'data-value': '__hx_clear',
                'data-field': fldName,
                'checked': 'true'
            }).appendTo(wrapperMarkup)
                    .change(function (evt) {
                        if (this.checked === true) {
                            var gFilterField = $(this).attr('data-field');
                            _self._doGlobalFilter(gFilterField, '__hx_clear');
                        }
                        $(_self._globalFilterContainer).popup("close");
                        evt.stopImmediatePropagation();
                        return false;
                    });
            $('<label />').attr({
                'for': 'clear',
                'data-corners': 'false'
            }).append('Any')
                    .appendTo(wrapperMarkup);
            wrapperMarkup.appendTo(filtersList);
            wrapperMarkup.find('input').checkboxradio({
                mini: true
            });
            $(wrapperMarkup).controlgroup({
                mini: true,
                type: 'horizontal'
            });
            return radioMarkup;
        },
        _refreshGlobalFilterContainer: function (filters) {
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
                'data-role': 'popup',
                'id': Helix.Utils.getUniqueID(),
                'data-theme': 'd',
                'data-position-to': 'origin',
                'data-history': 'false'
            }).appendTo(_self.$wrapper);
            var filtersList = $('<ul />').attr({
                'data-role': 'listview',
                'data-inset': 'true',
                'data-theme': 'd'
            }).appendTo(_self._globalFilterContainer);
            for (var fldName in filters) {
                var filterObj = filters[fldName];
                var filterItem = null;
                if (filterObj.values.length === 1) {
                    filterItem = $('<li />').append($('<a />').attr({
                        'href': 'javascript:void(0)',
                        'data-field': fldName,
                        'data-value': filterObj.values[0]
                    }).appendTo(filtersList)
                            .append(filterObj.valueNames[0]));
                    filtersList.append(filterItem);

                    // Execute the global filter.
                    filterItem.on(_self.tapEvent, function (evt) {
                        evt.stopImmediatePropagation();
                        evt.preventDefault();
                        var newFilterField = $(evt.target).attr('data-field');
                        var newFilterValue = $(evt.target).attr('data-value');

                        _self._doGlobalFilter(newFilterField, newFilterValue);
                        $(_self._globalFilterContainer).popup("close");
                    });
                } else {
                    // Make the filter name a list divider.
                    var nxtLI = $('<li />').appendTo(filtersList);
                    nxtLI.append($('<label/>').append(filterObj.display).appendTo(nxtLI));
                    _self._makeFilterRadioDOM(nxtLI, filterObj, fldName);
                }
            }

            /* Always have a "Clear" button to reset all global filters. */
            $('<li />').append($('<a />').attr({
                'href': 'javascript:void(0)',
                'data-field': '__clear',
                'data-theme': 'd',
                'data-mini': 'true'
            }).append("Clear All"))
                    .appendTo(filtersList)
                    .on(_self.tapEvent, function (evt) {
                        evt.stopImmediatePropagation();
                        evt.preventDefault();

                        _self._refreshData(function () {
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
        
        _resetPaging: function () {
            this._lastScrollPos = 0;
            this._renderWindowStart = 0;
            this._preloadWindowStart = 0;
            this._preloadHitDataTop = false;
            this._itemsPerPage = this.options.itemsPerPage;
        },

        _refreshData: function (oncomplete, noPaginate, extraItems, itemList, renderWindowStart, _options) {
            var _self = this;
            if (!_options) {
                _options = _self.options;
            }

            if (_self.refreshInProgress) {
                //alert("HELLO2");
                // Do not list refreshed interleave. Finish one, then do the next one.
                _self._queuedRefreshes.push([oncomplete, noPaginate, extraItems, itemList, renderWindowStart, _options]);
                return;
            }

            _self.refreshInProgress = true;
            if (!extraItems) {
                extraItems = _self.extraItems;
            }

            if (_self.options.headerText) {
                if (!_self._headerLI) {
                    _self._headerLI = $('<li />').attr({
                        'class': 'ui-li-divider ui-bar-d hx-no-webkit-select',
                        'data-role': 'list-divider'
                    }).append(_options.headerText)
                            .appendTo(_self.$parent);
                } else {
                    _self._headerLI.text(_options.headerText);
                }
            }

            /* List must be non-empty and either a query collection or an array. */
            if (itemList) {
                /* The item list is new - so we reset paging. */
                _self.itemList = itemList;
            } else {

            }

            /* Must happen after we call _resetPaging */
            if (renderWindowStart !== undefined) {
                _self.setRenderWindowStart(renderWindowStart);
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
            _self._resetPaging();
            this.$listWrapper.scrollTop(0);            
            this._sortAndRenderData(displayCollection, function (finalCompletion) {
                finalCompletion.call(_self);
                _self._refreshDividers();
                //_self.$parent.listview("refresh");
                _self.refreshInProgress = false;
                $(_self.$parent).trigger('refreshdone');
                if (_self._queuedRefreshes.length) {
                    var refreshArgs = _self._queuedRefreshes.pop();
                    setTimeout(function () {
                        _self._refreshData(refreshArgs[0], refreshArgs[1], refreshArgs[2], refreshArgs[3], refreshArgs[4], refreshArgs[5]);
                    }, 0);
                }
                _self._preloadPage(0); // Preload the 4 pages from the DB.
            }, _options.emptyMessage, oncomplete, noPaginate, extraItems, _options);
        },
        hasIndexedSearch: function () {
            if (this.options.indexedSearch) {
                return true;
            }

            return false;
        },
        indexedSearchDone: function (displayCollection, oncomplete, optionsOverrides) {
            var _self = this;
            if (!oncomplete) {
                oncomplete = function () {
                };
            }

            if ($.isFunction(displayCollection)) {
                this.refreshInProgress = false;
                displayCollection.call(this);
            } else {
                this.unfilteredList = this.itemList = displayCollection;
                displayCollection = _self._applyOrdering(displayCollection, _self._currentSort, _self._currentSortOrder, _self._currentSortCase);
                this._refreshData(oncomplete, true, undefined, displayCollection, 0, optionsOverrides);
            }
        },
        listIsEmpty: function () {
            return this.nRendered === 0;
        },
        getExtrasCount: function () {
            return this.nExtras;
        },
        _sortAndRenderData: function (displayCollection, oncomplete, emptyMsg, opaque, noPaginate, extraItems, _options) {
            var _self = this;
            var rowIndex = 0;
            _self.nRendered = 0;
            var LIs = [];
            var groupsToRender = [];
            if (_options.grouped) {
                LIs = $(_self.$parent).find('li[data-role="list-divider"]');
                // Remove any list rows that appear before the first divider, or the divider list is empty, remove the entire list.
                // In a grouped list, we only rewrite the divider titles and the rows that lie in between dividers. This scenario can
                // happen when we are switching a single list between grouped and ungrouped rendering.
                if (LIs.length === 0) {
                    $(_self.$parent).find('li').remove();
                } else {
                    $(LIs[0]).prevAll().remove();
                }
            } else {
                // Add not selector to make sure we handle auto dividers properly.
                LIs = $(_self.$parent).find('li').not('[data-role="list-divider"]').not('[data-role="empty-message"]');
            }
            _self.nExtras = 0;

            /* Functions used in processing each item. */
            var __processRow = function (curRow) {
                if (_options.grouped) {
                    groupsToRender.push(curRow);
                } else {
                    if (_self.nRendered >= _self._itemsPerPage) {
                        return false;
                    }

                    ++rowIndex;
                    if (_self._renderSingleRow(LIs, rowIndex - 1, _self._itemsPerPage, curRow, function () {
                        // Nothing to do.
                    }, false, _options)) {
                        ++_self.nRendered;
                        return true;
                    }
                }
                return false;
            };

            var __processStart = function (count) {
                _self.nElems = count;
            };

            var __renderGroup = function (groupIndex) {
                if (groupsToRender.length === 0) {
                    for (var _ridx = groupIndex; _ridx < LIs.length; ++_ridx) {
                        $(LIs[_ridx]).hide().removeData();
                    }
                    /* Call completion when all rows are done rendering. */
                    oncomplete.call(_self, opaque);
                    _self._handleEmpty(_self.nRendered, _self.nExtras, emptyMsg, _options.emptyHook);
                    return;
                }

                var nxt = groupsToRender.shift();
                if (_self.nRendered >= _self._itemsPerPage) {
                    return;
                }

                if (_self._renderSingleRow(LIs, groupIndex, _self._itemsPerPage, nxt, function () {
                    ++_self.nRendered;
                    __renderGroup(groupIndex + 1);
                }, true, _options)) {
                }
            };

            var __processDone = function (count, startIdx) {
                var _ridx;
                if (!_options.grouped) {
                    /* We did not render any rows. Call completion. */
                    if (!startIdx) {
                        startIdx = _self.nRendered;
                    } else {
                        startIdx = startIdx + _self.nRendered;
                    }
                    for (_ridx = startIdx; _ridx < LIs.length; ++_ridx) {
                        $(LIs[_ridx]).hide().removeData();
                    }

                    _self._handleEmpty(_self.nRendered, _self.nExtras, emptyMsg, _options.emptyHook);
                    // Remove all existing list dividers. The call to listview refresh in the completion method will take care of 
                    // restoring them.
                    $(_self.$parent).find('li[data-role="list-divider"]').remove();
                    oncomplete.call(_self, opaque);
                } else {
                    __renderGroup(0);
                }
            };

            var __addPreExtras = function () {
                if (extraItems && extraItems.pre) {
                    for (var i = 0; i < extraItems.pre.length; ++i) {
                        var nxtPre = extraItems.pre[i];
                        if (nxtPre.renderCondition && !nxtPre.renderCondition.call(_self)) {
                            continue;
                        }
                        if (__processRow(nxtPre)) {
                            ++_self.nExtras;
                        }
                    }
                }
            };

            if ($.isArray(displayCollection)) {
                _self.displayList = [];
                _self.displayLIs = [];
                __processStart(displayCollection.length);
                __addPreExtras();
                for (var i = 0; i < displayCollection.length; ++i) {
                    __processRow(displayCollection[i]);
                }
                __processDone(displayCollection.length);
            } else {
                _self.displayList = [];
                _self.displayLIs = [];
                /* Apply skip and limit. */
                if (_self._renderWindowStart > 0) {
                    displayCollection = displayCollection.skip(_self._renderWindowStart);
                }
                displayCollection = displayCollection.limit(_self._itemsPerPage);

                displayCollection.newEach({
                    /* Process each element. */
                    eachFn: function (curRow) {
                        __processRow(curRow);
                    },
                    /* Called on start. */
                    startFn: function (count) {
                        __processStart(count);
                        __addPreExtras();
                    },
                    /* Called on done. */
                    doneFn: function (count) {
                        __processDone(count);
                    }
                });
            }
        },
        _clearListRows: function () {
            this.$listWrapper.scrollTop(0);
            var toRemove = this.$parent.find("li").filter(":not(li[data-fixed-header='yes'])");
            toRemove.remove();
            this.$parent.find('[data-role="fieldcontain"]').remove();
        },
        _doRemoteSearch: function (searchText, localResultsColl) {
            var _self = this;
            if (_self.__searchReadyTimeout) {
                clearTimeout(_self.__searchReadyTimeout);
            }
            _self.__searchReadyTimeout = setTimeout(function () {
                if (searchText) {
                    _self.options.indexedSearch.call(_self, searchText, function (displayCollection, oncomplete, optionsOverrides) {
                        _self.indexedSearchDone(displayCollection, oncomplete, optionsOverrides);
                    }, localResultsColl);
                }
                _self.__searchReadyTimeout = null;
            }, 1000);

        },
        getCurrentSearchText: function () {
            if (!this.$searchBox) {
                // Search is not enabled OR we have not yet displayed this list.
                return '';
            }
            return this.$searchBox.val()
        },
        setCurrentSearchText: function (searchQry, doSearch) {
            this.$searchBox.val(searchQry);
            if (doSearch === true) {
                this._doSearch();
            }
        },
        _doSearch: function () {
            var _self = this;
            _self.__searchText = _self.$searchBox.val();
            if (_self.__searchReadyTimeout) {
                clearTimeout(_self.__searchReadyTimeout);
            }
            if (_self.__searchText.length === 0) {
                // The same as clearing the search.
                _self.resetListContents();
                return;
            }
            if (_self.__searchText.length < 2) {
                // We do not do 1 letter searches ...
                return;
            } else {
                var searchText = _self.__searchText.trim();
                if (_self.options.localIndexedSearch) {
                    _self.scrollToStart();
                    _self.options.localIndexedSearch.call(_self, searchText, function (res, optionsOverrides, oncomplete) {
                        // Make sure the user hasn't further changed the search box.
                        if (searchText !== _self.$searchBox.val()) {
                            return; // Don't do anything more here.
                        }
                        _self.indexedSearchDone(res, function () {
                            if (oncomplete) {
                                oncomplete.call(_self);
                            }
                            if (_self.options.indexedSearch) {
                                _self._doRemoteSearch(searchText, res);
                            }
                        }, optionsOverrides);
                    }, _self.originalList);
                } else {
                    _self._doRemoteSearch(searchText, _self.originalList);
                }
            }
        },
        resetAllFilters: function() {
            this._clearGlobalFilterMenu();
            this._filterMap = {};
            this.unfilteredList = this.originalList;
        },
        // Restore the original list contents, without any searching, sorting, or filtering.
        resetListContents: function () {
            var _self = this;
            var _doRefresh = true;
            if (_self.options.onSearchClear) {
                _doRefresh = _self.options.onSearchClear.call(_self);
            }
            if (_doRefresh !== false) {
                _self.unfilteredList = _self.originalList;
                _self._clearGlobalFilterMenu();
                _self._refreshData(function () {
                    _self.scrollToStart();
                    if (_self.options.afterSearchClear) {
                        _self.options.afterSearchClear.call(_self);
                    }
                }, true, _self.extraItems, _self.originalList);
            }
        },
        refreshSearchOptions: function (obj) {
            this.options.indexedSearchType = obj.indexedSearchType;
            this.options.indexedSearch = obj.indexedSearch;
            this.options.localIndexedSearch = obj.localIndexedSearch;
            this.options.onSearchClear = obj.onSearchClear;
            this.options.afterSearchClear = obj.afterSearchClear;
            this._searchSortDirty = true;
        },
        refreshSearchBox: function () {
            this._searchSortDirty = true;
            this._prependSearchBox(this.options);
        },
        _addSortFilterButton: function (id, icon, onclick) {
            return $('<a/>').attr({
                'id': id,
                'class': 'ui-btn iconbutton hx-icon-sort-filter'
            }).append($('<div/>').attr({
                'class': 'hx-btn-inner'
            }).append($('<div/>').attr({
                'class': 'hx-icon ui-icon-' + icon
            }))).appendTo(this.$sortDiv)
                    .on(this.tapEvent, onclick);
        },
        _prependSearchBox: function (options) {
            var _self = this;
            var useControlGroup = false;
            if (!_self._searchSortDirty) {
                return;
            }

            _self.$searchSortDiv.empty();
            _self._searchSortDirty = false;
            if (options.grouped || (!options.showSortButton && !options.showFilterButton && !options.indexedSearch)) {
                _self.$searchSortDiv.hide();
                return;
            }

            var _attachButtons = function () {
                if (!options.showSortButton && !options.showFilterButton) {
                    return;
                }

                if (options.showSortButton && options.showFilterButton) {
                    useControlGroup = true;
                }

                _self.$sortDiv = $('<div/>').attr({
                    'data-role': 'none',
                    'data-type': 'horizontal'
                }).appendTo(_self.$searchSortDiv);
                if (options.showSortButton) {
                    /* Ascending/descending sort buttons. */
                    var sAscendID = Helix.Utils.getUniqueID();
                    var sDescendID = Helix.Utils.getUniqueID();
                    _self.options.sortButtons = {
                        'ascending': PrimeFaces.escapeClientId(sAscendID),
                        'descending': PrimeFaces.escapeClientId(sDescendID)
                    };

                    this.$sortAscending = this._addSortFilterButton(sAscendID, 'hx-sort-asc-black', function (ev) {
                        ev.stopImmediatePropagation();
                        _self.displaySortMenu(this);
                        return false;
                    });
                    this.$sortDescending = this._addSortFilterButton(sDescendID, 'hx-sort-desc-black', function (ev) {
                        ev.stopImmediatePropagation();
                        _self.displaySortMenu(this);
                        return false;
                    });
                }

                if (options.showFilterButton) {
                    /* Filter button. */
                    var sFilterID = Helix.Utils.getUniqueID();
                    this.$filter = this._addSortFilterButton(sFilterID, 'hx-filter-black', function (ev) {
                        ev.stopImmediatePropagation();
                        _self.displayGlobalFilterMenu(this);
                        return false;
                    });
                }

                if (options.externalButtonsCallback) {
                    options.externalButtonsCallback(_self, _self.$sortDiv, useControlGroup);
                }

                if (useControlGroup) {
                    _self.$sortDiv.controlgroup();
                } else {
                    _self.$sortDiv.controlgroup({corners: false});
                }
            };

            var _attachSearchBox = function () {
                var $searchDiv = $('<div/>').addClass('hx-almost-full-width').appendTo(_self.$searchSortDiv);
                var sboxID = Helix.Utils.getUniqueID();
                var sboxType = 'search';
                if (options.indexedSearchType !== 'search') {
                    sboxType = 'text';
                }
                this.$searchBox = $('<input/>').attr({
                    'type': sboxType,
                    'name': 'search',
                    'id': sboxID,
                    'data-role': 'none',
                    'data-mini': true,
                    'value': options.indexedSearchText
                }).appendTo($searchDiv);

                this.$searchLabel = $('<label/>').attr({
                    'for': sboxID
                }).append('Search').appendTo($searchDiv).hide();
                this.$searchBox.textinput({
                    clearBtn: true
                });
                if (options.defaultSearchText) {
                    this.__searchText = options.defaultSearchText;
                }
                if (this.__searchText) {
                    this.$searchBox.val(this.__searchText);
                }
                this.$searchBox.on('input', function () {
                    _self.__searchClear = false;
                    _self._doSearch();
                });
                if (options.indexedSearchText) {
                    _self.__searchClear = true;
                    this.$searchBox.on('focus', function () {
                        if (_self.__searchClear) {
                            _self.$searchBox.val('');
                        }
                        if (_self.$sortDiv) {
                            _self.$sortDiv.hide(100);
                        }
                    });
                    this.$searchBox.on('blur', function () {
                        // If we had previously searched and we then blur the search box
                        // when it is empty, restore the original list.
                        if (!_self.$searchBox.val() && _self.__searchText) {
                            _self._clearSearchText();
                            _self.resetListContents();
                        }
                        if (_self.$sortDiv) {
                            _self.$sortDiv.show();
                        }
                        return false;
                    });
                } else {
                    this.$searchBox.on('focus', function () {
                        if (_self.$sortDiv) {
                            _self.$sortDiv.hide(100);
                        }
                    });
                    this.$searchBox.on('blur', function () {
                        if (_self.$sortDiv) {
                            _self.$sortDiv.show();
                        }
                    });
                }

                var $clearBtn = $searchDiv.find('a.ui-input-clear');
                $clearBtn.on(_self.tapEvent, function () {
                    _self.clearSearchText();
                    _self.resetListContents();
                    return false;
                });
            };

            if (options.buttonPos === 'left') {
                _attachButtons.call(this);
                if (options.indexedSearch || options.localIndexedSearch) {
                    _attachSearchBox.call(this);
                }
            } else {
                if (options.indexedSearch || options.localIndexedSearch) {
                    _attachSearchBox.call(this);
                }
                _attachButtons.call(this);
            }

            _self.$searchSortDiv.show();
            _self.$clearSelectionDiv.show();
        },
        _prependClearSelection: function () {
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
            }).on(_self.tapEvent, function () {
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
        _applyOrdering: function (displayCollection, orderby, direction, usecase) {
            // Make sure this is a query collection.
            if (displayCollection && displayCollection.clearOrder) {
                displayCollection = displayCollection.clearOrder();
                if (this.options.groupBy) {
                    if (this.options.groupByOrder.toUpperCase() === 'ASC') {
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
                        var latestDirection = ((oidx < directionVals.length) ? directionVals[oidx] : directionVals[directionVals.length - 1]);
                        var nxtCase = (caseVals[oidx] === 'true' ? true : false);
                        if (latestDirection.toUpperCase() === 'DSC') {
                            displayCollection = displayCollection.order(orderbyFields[oidx], false, nxtCase);
                        } else {
                            displayCollection = displayCollection.order(orderbyFields[oidx], true, nxtCase);
                        }
                    }
                }
            }
            return displayCollection;
        },
        _renderSingleRow: function (LIs, rowIndex, itemsPerPage, curRow, oncomplete, isGrouped, _options) {
            var _self = this;
            var arrIdx = (itemsPerPage > 0) ? (rowIndex % itemsPerPage) : rowIndex;
            if (isGrouped) {
                var __renderEmptyGroup = function (dividerLI) {
                    // Hide all elements in this group index.
                    _self.$parent.find('li[data-group="' + rowIndex + '"]').hide();

                    // Find the empty element, if it is there. If so, show it.
                    var $emptyElem = _self.$parent.find('li[data-group="' + rowIndex + '"][data-role="empty-group"]');
                    if ($emptyElem.length) {
                        $emptyElem.show();
                    } else {
                        $('<li />').attr({
                            'data-group': rowIndex,
                            'data-role': 'empty-group'
                        }).append(_self.options.emptyGroupMessage)
                                .insertAfter(dividerLI);
                    }
                };

                var __finishGroup = function (idx) {
                    if (_self.options.itemsPerGroup > 0 &&
                            idx > _self.options.itemsPerGroup) {
                        // Add a "More ..." item.
                        var $moreMarkup = $('<div/>')
                                .append(_self.options.groupOverflowText);
                        var $moreLink = $('<a/>').attr({
                            'href': 'javascript:void(0)',
                            'class': 'ui-btn ui-btn-up-c'
                        }).append($moreMarkup);
                        if (_self.options.groupOverflowTextClass) {
                            $moreMarkup.addClass(_self.options.groupOverflowTextClass);
                        }
                        var li;
                        if (idx < groupLIs.length) {
                            li = groupLIs[idx];
                            $(li).empty().append($moreLink);
                            // Force jQueryMobile to re-enhance
                            $(li).removeClass('ui-li');
                            idx++;
                        } else {
                            li = groupLIs[idx] = $('<li/>')
                                    .attr('data-theme', 'd')
                                    .append($moreLink)
                                    .appendTo(_self.$parent);
                            idx++;
                        }
                        $(li).attr('data-overflow', '1'); // Mark this as overflow
                        $(li).attr('data-group', rowIndex);
                        $(li).data('group', curRow);
                    }
                    oncomplete();
                    for (var _gidx = idx; _gidx < groupLIs.length; ++_gidx) {
                        $(groupLIs[_gidx]).hide().removeData();
                    }
                };

                var __renderGroupRow = function (groupRow, groupIndex, groupStart) {
                    if (_self.options.itemsPerGroup > 0 &&
                            groupIndex > _self.options.itemsPerGroup) {
                        // Stop rendering ... we have exceeded the max number in a group.
                        return groupIndex;
                    }

                    var renderer = null;
                    if (_self.options.groupRenderer) {
                        renderer = _self.options.groupRenderer(rowObject.group);
                    }
                    if (_self._renderGroupRowMarkup(groupLIs, groupRow, rowIndex, groupIndex, renderer, groupStart, curRow)) {
                        rowObject.rows.push(groupRow);
                        ++groupIndex;
                    }
                    return groupIndex;
                };

                var rowObject = {
                    'group': curRow,
                    'rows': []
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
                        'data-role': 'list-divider',
                        'class': 'ui-li-divider ui-bar-d hx-no-webkit-select'
                    }).append(groupName);
                    dividerLI.appendTo(_self.$parent);
                } else {
                    dividerLI = LIs[arrIdx];
                    $(dividerLI).empty().append(groupName).show();
                }
                _self.displayLIs.push(dividerLI[0]);
                if (groupOptions.search) {
                    $(dividerLI).append($('<div/>').attr({
                        'class': 'ui-icon ui-icon-search sh-hbutton-right',
                        'style': 'margin-top: -.25em;'
                    }).on(Helix.clickEvent, rowObject, function (ev) {
                        groupOptions.search(ev.data.group);
                        return false;
                    }));
                }

                if (_self.options.dividerStyleClass) {
                    $(dividerLI).addClass(_self.options.dividerStyleClass);
                }

                if (groupMembers) {
                    // Remove empty group messages.
                    $(dividerLI).nextUntil('li[data-role="list-divider"]', '[data-role="empty-group"]').remove();
                    // groupLIs are all LIs from dividerLI to the next divider (except empty messages)
                    var groupLIs = $(dividerLI).nextUntil('li[data-role="list-divider"]');
                    if ($.isArray(groupMembers)) {
                        if (groupMembers.length === 0) {
                            __renderEmptyGroup(dividerLI);
                            __finishGroup(0);
                        } else {
                            var i;
                            for (i = 0; i < groupMembers.length; ++i) {
                                groupIndex = __renderGroupRow(groupMembers[i], groupIndex, dividerLI);
                            }
                            __finishGroup(groupIndex);
                        }
                    } else {
                        groupMembers.forEach(
                                /* Element callback. */
                                        function (groupRow) {
                                            groupIndex = __renderGroupRow(groupRow, groupIndex, dividerLI);
                                        },
                                        /* On start. */
                                                function (ct) {
                                                    if (ct === 0) {
                                                        __renderEmptyGroup(dividerLI);
                                                    } else {

                                                    }
                                                },
                                                /* On done. */
                                                        function () {
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
                // Not grouped
                if (_self._renderRowMarkup(LIs, curRow, _self.displayList.length)) {
                    _self.displayList.push(curRow);
                    oncomplete();
                    return true;
                }
                oncomplete();
                return false;
            }
        },
        refreshHandlers: function () {
            if (Helix.hasTouch) {
                this._installTouchActionHandlers();
            } else {
                this._installNoTouchActionHandlers();
            }
        },
        _handleClick: function (event, target) {
            if ($(target).is('.ui-li-divider')) {
                return false;
            }
            if (this.refreshInProgress) {
                $(this.$parent).one('refreshdone', [this, event, target], function (ev) {
                    ev.data[0]._handleClick(ev.data[1], ev.data[2]);
                });
                return;
            }

            if (this.options.multiSelect && event.clientX < 35 && $(target).is('.hx-multi-select-item')) {
                $(target).toggleClass("hx-selected");

                // Check to see if we have anything selected - if yes, show the clear button;
                // if not, hide it. Re-layout the page if we make a change.
                var selectedElems = this.getAllMultiSelectElements();
                if (selectedElems.length === 0) {
                    this.$clearSelectionDiv.addClass('hx-toggled');
                    this.$searchSortDiv.removeClass('hx-toggled');
                } else {
                    this.$clearSelectionDiv.removeClass('hx-toggled');
                    this.$searchSortDiv.addClass('hx-toggled');
                }
            } else {
                if (this.setSelected(target)) {
                    if ($(target).is('a[data-role="splitlink"]')) {
                        if (this.options.splitAction) {
                            this.options.splitAction(this.selected, this.selectedGroup, this.strings);
                        } else {
                            this._runContextAction(target);
                        }
                    } else {
                        this.selectItem();
                    }
                }
            }

            return false;
        },
        _handleTap: function (event) {
            event.stopImmediatePropagation();

            if (this.options.itemContextMenu && this.options.itemContextMenu.active) {
                return false;
            }

            var touch = event.changedTouches[0];
            //var target = document.elementFromPoint(touch.clientX, touch.clientY);
            var target = event.target;
            target = $(target).closest('li.hx-li,a[data-role="splitlink"],li[data-overflow="1"]');
            if (target.length === 0) {
                return false;
            }

            return this._handleClick(touch, target);
        },
        _queueTap: function (ev) {
            if (this._nextTapTimer) {
                clearTimeout(this._nextTapTimer);
            }
            if (ev) {
                if (this._longTouchTimer) {
                    clearTimeout(this._longTouchTimer);
                    this._longTouchTimer = null;
                    this._longTapAction = null;
                }
                if (this._longTouchReadyTimer) {
                    clearTimeout(this._longTouchReadyTimer);
                    this._longTouchReadyTimer = null;
                }
                this._nextTapAction = $.proxy(function () {
                    if (this.list._handleTap(this.data) === false) {
                        this.data.preventDefault();
                        this.data.stopPropagation();
                    }
                }, {
                    list: this,
                    data: ev
                });
            }
            this._nextTapTimer = setTimeout(function (list) {
                if (list._nextTapAction) {
                    list._nextTapAction();
                    list._nextTapAction = false;
                }
            }, 0, this);
        },
        _runContextAction: function (_tgtDiv) {
            this.setSelected(_tgtDiv);
            if (!this.options.itemContextMenuFilter || this.options.itemContextMenuFilter(this.selected)) {
                var extraArgs = this.options.itemContextMenuArgs ? this.options.itemContextMenuArgs : [];
                this.options.itemContextMenu.open({
                    positionTo: _tgtDiv,
                    thisArg: this,
                    extraArgs: extraArgs.concat([this.selected])
                });
            }
        },
        _queueLongTap: function (ev) {
            if (this._longTouchTimer) {
                clearTimeout(this._longTouchTimer);
            }
            if (ev) {
                this._longTapAction = $.proxy(function () {
                    var _yDiff = this.list.$listWrapper.scrollTop() - this.list._lastScrollTop;
                    if (Math.abs(_yDiff) > 10) {
                        // Scrolled too much
                        return;
                    }

                    var touch = this.data.changedTouches[0];
                    var _tgt = document.elementFromPoint(touch.clientX, touch.clientY);
                    var _tgtDiv = $(_tgt).closest('li.hx-li');
                    if (_tgtDiv.length) {
                        this.list._runContextAction(_tgtDiv);
                    }
                }, {
                    list: this,
                    data: ev
                });
            }
            this._longTouchTimer = setTimeout(function (list) {
                list._longTouchTimer = null;
                if (list._longTapAction) {
                    list._longTapAction();
                    list._longTapAction = null;
                }
            }, 600, this);
        },
        _installNoTouchActionHandlers: function () {
            // Right-click
            if (this.options.itemContextMenu) {
                $(this.$listWrapper).off(this.contextEvent).on(this.contextEvent, 'li.ui-li', this, function (event) {
                    var _self = event.data;

                    // This allows the container to have taphold context menus that are not
                    // triggered when this event is triggered.
                    _self._runContextAction(event.target);
                    event.stopImmediatePropagation();
                    return false;
                });
            } else if (this.options.holdAction) {
                $(this.$listWrapper).off(this.contextEvent).on(this.contextEvent, 'li.ui-li', this, function (event) {
                    var _self = event.data;
                    if (_self.setSelected(event.target)) {
                        _self.selectItem(true);
                    }
                    _self.options.holdAction(_self.selected, _self.selectedGroup, _self.options.strings);
                    _self._cancelNextTap = true;

                    event.stopImmediatePropagation();
                    return false;
                });
            }

            // Click
            if (this.options.selectAction) {
                $(this.$listWrapper).off(this.tapEvent).on(this.tapEvent, '.hx-li,a[data-role="splitlink"]', this, function (event) {
                    var _self = event.data;
                    var _tgt = $(event.target).closest('li.hx-li,a[data-role="splitlink"]');
                    if (_tgt.length) {
                        event.stopImmediatePropagation();
                        return _self._handleClick(event, _tgt);
                    }
                });
                $(this.$listWrapper).on('vclick', function (event) {
                    // Stop propagation, otherwise the issues with Safari's touchstart targeting mean that we end up making >1
                    // list item highlighted active. We handle all of the active highlighting in the datalist class.
                    event.noButtonSelect = true;
                });
            }
        },
        _installTouchActionHandlers: function () {
            var _self = this;

            // Tap-hold
            if (this.options.holdAction) {
                $(this.$listWrapper).off(this.contextEvent).on(this.contextEvent, 'li.ui-li', this, function (event) {
                    var _self = event.data;
                    if (_self.setSelected(event.target)) {
                        _self.selectItem(true);
                    }
                    _self.options.holdAction.call(_self, _self.selected, _self.selectedGroup, _self.options.strings);
                    _self._cancelNextTap = true;

                    event.stopImmediatePropagation();
                    return false;
                });
            } else if (this.options.doThisFilter) {
                $(this.$listWrapper).off(this.contextEvent).on(this.contextEvent, 'li.ui-li', this, function (event) {
                    var _self = event.data;
                    if (_self.setSelected(event.target)) {
                        _self.selectItem(true);
                    }
                    _self.displayFilterMenu();
                    _self._cancelNextTap = true;

                    event.stopImmediatePropagation();
                    return false;
                });
            }

            // Tap
            if (this.options.selectAction) {
                /* Suppress tap and vclick so they don't propagate below this list. */
                $(this.listWrapper).off('tap vclick').on('tap vclick', 'a[data-role="splitlink"],.hx-li', function (ev) {
                    ev.stopImmediatePropagation();
                    return false;
                });

                /*$(this.$listWrapper).off(this.tapEvent).on(this.tapEvent, 'li,a[data-origin="splitlink"]', this, function(event) {
                 var _self = event.data;
                 var _tgt = $(event.target).closest('li,a[data-origin="splitlink"]');
                 if (_tgt.length) {
                 return _self._handleTap(event, _tgt);
                 }
                 });*/
                this.$listWrapper[0].addEventListener('touchstart', function (ev) {
                    _self._tapInstant = new Date().getTime();
                    _self._lastScrollTop = _self.$listWrapper.scrollTop();
                    _self._lastTapX = ev.changedTouches[0].clientX;
                    _self._lastTapY = ev.changedTouches[0].clientY;
                    if (_self.options.itemContextMenu) {
                        _self._queueLongTap(ev);
                    }
                }, false);
                this.$listWrapper[0].addEventListener('touchmove', function (ev) {
                    var _xDiff = _self._lastTapX - ev.changedTouches[0].clientX;
                    if (Math.abs(_xDiff) > 10) {
                        if (_self._longTouchTimer) {
                            clearTimeout(_self._longTouchTimer);
                            _self._longTouchTimer = null;
                        }
                    }
                });
                this.$listWrapper[0].addEventListener('touchend', function (ev) {
                    var _now = new Date().getTime();
                    var _tDiff = _now - _self._tapInstant;
                    var _yDiff = _self.$listWrapper.scrollTop() - _self._lastScrollTop;
                    var _xDiff = _self._lastTapX - ev.changedTouches[0].clientX;
                    var _yTouchDiff = _self._lastTapY - ev.changedTouches[0].clientY;
                    if (Math.abs(_yDiff) > 10 || Math.abs(_xDiff) > 10 || Math.abs(_yTouchDiff) > 10) {
                        if (_self._nextTapTimer) {
                            clearTimeout(_self._nextTapTimer);
                            _self._nextTapTimer = null;
                        }
                        // The finger moved too much ...
                        return;
                    }
                    if (_tDiff > 600) {
                        return;
                    }
                    if (_self._longTouchTimer) {
                        clearTimeout(_self._longTouchTimer);
                        _self._longTouchTimer = null;
                    }
                    _self._queueTap(ev);
                }, false);
                this.$listWrapper[0].addEventListener('scroll', function (ev) {
                    if (_self._nextTapTimer) {
                        //_self._queueTap();
                        clearTimeout(_self._nextTapTimer);
                    }
                    if (_self._longTouchTimer) {
                        clearTimeout(_self._longTouchTimer);
                    }
                }, false);
                $(this.$listWrapper).on('vclick', function (event) {
                    // Stop propagation, otherwise the issues with Safari's touchstart targeting mean that we end up making >1
                    // list item highlighted active. We handle all of the active highlighting in the datalist class.
                    event.noButtonSelect = true;
                    event.stopImmediatePropagation();
                    return false;
                });
            }

            if (this.options.swipeLeftAction) {
                this.$listWrapper.off('swipeleft').on('swipeleft', '.hx-li', this, function (event) {
                    var _self = event.data;
                    event.stopImmediatePropagation();

                    _self.setSelected(event.target);
                    _self.options.swipeLeftAction.call(_self, _self.selected);
                    return false;
                });
            }
            if (this.options.swipeRightAction) {
                $(this.$listWrapper).off('swiperight').on('swiperight', '.hx-li', this, function (event) {
                    var _self = event.data;
                    event.stopImmediatePropagation();

                    _self.setSelected(event.target);
                    _self.options.swipeRightAction.call(_self, _self.selected);
                    return false;
                });
            }
        },
        _renderGroupRowMarkup: function (LIs, row, rowIndex, groupIndex, renderer, groupStart, group) {
            var _self = this;
            var curRowParent = null;
            var curRowFresh = false;

            if (groupIndex < LIs.length) {
                curRowParent = $(LIs[groupIndex]);
            }

            if (!curRowParent) {
                curRowFresh = true;
                curRowParent = $('<li />').attr({
                    'class': _self.options.rowStyleClass + ' ui-li hx-li hx-flex-horizontal'
                });
            }

            curRowParent.attr('data-group', rowIndex);
            curRowParent.attr('data-selected', '0');

            if (!renderer) {
                renderer = _self.options.rowRenderer;
            }
            var rendererContext = _self.options.rowRendererContext ? _self.options.rowRendererContext : _self;
            if (renderer.call(rendererContext, curRowParent, _self, row, rowIndex, _self.options.strings)) {
                if (curRowFresh) {
                    if (LIs.length > 0) {
                        curRowParent.insertAfter(LIs[LIs.length - 1]);
                    } else {
                        curRowParent.insertAfter(groupStart);
                    }
                    LIs.push(curRowParent);
                } else {
                    curRowParent.show();
                }
            } else {
                return false;
            }
            curRowParent.data('group', group);
            curRowParent.data('data', row);
            return true;
        },
        _renderRowMarkup: function (LIs, row, rowIndex, attachFn) {
            var _self = this;
            var curRowParent = null;
            var curRowFresh = false;

            if (rowIndex < LIs.length) {
                curRowParent = $(LIs[rowIndex]);
            }

            if (!curRowParent) {
                curRowFresh = true;
                curRowParent = $('<li />').attr({
                    'class': _self.options.rowStyleClass + ' ui-li hx-li hx-flex-horizontal'
                });
            }

            if (_self.options.grouped) {
                curRowParent.attr('data-group', rowIndex);
            }
            curRowParent.attr('data-selected', '0');

            var rendererContext = _self.options.rowRendererContext ? _self.options.rowRendererContext : _self;
            if (_self.options.rowRenderer.call(rendererContext, curRowParent, _self, row, rowIndex, _self.options.strings)) {
                if (curRowFresh) {
                    if (!attachFn) {
                        curRowParent.appendTo(_self.$parent);
                        _self.displayLIs.push(curRowParent[0]);
                    } else {
                        attachFn(curRowParent);
                    }
                } else {
                    curRowParent.show();
                    _self.displayLIs.push(curRowParent[0]);
                }
            } else {
                return false;
            }
            curRowParent.data('data', row);
            return true;
        },
        rerenderSelected: function () {
            if (this.selected === null) {
                return;
            }
            var renderer = this.options.rowRenderer;
            if (this.options.grouped) {
                renderer = this.options.groupRenderer(this.selectedGroup);
            }

            var rendererContext = this.options.rowRendererContext ? this.options.rowRendererContext : this;
            if (renderer.call(rendererContext, this.selectedLI, this, this.selected, this.selectedIndex, this.options.strings)) {
                this.selectedLI.show();
                return true;
            } else {
                this.selectedLI.hide();
                return false;
            }
        },
        setSelected: function (targetElem) {
            var enclosingLI = $(targetElem).closest("li");
            var nxtSelection = $(enclosingLI).data('data');
            if (this.options.grouped) {
                this.selectedGroup = $(enclosingLI).data('group');
            }
            if (this.selectedGroup) {
                var isOverflow = $(enclosingLI).attr('data-overflow');
                if (Number(isOverflow) === 1) {
                    // Overflow
                    this.options.groupOverflowFn.call(this, this.selectedGroup);
                    return false; // so that normal click handlers are not invoked.
                }
            }

            this.$listWrapper.find('.ui-btn-active').removeClass('ui-btn-active');
            /*if (this.selectedLI) {
             this.selectedLI.removeClass('ui-btn-active');
             }*/
            this.selectedLI = enclosingLI;
            this.selectedLI.addClass('ui-btn-active');
            this.selected = nxtSelection;

            return true;
        },
        getSelected: function () {
            return this.selected;
        },
        clearSelected: function () {
            if (this.selected) {
                this.selectedLI.removeClass('ui-btn-active');
                this.selectedLI = null;
                this.selected = null;
                this.selectedGroup = null;
            }
        },
        clearSearchSort: function () {
            this.options.indexedSearch = null;
            this.options.localIndexedSearch = null;
            this.options.indexedSearchText = null;
            this.options.onSearchClear = null;
            this.options.afterSearchClear = null;

            this._searchSortDirty = true;
        },
        getSelectedLI: function () {
            return this.selectedLI;
        },
        _getFirstDataLI: function () {
            var _first = null;
            $.each($(this.$wrapper).find('li'), function (idx, li) {
                var obj = $(li).data('data');
                if (obj) {
                    _first = li;
                    return false;
                }
                return true;
            });

            return _first;
        },
        _getLastDataLI: function () {
            var _last = null;
            var LIs = $(this.$wrapper).find('li');
            for (var i = LIs.length - 1; i >= 0; --i) {
                var li = LIs[i];
                var obj = $(li).data('data');
                if (obj) {
                    _last = li;
                    break;
                }
            }
            return _last;
        },
        // Select the very first item in the list.
        selectFirst: function () {
            var _self = this;
            $.each($(this.$wrapper).find('li'), function (idx, li) {
                var obj = $(li).data('data');
                if (obj) {
                    _self.setSelected(li);
                    return false;
                }
                return true;
            });
        },
        getSelectedRow: function () {
            return this.selectedIndex;
        },
        getSelectedGroupRow: function () {
            return this.selectedGroupRow;
        },
        updateSelectedRow: function (rowComponents) {
            var parentElement = this.getSelectedLI();
            if (rowComponents.icon) {
                var oldIcon = $(parentElement).attr('data-icon');
                $(parentElement).attr('data-icon', rowComponents.icon);
                $(parentElement).find('span.ui-icon')
                        .removeClass('ui-icon-' + oldIcon)
                        .addClass('ui-icon-' + rowComponents.icon);
            }
            if (rowComponents.updateFn) {
                rowComponents.updateFn.call(this, parentElement);
            }
        },
        getAllMultiSelectElements: function () {
            return $(this.element).find('li.hx-selected[data-deleted!="true"]');
        },
        getAllMultiSelectItems: function () {
            var ret = [];
            $(this.element).find('li.hx-selected[data-deleted!="true"]').each(function () {
                ret.push($(this).data('data'));
            });
            return ret;
        },
        clearAllMultiSelect: function () {
            $(this.element).find('li.hx-selected').removeClass('hx-selected');
            this.$clearSelectionDiv.addClass('hx-toggled');
            this.$searchSortDiv.removeClass('hx-toggled');
            Helix.Layout.layoutPage();
        },
        clearAllListRows: function () {
            this.$parent.empty();
        },
        _findRowComponents: function (elem, components) {
            var roleAttr = elem.getAttribute('data-role');
            if (roleAttr) {
                components[roleAttr] = $(elem);
                if (roleAttr !== 'bodyParent') {
                    return;
                }
            }
            for (var i = 0; i < elem.children.length; ++i) {
                this._findRowComponents(elem.children[i], components);
            }
        },
        createListRow: function (parentElement, rowComponents, rowID) {
            var components = {};
            var lastComponent = null;
            this._findRowComponents(parentElement[0], components);

            // Hide the parent to avoid contant recomputation of the DOM.
            //parentElement[0].style.display = 'none';
            if (this.options.multiSelect) {
                if (!rowComponents.disableMultiSelect) {
                    //$(parentElement).addClass('hx-multi-select-item');
                    if ('multiselect' in components) {
                        $(components['multiselect']).show();
                        lastComponent = $(components['multiselect']);
                    } else {
                        lastComponent = $('<div/>').attr({
                            'data-role': 'multiselect',
                            'class': 'hx-multi-select-parent'
                        }).append($('<div/>').attr({
                            'class': 'hx-multi-select-button'
                        }));
                        $(parentElement).prepend(lastComponent);
                    }
                    parentElement.addClass('hx-multi-select-item');
                } else if ('multiselect' in components) {
                    $(components['multiselect']).hide();
                    parentElement.removeClass('hx-multi-select-item');
                }
            }

            var oldPfx = components.prefix;
            if (rowComponents.prefix) {
                if (oldPfx /*oldPfx.length*/) {
                    oldPfx.replaceWith(rowComponents.prefix.attr('data-role', 'prefix'));
                } else {
                    var pfx = rowComponents.prefix.attr('data-role', 'prefix');
                    if (lastComponent) {
                        pfx.insertAfter(lastComponent);
                    } else {
                        parentElement.append(pfx);
                        lastComponent = pfx;
                    }
                }
            } else if (oldPfx) {
                oldPfx.hide();
            }

            var bodyParent = components.bodyParent;
            if (!bodyParent) {
                bodyParent = $('<div />').attr({
                    'data-role': 'bodyParent',
                    'class': 'hx-flex-fill'
                }).appendTo(parentElement);
            }
            lastComponent = bodyParent;

            var headerMarkup = components.itemheader;
            if (rowComponents.header) {
                //var headerMarkup = mainLink.find('h3[data-role="itemheader"]');
                if (Object.prototype.toString.call(rowComponents.header) === '[object String]') {
                    if (headerMarkup /*headerMarkup.length*/) {
                        headerMarkup.text(Helix.Utils.escapeQuotes(rowComponents.header)).show();
                    } else {
                        var hdr = $('<h3 />')
                                .attr('data-role', 'itemheader')
                                .text(Helix.Utils.escapeQuotes(rowComponents.header));
                        bodyParent.prepend(hdr);
                    }
                } else {
                    var hdr = rowComponents.header.attr('data-role', 'itemheader');
                    if (headerMarkup /*headerMarkup.length*/) {
                        headerMarkup.replaceWith(hdr).show();
                    } else {
                        bodyParent.prepend(hdr);
                    }
                }
            } else if (headerMarkup) {
                headerMarkup.hide();
            }

            var bodyMarkup = components.body;
            if (rowComponents.body) {
                var body = rowComponents.body.attr('data-role', 'body');
                if (bodyMarkup) {
                    bodyMarkup.replaceWith(body).show();
                } else {
                    bodyParent.append(body);
                }
            } else if (bodyMarkup) {
                bodyMarkup.hide();
            }

            if (rowComponents.key) {
                $(parentElement).attr('data-key', rowComponents.key);
            }

            var splitLink = components.splitlink;
            if (rowComponents.splitLink) {
                var _newSplit = Helix.Layout.makeIconButton(rowComponents.splitLink).attr('data-role', 'splitlink').addClass('hx-splitview-link');
                if (splitLink) {
                    splitLink.replaceWith(_newSplit);
                } else {
                    _newSplit.insertAfter(lastComponent);
                }
            } else if (splitLink) {
                $(splitLink).hide();
            }

            if (rowID) {
                $(parentElement).attr('data-id', rowID);
            } else {
                $(parentElement).removeAttr('data-id');
            }
            //parentElement[0].style.display = '';
            return parentElement;
        },
        selectItem: function (noSelectAction) {
            if (!this.selected) {
                this.selectFirst();
            }
            if (this.options.selectAction && !noSelectAction) {
                if (this.options.itemContextMenuArgs) {
                    var allArgs = [this.selected, this.selectedGroup, this.strings].concat(this.options.itemContextMenuArgs)
                    this.options.selectAction.apply(this, allArgs);
                } else {
                    this.options.selectAction.call(this, this.selected, this.selectedGroup, this.strings);
                }
            }
        },
        selectNext: function (noSelectAction) {
            if (!this.selectedLI) {
                this.selectFirst();
                this.selectItem(noSelectAction);
                return true;
            } else {
                var nxt = this.selectedLI;
                do {
                    nxt = nxt.next();
                } while (nxt.is('li') && (!nxt.data('data') || nxt.is('li[data-deleted="true"]')));
                if (nxt.length) {
                    this.setSelected(nxt);
                    this.selectItem(noSelectAction);
                    return true;
                }
            }
            return false;
        },
        selectPrev: function (noSelectAction) {
            if (!this.selectedLI) {
                this.selectFirst();
                this.selectItem(noSelectAction);
                return true;
            } else {
                var prev = this.selectedLI;
                do {
                    prev = prev.prev();
                } while (prev.is('li') && (!prev.data('data') || prev.is('li[data-deleted="true"]')));
                if (prev.length) {
                    this.setSelected(prev);
                    this.selectItem(noSelectAction);
                    return true;
                }
            }
            return false;
        },
        holdItem: function () {
            if (!this.selected) {
                this.selectFirst();
            }
            this.options.holdAction.call(this, this.selected, this.selectedGroup, this.strings);
        },
        /* Display sort and filter menus. */
        displaySortMenu: function (selector) {
            this._sortContainer.popup('open', {positionTo: selector});
        },
        displayFilterMenu: function (selector) {
            this._filterContextMenu.open({
                positionTo: selector
            });
        },
        displayGlobalFilterMenu: function (selector) {
            this._globalFilterContainer.popup('open', {positionTo: selector});
        },
        setWrapperHeight: function (hgt) {
            this.$wrapper.height(hgt);
        },
        /**
         * Refresh the scroller surrounding the datalist contents.
         */
        scrollToStart: function () {
            // Prevent pagination
            var _self = this;
            this._setScrollTimer(function () {
                _self.$listWrapper.scrollTop(0);
            });
        },
        /**
         * Set the scroll position of the list element.
         * 
         * @param {int} pos
         * @returns {undefined}
         */
        setScrollPosition: function (pos) {
            // Prevent pagination
            var _self = this;
            this._setScrollTimer(function () {
                _self.$listWrapper.scrollTop(pos);
            });
        },
        /**
         * Return the current scroll position of the list element. This is particularly useful when you want
         * to later restore the scroll position using setScrollPosition.
         * 
         * @returns {int}
         */
        getScrollPosition: function () {
            return this.$listWrapper.scrollTop();
        },
        /**
         * In a paginated list, return the index of the first data element that is visible. In non-paginated lists this is always 0.
         * 
         * @returns {int}
         */
        getRenderWindowStart: function () {
            return this._renderWindowStart;
        },
        /**
         * In a paginated list, set the start of the render window, which determines which element is visible at the very top of the list.
         * Note that this function does not refresh the list ... it is intended to be called prior to a call to refreshData/refreshList.
         * 
         * @param {int} start
         * @returns {undefined}
         */
        setRenderWindowStart: function (start) {
            this._renderWindowStart = start;
        },
        setHeaderText: function (txt) {
            this.options.headerText = txt;
        },
        startLoading: function (text) {
            var loader = $('<div/>').addClass('hx-datalist-loading')
                    .append($('<div/>').addClass('hx-datalist-loading-bar'))
                    .append($('<div/>').addClass('hx-datalist-loading-bar'))
                    .append($('<div/>').addClass('hx-datalist-loading-bar'))
                    .append($('<div/>').addClass('hx-datalist-loading-bar'));

            if (!text) {
                text = this.options.footerLoadingText;
            }

            if (text) {
                loader = $('<div/>').addClass('hx-datalist-loading-parent')
                        .append(loader)
                        .append($('<div/>').addClass('hx-datalist-loading-text').append(text));
            }
            this._restoreFooter = this.$footerSection.children();
            this.setFooterContents(loader);
        },
        stopLoading: function () {
            this.setFooterContents(this._restoreFooter);
            this.$footerSection.find('.hx-datalist-loading,.hx-datalist-loading-parent').remove();
        },
        setFooterContents: function (contents) {
            this.$footerSection.empty();
            if (contents) {
                this.$footerSection.append(contents);
                this.$footerSection.show();
            }
        },
        hideFooter: function () {
            this.$footerSection.hide();
        },
        openItemContextMenu: function () {
            this.options.itemContextMenu.open();
        },
        closeItemContextMenu: function () {
            this.options.itemContextMenu.close();
        },
        /**
         * Returns true after the first time the list has been loaded and laid out.
         */
        getIsLoaded: function () {
            return this.isLoaded;
        },
        /**
         * Reset the isLoaded flag.
         */
        clearIsLoaded: function () {
            this.isLoaded = false;
        },
        /**
         * Update the value of the 'noSelectOnPagination' option.
         */
        setNoSelectOnPagination: function (val) {
            this.options.noSelectOnPagination = val;
        },
        /**
         * Get the ul element of the list.
         */
        getListElement: function () {
            return this.$parent;
        },
        /**
         * Clear the contents of the indexedSearch text box.
         * 
         * @returns {undefined}
         */
        _clearSearchText: function () {
            if (this.$searchBox) {
                this.$searchBox.val(this.options.indexedSearchText ? this.options.indexedSearchText : '');
                this.__searchClear = true;
            }
            this.__searchText = '';
        },
        clearSearchText: function () {
            this._clearSearchText();
            if (this.$searchBox) {
                this.$searchBox.blur();
            }
        },
        hideList: function () {
            this.$wrapper.hide();
        },
        showList: function () {
            this.$wrapper.show();
        },
        /**
         * Mark the list dirty. The dirty flag persists until the list is refreshed either
         * with refreshList or refreshData. This flag is primarily used for debugging.
         */
        markListDirty: function () {
            this.isDirty = true;
        },
        /**
         * Return the isDirty flag.
         */
        listIsDirty: function () {
            return this.isDirty;
        },
        getCurrentSort: function () {
            return {
                sortBy: this._currentSort,
                direction: this._currentSortOrder,
                usecase: this._currentSortCase
            };
        },
        setCurrentSort: function (jsonSort, doRefresh) {
            var sort = jsonSort;
            if (Helix.Utils.isString(sort)) {
                sort = JSON.parse(sort);
            }

            var oldOrder = this._currentSortOrder;
            var oldSort = this._currentSort;
            var oldSortCase = this._currentSortCase;
            var newSort = (sort.sortBy ? sort.sortBy : oldSort);
            var newOrder = (sort.direction ? sort.direction : oldOrder);
            var newCase = (sort.usecase ? sort.usecase : oldSortCase);

            if ((oldSort !== newSort) ||
                    (oldOrder !== newOrder) ||
                    (oldSortCase !== newCase)) {
                var _self = this;
                var __sortUpdateDone = function () {
                    _self._currentSort = newSort;
                    _self._currentSortOrder = newOrder;
                    _self._currentSortCase = newCase;
                    if (_self.isLoaded) {
                        _self.__refreshSortContainer();
                        _self._updateSortButtons();
                    }
                };

                if (doRefresh === true) {
                    _self._refreshData(function () {
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
        getListHeader: function () {
            return this.$headerSection;
        },
        /**
         * Overlay content on top of the header section.
         */
        overlayHeader: function (markup) {
            this.restoreHeaderMarkup = this.$headerSection.children();
            this.restoreHeaderMarkup.detach();
            this.$headerSection.append(markup);
        },
        restoreHeader: function () {
            if (this.restoreHeaderMarkup) {
                this.$headerSection.empty();
                this.$headerSection.append(this.restoreHeaderMarkup);
                this.restoreHeaderMarkup = null;
            }
        },
        /**
         * Return the options object.
         */
        getOptions: function () {
            return this.options;
        },
        /**
         * Return the query collection of the data we are showing in the list. 
         */
        getItemList: function () {
            return this.itemList;
        },
        /**
         * Return the width of the list.
         */
        getListWidth: function () {
            return this.$listWrapper.width();
        },
        /**
         * Refresh the listview component that is the rendering of the data list.
         */
        refreshListView: function () {
            //this.$parent.listview("refresh");
        },
        /**
         * Re-render the list view if some attributes of the underlying data have changed (but not
         * the data set itself).
         */
        renderListView: function (oncomplete) {
            var _self = this;
            this._sortAndRenderData(this.itemList, function (finalCompletion) {
                if (finalCompletion) {
                    finalCompletion();
                }
                _self._refreshDividers();
            }, this.options.emptyMessage, oncomplete, true, this.extraItems, _self.options);
        },
        markDeleted: function (elems) {
            //$(elems).hide(400, 'linear');
            $(elems).attr('data-deleted', 'true');
            $(elems).addClass('hx-deleted');
        },
        confirmDeleted: function (elems) {
            $(elems).remove();
        },
        clearDeleted: function (elems) {
            $(elems).attr('data-deleted', '').removeClass('hx-deleted');
            this.refreshListView();
        },
        equals: function(other) {
            return this.dataListID === other.dataListID;
        }

    });
})(jQuery);
