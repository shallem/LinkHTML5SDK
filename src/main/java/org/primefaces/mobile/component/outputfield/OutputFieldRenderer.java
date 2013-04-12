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
package org.primefaces.mobile.component.outputfield;

import java.io.IOException;
import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import org.primefaces.renderkit.CoreRenderer;

public class OutputFieldRenderer extends CoreRenderer {

    @Override
    public void encodeBegin(FacesContext context, UIComponent component) throws IOException {
        ResponseWriter writer = context.getResponseWriter();
        OutputField field = (OutputField) component;

        if (field.isEscape()) {
            writer.startElement("span", field);
        } else {
            writer.startElement("div", field);
        }
        writer.writeAttribute("id", field.getClientId(context), "id");
        writer.writeAttribute("data-name", field.getName(), null);
        
        String styleClass = "viewMode";
        if (field.getStyleClass() != null) {
            styleClass = styleClass + " " + field.getStyleClass();
        }
        writer.writeAttribute("class", styleClass, null);
        if (field.getStyle() != null) {
            writer.writeAttribute("style", field.getStyle(), null);
        }
        if (!field.isEscape()) {
            writer.write((String)field.getValue());
        } else {
            writer.writeText(field.getValue(), component, null);
        }
    }

    @Override
    public void encodeEnd(FacesContext context, UIComponent component) throws IOException {
        ResponseWriter writer = context.getResponseWriter();
        OutputField field = (OutputField) component;
        
        if (field.isEscape()) {
            writer.endElement("span");
        } else {
            writer.endElement("div");
        }
    }
}
