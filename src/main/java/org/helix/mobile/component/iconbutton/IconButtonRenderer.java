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
        boolean useStdButton = false;
        
        writer.startElement("a", button);
        writer.writeAttribute("id", clientId, "id");
        writer.writeAttribute("name", clientId, "name");
        
        
        /*writer.writeAttribute("data-role", "button", null);
        if (button.getIconPos() != null) {
            writer.writeAttribute("data-iconpos", button.getIconPos(), null);            
        } else {        
            writer.writeAttribute("data-iconpos", "bottom", null);
        }
        if (button.getImage() != null) {
            writer.writeAttribute("data-icon", button.getImage(), null);
        } else if (button.getIcon() != null) {
            writer.writeAttribute("data-icon", button.getIcon(), null);
            writer.writeAttribute("data-theme", button.getTheme(), null);
            useStdButton = true;
        }
        
        writer.writeAttribute("data-inline", "true", null);
        writer.writeAttribute("data-corners", "false", null);
        writer.writeAttribute("data-shadow", "false", null);
        writer.writeAttribute("data-iconshadow", "false", null);
        writer.writeAttribute("data-mini", "true", null);*/
        writer.writeAttribute("style", "min-width: " + Integer.toString(button.getWidth()), null);
        writer.writeAttribute("href", button.getHref(), null);
        
        // ui-btn ui-btn-up-d ui-mini ui-btn-inline
        String aClass = "ui-btn iconbutton"; 
        if (button.getStyleClass() != null) {
            aClass = aClass + " " + button.getStyleClass();
        }
        writer.writeAttribute("class", aClass, null);
        
        String onclick = button.getOnclick();
        if (!isValueBlank(onclick)) {
            writer.writeAttribute("onclick", onclick, "onclick");
        }
        
        writer.startElement("div", button);
        writer.writeAttribute("class", "hx-btn-inner", null);
        
        writer.startElement("div", component);
        writer.writeAttribute("class", "hx-icon ui-icon-" + button.getImage(), null);
        writer.endElement("div");
        
        writer.endElement("div");
        
        writer.endElement("a");
    }
}
