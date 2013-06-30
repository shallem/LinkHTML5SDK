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
package org.helix.mobile.component.panelgroup;

import java.io.IOException;
import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import org.primefaces.renderkit.CoreRenderer;

/**
 *
 * @author shallem
 */
public class PanelGroupRenderer extends CoreRenderer {
    
    @Override
    public void encodeEnd(FacesContext context, UIComponent component) throws IOException {
        ResponseWriter writer = context.getResponseWriter();
        PanelGroup pgroup = (PanelGroup) component;
        String id = pgroup.getClientId(context);

        StringBuilder styleStrBuilder = new StringBuilder();
        if (pgroup.getWidth() != null) {
            styleStrBuilder.append("width: ").append(pgroup.getWidth()).append(";");
        }
        if (pgroup.getHeight() != null) {
            styleStrBuilder.append("height: ").append(pgroup.getHeight()).append(";");
        }
        
        String customStyleClass =
                pgroup.getStyleClass();
        if (customStyleClass == null) {
            customStyleClass = "";
        }
        
        // Output a full-width div enclosing the child. This is the wrapper.
        writer.startElement("div", pgroup);
        writer.writeAttribute("id", id, null);
        if (styleStrBuilder.length() > 0) {
            writer.writeAttribute("style", styleStrBuilder.toString(), null);
        }
        writer.writeAttribute("class", customStyleClass, null);
        
        writer.endElement("div");
        
        encodeScript(context, pgroup);
    }
    
    protected void encodeScript(FacesContext context, PanelGroup pgroup) throws IOException {
        ResponseWriter writer = context.getResponseWriter();
        String clientId = pgroup.getClientId();

        startScript(writer, clientId);
        
        writer.write("\n(function($) {");
        
        // Define the data list and condition, handling the case where a data widget
        // is specified and that widget may be undefined.
        if (pgroup.getDataWidget() != null) { 
            writer.write("var dataList;");
            writer.write("if (" + pgroup.getDataWidget() + ") {");
            writer.write("dataList=" + pgroup.getItemList() + ";");
            writer.write("}");
        } else {
            writer.write("var dataList = " + pgroup.getItemList() + ";");
        }
        
        if (pgroup.getCondition() != null) {
            writer.write("\nvar renderCondition;");
            if (pgroup.getDataWidget() != null) { 
                writer.write("if (" + pgroup.getDataWidget() + ") {");
                writer.write("renderCondition=" + pgroup.getCondition() + ";");
                writer.write("}");
            }
        }
        
        // Setup the widget.
        writer.write("\n" + pgroup.resolveWidgetVar() + " = $(PrimeFaces.escapeClientId('" + clientId + "')).helixPanelgroup({");
        writer.write("itemList : dataList");
        writer.write(",renderer : " + pgroup.getRenderer());
        if (pgroup.getStrings() != null) {
            writer.write(",strings : '" + pgroup.getStrings() + "'");
        }
        if (pgroup.getCondition() != null) {
            writer.write(",condition : renderCondition");
        }
        writer.write("}).data('helix-helixPanelgroup');");
        
        writer.write("})(jQuery);\n");
        
        endScript(writer);
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
