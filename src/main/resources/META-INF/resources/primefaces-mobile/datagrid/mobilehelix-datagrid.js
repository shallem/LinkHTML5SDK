/**
 * PrimeFaces Mobile DataGrid Widget
 */
PrimeFaces.widget.MobileDataGrid = PrimeFaces.widget.BaseWidget.extend({        
    
    init: function(cfg) {
        this._super(cfg);

        // Private variables.
        this.currentPage = 0;
        this.CONTENT_CLASS_MOBILE = "ui-datagrid-content ui-widget-content pm-scroller pm-scroller-nozoom pm-layout-full-height";
        this.EMPTY_CONTENT_CLASS = "ui-datagrid-content ui-datagrid-content-empty ui-widget-content pm-layout-full-height";
	this.TABLE_CLASS = "ui-datagrid-data";
	this.TABLE_ROW_CLASS = "ui-datagrid-row";
	this.TABLE_COLUMN_CLASS = "ui-datagrid-column pm-full-height";

        this.rows = cfg.rows;
        this.cols = cfg.cols;
        if (typeof this.rows === 'string') {
            this.rows = this.getDimensionForDeviceType(this.rows);
        }
        if (typeof this.cols === 'string') {
            this.cols = this.getDimensionForDeviceType(this.cols);
        }
        this.itemsPerPage = (this.rows * this.cols);
        this.paginatorTemplate = cfg.paginatorTemplate;
        this.id = PrimeFaces.escapeClientId(cfg.id);
        this.contentId = cfg.id + '_content';
        this.paginatorId = cfg.id + '_paginator';
        this.list = cfg.itemList;
        this.renderer = cfg.renderer;
        this.defaultContextMenu = cfg.defaultContextMenu;
        this.itemContextMenu = cfg.itemContextMenu;
        this.emptyMessage = cfg.emptyMessage;
        if (!this.emptyMessage) {
            this.emptyMessage = "There are no items to display.";
        }
        if (cfg.strings) {
            this.strings = cfg.strings.split(",");            
        }
        
        this.parent = $(this.id);
        if (this.list) {
            this.refresh(this.list, cfg.condition);
        }
    },
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
            if (_self.defaultContextMenu) {
                var cMenu = _self.defaultContextMenu;
                $(_self.parent).on('taphold', function(event) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    $(PrimeFaces.escapeClientId(cMenu)).popup( "open" );
                });
            } 
            if (oncomplete) {
                oncomplete();
            }
        };
        if ($.isArray(_self.list)) {
            _self.refreshPaginatorContainer(_self.list.length);
            _self.refreshData(_self.list.length, refreshDone);
        } else {
            _self.list.count(function(ct) {
                _self.refreshPaginatorContainer(ct);
                _self.refreshData(ct, refreshDone);
            })
        }
    },
    refreshPaginatorContainer: function(nElems) {
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
        $.each(this.paginatorTemplate.split(" "), function(idx, obj) {
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
    createRefreshState: function(nElems) {
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
    createOneElement: function(tableBody, curState, idx, elem) {
        // Determine if we need to start a new row.
        if (!curState.curRow || (idx % curState.parent.cols) == 0) {
            curState.curRow = $('<tr />').attr({
                    'class' : curState.parent.TABLE_ROW_CLASS
                })
            .appendTo(tableBody);
        }

        var nxtCol = $('<td />').attr({
            'class' : curState.parent.TABLE_COLUMN_CLASS,
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
    refreshData: function(nElems, oncomplete) {
        var _self = this;
        var gridBody, tableBody, curState;
        var doneFn = function(b) {
            $(contentContainer).append(b);
            oncomplete();
        }
        
        
        var contentContainer = $(PrimeFaces.escapeClientId(this.contentId));
        if (contentContainer.length == 0) {
            contentContainer = $('<div />').attr({
                'id' : this.contentId
            }).appendTo(this.parent);
        } else {
            $(contentContainer).empty();
        }
        if (nElems > 0) {
            if ($.isArray(this.list)) {
                $(contentContainer).attr('class', this.CONTENT_CLASS_MOBILE);

                /* Generate the actual data for the current page. */
                tableBody = $('<tbody />');
                curState = this.createRefreshState(this.list.length);
                $.each(this.list.slice(curState.startElem, curState.endElem), function(idx, elem) {
                    _self.createOneElement(tableBody, curState, idx, elem);
                });
                gridBody = $('<div />')
                    .append($('<table />').attr({
                            'class' : this.TABLE_CLASS
                            })
                            .append(tableBody));
                doneFn(gridBody);
            } else if (this.list.forEach) {
                /* Generate the actual data for the current page. */
                tableBody = $('<tbody />');
                var _list = this.list;
                
                var _idx = 0;
                curState = _self.createRefreshState(nElems);
                _list.skip(curState.startElem);
                _list.limit(curState.endElem - curState.startElem);
                _list.each(function(elem) {
                    _self.createOneElement(tableBody, curState, _idx, elem);
                    ++_idx;
                }, 
                function() {
                    
                },
                function() {
                    gridBody = $('<div />')
                        .append($('<table />').attr({
                            'class' : _self.TABLE_CLASS
                            }).append(tableBody)
                    );                    
                    doneFn(gridBody);
                });
            } else {
                gridBody = "Invalid item list type.";
                doneFn(gridBody);
            }
        } else {
            $(contentContainer).attr('class', this.EMPTY_CONTENT_CLASS);
            gridBody = this.emptyMessage;
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
    setupEvents: function() {
        $(this.content).on('swiperight', function() {
            this.prevPage();
        });
        $(this.content).on('swipeleft', function() {
            this.prevPage();
        });
    },
    getDimensionForDeviceType: function(dimensionString) {
        var rowsOptions = dimensionString.split(",");
        if (Helix.deviceType == 'phone') {
            return rowsOptions[0];
        } else if (Helix.deviceType == 'phablet') {
            return rowsOptions[1];
        } else {
            return rowsOptions[rowsOptions.length - 1];
        }
    }
});
