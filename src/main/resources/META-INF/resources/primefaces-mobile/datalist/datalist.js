/**
 * jQuery Mobile datalist wrapper.
 */
PrimeFaces.widget.DataList = PrimeFaces.widget.BaseWidget.extend({
    
    init: function(cfg) {
        this._super(cfg);
        
        this.rowStyleClass = this.cfg.rowStyleClass;
        
        // ID of the datalist component.
        this.id = this.cfg.id;
        this.jqID = PrimeFaces.escapeClientId(this.id);
        
        // Is this list grouped?
        this.grouped = this.cfg.grouped;
        if (this.grouped) {
            // Save the getters for the group name and group members.
            this.groupName = this.cfg.groupName;
            this.groupMembers = this.cfg.groupMembers;
        }

        // Column setup.
        this.currentPage = 0;
        this.itemsPerPage = this.cfg.itemsPerPage;
    
        this.paginatorTemplate = this.cfg.paginatorTemplate;
        this.paginatorId = this.cfg.id + '_paginator';
        this.renderer = this.cfg.rowRenderer;
        this.itemContextMenu = this.cfg.itemContextMenu;
        this.emptyMessage = this.cfg.emptyMessage;
        this.rowStyleClass = this.cfg.rowStyleClass;
        this.dividerStyleClass = this.cfg.dividerStyleClass;
        this.selectAction = this.cfg.selectAction;
        this.holdAction = this.cfg.holdAction;
        
        // Set context menu event to taphold for touch devices, dblclick for none-touch.
        if (Helix.hasTouch) {
            this.contextEvent = 'taphold';
        } else {
            this.contextEvent = 'dblclick';
        }
        
        // Search
        this.isIndexedSearch = this.cfg.indexedSearch;
        
        // Default sort.
        this.sortBy = this.cfg.sortBy;
        this.sortOrder = this.cfg.sortOrder.toUpperCase();
        this.onSortChange = null;
        
        if (!this.emptyMessage) {
            this.emptyMessage = "There are no items to display.";
        }
        if (!this.emptyGroupMessage) {
            this.emptyGroupMessage = "There are no items to display in this group.";
        }
        if (this.cfg.strings) {
            this.strings = this.cfg.strings.split(",");            
        }
        
        // Number of elements in the list.
        this.nElems = 0;
        
        this.$parent = $(this.jqID);
        this.$parent.listview();
        this.refreshList(this.cfg.itemList,this.cfg.condition);
    },
    refresh: function(cfg) {
        /* This is called automatically at the end of AJAX loads. We do not want to
         * do anything here.
         */
    },
    refreshList: function(list,condition,sorts,filters,oncomplete) {
        if (!list) {
            return;            
        }
        
        if ((condition !== undefined) &&
            !condition) {
            /* The condition is false. Remove this entirely from the DOM. */
            this.$parent.hide();
            return;
        } else {
            this.$parent.show();
        }
        this.sorts = sorts;
        if (this.sorts) {
            this.refreshSortContainer();
        }
        this.filters = filters;
        this.refreshPaginatorContainer();
        var _self = this;
        this.dbList = list;
        this.refreshData(list, this.sortBy, this.sortOrder, function() {
            if (_self.nElems == 0) {
                _self.$parent.empty();
                _self.$parent.append($('<li />').append(_self.emptyMessage));
            }
            $(_self.jqID).listview( "refresh" );
            if (oncomplete) {
                oncomplete(_self);            
            }
        });
    },
    refreshSortContainer: function() {
        if (this.sorts) {
            var menuID = this.id + "_sortMenu";
            this.sortMenuID = PrimeFaces.escapeClientId(menuID);
            var _self = this;
            /* Remove the old context menu ... */
            _self.$parent.parent().find(this.sortMenuID).remove();
            
            var sortMenuContainer = $('<div/>').attr({
                'data-role' : 'popup',
                'id' : menuID,
                'data-theme' : 'a',
                'data-position-to' : 'origin',
                'data-history': 'false'
            }).insertAfter(_self.$parent);
            var sortsList = $('<ul />').attr({ 
                'data-role' : 'listview',
                'data-inset' : 'true',
                'data-theme' : 'b'
            }).appendTo(sortMenuContainer);
            for (var sortFld in _self.sorts) {
                if (_self.sorts[sortFld] !== "[none]") {
                    var sortItem = $('<li />').append($('<a />').attr({ 
                        'href' : 'javascript:void(0)',
                        'data-field': sortFld
                    }).append(_self.sorts[sortFld]));
                    $(sortsList).append(sortItem);
                    $(sortItem).on('tap', function(evt) {
                        evt.stopImmediatePropagation();                        
                        var newSortField = $(evt.target).attr('data-field');
                        if (newSortField == _self.sortBy) {
                            if (_self.sortOrder === "ASCENDING") {
                                _self.sortOrder = "DESCENDING";
                            } else {
                                _self.sortOrder = "ASCENDING";
                            }
                        } else {
                            _self.sortBy = newSortField;
                            _self.sortOrder = "ASCENDING";
                        }
                        if (_self.nElems == 0) {
                            /* Nothing to do. */
                            return;
                        }
                        if (_self.onSortChange) {
                            _self.onSortChange(_self.sortBy, _self.sortOrder);
                        }
                        
                        _self.refreshData(_self.dbList, _self.sortBy, _self.sortOrder, function() {
                            $(_self.jqID).listview( "refresh" );
                        });
                    });
                }
            }
            $(sortMenuContainer).trigger("create");
            $(sortMenuContainer).popup();
        }
    },
    refreshPaginatorContainer: function() {
        if (!this.itemsPerPage || !this.paginatorTemplate) {
            return;
        }
        
        var paginatorContainer = $(PrimeFaces.escapeClientId(this.paginatorId));
        if (paginatorContainer.length == 0) {
            paginatorContainer = $('<div />').attr({
                'id' : this.paginatorId,
                'class': Helix.Utils.paginator.PAGINATOR_TOP_CONTAINER_CLASS
            }).insertBefore(this.$parent);
        } else {
            // Clear out all children of the paginator so that we can refresh it.
            $(paginatorContainer).empty();
        }
        var parent = this;
        $.each(this.paginatorTemplate.split(" "), function(idx, obj) {
            Helix.Utils.paginator.render(obj, paginatorContainer, {
                'page' : parent.currentPage,
                'totalItems' : parent.list.length,
                'itemsPerPage' : parent.itemsPerPage,
                'nextPage' : parent.nextPage,
                'prevPage' : parent.prevPage,
                'owner' : parent
            });
        });
    },
    refreshData: function(list, orderby, direction, oncomplete) {
        var _self = this;
        var toRemove = _self.$parent.find("li").filter(":not(li[data-fixed-header='yes'])");
        toRemove.remove();
        _self.$parent.find('[data-role="fieldcontain"]').remove();
        
        _self.itemList = [];
        
        /* Generate the actual data for the current page. */            
        var startElem = 0;
        var endElem;
        var limitCt;
        var rowIndex = 0;
        var doneCt = 0;
        if (_self.itemsPerPage > 0) {
            startElem = _self.currentPage * _self.itemsPerPage;
            endElem = startElem + _self.itemsPerPage;
            if (endElem > _self.itemList.length) {
                endElem = _self.itemList.length;
            }
            limitCt = endElem - startElem;
        }

        if (_self.isIndexedSearch) {
            $(this.jqID + "_wrapper").prev(PrimeFaces.escapeClientId(this.cfg.id + "_searchwrapper")).remove();
            $('<div />').attr({
                'data-role' : 'fieldcontain',
                'id' : this.cfg.id + "_searchwrapper"
            }).append($('<label />').attr({
                'for' : this.cfg.id + '_search'
            })).append($('<input/>').attr({
                'type' : 'search',
                'name' : this.cfg.id + '_search',
                'id' : this.cfg.id + '_search',
                'value' : ''
            })).insertBefore($(this.jqID + "_wrapper"));
            $( PrimeFaces.escapeClientId(this.cfg.id + '_search') ).textinput();
        }

        if (_self.headerText) {
            $('<li />').attr({
                'data-role' : 'list-divider'
            }).append(_self.headerText)
            .appendTo(_self.$parent);
        }
        
        /* Determine if the itemList is a QueryCollection. */
        if (list && (Object.prototype.toString.call(list) === '[object Array]')) {
            var listIdx;
            if (!endElem) {
                endElem = list.length;
            }
            var listItem;
            _self.nElems = endElem - startElem;
            for (listIdx = startElem; listIdx < endElem; ++listIdx) {
                listItem = list[listIdx];
                _self.renderSingleRow(listItem, rowIndex, function() {
                    ++doneCt;
                    if (doneCt == _self.nElems) {
                        oncomplete();
                    }
                });
                ++rowIndex;
            }
        } else if (list && list.forEach) {
            var displayList;
            if (startElem > 0) {
                displayList = displayList.skip(_self.startElem);
            }
            if (limitCt) {
                displayList = displayList.limit(limitCt);                
            }
            if (orderby) {
                if (direction == "DESCENDING") {
                    displayList = list.order(orderby, false);
                } else {
                    displayList = list.order(orderby, true);
                }
            } else {
                displayList = list;
            }

            displayList.count(function(count) {
                _self.nElems = count;
                if (count == 0) {
                    oncomplete();
                } else {
                    displayList.each(function(curRow) {
                        _self.renderSingleRow(curRow, rowIndex, function() {
                            ++doneCt;
                            if (doneCt == _self.nElems) {
                                oncomplete();
                            }
                        });
                        ++rowIndex;
                    });
                }
            });
        } else if (list) {
            _self.nElems = 1;
            
            /* We are just rendering a single object. */
            _self.renderSingleRow(list, 0, oncomplete);
        } else {
            oncomplete();
        }
    },
    
    renderSingleRow: function(curRow, rowIndex, oncomplete) {
        var _self = this;
        if (this.grouped) {
            var rowObject = {
                'group': curRow, 
                'rows' : []
            };
            _self.itemList.push(rowObject);
          
            var groupName = this.groupName(rowObject.group);

            // Attach the group header.
            var dividerLI = $('<li />').attr({
                'data-role' : 'list-divider'
            }).append(groupName).appendTo(this.$parent);

            if (this.dividerStyleClass) {
                $(dividerLI).attr('class', this.dividerStyleClass);
            }

            var groupMembers = this.groupMembers(rowObject.group);
            var groupIndex = 0;
            var precedingElem = dividerLI;
            groupMembers.count(function(ct) {
                var groupSize = ct;
                if (groupSize > 0) {
                    groupMembers.forEach(function(groupRow) {
                        rowObject.rows.push(groupRow);
                        precedingElem = _self.renderRowMarkup(groupRow, rowIndex, precedingElem, groupIndex);
                        ++groupIndex;
                        if (groupIndex == groupSize) {
                            oncomplete();
                        }
                    });
                } else {
                    $('<li />').attr({
                        'class' : this.rowStyleClass
                    }).append(_self.emptyGroupMessage)
                        .insertAfter(precedingElem);
                    oncomplete();
                }
            });
        } else {
            _self.itemList.push(curRow);
            _self.renderRowMarkup(curRow, rowIndex);
            oncomplete();
        }  
    },
    
    renderRowMarkup: function(row, rowIndex, precedingElem, groupIndex) {
        var _self = this;
        var rowStyleClass = _self.rowStyleClass;
        
        var curRowParent = $('<li />').attr({
            'class' : rowStyleClass,
            'data-index' : rowIndex
        });
        var topRowParent = curRowParent;
        if (_self.grouped) {
            curRowParent.attr('data-group-index', groupIndex);
        }
        if (_self.selectAction || _self.holdAction) {
            curRowParent = $('<a />').attr({
                'href' : "javascript:void(0);"
            }).appendTo(curRowParent);
        }
        
        if (_self.renderer(curRowParent, _self, row, rowIndex, _self.strings)) {
            if (precedingElem) {
                topRowParent.insertAfter(precedingElem);
            } else {
                topRowParent.appendTo(_self.$parent);
            }
        }
            
        if (_self.itemContextMenu) {
            $(curRowParent).on(this.contextEvent, function(event) {
                // This allows the container to have taphold context menus that are not
                // triggered when this event is triggered.
                event.stopImmediatePropagation();
                _self.setSelected(event.target);
                $(PrimeFaces.escapeClientId(_self.itemContextMenu)).popup( "open", {
                    positionTo: event.target
                });
            });
        } 
        if (_self.selectAction) {
            $(curRowParent).on('tap', function(event) {
                _self.setSelected(event.target);
                _self.selectItem();
                event.stopPropagation();
            });
        }
        if (_self.holdAction) {
           $(curRowParent).on(this.contextEvent, function(event) {
                _self.setSelected(event.target);
                _self.holdItem();
                event.stopPropagation();
            }); 
        }
        
        return topRowParent;
    },
    
    setSelected: function(targetElem) {
        var enclosingLI = $(targetElem).closest("li[data-index]");
        if (this.selectedLI) {
            this.selectedLI.removeClass('ui-btn-active');
        }
        this.selectedLI = enclosingLI;
        this.selectedLI.addClass('ui-btn-active');
        
        this.selectedIndex = $(enclosingLI).attr('data-index');
        if (this.grouped) {
            this.selectedGroupRow = $(enclosingLI).attr('data-group-index');
            this.selected = this.itemList[this.selectedIndex].rows[this.selectedGroupRow];
            this.selectedGroup = this.itemList[this.selectedIndex].group;
        } else {
            this.selected = this.itemList[this.selectedIndex];
        }
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
        if (rowComponents.image) {
            $(parentElement).append('<img />').attr({
                'src' : rowComponents.image
            });
        }
        if (rowComponents.header) {
            $(parentElement).append($('<h3 />').append(rowComponents.header));
        }
        if (rowComponents.subHeader) {
            $(parentElement).append($('<p />')
                .append($('<strong />')
                    .append(rowComponents.subHeader)
                    )
                );
        }
        if (rowComponents.body && (rowComponents.header || rowComponents.subHeader)) {
            $(parentElement).append($('<p />').append(rowComponents.body));
        } else {
            $(parentElement).append(rowComponents.body);
        }
        if (rowComponents.aside) {
            $(parentElement).append($('<p />').attr({
                'class' : 'ui-li-aside'
            }).append(rowComponents.aside));
        }
    },
    
    selectItem: function() {
        if (!this.selected) {
            this.setSelectedByIndex(0, 0);
        }
        this.selectAction(this.selected, this.selectedGroup, this.strings);          
    },
    
    holdItem: function() {
        if (!this.selected) {
            this.setSelectedByIndex(0, 0);
        }
        this.holdAction(this.selected, this.selectedGroup, this.strings);          
    },
    
    /**
     * Applies events related to sorting in a non-obstrusive way
     */
    setupSortEvents: function(col) {
        var _self = this;

        $(PrimeFaces.escapeClientId(col.id))
        .on('tap', function(event) {
            var columnHeader = $(this),
            sortorder = columnHeader.data('sortorder'),
            sortfield = columnHeader.data('sortfield');
                
            if(sortorder === 'DESCENDING') {
                _self.itemList.order(sortfield, true);
                columnHeader.data('sortorder', 'ASCENDING');
            } else if(sortorder === 'ASCENDING') {
                _self.itemList.order(sortfield, 'DESCENDING');
                columnHeader.data('sortorder', 'DESCENDING');
            }
        })
        .data('sortfield', col.sortBy)
        .data('sortorder', col.sortOrder.toUpperCase());
    },
    
    /**
     * Clears table filters
     */
    clearFilters: function() {
        this.itemList = this.allItems;
        this.refreshData();
    },
    
    /**
     * Refresh the scroller surrounding the datalist contents.
     */
    refreshScroller: function() {
        Helix.Layout.updateScrollers($(this.jqID + "_wrapper"));
    }
});