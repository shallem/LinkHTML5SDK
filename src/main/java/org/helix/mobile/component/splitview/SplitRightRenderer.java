/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package org.helix.mobile.component.splitview;

import java.io.IOException;
import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import org.primefaces.renderkit.CoreRenderer;

/**
 *
 * @author shallem
 */
public class SplitRightRenderer extends CoreRenderer {
    
    private String getRightWidth(SplitRight right) {
        SplitView sview = (SplitView)right.getParent();
        SplitLeft sleft = (SplitLeft)sview.getChildren().get(0);
        
        Integer leftWidthInt = sleft.getWidth();
        double rightWidthFloat = 100.0 - (1.03 * leftWidthInt);
        String rwidth = Double.toString(rightWidthFloat) + "%";
        return rwidth;
    }
    
    @Override
    public void encodeEnd(FacesContext context, UIComponent component) throws IOException {
        ResponseWriter writer = context.getResponseWriter();
        SplitRight sright = (SplitRight) component;
        
        // Output the left div.
        writer.startElement("div", sright);
        writer.writeAttribute("class", "pm-split-right-area pm-layout-full-height", null);
        writer.writeAttribute("style",
                "width: " + this.getRightWidth(sright) + ";", null);
        for (UIComponent c : sright.getChildren()) {
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
