/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package org.helix.mobile.component.contextmenudivider;

import java.io.IOException;
import java.io.StringWriter;
import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.render.Renderer;

/**
 *
 * @author shallem
 */
public class ContextMenuDividerRenderer extends Renderer {
    @Override
    public void encodeBegin(FacesContext context, UIComponent component) throws IOException {
        StringWriter writer = (StringWriter)context.getAttributes().get("menuWriter");
        ContextMenuDivider item = (ContextMenuDivider) component; 

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
