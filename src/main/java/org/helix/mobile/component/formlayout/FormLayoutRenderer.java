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
package org.helix.mobile.component.formlayout;

import java.io.IOException;
import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import org.primefaces.renderkit.CoreRenderer;

public class FormLayoutRenderer extends CoreRenderer {

    @Override
    public void encodeEnd(FacesContext context, UIComponent component) throws IOException {
        ResponseWriter writer = context.getResponseWriter();
        FormLayout layout = (FormLayout) component;
        String id = layout.getClientId(context);
        
        writer.startElement("div", layout);
        writer.writeAttribute("id", id, "id"); 
        if (layout.getWidth() != null) {
            writer.writeAttribute("style", "width: " + layout.getWidth() + ";", "width");
        }
        if (layout.isFullScreen()) {
            writer.writeAttribute("class", "hx-layout-full-height", "class");
        }
        
        writer.endElement("div");
        
        startScript(writer, layout.getClientId(context));
        writer.write("\nvar " + layout.resolveWidgetVar() + " = null;");
        writer.write("\n(function($) {");
        
        writer.write("$(document).on('pagecreate', function(ev) {");
        writer.write("Helix.Layout.renderer(");
        writer.write("$(PrimeFaces.escapeClientId('" + id + "')).closest('.ui-page'),'" + id + "', function() {");
        writer.write("\n if (" + layout.resolveWidgetVar() + ") { return; }");
        writer.write("\n" + layout.resolveWidgetVar() + " =$(PrimeFaces.escapeClientId('" + layout.getClientId(context) + "')).helixFormLayout({");
        writer.write("items: [");
        boolean isFirst = true;
        for (UIComponent c : layout.getChildren()) {
            if (isFirst) {
                isFirst = false;
            } else {
                writer.write(",\n");
            }
            c.encodeAll(context);
        }
        writer.write("]");
        if (layout.getFieldStyleMap() != null) {
            writer.write(",'fieldStyle' : " + layout.getFieldStyleMap());
        } else if (layout.getFieldStyle() != null) {
            writer.write(",'fieldStyle' : '" + layout.getFieldStyle() + "'");
        }
        
        if (layout.getFieldStyleClassMap() != null) {
            writer.write(",'fieldStyleClass' : " + layout.getFieldStyleClassMap());
        } else if (layout.getFieldStyleClass() != null) {
            writer.write(",'fieldStyleClass' : '" + layout.getFieldStyleClass());
        }
        
        if (layout.getTitleStyleClass() != null) {
            writer.write(", 'titleStyleClass' : '" + layout.getTitleStyleClass() + "'");
        } else {
            writer.write(", 'titleStyleClass' : null");
        }
        
        if (layout.getMaxWidth() != null) {
            writer.write(", 'width' : '" + layout.getMaxWidth() + "'");
        }
        if (layout.getHeight() != null) {
            writer.write(", 'height' : '" + layout.getHeight() + "'");
        }
        
        writer.write(",modes : '" + layout.getModes() + "'");
        writer.write(",currentMode: '" + layout.getCurrentMode() + "'");
        writer.write(",separateElements: " + Boolean.toString(layout.isSeparateElements()));
        writer.write("}).data('helix-helixFormLayout');");
        writer.write("});");
        writer.write("});");
        
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
