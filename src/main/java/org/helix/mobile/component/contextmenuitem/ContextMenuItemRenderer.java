/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package org.helix.mobile.component.contextmenuitem;

import java.io.IOException;
import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import org.primefaces.renderkit.CoreRenderer;

/**
 *
 * @author shallem
 */
public class ContextMenuItemRenderer extends CoreRenderer {
    /*@Override
     public void encodeBegin(FacesContext context, UIComponent component) throws IOException {
     ResponseWriter writer = context.getResponseWriter();
     ContextMenuItem item = (ContextMenuItem) component; 
     writer.startElement("li", item);
     writer.startElement("a", null);
     writer.writeAttribute("href", "javascript:void(0);", null);
     writer.writeAttribute("onclick", item.getOntap(), null);
     writer.write((String)item.getValue());
     }*/

    @Override
    public void encodeEnd(FacesContext context, UIComponent component) throws IOException {
        ResponseWriter writer = context.getResponseWriter();
        ContextMenuItem item = (ContextMenuItem) component;
        String itemType = item.getType();

        /*writer.endElement("a");
         writer.endElement("li");*/
        writer.write("{");
        writer.write("'display' : '" + item.getValue() + "'");
        if (item.getOntap() != null) {
            writer.write(",'action' : " + item.getOntap());
        }
        writer.write(",'enabled' : " + Boolean.toString(item.isEnabled()));
        writer.write(",'name' : '" + item.getClientId(context) + "'");
        writer.write(",type: '" + itemType + "'");
        if (item.getGroup() != null) {
            writer.write(",'group' : '" + item.getGroup() + "'");
        }
        if (item.getStyleClass() != null) {
            writer.write(",'styleClass' : '" + item.getStyleClass() + "'");
        }
        if (item.getData() != null) {
            writer.write(",'data' : '" + item.getData() + "'");
        }
        if (itemType.equals("radio")) {
            writer.write(",'options': [");
            boolean isFirst = true;
            for (UIComponent c : item.getChildren()) {
                if (isFirst) {
                    isFirst = false;
                } else {
                    writer.write(",\n");
                }
                c.encodeAll(context);
            }
            writer.write("]");
        }

        writer.write("}");
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
