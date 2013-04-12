/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package org.primefaces.mobile.component.contextmenudivider;

import java.io.IOException;
import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import org.primefaces.renderkit.CoreRenderer;

/**
 *
 * @author shallem
 */
public class ContextMenuDividerRenderer extends CoreRenderer {
    @Override
    public void encodeBegin(FacesContext context, UIComponent component) throws IOException {
        ResponseWriter writer = context.getResponseWriter();
        ContextMenuDivider item = (ContextMenuDivider) component;

        writer.startElement("li", item);
        writer.writeAttribute("data-role", "divider", null);
        writer.writeAttribute("data-theme", "a", null);
        writer.write((String)item.getValue());
    }

    @Override
    public void encodeEnd(FacesContext context, UIComponent component) throws IOException {
        ResponseWriter writer = context.getResponseWriter();

        writer.endElement("li");
    }
}
