/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package org.helix.mobile.component.overlay;

import java.io.IOException;
import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import org.primefaces.renderkit.CoreRenderer;

/**
 *
 * @author shallem
 */
public class OverlayRenderer extends CoreRenderer {
    
    @Override
    public void encodeEnd(FacesContext context, UIComponent component) throws IOException {
        ResponseWriter writer = context.getResponseWriter();
        Overlay overlay = (Overlay) component;
        String id = overlay.getClientId(context);
        
        String customStyleClass =
                overlay.getStyleClass();
        if (customStyleClass == null) {
            customStyleClass = "";
        }
        
        // Output a full-width div enclosing the child. This is the wrapper.
        writer.startElement("div", overlay);
        writer.writeAttribute("id", id, null);
        writer.writeAttribute("data-role", "panel", null);
        writer.writeAttribute("data-position", overlay.getPosition(), null);
        writer.writeAttribute("data-position-fixed", Boolean.toString(overlay.isPositionFixed()), null);
        writer.writeAttribute("data-display", "overlay", null);
        writer.writeAttribute("data-theme", overlay.getTheme(), null);
        writer.writeAttribute("data-dismissible", "true", null);
        writer.writeAttribute("class", customStyleClass, null);
        
        for (UIComponent c : overlay.getChildren()) {
            c.encodeAll(context);
        }
        
        writer.endElement("div");
        encodeScript(context, overlay);
    }

    protected void encodeScript(FacesContext context, Overlay overlay) throws IOException {
        ResponseWriter writer = context.getResponseWriter();
        String clientId = overlay.getClientId(context);

        startScript(writer, clientId);

        writer.write("(function($) {\n");
        
        writer.write("$(document).on('helixinit', function() {");
        
        if (overlay.getBeforeOpen() != null) {
            writer.write("$(PrimeFaces.escapeClientId('" + clientId + "')).on('panelbeforeopen', function( event, ui ) {");
            writer.write(overlay.getBeforeOpen() + ".call($(event.target));");
            writer.write("});" );
        }
        if (overlay.getOpen() != null) {
            writer.write("$(PrimeFaces.escapeClientId('" + clientId + "')).on('panelopen', function( event, ui ) {");
            writer.write(overlay.getOpen() + ".call($(event.target));");
            writer.write("});" );
        }
        if (overlay.getAfterClose() != null) {
            writer.write("$(PrimeFaces.escapeClientId('" + clientId + "')).on('panelclose', function( event, ui ) {");
            writer.write(overlay.getAfterClose() + ".call($(event.target));");
            writer.write("});" );
        }
        
        writer.write("});\n");
        
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
