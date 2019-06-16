/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package org.helix.mobile.component.contextmenuitemoption;

import java.io.IOException;
import java.io.StringWriter;
import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.render.Renderer;

/**
 *
 * @author shallem
 */
public class ContextMenuItemOptionRenderer extends Renderer {
    @Override
    public void encodeBegin(FacesContext context, UIComponent component) throws IOException {
        StringWriter writer = (StringWriter)context.getAttributes().get("menuWriter");
        ContextMenuItemOption item = (ContextMenuItemOption) component; 

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
