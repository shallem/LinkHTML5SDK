/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package org.helix.mobile.component.splitview;

import java.io.IOException;
import javax.faces.FacesException;
import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
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
        writer.writeAttribute("id", sview.getId(), null);
        for (UIComponent c : sview.getChildren()) {
            c.encodeAll(context);
        }
        
        writer.endElement("div");
        
        startScript(writer, sview.getClientId(context));
        writer.write("\n(function($) {");
        
        writer.write("$(document).on('helixinit', function() {");
        writer.write("\n" + sview.resolveWidgetVar() + " =$(PrimeFaces.escapeClientId('" + sview.getClientId(context) + "')).helixSplitView({");
        writer.write("leftWidth: " + Integer.toString(sview.getLeftWidth()));
        writer.write(",rightWidth: " + Integer.toString(sview.getRightWidth()));
        writer.write(",splitThreshold: " + Integer.toString(sview.getSplitThreshold()));
        if (sview.getOnRefresh() != null) {
            writer.write(",onRefresh: " + sview.getOnRefresh());
        }
        writer.write("}).data('helix-helixSplitView');");
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
