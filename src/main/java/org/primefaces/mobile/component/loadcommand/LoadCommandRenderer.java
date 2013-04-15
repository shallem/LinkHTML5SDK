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
package org.primefaces.mobile.component.loadcommand;

import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.text.MessageFormat;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import org.primefaces.mobile.model.JSONSerializer;
import org.primefaces.renderkit.CoreRenderer;

public class LoadCommandRenderer extends CoreRenderer {

    
    @Override
    public void encodeEnd(FacesContext context, UIComponent component) throws IOException {
        LoadCommand cmd = (LoadCommand) component;
        if (context.getExternalContext().getRequestParameterMap().containsKey(cmd.getClientId(context) + "_reload")) {
            /* This is the result of a partial update to reload the data. Return raw JSON. This will
             * be stored inside of a script tag returned by the partial update.
             */
            ResponseWriter writer = context.getResponseWriter();
            JSONSerializer s = new JSONSerializer();
            try {
                writer.write(s.serializeObject(cmd.getValue()));
            } catch (IllegalAccessException | IllegalArgumentException | InvocationTargetException | NoSuchMethodException ex) {
                Logger.getLogger(LoadCommandRenderer.class.getName()).log(Level.SEVERE, null, ex);
            }
        } else {
            this.encodeMarkup(context, cmd);
            this.encodeScript(context, cmd);
        }
    }
    
    protected void encodeMarkup(FacesContext context, LoadCommand cmd) throws IOException {
        
    }
    
    protected void encodeScript(FacesContext context, LoadCommand cmd) throws IOException {
        ResponseWriter writer = context.getResponseWriter();
        String clientId = cmd.getClientId();

        StringBuilder onComplete = new StringBuilder();
        if (cmd.getOncomplete() != null) {
            onComplete.append("function () {").append(cmd.getOncomplete()).append("}");
        } else {
            onComplete.append("null");
        }
       
        String schema = "null";
        if (cmd.getOfflineSave().equals("true")) {
            JSONSerializer s = new JSONSerializer();
            schema = s.serializeObjectSchema(cmd.getValue());
        }
        
        // Output empty form to POST for this command.
        String formId = clientId + "_form";
        writer.startElement("form", null);
        writer.writeAttribute("id", formId, null);
        writer.endElement("form");
        
        // Output script tag to update whenever we run a load command.
        String scriptId = clientId + "_script";
        writer.startElement("script", null);
        writer.writeAttribute("id", scriptId, null);
        writer.endElement("script");

        // Request parameters to send in post backs.
        StringBuilder paramsBuilder = new StringBuilder();
        paramsBuilder.append("[")
                .append("{ name: '").append(clientId).append("_reload'").append(", value: true },")
                .append("{ name: 'key', value: ").append(cmd.getKey()).append("}")
                .append("]");
        
        startScript(writer, clientId);

        writer.write("window." + cmd.resolveWidgetVar() + " = null;");
   
        // Create DB schema
        writer.write("window." + cmd.resolveWidgetVar() + "_schema = generatePersistenceSchema(");
        writer.write(schema);
        writer.write(", '");
        writer.write(cmd.resolveWidgetVar());
        writer.write("');");
        
        writer.write("function " + cmd.getName() + "(){ ");
        
        // Setup the widget.
        writer.write(MessageFormat.format("PrimeFaces.Utils.ajaxBeanLoad(''{0}'', ''{1}'', {2}, {3}, ''{5}'', {6});",
                new Object[] {
                    formId,
                    scriptId,
                    paramsBuilder.toString(),
                    "window." + cmd.resolveWidgetVar() + "_schema",
                    cmd.resolveWidgetVar(),
                    onComplete.toString()
                }));

        writer.write("}");
        
        endScript(writer);
    }
}
