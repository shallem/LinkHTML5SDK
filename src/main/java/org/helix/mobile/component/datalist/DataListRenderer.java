/*
 * Copyright 2009-2011 Prime Technology.
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
package org.helix.mobile.component.datalist;

import java.io.IOException;
import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import org.primefaces.renderkit.CoreRenderer;

public class DataListRenderer extends CoreRenderer {
    
    @Override
    public void encodeEnd(FacesContext context, UIComponent component) throws IOException {
        ResponseWriter writer = context.getResponseWriter();
        DataList dataList = (DataList) component;
        
        /* If the list has a header encode it before the list. */
        UIComponent header = dataList.getFacet("header");
        writer.writeAttribute("id", dataList.getClientId(context), "id");
        
        writer.startElement("div", dataList);
        if(dataList.getStyleClass() != null) {
            writer.writeAttribute("class", dataList.getStyleClass(), null);
        }
        if(header != null) {
            header.encodeAll(context);
        }
        
        // Enclose the entire ul in a div so that we can scroll it. Attach the jQM plugin
        // to this element.
        writer.startElement("div", dataList);
        if(dataList.getStyle() != null) {
            writer.writeAttribute("style", dataList.getStyle(), null);
        }
        if(dataList.getListStyleClass() != null) {
            writer.writeAttribute("class", dataList.getListStyleClass(), null);
        }
        writer.writeAttribute("id", dataList.getClientId(context) + "_wrapper", "id");
        writer.endElement("div");
        
        writer.endElement("div");
        
        encodeScript(context, dataList);
    }
    
    protected void encodeScript(FacesContext context, 
            DataList dlist) throws IOException {
        ResponseWriter writer = context.getResponseWriter();
        String clientId = dlist.getClientId(context);

        startScript(writer, clientId);
        writer.write("\n(function($) {");
        
        writer.write("$(document).on('helixinit', function() {");
        
        writer.write("\n" + dlist.resolveWidgetVar() + " = $(PrimeFaces.escapeClientId('" + clientId + "_wrapper')).helixDatalist({");
        
        /**
         * Display options
         */
        if(dlist.getType() != null && dlist.getType().equals("inset")) {
            writer.write("inset: true,");
        } else {
            writer.write("inset: false,");
        }
        if (dlist.isScrollContents()) {
            writer.write("scroll: true,");
        } else {
            writer.write("scroll: false,");
        }
        if (dlist.isMultiSelect()) {
            writer.write("multiSelect: true,");
        } else {
            writer.write("multiSelect: false,");
        }

        if (!dlist.isShowButtons()) {
            writer.write("showButtons: false,");
        }
        
        if (dlist.getButtonPos() != null) {
            writer.write("buttonPos: '" + dlist.getButtonPos() + "',");
        }

        if (!dlist.isShowDataIcon()) {
            writer.write("showDataIcon: false,");
        } 
        
        /**
         * Settings for grouping.
         */
        writer.write("grouped: " + Boolean.toString(dlist.isGrouped()));
        
        // Getter for group name.
        if (dlist.getGroupName() != null) {
            writer.write(",groupName: " + dlist.getGroupName());
        }
        // Getter for group members.
        if (dlist.getGroupMembers() != null) {
            writer.write(",groupMembers: " + dlist.getGroupMembers());
        }
        
        if (dlist.getGroupRenderer() != null) {
            writer.write(",groupRenderer: " + dlist.getGroupRenderer());
        }
        
        if (dlist.getGroupIndexedSearch() != null) {
            writer.write(",groupIndexedSearch: " + dlist.getGroupIndexedSearch());
        }
        
        if (dlist.getItemsPerGroup() != null) {
            writer.write(",itemsPerGroup: " + dlist.getItemsPerGroup());
        }
        
        if (dlist.getGroupOverflowText() != null) {
            writer.write(",groupOverflowText: '" + dlist.getGroupOverflowText() + "'");
        }
        
        if (dlist.getGroupOverflowTextClass() != null) {
            writer.write(",groupOverflowTextClass: '" + dlist.getGroupOverflowTextClass() + "'");
        }
        
        if (dlist.getGroupOverflowFn() != null) {
            writer.write(",groupOverflowFn: " + dlist.getGroupOverflowFn());
        }
        
        // The row style class.
        if (dlist.getRowStyleClass() != null) {
            writer.write(",rowStyleClass: '" + dlist.getRowStyleClass() + "'");
        }
        
        // The divider style class.
        if (dlist.getDividerStyleClass() != null) {
            writer.write(",dividerStyleClass: '" + dlist.getDividerStyleClass() + "'");
        }
        
        // Rendered condition.
        if (dlist.getCondition() != null) {
            writer.write(",condition: function() {" + dlist.getCondition() + "; }");
        }
        
        // Messages to display when the list or list groups are empty.
        if (dlist.getEmptyMessage() != null) {
            writer.write(",emptyMessage: '" + dlist.getEmptyMessage() + "'");
        }
        if (dlist.getEmptyGroupMessage() != null) {
            writer.write(",emptyGroupMessage: '" + dlist.getEmptyGroupMessage() + "'");
        }
        
        // Pagination
        if (dlist.getItemsPerPage() != null) {
            writer.write(",itemsPerPage: " + dlist.getItemsPerPage());
            if (dlist.getPaginatorTemplate() != null) {
                writer.write(",paginatorTemplate: '" + dlist.getPaginatorTemplate() + "'");
            }
        }

        // Selection
        if (dlist.getSelectAction() != null) {
            writer.append(",selectAction: function(row,group,strings) {" + dlist.getSelectAction() + "}");
        }
        if (dlist.getSwipeLeftAction() != null) {
            writer.append(",swipeLeftAction: function(row) {" + dlist.getSwipeLeftAction() + "}");
        }
        if (dlist.getSwipeRightAction() != null) {
            writer.append(",swipeRightAction: function(row) {" + dlist.getSwipeRightAction() + "}");
        }
        if (dlist.getHoldAction() != null) {
            writer.append(",holdAction: function(row,group,strings) {" + dlist.getHoldAction() + "}");
        }
        if (dlist.getItemContextMenu() != null) {
            writer.append(",itemContextMenu: " + dlist.getItemContextMenu());
        }
        if (dlist.getItemContextMenuFilter() != null) {
            writer.append(",itemContextMenuFilter: " + dlist.getItemContextMenuFilter());
        }
        
        // Search
        if (dlist.getIndexedSearch() != null) {
            writer.write(",indexedSearch: " + dlist.getIndexedSearch());
        }
        if (dlist.getLocalIndexedSearch()!= null) {
            writer.write(",localIndexedSearch: " + dlist.getLocalIndexedSearch());
        }
        if (dlist.getIndexedSearchText() != null) {
            writer.write(",indexedSearchText: '" + dlist.getIndexedSearchText() + "'");
        }
        if (dlist.getIndexedSearchType() != null) {
            writer.write(",indexedSearchType: '" + dlist.getIndexedSearchType() + "'");
        }
        if (dlist.getOnSearchClear() != null) {
            writer.write(",onSearchClear: " + dlist.getOnSearchClear());
        }

        // Show sort/filter buttons.
        writer.write(",showSortButton: " + (dlist.isSortButton() ? "true" : "false"));
        writer.write(",showFilterButton: " + (dlist.isFilterButton() ? "true" : "false"));
        
        // Default field to sort by.
        if (dlist.getSortBy() != null) {
            writer.write(",sortBy:'" + dlist.getSortBy() + "'");
        }

        // Sort order for the default sort.
        if (dlist.getSortOrder() != null) {
            writer.write(",sortOrder:'" + dlist.getSortOrder() + "'");
        }
        
        if (dlist.getGroupBy() != null) {
            writer.write(",groupBy:'" + dlist.getGroupBy() + "'");
        }
        
        if (dlist.getGroupByOrder()!= null) {
            writer.write(",groupByOrder:'" + dlist.getGroupByOrder() + "'");
        }
        
        // Sort callback.
        if (dlist.getOnSort() != null) {
            writer.write(",onSortChange: " + dlist.getOnSort());
        }
        
        // Sort buttons.
        if (dlist.getSortAscendingButton() != null &&
                dlist.getSortDescendingButton() != null) {
            writer.write(",sortButtons: {");
            writer.write("  'ascending' : '" + dlist.getSortAscendingButton() + "',");
            writer.write("  'descending' : '" + dlist.getSortDescendingButton() + "'");
            writer.write("}");
        }
        
        // Filter callbacks.
        if (dlist.getDoThisFilter() != null) {
            writer.write(",doThisFilter: " + dlist.getDoThisFilter());
        }
        if (dlist.getDoGlobalFilter() != null) {
            writer.write(",doGlobalFilter: " + dlist.getDoGlobalFilter());
        }
        
        // Localizable strings.
        if (dlist.getStrings() != null) {
            writer.write(",strings: '" + dlist.getStrings() + "'");
        }
        
        // Split theme
        if (dlist.getSplitAction()!= null) {
            writer.write(",splitAction: " + dlist.getSplitAction());
        }
        
        // Pull to refresh.
        if (dlist.getPullToRefresh() != null) {
            writer.write(",pullToRefresh: " + dlist.getPullToRefresh());
        }
        
        // Push to get more
        if (dlist.getPushToRefresh() != null) {
            writer.write(",pushToRefresh: " + dlist.getPushToRefresh());
        }
        
        // Custom paginator template.
        if (dlist.getCustomPaginatorTemplate() != null) {
            writer.write(",customPaginatorTemplate: " + dlist.getCustomPaginatorTemplate());
        }
        
        // Header.
        if (dlist.getHeaderText() != null) {
            writer.write(",headerText: '" + dlist.getHeaderText() + "'");
        }
        
        // Auto dividers.
        writer.write(",autodividers: '" + Boolean.toString(dlist.isAutodividers()) + "'");
        
        // Auto dividers selector.
        if (dlist.getAutodividersSelectorCallback() != null) {
            writer.write(",autodividersSelectorCallback: function(elt, list, sort) { return " + dlist.getAutodividersSelectorCallback() + "}");
        }
        
        // Turn off the select on pagination.
        if (dlist.isNoSelectOnPagination()) {
            writer.write(",noSelectOnPagination: true");
        }
        
        // The data list.
        writer.write(",itemList: " + dlist.getItemList());
        
        // The row renderer
        writer.write(",rowRenderer: " + dlist.getRowRenderer());
        
        // External buttons.
        if (dlist.getExternalButtonsCallback() != null) {
            writer.write(",externalButtonsCallback:  function(list, div, useControlGroup) { return "+ dlist.getExternalButtonsCallback() +"}");
        }
        
        // Selection buttons.
        if (dlist.getSelectionButtonsCallback() != null) {
            writer.write(",selectionButtonsCallback:  " + dlist.getSelectionButtonsCallback());
        }
        
        writer.write("}).data('helix-helixDatalist');");
        
        writer.write("});");
        writer.write("})(jQuery);\n");

        endScript(writer);
    } 
    
    @Override
    public void encodeChildren(FacesContext context, UIComponent component) throws IOException {
        //Do Nothing
    }

    @Override
    public boolean getRendersChildren() {
        return true;
    }
}
