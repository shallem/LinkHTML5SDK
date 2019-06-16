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
import java.io.StringWriter;
import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import org.helix.mobile.component.page.PageRenderer;
import org.primefaces.renderkit.CoreRenderer;

public class FormLayoutRenderer extends CoreRenderer {

    @Override
    public void encodeBegin(FacesContext context, UIComponent component) throws IOException {
        FormLayout layout = (FormLayout) component;
        String id = layout.getClientId(context);
        String pageID = (String)context.getAttributes().get("pageID");
        
        {
            ResponseWriter writer = context.getResponseWriter();
            writer.startElement("div", layout);
            writer.writeAttribute("id", id, "id"); 
            if (layout.getWidth() != null) {
                writer.writeAttribute("style", "width: " + layout.getWidth() + ";", "width");
            }

            writer.endElement("div");
        }
        
        StringWriter scriptWriter = new StringWriter();
        context.getAttributes().put("formWriter", scriptWriter);
        
        scriptWriter.write("Helix.Layout.makeForm('" + layout.resolveWidgetVar() + "', '" + pageID + "', '" + id + "', {");
        scriptWriter.write("items: [");
        boolean isFirst = true;
        for (UIComponent c : layout.getChildren()) {
            if (isFirst) {
                isFirst = false;
            } else {
                scriptWriter.write(",\n");
            }
            c.encodeAll(context);
        }
        context.getAttributes().remove("formWriter");
        scriptWriter.write("]");
        if (layout.getFieldStyleMap() != null) {
            scriptWriter.write(",'fieldStyle' : " + layout.getFieldStyleMap());
        } else if (layout.getFieldStyle() != null) {
            scriptWriter.write(",'fieldStyle' : '" + layout.getFieldStyle() + "'");
        }
        
        if (layout.getFieldStyleClassMap() != null) {
            scriptWriter.write(",'fieldStyleClass' : " + layout.getFieldStyleClassMap());
        } else if (layout.getFieldStyleClass() != null) {
            scriptWriter.write(",'fieldStyleClass' : '" + layout.getFieldStyleClass() + "'");
        }
        
        if (layout.getTitleStyleClass() != null) {
            scriptWriter.write(", 'titleStyleClass' : '" + layout.getTitleStyleClass() + "'");
        } else {
            scriptWriter.write(", 'titleStyleClass' : null");
        }
        
        if (layout.getFormStyleClass() != null) {
            scriptWriter.write(", 'formStyleClass' : '" + layout.getFormStyleClass() + "'");
        }
        
        if (layout.getMaxWidth() != null) {
            scriptWriter.write(", 'width' : '" + layout.getMaxWidth() + "'");
        }
        if (layout.getHeight() != null) {
            scriptWriter.write(", 'height' : '" + layout.getHeight() + "'");
        }
        if (layout.getUseMiniLayout() != null) {
            scriptWriter.write(", 'useMiniLayout' : " + layout.getUseMiniLayout());
        }
        if (layout.getTextStyleClass() != null) {
            scriptWriter.write(", 'textStyleClass' : '" + layout.getTextStyleClass() + "'");
        }
        
        scriptWriter.write(",fullScreen : " + Boolean.toString(layout.isFullScreen()));
        scriptWriter.write(",modes : '" + layout.getModes() + "'");
        scriptWriter.write(",currentMode: '" + layout.getCurrentMode() + "'");
        scriptWriter.write(",separateElements: " + Boolean.toString(layout.isSeparateElements()));
        scriptWriter.write("});\n");
        PageRenderer.renderDialog(context, component, scriptWriter.toString());
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
