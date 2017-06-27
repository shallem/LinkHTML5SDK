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
import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import org.primefaces.renderkit.CoreRenderer;

public class DialogRenderer extends CoreRenderer {

    @Override
    public void decode(FacesContext context, UIComponent component) {
        super.decodeBehaviors(context, component);
    }

    @Override
    public void encodeEnd(FacesContext context, UIComponent component) throws IOException {
        Dialog dialog = (Dialog) component;
        ResponseWriter writer = context.getResponseWriter();
        String clientId = dialog.getClientId(context);
        
        writer.startElement("div", null);
        writer.writeAttribute("id", clientId, null);
        writer.writeAttribute("data-role", "popup", null);
        writer.writeAttribute("data-history", "false", null);
        
        writer.endElement("div");
        
        encodeScript(context, dialog);
    }

    protected void encodeScript(FacesContext context, Dialog dialog) throws IOException {
        ResponseWriter writer = context.getResponseWriter();
        String clientId = dialog.getClientId(context);

        startScript(writer, clientId);

        writer.write("(function($) {\n");
        
        writer.write("$(document).on('helixinit', function() {");
        writer.write("\nwindow." + dialog.resolveWidgetVar() + " = $(PrimeFaces.escapeClientId('" + clientId + "')).helixDialog({");
        writer.write("title:'" + dialog.getTitle() + "',");
        writer.write("hasForm:" + dialog.isHasForm() + ",");
        writer.write("onConfirm:" + dialog.getOnConfirm() + ",");
        if (dialog.getOnDismiss() != null) {
            writer.write("onDismiss:" + dialog.getOnDismiss() + ",");
        }
        if (dialog.getConfirmTitle() != null) {
            writer.write("confirmText:'" + dialog.getConfirmTitle() + "',");
        }
        if (dialog.getDismissTitle() != null) {
            writer.write("dismissText:'" + dialog.getDismissTitle() + "',");
        }
        if (dialog.getBodyContent() != null) {
            writer.write("message:'" + dialog.getBodyContent() + "',");
        }
        writer.write("name: '" + dialog.resolveWidgetVar() + "',");
        writer.write("id:'" + clientId + "'");
        writer.write("});\n");
        writer.write("});");
        
        writer.write("})(jQuery);\n");

        endScript(writer);
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