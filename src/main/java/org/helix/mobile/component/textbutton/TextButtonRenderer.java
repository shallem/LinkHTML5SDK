/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package org.helix.mobile.component.textbutton;

import java.io.IOException;
import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import org.primefaces.renderkit.CoreRenderer;

/**
 *
 * @author shallem
 */
public class TextButtonRenderer extends CoreRenderer {
    @Override
    public void encodeEnd(FacesContext context, UIComponent component) throws IOException {
        ResponseWriter writer = context.getResponseWriter();
        TextButton button = (TextButton) component;
        String clientId = button.getClientId(context);
               
        writer.startElement("a", button);
        writer.writeAttribute("id", clientId, "id");
        writer.writeAttribute("name", clientId, "name");
        writer.writeAttribute("data-role", "button", null);        
        writer.writeAttribute("data-inline", "true", null);
        writer.writeAttribute("data-corners", "false", null);
        writer.writeAttribute("data-shadow", "false", null);
        writer.writeAttribute("data-iconshadow", "false", null);
        writer.writeAttribute("data-mini", "true", null);
        writer.writeAttribute("style", "min-width: " + Integer.toString(button.getWidth()), null);
        writer.writeAttribute("href", button.getHref(), null);
        
        String aClass = ""; 
        if (button.getStyleClass() != null) {
            aClass = aClass + " " + button.getStyleClass();
        }
        if (button.getCorner() != null) {
            aClass = aClass + " ui-corner-" + button.getCorner();
        }
        writer.writeAttribute("class", aClass, null);
        
        String onclick = button.getOnclick();
        if (!isValueBlank(onclick)) {
            writer.writeAttribute("onclick", onclick, "onclick");
        }

        if (button.getValue() != null) {
            writer.write(button.getValue().toString());
        }

        writer.endElement("a");
    }
}
