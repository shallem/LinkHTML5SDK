/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package org.helix.mobile.component.tab;

import java.io.IOException;
import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import org.primefaces.renderkit.CoreRenderer;

/**
 * This rendering is invoked by each page, which checks to see if it in a tab bar and,
 * if so, renders the tab bar.
 * 
 * @author shallem
 */
public class TabRenderer extends CoreRenderer {
    
    @Override
    public void encodeBegin(FacesContext context, UIComponent component) throws IOException {
        Tab tab = (Tab)component;
        Boolean isActive = (Boolean)tab.getAttributes().get("active");
        
        ResponseWriter writer = context.getResponseWriter();
        writer.startElement("li", component);
        writer.startElement("a", component);
        writer.writeAttribute("href", "#" + tab.getPage(), null);
        if (isActive) {
            writer.writeAttribute("class", "hx-tab ui-btn-active ui-btn", null);
        } else {
            writer.writeAttribute("class", "hx-tab ui-btn", null);
        }
        
        writer.startElement("div", component);
        writer.writeAttribute("class", "hx-btn-inner hx-tab-inner", null);
        
        writer.startElement("div", component);
        writer.writeAttribute("class", "hx-icon     ui-icon-" + tab.getIcon(), null);
    }
    
    @Override
    public void encodeEnd(FacesContext context, UIComponent component) throws IOException {
        ResponseWriter writer = context.getResponseWriter();
        writer.endElement("div");
        writer.endElement("div");
        writer.endElement("a");
        writer.endElement("li");
    }
}
