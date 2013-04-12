/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package org.primefaces.mobile.component.iconbutton;

import java.io.IOException;
import java.util.Map;
import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import javax.faces.event.ActionEvent;
import org.primefaces.renderkit.CoreRenderer;

/**
 *
 * @author shallem
 */
public class IconButtonRenderer extends CoreRenderer {
    @Override
    public void decode(FacesContext context, UIComponent component) {
        IconButton button = (IconButton) component;
        if (button.isDisabled()) {
            return;
        }

        Map<String, String> params = context.getExternalContext().getRequestParameterMap();
        String clientId = component.getClientId(context);
        String value = params.get(clientId);

        if (!isValueBlank(value)) {
            component.queueEvent(new ActionEvent(component));
        }
    }

    @Override
    public void encodeEnd(FacesContext context, UIComponent component) throws IOException {
        ResponseWriter writer = context.getResponseWriter();
        IconButton button = (IconButton) component;
        String clientId = button.getClientId(context);
        
        writer.startElement("a", button);
        writer.writeAttribute("id", clientId, "id");
        writer.writeAttribute("name", clientId, "name");
        writer.writeAttribute("data-role", "button", null);
        writer.writeAttribute("data-iconpos", "bottom", null);
        writer.writeAttribute("data-icon", button.getImage(), null);
        writer.writeAttribute("data-iconshadow", "true", null);
        writer.writeAttribute("data-corners", "", null);
        writer.writeAttribute("href", button.getHref(), null);
        
        String onclick = button.getOnclick();
        String request = buildAjaxRequest(context, button, null);
        onclick = onclick != null ? onclick + ";" + request : request;
        
        //String aStyle = " ";
        //if (button.getImage() != null) {
        //    aStyle = "background-image: url('" + button.getImage() + "'); background-repeat: no-repeat; ";
        //}
        if (button.getStyle() != null) {
            writer.writeAttribute("style", button.getStyle(), null);
        }
        
        String aClass = "iconbutton";
        if (button.getStyleClass() != null) {
            aClass = aClass + " " + button.getStyleClass();
        }
        if (button.getCorner() != null) {
            aClass = aClass + " ui-corner-" + button.getCorner();
        }
        writer.writeAttribute("class", aClass, null);
        
        if (!isValueBlank(onclick)) {
            writer.writeAttribute("onclick", onclick, "onclick");
        }

        if (button.getValue() != null) {
            writer.write(button.getValue().toString());
        }

        writer.endElement("a");
    }
}
