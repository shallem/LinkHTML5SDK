/*
 * Copyright 2013 Mobile Helix, Inc.
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
package org.helix.mobile.component.dialog;

import java.io.IOException;
import java.io.StringWriter;
import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import javax.faces.render.Renderer;
import org.helix.mobile.component.page.PageRenderer;

public class DialogRenderer extends Renderer {

    private String clientId;
    
    @Override
    public void encodeBegin(FacesContext context, UIComponent component) throws IOException {
        Dialog dialog = (Dialog) component;
        this.clientId = dialog.getClientId(context);
        encodeScript(context, dialog);   
    }
    
    @Override
    public void encodeEnd(FacesContext context, UIComponent component) throws IOException {
        ResponseWriter writer = context.getResponseWriter();
        
        writer.startElement("div", null);
        writer.writeAttribute("id", clientId, null);
        writer.writeAttribute("data-role", "popup", null);
        writer.writeAttribute("data-history", "false", null);
        
        writer.endElement("div");
    }

    protected void encodeScript(FacesContext context, Dialog dialog) throws IOException {
        StringWriter writer = new StringWriter();
        
        writer.write("Helix.Layout.makeDialog('" + dialog.resolveWidgetVar() + "', '" + this.clientId + "', ");
        writer.write("{");
        writer.write("title:'" + dialog.getTitle() + "'");
        writer.write(", hasForm:" + dialog.isHasForm());
        writer.write(", onConfirm:" + dialog.getOnConfirm());
        if (dialog.getOnDismiss() != null) {
            writer.write(", onDismiss:" + dialog.getOnDismiss());
        }
        if (dialog.getConfirmTitle() != null) {
            writer.write(", confirmText:'" + dialog.getConfirmTitle() + "'");
        }
        if (dialog.getDismissTitle() != null) {
            writer.write(", dismissText:'" + dialog.getDismissTitle() + "'");
        }
        if (dialog.getBodyContent() != null) {
            writer.write(", message:'" + dialog.getBodyContent() + "'");
        }
        if (dialog.getOncomplete() != null) {
            writer.write(", oncomplete: " + dialog.getOncomplete());
        }
        writer.write(", dismissible: " + (dialog.isDismissible() ? "true" : "false"));
        
        writer.write("});\n");
        PageRenderer.renderDialog(context, dialog, writer.toString());
    }

    @Override
    public boolean getRendersChildren() {
        return true;
    }
}