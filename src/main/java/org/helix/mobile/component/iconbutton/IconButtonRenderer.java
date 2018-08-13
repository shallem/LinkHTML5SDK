/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package org.helix.mobile.component.iconbutton;

import java.io.IOException;
import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import org.primefaces.renderkit.CoreRenderer;

/**
 *
 * @author shallem
 */
public class IconButtonRenderer extends CoreRenderer {
    @Override
    public void encodeEnd(FacesContext context, UIComponent component) throws IOException {
        ResponseWriter writer = context.getResponseWriter();
        IconButton button = (IconButton) component;
        String clientId = button.getClientId(context);
        
        writer.startElement("a", button);
        if (button.getId() != null) {
            writer.writeAttribute("id", button.getId(), null);
        } else {
            writer.writeAttribute("id", clientId, "id");
        }
        writer.writeAttribute("name", clientId, "name");
        if (button.getWidth() != null) {
            writer.writeAttribute("style", "min-width: " + button.getWidth(), null);
        }
        writer.writeAttribute("href", button.getHref(), null);
        
        // ui-btn ui-btn-up-d ui-mini ui-btn-inline
        String aClass = "ui-btn iconbutton hx-no-webkit-select"; 
        if (button.getStyleClass() != null) {
            aClass = aClass + " " + button.getStyleClass();
        }
        writer.writeAttribute("class", aClass, null);
        
        String onclick = button.getOnclick();
        if (!isValueBlank(onclick)) {
            writer.writeAttribute("onclick", onclick, "onclick");
        }
        
        String borderClass = "";
        if (button.isBorder()) {
            borderClass = " hx-btn-border";
        }
        writer.startElement("div", button);
        writer.writeAttribute("class", "hx-btn-inner" + borderClass, null);
        
        writer.startElement("div", component);
        writer.writeAttribute("class", "hx-icon ui-icon-" + button.getImage(), null);
        writer.endElement("div");
        
        writer.endElement("div");
        
        writer.endElement("a");
    }
}
