/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package org.primefaces.mobile.component.splitview;

import java.io.IOException;
import javax.faces.FacesException;
import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import org.primefaces.mobile.component.view.View;
import org.primefaces.renderkit.CoreRenderer;

/**
 *
 * @author shallem
 */
public class SplitViewRenderer extends CoreRenderer {
    
    @Override
    public void encodeEnd(FacesContext context, UIComponent component) throws IOException {
        ResponseWriter writer = context.getResponseWriter();
        SplitView sview = (SplitView) component;

        if (sview.getChildCount() > 2) {
            throw new FacesException("Split view " + sview.getClientId() + " can only have a maximum of two children.");
        }

        // Output a full-width div enclosing the children.
        writer.startElement("div", sview);
        // NOTE: instead of this just float left and float right the two sub-pieces.
        // If we use inline-block display, then iScroll WILL NOT work.
        //writer.writeAttribute("style", "display: inline-block;", null);
        writer.writeAttribute("class", "splitMaster pm-layout-full-height", null);
        writer.writeAttribute("id", sview.getId(), null);
        for (UIComponent c : sview.getChildren()) {
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
