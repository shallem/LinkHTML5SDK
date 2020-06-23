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
package org.helix.mobile.component.contextmenu;

import java.io.IOException;
import java.io.StringWriter;
import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import javax.faces.render.Renderer;
import org.helix.mobile.component.page.PageRenderer;

public class ContextMenuRenderer extends Renderer {

    @Override
    public void encodeBegin(FacesContext context, UIComponent component) throws IOException {
        ContextMenu menu = (ContextMenu)component;
        StringWriter writer = new StringWriter();
        writer.write("Helix.Layout.makeMenu('" + menu.resolveWidgetVar() + "', '" + menu.getClientId(context) + "', {");
        writer.write("items: [");
        boolean isFirst = true;
        boolean didWrite = false;
        
        context.getAttributes().put("menuWriter", writer);
        
        for (UIComponent c : menu.getChildren()) {
            if (isFirst) {
                isFirst = false;
            } else if (didWrite) {
                writer.write(",\n");
            }
            int preLength = writer.getBuffer().length();
            c.encodeAll(context);
            int postLength = writer.getBuffer().length();
            didWrite = (postLength > preLength);
        }
        context.getAttributes().remove("menuWriter");
        writer.write("]");
        
        if (menu.getUseMiniLayout() != null) {
            writer.write(",useMiniLayout: " + menu.getUseMiniLayout());
        }
        if (menu.getBeforeOpen() != null) {
            writer.write(",beforeopen: " + menu.getBeforeOpen());
        }
        if (menu.getAfterClose() != null) {
            writer.write(",afterclose: " + menu.getAfterClose());
        }
        if (menu.getAfterOpen() != null) {
            writer.write(",afteropen: " + menu.getAfterOpen());
        }
        
        writer.write("});\n");
        PageRenderer.renderDialog(context, component, writer.toString());
    }
    
    @Override
    public void encodeEnd(FacesContext context, UIComponent component) throws IOException {
        ResponseWriter writer = context.getResponseWriter();
        ContextMenu menu = (ContextMenu)component;
        writer.startElement("div", menu);
        writer.writeAttribute("id", menu.getClientId(context), "id"); 
        
        writer.endElement("div");
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