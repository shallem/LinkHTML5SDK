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
package org.helix.mobile.component.scrollingdiv;

import java.io.IOException;
import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import org.primefaces.renderkit.CoreRenderer;

/**
 *
 * @author shallem
 */
public class ScrollingDivRenderer extends CoreRenderer {
    
    @Override
    public void encodeEnd(FacesContext context, UIComponent component) throws IOException {
        ResponseWriter writer = context.getResponseWriter();
        ScrollingDiv sdiv = (ScrollingDiv) component;
        String id = sdiv.getClientId(context);
        
        // Output a full-width div enclosing the child. This is the wrapper.
        writer.startElement("div", sdiv);
        writer.writeAttribute("id", id, "id");
        String customStyleClass = sdiv.getStyleClass();
        if (customStyleClass != null) {
            writer.writeAttribute("class", customStyleClass, null);
        }
        for (UIComponent c : sdiv.getChildren()) {
            c.encodeAll(context);
        }
        writer.endElement("div");
        
        
        startScript(writer, sdiv.getClientId(context));
        writer.write("\n(function($) {");
        writer.write("\n" + sdiv.resolveWidgetVar() + " =$(PrimeFaces.escapeClientId('" + id + "')).helixScrollingDiv({");
        writer.write("orientation: '" + sdiv.getOrientation() + "'");
        writer.write(",zoom: " + Boolean.toString(sdiv.isZoom()));
        writer.write(",width: '" + sdiv.getWidth() + "'");
        writer.write(",height: '" + sdiv.getHeight() + "'");
        writer.write("}).data('helix-helixScrollingDiv');");
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
