/**
 * PrimeFaces Mobile DataGrid Widget
 */
PrimeFaces.widget.MobileDataGrid = PrimeFaces.widget.BaseWidget.extend({        
    
    init: function(cfg) {
        this._super(cfg);

        // Private variables.
        this.currentPage = 0;
        this.CONTENT_CLASS_MOBILE = "ui-datagrid-content ui-widget-content pm-scroller";
        this.EMPTY_CONTENT_CLASS = "ui-datagrid-content  ui-datagrid-content-empty ui-widget-content";
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
    refresh: function(list, condition) {
        this.list = list;
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
        if (this.defaultContextMenu) {
            var cMenu = this.defaultContextMenu;
            $(this.parent).on('taphold', function(event) {
                $(PrimeFaces.escapeClientId(cMenu)).popup( "open" );
            });
        } 
    },
    refreshPaginatorContainer: function() {
        var paginatorContainer = $(PrimeFaces.escapeClientId(this.paginatorId));
        if (paginatorContainer.length == 0) {
            paginatorContainer = $('<div />').attr({
                    'id' : this.paginatorId,
                    'class': PrimeFaces.Utils.paginator.PAGINATOR_TOP_CONTAINER_CLASS
                }).appendTo($(this.parent));
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
        var contentContainer = $(PrimeFaces.escapeClientId(this.contentId));
        if (contentContainer.length == 0) {
            contentContainer = $('<div />').attr({
                'id' : this.contentId
            }).appendTo(this.parent);
        } else {
            $(contentContainer).empty();
        }
        if (this.list.length > 0) {
            $(contentContainer).attr('class', this.CONTENT_CLASS_MOBILE);
            
            /* Generate the actual data for the current page. */
            var tableBody = $('<tbody />');
            var curRow;
            var startElem = this.currentPage * this.itemsPerPage;
            var endElem = startElem + this.itemsPerPage;
            if (endElem > this.list.length) {
                endElem = this.list.length;
            }
            var parent = this;
            $.each(this.list.slice(startElem, endElem), function(idx, elem) {
                // Determine if we need to start a new row.
                if (!curRow || (idx % parent.cols) == 0) {
                    curRow = $('<tr />').attr({
                            'class' : parent.TABLE_ROW_CLASS
                        })
                    .appendTo(tableBody);
                }
                
                var nxtCol = $('<td />').attr({
                    'class' : parent.TABLE_COLUMN_CLASS,
                    'data-index' : startElem + idx
                }).appendTo(curRow);
                parent.renderer(nxtCol, elem, parent.strings);
                if (parent.itemContextMenu) {
                    $(nxtCol).on('taphold', function(event) {
                        // This allows the container to have taphold context menus that are not
                        // triggered when this event is triggered.
                        event.stopImmediatePropagation();
                        parent.selectedIndex = $(event.target).closest("td").attr('data-index');
                        parent.selected = parent.list[parent.selectedIndex];
                        $(PrimeFaces.escapeClientId(parent.itemContextMenu)).popup( "open", { positionTo: event.target });
                    });
                } 
            });
            $(contentContainer).append($('<div />')
                .append($('<table />').attr({
                        'class' : this.TABLE_CLASS
                        }).append(tableBody)
                )
            );
        } else {
            $(contentContainer).attr('class', this.EMPTY_CONTENT_CLASS);
            $(contentContainer).append(this.emptyMessage);
        }
    },
    nextPage: function(nPages) {
        if (this.currentPage < (nPages - 1)) {
            this.currentPage++;
            this.refresh(this.list, this.condition);
        }
    },
    prevPage : function() {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.refresh(this.list, this.condition);
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
        if (PrimeFaces.deviceType == 'phone') {
            return rowsOptions[0];
        } else if (PrimeFaces.deviceType == 'phablet') {
            return rowsOptions[1];
        } else {
            return rowsOptions[rowsOptions.length - 1];
        }
    }
});
