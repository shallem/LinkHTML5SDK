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
import java.text.MessageFormat;
import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import org.primefaces.renderkit.CoreRenderer;

public class LoadCommandRenderer extends CoreRenderer {

    @Override
    public void encodeEnd(FacesContext context, UIComponent component) throws IOException {
        LoadCommand cmd = (LoadCommand) component;
        this.encodeScript(context, cmd);
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
        
        startScript(writer, clientId);

        writer.write("window." + cmd.resolveWidgetVar() + " = null;");
        writer.write("function " + cmd.getName() + "(){ ");
        
        // Setup the widget.
        writer.write(MessageFormat.format("PrimeFaces.Utils.ajaxJSONLoad(''{0}'', {1}, ''{2}'', {3}, {4});",
                new Object[] {
                    cmd.getUrl(),
                    cmd.getKey(),
                    cmd.resolveWidgetVar(),
                    onComplete.toString(),
                    cmd.getOfflineSave()
                }));

        writer.write("}");
        
        endScript(writer);
    }
}
