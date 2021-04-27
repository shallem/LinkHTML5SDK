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
        if (sview.getExitSplitMode() != null) {
            writer.write(",exitSplitMode: '" + sview.getExitSplitMode() + "'");
        }
        if (sview.getOnPopRight() != null) {
            writer.write(",onPopRight: " + sview.getOnPopRight());
        }
        if (sview.getButtonBarSelector() != null) {
            writer.write(",buttonBarSelector: '" + sview.getButtonBarSelector() + "'");
        }
        writer.write(",splitPadding: " + sview.getSplitPadding());
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
