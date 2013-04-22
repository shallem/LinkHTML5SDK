/*
 * Copyright 2009-2011 Prime Technology.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.primefaces.mobile.component.navbar;

import java.io.IOException;
import java.util.LinkedList;
import java.util.List;
import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import org.primefaces.mobile.component.iconbutton.IconButton;
import org.primefaces.renderkit.CoreRenderer;

public class NavBarRenderer extends CoreRenderer {

    protected void outputChildren(FacesContext context,
            ResponseWriter writer, NavBar navBar,
            List<UIComponent> childButtons, boolean isLeft,
            boolean isHorizontal, boolean hasBoth) throws IOException {
        String widthStr = "";
        if (isLeft) {
            widthStr = hasBoth ? " width: 50%;" : " width: 100%;";
        }
        
        writer.startElement("ul", navBar);
        if (navBar.getListStyleClass() != null) {
            //writer.writeAttribute("class", navBar.getListStyleClass(), null);
        }
        writer.writeAttribute("style", "float: " + (isLeft ? "left" : "right") + ";" + widthStr, null);
        for(UIComponent child : childButtons) {
            
            if(child.isRendered()) {
                writer.startElement("li", navBar);
                if (isHorizontal) {
                    writer.writeAttribute("style", "display: inline-block;", null);
                }
                child.encodeAll(context);
                writer.endElement("li");
            }
        }
        writer.endElement("ul");
    }
    
    @Override
    public void encodeEnd(FacesContext context, UIComponent component) throws IOException {
        ResponseWriter writer = context.getResponseWriter();
        NavBar navBar = (NavBar) component;
        boolean isHorizontal = navBar.getOrientation().equals("Horizontal") ||
                navBar.getOrientation().equals("horizontal");
        
        writer.startElement("div", navBar);
        writer.writeAttribute("id", navBar.getClientId(context), "id");
        writer.writeAttribute("data-role", "navbar", null);
        
        if(navBar.getStyle() != null) {
            writer.writeAttribute("style", navBar.getStyle(), null);
        }
        if(navBar.getStyleClass() != null) {
            writer.writeAttribute("class", navBar.getStyleClass(), null);
        }

        // Separate children into right/left buttons.
        List<UIComponent> leftButtons = new LinkedList<UIComponent>();
        List<UIComponent> rightButtons = new LinkedList<UIComponent>();
        
        for(UIComponent child : navBar.getChildren()) {
            if (child instanceof IconButton) {
                IconButton ib = (IconButton) child;
                if (ib.getAlign().equals("right")) {
                    rightButtons.add(child);
                    continue;
                }
            } 
            leftButtons.add(child);
        }
        
        boolean hasBoth = (!leftButtons.isEmpty()) && (!rightButtons.isEmpty());
        if (!leftButtons.isEmpty()) {
            outputChildren(context, writer, navBar, leftButtons, true, isHorizontal, hasBoth);
        }
        if (!rightButtons.isEmpty()) {
            outputChildren(context, writer, navBar, rightButtons, false, isHorizontal, hasBoth);
        }
        
        /*
        writer.startElement("ul", navBar);
        if (navBar.getListStyleClass() != null) writer.writeAttribute("class", navBar.getListStyleClass(), null);
        for(UIComponent child : navBar.getChildren()) {
            
            if(child.isRendered()) {
                writer.startElement("li", navBar);
                if (isHorizontal) {
                    writer.writeAttribute("style", "display: inline;", null);
                }
                child.encodeAll(context);
                writer.endElement("li");
            }
        }
        writer.endElement("ul");
*/
        writer.endElement("div");
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