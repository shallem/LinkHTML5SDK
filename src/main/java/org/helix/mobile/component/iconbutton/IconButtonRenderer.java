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
        
        String borderClass = "";
        if (button.isBorder()) {
            borderClass = " hx-btn-border";
        }
        writer.startElement("div", button);
        if (!isValueBlank(button.getId())) {
            writer.writeAttribute("id", button.getId(), null);
        }
        String bClass = "iconbutton hx-btn-inner hx-no-webkit-select";
        if (button.getStyleClass() != null) {
            bClass = bClass + " " + button.getStyleClass() + borderClass;
        }
        writer.writeAttribute("class", bClass, null);
        String onclick = button.getOnclick();
        if (isValueBlank(onclick)) {
            onclick = button.getHref();
        }
        if (!isValueBlank(onclick)) {
            writer.writeAttribute("onclick", onclick, "onclick");
        } 
        
        writer.startElement("div", component);
        if (!isValueBlank(button.getImage())) {
            writer.writeAttribute("class", "hx-icon ui-icon-" + button.getImage(), null);
        } else if (!isValueBlank(button.getIconClass())) {
            writer.writeAttribute("class", "hx-icon " + button.getIconClass(), null);
        }
        writer.endElement("div");
        
        writer.endElement("div");
    }
}
