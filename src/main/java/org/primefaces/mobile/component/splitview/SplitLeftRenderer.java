/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package org.primefaces.mobile.component.splitview;

import java.io.IOException;
import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import org.primefaces.renderkit.CoreRenderer;

/**
 *
 * @author shallem
 */
public class SplitLeftRenderer extends CoreRenderer {
    
    @Override
    public void encodeEnd(FacesContext context, UIComponent component) throws IOException {
        ResponseWriter writer = context.getResponseWriter();
        SplitLeft sleft = (SplitLeft) component;
        
        // Output the left div.
        writer.startElement("div", sleft);
        writer.writeAttribute("class", "leftContentArea", null);
        writer.writeAttribute("style",
                "width: " + sleft.getWidth() + "%;", null);
        for (UIComponent c : sleft.getChildren()) {
            c.encodeAll(context);
        }
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
