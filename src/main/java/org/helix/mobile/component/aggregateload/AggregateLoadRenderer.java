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
package org.helix.mobile.component.aggregateload;

import java.io.IOException;
import javax.faces.FacesException;
import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import org.helix.mobile.component.loadcommand.*;
import org.helix.mobile.model.AggregateObject;
import org.helix.mobile.model.JSONSerializer;
import org.helix.mobile.model.ParamObject;

public class AggregateLoadRenderer extends LoadCommandRenderer {
    
    public AggregateLoadRenderer() {
        super();
    }
    
    @Override
    public void encodeEnd(FacesContext context, UIComponent component) throws IOException {
        AggregateLoad cmd = (AggregateLoad) component;
        this.encodeScript(context, cmd);
    }
    
    protected void encodeScript(FacesContext context, AggregateLoad cmd) throws IOException {
        ResponseWriter writer = context.getResponseWriter();
        String clientId = cmd.getClientId();
        
        String url = context.getExternalContext().getRequestContextPath() + 
                //context.getExternalContext().getRequestServletPath() +
                "/__hxload/index.xhtml";
       
        Object v = cmd.getValue();
        if (v == null) {
            throw new FacesException("AggregateLoad '" + 
                    cmd.getName() + 
                    "': The value getter cannot ever return null. Return an empty object of the proper return type if no data is available.");
        }
        if (!(v instanceof AggregateObject) &&
                !(v instanceof ParamObject)) {
            throw new FacesException("AggregateLoad '" + 
                    cmd.getName() + 
                    "': An aggregate load command must return an instance of AggregateObject.");
        }
        
        // Global variables populated by this load.
        String widgetName = "window." + cmd.resolveWidgetVar();
        
        // NOTE: must call this AFTER we call cmd.getValue above to create the request-scoped
        // bean. Otherwise this method will throw a null pointer exception.
        StringBuilder loadMethodName = new StringBuilder();
        StringBuilder getMethodNameRet = new StringBuilder();
        String keyVal = this.resolveCommand(context, cmd.getName(),
                cmd.getValueExpression("value"), cmd.getCmd(),
                loadMethodName, getMethodNameRet);
        
        writer.write("\n");
        startScript(writer, clientId);
        writer.write(widgetName + " = null;");
   
        writer.write("function " + cmd.getName() + "(options){ ");
        writer.write("var loadCommandOptions = $.extend({");
        writer.write(" 'name' : '" + cmd.resolveWidgetVar() + "',");
        writer.write(" 'loadingOptions' : {");
        writer.write(" 'message' : '" + (cmd.getLoadingMessage() != null ? cmd.getLoadingMessage() : "") + "', ");
        writer.write(" 'theme' : '" + (cmd.getLoadingTheme() != null ? cmd.getLoadingTheme() : "") + "', ");
        writer.write(" 'color' : '" + (cmd.getLoadingColor() != null ? cmd.getLoadingColor() : "") + "'");
        writer.write("},");
        if (cmd.getSyncingMessage() != null) {
            writer.write(" 'syncingOptions' : {");
            writer.write(" 'message' : '" + (cmd.getSyncingMessage() != null ? cmd.getSyncingMessage() : "") + "', ");
            writer.write(" 'theme' : '" + (cmd.getLoadingTheme() != null ? cmd.getLoadingTheme() : "") + "'");
            writer.write("},");
        }
        writer.write(" 'requestOptions' : {");
        writer.write(" 'loadKey' : '" + keyVal + "',");
        writer.write(" 'loadMethod' : '" + loadMethodName.toString() + "',");
        writer.write(" 'getMethod' : '" + getMethodNameRet.toString() + "',");
        writer.write(" 'postBack' : '" + url + "'");
        writer.write("}");
        writer.write("}, options);\n");
        
        // Setup the widget.
        writer.write("Helix.Ajax.ajaxAggregateLoad(loadCommandOptions);");

        writer.write("}");
        
        endScript(writer);
    }
}