/**
 * PrimeFaces DataTable Widget
 */
PrimeFaces.widget.DataTable = PrimeFaces.widget.BaseWidget.extend({
    
    init: function(cfg) {
        this._super(cfg);
        
        // Styles
        this.COLUMN_HEADER_CLASS = "ui-state-default";
        this.DATA_CLASS = "ui-datatable-data ui-widget-content";
        this.TABLE_ROW_CLASS = "ui-widget-content";
        this.TABLE_EVEN_ROW_CLASS = "ui-datatable-even";
        this.TABLE_ODD_ROW_CLASS = "ui-datatable-odd";
        this.TABLE_COLUMN_CLASS = "ui-dt-c";
        this.EMPTY_MESSAGE_ROW_CLASS = "ui-widget-content ui-datatable-empty-message";
        this.HEADER_CLASS = "ui-datatable-header ui-widget-header";
        this.FOOTER_CLASS = "ui-datatable-footer ui-widget-header";
        this.GROUP_NAME_ROW_CLASS = "";
        
        this.rowStyleClass = this.cfg.rowStyleClass;
        
        // ID of the form used to display content for a single row.
        this.formId = this.cfg.formId;
        
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

        // Columns
        this.cols = this.cfg.cols;
        this.nCols = this.cols.length;

        // Sort events
        for (var i = 0; i < this.cols.length; ++i) {
            if (this.cols[i].sortBy) {
                this.setupSortEvents(this.cols[i]);
            }
        }

        // Filtering - allow either per-column filters or a single search box. 
        // Single search box requires that the load command has indexing enabled.
        //if(this.cfg.filter) {
        //    this.setupFiltering();
        //}
    
        this.paginatorTemplate = this.cfg.paginatorTemplate;
        this.id = PrimeFaces.escapeClientId(this.cfg.id);
        this.tbodyId = this.jqId + '_data';
        this.paginatorId = this.cfg.id + '_paginator';
        this.itemList = this.allItems = this.cfg.itemList;
        this.renderer = this.cfg.columnRenderer;
        this.itemContextMenu = this.cfg.itemContextMenu;
        this.emptyMessage = this.cfg.emptyMessage;
        this.rowStyleClass = this.cfg.rowStyleClass;
        this.selectAction = this.cfg.selectAction;
        
        // Default sort.
        this.sortBy = this.cfg.sortBy;
        this.sortOrder = this.cfg.sortOrder;
        
        if (!this.emptyMessage) {
            this.emptyMessage = "There are no items to display.";
        }
        if (this.cfg.strings) {
            this.strings = this.cfg.strings.split(",");            
        }
        
        this.parent = $(this.id);
        if (this.itemList) {
            if (this.sortBy) {
                if (this.sortOrder.toUpperCase() == "DESCENDING") {
                    this.itemList.order(this.sortBy, false);
                } else {
                    this.itemList.order(this.sortBy, true);
                }
            }
            
            this.refresh(this.cfg.condition);
        }
    },
    refresh: function(list,condition) {
        this.itemList = list;
        if ((condition !== undefined) &&
            !condition) {
            /* The condition is false. Remove this entirely from the DOM. */
            $(this.parent).hide();
            return;
        } else {
            $(this.parent).show();
        }
        this.refreshPaginatorContainer();
        this.refreshData();
    },
    refreshPaginatorContainer: function() {
        var paginatorContainer = $(PrimeFaces.escapeClientId(this.paginatorId));
        if (paginatorContainer.length == 0) {
            paginatorContainer = $('<div />').attr({
                    'id' : this.paginatorId,
                    'class': PrimeFaces.Utils.paginator.PAGINATOR_TOP_CONTAINER_CLASS
                }).insertBefore($(this.parent).find("table"));
        } else {
            // Clear out all children of the paginator so that we can refresh it.
            $(paginatorContainer).empty();
        }
        var parent = this;
        $.each(this.paginatorTemplate.split(" "), function(idx, obj) {
            PrimeFaces.Utils.paginator.render(obj, paginatorContainer, {
                'page' : parent.currentPage,
                'totalItems' : parent.list.length,
                'itemsPerPage' : parent.itemsPerPage,
                'nextPage' : parent.nextPage,
                'prevPage' : parent.prevPage,
                'owner' : parent
            });
        });
    },
    refreshData: function() {
        var _self = this;
        var tableBody = $(_self.tbodyId);
        $(tableBody).empty();
        
        if (_self.itemList && _self.itemList.length > 0) {
            /* Generate the actual data for the current page. */            
            var displayList = _self.itemList;
            
            if (this.itemsPerPage > 0) {
                displayList.limit(_self.itemsPerPage);
                var startElem = _self.currentPage * _self.itemsPerPage;
                var endElem = startElem + _self.itemsPerPage;
                if (endElem > _self.itemList.length) {
                    endElem = _self.itemList.length;
                }
                if (startElem > 0) {
                    displayList.skip(_self.startElem);
                }
            }

            var rowIndex = 0;
            displayList.each(function(curRow) {
                if (_self.grouped) {
                    var groupName = _self.groupName(curRow);
                    tableBody.append($('<tr />').attr({
                        'class' : _self.GROUP_NAME_ROW_CLASS
                        }).append($('<td />').attr({
                                'colspan': _self.nCols
                            }).append($('<div />').attr({
                                'class' : _self.TABLE_COLUMN_CLASS
                            }).append(groupName)
                        )
                    )
                    );
                    var groupMembers = _self.groupMembers(curRow);
                    for (var i = 0; i < groupMembers.length; ++i) {
                        renderRow(groupMembers[i], rowIndex, 0, tableBody);
                        ++rowIndex;
                    }
                } else {
                    renderRow(curRow, rowIndex, startElem, tableBody);
                    ++rowIndex;
                }              
            });
        } else {
            tableBody.append($('<tr />').attr({
                'class' : _self.EMPTY_MESSAGE_ROW_CLASS
            }).append($('<td />').attr({
                    'colspan': _self.nCols
                }).append($('<div />').attr({
                        'class' : _self.TABLE_COLUMN_CLASS
                    }).append(_self.emptyMessage)
                )
                )
            );
        }
    },
    
    renderRow: function(row, rowIndex, startElem, tableBody) {
        var _self = this;
        var userRowStyleClass = _self.rowStyleClass;
        var rowStyleClass = rowIndex % 2 == 0 ? 
            _self.TABLE_ROW_CLASS + " " + _self.TABLE_EVEN_ROW_CLASS : 
            _self.TABLE_ROW_CLASS + " " + _self.TABLE_ODD_ROW_CLASS;
        if (userRowStyleClass) {
            rowStyleClass = userRowStyleClass + " " + rowStyleClass;
        }
        var curRowMarkup = $('<tr />').attr({
                'class' : rowStyleClass,
                'data-index' : startElem + rowIndex
            })
        .appendTo(tableBody);
        
        for (var i = 0; i < _self.cols.length; ++i) {
            var col = this.cols[i];
            var colClass = _self.TABLE_COLUMN_CLASS;
            if (col.styleClass) {
                colClass = col.styleClass + " " + _self.TABLE_COLUMN_CLASS;
            }

            var nxtCol = $('<div />').attr({
                'class' : colClass
            }).appendTo($('<td />').attr({
                'data-col-index' : i
            }));
            if (_self.renderer(nxtCol, row, col, _self.strings)) {
                nxtCol.appendTo(curRowMarkup); 
            }
            
            if (_self.itemContextMenu) {
                $(nxtCol).on('taphold', function(event) {
                    // This allows the container to have taphold context menus that are not
                    // triggered when this event is triggered.
                    event.stopImmediatePropagation();
                    _self.selectedIndex = $(event.target).closest("tr").attr('data-index');
                    _self.selected = _self.itemList[_self.selectedIndex];
                    $(PrimeFaces.escapeClientId(_self.itemContextMenu)).popup( "open", { positionTo: event.target });
                });
            } 
            if (_self.selectAction) {
                $(nxtCol).on('tap', function(event) {
                    _self.selectedIndex = $(event.target).closest("tr").attr('data-index');
                    var colIndex = $(event.target).closes("td").attr('data-col-index');
                    _self.selectItem(_self.selectedIndex,colIndex);
                });
            }
        }
    },
    
    selectItem: function(idx,colidx) {
        this.selected = this.itemList[idx];
        var col = null;
        if (colidx) {
            col = this.cols[colidx];
        }
        this.selectedIndex = idx;
        
        this.selectAction(this.selected, col, this.strings);  
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
    }
});