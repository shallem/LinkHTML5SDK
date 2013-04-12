/*
 * Copyright 2009-2012 Prime Teknoloji.
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
package org.primefaces.mobile.component.datatable;

import java.io.IOException;
import javax.el.MethodExpression;
import javax.el.ValueExpression;
import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import org.primefaces.component.api.UIColumn;
import org.primefaces.component.summaryrow.SummaryRow;
import org.primefaces.renderkit.DataRenderer;
import org.primefaces.util.HTML;

public class DataTableRenderer extends DataRenderer {

    public static final String CONTAINER_CLASS = "ui-datatable ui-widget";
    public static final String COLUMN_HEADER_CLASS = "ui-state-default";
    public static final String COLUMN_CONTENT_WRAPPER = "ui-dt-c";
    public static final String COLUMN_FOOTER_CLASS = "ui-state-default";
    public static final String DATA_CLASS = "ui-datatable-data ui-widget-content";
    
    @Override
    public void encodeEnd(FacesContext context, UIComponent component) throws IOException {
        DataTable table = (DataTable) component;
        encodeMarkup(context, table);
        encodeScript(context, table);
    }

    protected void encodeScript(FacesContext context, DataTable table) throws IOException {
        ResponseWriter writer = context.getResponseWriter();
        String clientId = table.getClientId(context);

        startScript(writer, clientId);

        writer.write("PrimeFaces.cw('DataTable','" + table.resolveWidgetVar() + "',{");
        writer.write("id:'" + clientId + "'");

        // Rendered condition.
        if (table.getCondition() != null) {
            writer.write(",condition: function() {" + table.getCondition() + "}");
        }
        
        //Pagination
        if (table.getPaginatorTemplate() != null) {
            writer.write(",paginatorTemplate: '" + table.getPaginatorTemplate() + "'");
        }

        //Selection
        if (table.getSelectable().equals("true")) {
            writer.write(",selectable: true");
            
            if (table.getSelectionForm() != null) {
                writer.write(",formId : '" + table.getSelectionForm() + "'");
            }
            if (table.getSelectAction() != null) {
                writer.append(",selectAction: function(row) {" + table.getSelectAction() + "}");
            }
        }

        //Filtering
        if (table.getSortFields() != null) {
            writer.write(",sortFields: '" + table.getSortFields() + "'");

            if (table.getSortBy() != null) {
                writer.write(",sortBy:'" + table.getSortBy() + "'");
            }

            if (table.getSortOrder() != null) {
                writer.write(",sortOrder:'" + table.getSortOrder() + "'");
            }
        }
        
        // The data list.
        if (table.getDataList() != null) {
            writer.write(",dataList: function() {" + table.getDataList() + "}");
        } else if (table.getDeltaList() != null) {
            writer.write(",deltaList: function() {" + table.getDeltaList() + "}");
        }
        
        if (table.getRowKey() != null) {
            writer.write(",keyField: '" + table.getRowKey() + "'");
        }
        
        writer.write("});");

        endScript(writer);
    }

    protected void encodeMarkup(FacesContext context, DataTable table) throws IOException {
        ResponseWriter writer = context.getResponseWriter();
        String clientId = table.getClientId(context);
        String style = table.getStyle();

        //style class
        String containerClass = DataTableRenderer.CONTAINER_CLASS;
        containerClass = table.getStyleClass() != null ? containerClass + " " + table.getStyleClass() : containerClass;

        writer.startElement("div", table);
        writer.writeAttribute("id", clientId, "id");
        writer.writeAttribute("class", containerClass, "styleClass");
        if (style != null) {
            writer.writeAttribute("style", style, "style");
        }

        encodeRegularTable(context, table);

        if (table.getSelectable() != null) {
            // TODO
            //encodeStateHolder(context, table, table.getClientId(context) + "_selection");
        }

        writer.endElement("div");
    }

    protected void encodeRegularTable(FacesContext context, DataTable table) throws IOException {
        ResponseWriter writer = context.getResponseWriter();

        writer.startElement("table", null);
        writer.writeAttribute("role", "grid", null);
        if (table.getTableStyle() != null) {
            writer.writeAttribute("style", table.getTableStyle(), null);
        }
        if (table.getTableStyleClass() != null) {
            writer.writeAttribute("class", table.getTableStyleClass(), null);
        }

        encodeThead(context, table);
        //encodeTFoot(context, table); TODO
        encodeTbody(context, table, false);
        writer.endElement("table");
    }

    protected void encodeColumnHeader(FacesContext context, DataTable table, UIColumn column) throws IOException {
        if (!column.isRendered()) {
            return;
        }

        ResponseWriter writer = context.getResponseWriter();
        String clientId = column.getContainerClientId(context);
        ValueExpression tableSortByVe = table.getValueExpression("sortBy");
        ValueExpression columnSortByVe = column.getValueExpression("sortBy");
        String selectionMode = column.getSelectionMode();

        String columnClass = DataTableRenderer.COLUMN_HEADER_CLASS;
        columnClass = column.getStyleClass() != null ? columnClass + " " + column.getStyleClass() : columnClass;

        writer.startElement("th", null);
        writer.writeAttribute("id", clientId, null);
        writer.writeAttribute("class", columnClass, null);
        writer.writeAttribute("role", "columnheader", null);

        if (column.getStyle() != null) {
            writer.writeAttribute("style", column.getStyle(), null);
        }
        if (column.getRowspan() != 1) {
            writer.writeAttribute("rowspan", column.getRowspan(), null);
        }
        if (column.getColspan() != 1) {
            writer.writeAttribute("colspan", column.getColspan(), null);
        }

        //column content wrapper
        writer.startElement("div", null);
        writer.writeAttribute("class", DataTableRenderer.COLUMN_CONTENT_WRAPPER, null);
        if (column.getWidth() != -1) {
            writer.writeAttribute("style", "width:" + column.getWidth() + "px", null);
        }
        //encodeColumnHeaderContent(context, column, sortIcon); TODO

        writer.endElement("div");

        writer.endElement("th");
    }

    protected void encodeColumnHeaderContent(FacesContext context, UIColumn column, String sortIcon) throws IOException {
        ResponseWriter writer = context.getResponseWriter();

        if (sortIcon != null) {
            writer.startElement("span", null);
            writer.writeAttribute("class", sortIcon, null);
            writer.endElement("span");
        }

        UIComponent header = column.getFacet("header");
        String headerText = column.getHeaderText();

        writer.startElement("span", null);

        if (header != null) {
            header.encodeAll(context);
        } else if (headerText != null) {
            writer.write(headerText);
        }

        writer.endElement("span");
    }

    protected void encodeColumnFooter(FacesContext context, DataTable table, UIColumn column) throws IOException {
        if (!column.isRendered()) {
            return;
        }

        ResponseWriter writer = context.getResponseWriter();

        String style = column.getStyle();
        String styleClass = column.getStyleClass();
        styleClass = styleClass == null ? DataTableRenderer.COLUMN_FOOTER_CLASS : DataTableRenderer.COLUMN_FOOTER_CLASS + " " + styleClass;

        writer.startElement("td", null);
        writer.writeAttribute("class", styleClass, null);

        if (style != null) {
            writer.writeAttribute("style", style, null);
        }
        if (column.getRowspan() != 1) {
            writer.writeAttribute("rowspan", column.getRowspan(), null);
        }
        if (column.getColspan() != 1) {
            writer.writeAttribute("colspan", column.getColspan(), null);
        }

        writer.startElement("div", null);
        writer.writeAttribute("class", DataTableRenderer.COLUMN_CONTENT_WRAPPER, null);
        if (column.getWidth() != -1) {
            writer.writeAttribute("style", "width:" + column.getWidth() + "px", null);
        }

        //Footer content
        UIComponent facet = column.getFacet("footer");
        String text = column.getFooterText();
        if (facet != null) {
            facet.encodeAll(context);
        } else if (text != null) {
            writer.write(text);
        }

        writer.endElement("div");

        writer.endElement("td");
    }

    /**
     * Render column headers either in single row or nested if a columnGroup is
     * defined
     */
    protected void encodeThead(FacesContext context, DataTable table) throws IOException {
        /* TO DO */
        /*ResponseWriter writer = context.getResponseWriter();
        ColumnGroup group = table.getColumnGroup("header");

        writer.startElement("thead", null);

        encodeFacet(context, table, table.getHeader(), DataTable.HEADER_CLASS, "th");

        if (group != null && group.isRendered()) {

            for (UIComponent child : group.getChildren()) {
                if (child.isRendered() && child instanceof Row) {
                    Row headerRow = (Row) child;

                    writer.startElement("tr", null);

                    for (UIComponent headerRowChild : headerRow.getChildren()) {
                        if (headerRowChild.isRendered() && headerRowChild instanceof Column) {
                            encodeColumnHeader(context, table, (Column) headerRowChild);
                        }
                    }

                    writer.endElement("tr");
                }
            }

        } else {
            writer.startElement("tr", null);
            writer.writeAttribute("role", "row", null);

            for (UIColumn column : table.getColumns()) {
                if (column instanceof Column) {
                    encodeColumnHeader(context, table, column);
                } else if (column instanceof DynamicColumn) {
                    DynamicColumn dynamicColumn = (DynamicColumn) column;
                    dynamicColumn.applyModel();

                    encodeColumnHeader(context, table, dynamicColumn);
                }
            }

            writer.endElement("tr");
        }

        writer.endElement("thead");*/
    }

    public void encodeTbody(FacesContext context, DataTable table, boolean dataOnly) throws IOException {
        ResponseWriter writer = context.getResponseWriter();
        String clientId = table.getClientId(context);

        writer.startElement("tbody", null);
        writer.writeAttribute("id", clientId + "_data", null);
        writer.writeAttribute("class", DataTableRenderer.DATA_CLASS, null);
        
        writer.endElement("tbody");
    }

    private void encodeSummaryRow(FacesContext context, DataTable table, SummaryRow summaryRow) throws IOException {
        MethodExpression me = summaryRow.getListener();
        if (me != null) {
            me.invoke(context.getELContext(), new Object[]{table.getSortBy()});
        }

        summaryRow.encodeAll(context);
    }

    protected void encodeStateHolder(FacesContext context, DataTable table, String id, String value) throws IOException {
        ResponseWriter writer = context.getResponseWriter();

        writer.startElement("input", null);
        writer.writeAttribute("type", "hidden", null);
        writer.writeAttribute("id", id, null);
        writer.writeAttribute("name", id, null);
        writer.writeAttribute("autocomplete", "off", null);
        if (value != null) {
            writer.writeAttribute("value", value, null);
        }
        writer.endElement("input");
    }

    @Override
    public void encodeChildren(FacesContext context, UIComponent component) throws IOException {
        //Rendering happens on encodeEnd
    }

    @Override
    public boolean getRendersChildren() {
        return true;
    }
}