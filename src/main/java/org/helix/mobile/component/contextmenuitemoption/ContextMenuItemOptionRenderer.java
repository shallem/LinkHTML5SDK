/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package org.helix.mobile.component.contextmenuitemoption;

import org.helix.mobile.component.contextmenuitem.*;
import java.io.IOException;
import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import org.primefaces.renderkit.CoreRenderer;

/**
 *
 * @author shallem
 */
public class ContextMenuItemOptionRenderer extends CoreRenderer {
    @Override
    public void encodeEnd(FacesContext context, UIComponent component) throws IOException {
        ResponseWriter writer = context.getResponseWriter();
        ContextMenuItemOption item = (ContextMenuItemOption) component; 

        /*writer.endElement("a");
        writer.endElement("li");*/
        writer.write("{");
        writer.write("'value' : '" + item.getValue() + "'");
        writer.write(",'label' : '" + item.getLabel() + "'");
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
