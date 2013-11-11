/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package org.helix.mobile.component.contextmenudivider;

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
    /*@Override
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
    }*/
    
    @Override
    public void encodeEnd(FacesContext context, UIComponent component) throws IOException {
        ResponseWriter writer = context.getResponseWriter();
        ContextMenuDivider item = (ContextMenuDivider) component; 

        /*writer.endElement("a");
        writer.endElement("li");*/
        writer.write("{");
        writer.write("'display' : '" + item.getValue() + "'");
        writer.write(",'isDivider' : true");
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
