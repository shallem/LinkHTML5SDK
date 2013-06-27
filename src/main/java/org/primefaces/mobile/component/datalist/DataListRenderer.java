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
package org.primefaces.mobile.component.datalist;

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
        if (dlist.getHoldAction() != null) {
            writer.append(",holdAction: function(row,group,strings) {" + dlist.getHoldAction() + "}");
        }
        
        // Search
        if (dlist.getIndexedSearch() != null) {
            writer.write(",indexedSearch: " + dlist.getIndexedSearch());
        }

        // Default field to sort by.
        if (dlist.getSortBy() != null) {
            writer.write(",sortBy:'" + dlist.getSortBy() + "'");
        }

        // Sort order for the default sort.
        if (dlist.getSortOrder() != null) {
            writer.write(",sortOrder:'" + dlist.getSortOrder() + "'");
        }
        
        // Sort callback.
        if (dlist.getOnSort() != null) {
            writer.write(",onSortChange: " + dlist.getOnSort());
        }
        
        // Filter callback.
        if (dlist.getDoFilter() != null) {
            writer.write(",doFilter: " + dlist.getDoFilter());
        }
        
        // Localizable strings.
        if (dlist.getStrings() != null) {
            writer.write(",strings: '" + dlist.getStrings() + "'");
        }
        
        // The data list.
        writer.write(",itemList: " + dlist.getItemList());
        
        // The row renderer
        writer.write(",rowRenderer: " + dlist.getRowRenderer());
        
        writer.write("}).data('helix-helixDatalist');");
        
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
