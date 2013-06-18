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
package org.primefaces.mobile.component.loadcommand;

import java.io.IOException;
import java.lang.reflect.Constructor;
import java.lang.reflect.Method;
import java.security.MessageDigest;
import java.text.MessageFormat;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.el.ValueExpression;
import javax.faces.FacesException;
import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import org.primefaces.mobile.model.JSONSerializer;
import org.primefaces.mobile.model.LoadCommandAction;
import org.primefaces.renderkit.CoreRenderer;
import org.primefaces.util.ComponentUtils;

public class LoadCommandRenderer extends CoreRenderer {

    private Pattern commandPattern;
    
    public LoadCommandRenderer() {
        commandPattern = Pattern.compile("#\\{([^.]+)\\.([^\\(]+).*\\}");
    }
    
    @Override
    public void encodeEnd(FacesContext context, UIComponent component) throws IOException {
        LoadCommand cmd = (LoadCommand) component;
        this.encodeScript(context, cmd);
    }
    
    protected String saveLoadCommand(FacesContext context, 
            Class c, 
            Constructor ctor, 
            Method loadMethod, 
            Method getMethod) throws IOException {
        String key = null;
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            md.update(c.getCanonicalName().getBytes());
            md.update(loadMethod.getName().getBytes());
            md.update(getMethod.getName().getBytes());
            byte[] b = md.digest();
            key = new String(b);
        } catch(Exception e) {
            throw new IOException("Could not generate key for load command.");
        }
        
        context.getExternalContext().getApplicationMap().put(key, new LoadCommandAction(key, ctor, loadMethod, getMethod));
        return key;
    }
    
    protected String resolveCommand(FacesContext context, 
            LoadCommand cmd) throws IOException {
        Object val = cmd.getValue();
        ValueExpression valE = cmd.getValueExpression("value");
        
        javax.el.MethodExpression commandExpr = cmd.getCmd();
        Matcher m = commandPattern.matcher(commandExpr.getExpressionString());
        if (m.matches()) {
            String beanName = m.group(1);
            String methodName = m.group(2);
            
            Object bean = context.getExternalContext().getRequestMap().get(beanName);
            if (bean != null) {
                Class<?> c = bean.getClass();
                Method loadMethod = null;
                try {
                    loadMethod = c.getMethod(methodName, new Class[]{});
                } catch (Exception e) {
                    
                }
                if (loadMethod == null) {
                    throw new IOException(methodName + " must refer to a 0 argument method of the bean of type " + c.getName());
                }
                
                Method getMethod = null;
                Matcher getM = commandPattern.matcher(valE.getExpressionString());
                if (getM.matches()) {
                    String getMethodName = getM.group(2);
                    try {
                        getMethod = c.getMethod(getMethodName, new Class[]{});
                    } catch(Exception e) {
                        
                    }
                } else {
                    throw new IOException("Failed to parse value expression: " + valE.getExpressionString());
                }
                if (getMethod == null) {
                    throw new IOException("Failed to find method corresponding to value attribute for class " + c.getName());
                }
                
                
                Object thisObject = null;
                Constructor constr = null;
                try {
                    constr = c.getConstructor(new Class[]{});
                    thisObject = constr.newInstance(new Object[]{});
                } catch(Exception e) {
                    
                }
                if (thisObject == null) {
                    throw new IOException(c.getName() + " must have a 0 argument constructor.");
                }
                
                return this.saveLoadCommand(context, c, constr, loadMethod, getMethod);
            } else {
                throw new IOException(beanName + " must refer to a JSF request-scoped bean.");
            }
        } else {
            throw new IOException("Invalid format for the command argument. It must have the form bean.method() or bean.method.");
        }
    }
    
    protected void encodeScript(FacesContext context, LoadCommand cmd) throws IOException {
        ResponseWriter writer = context.getResponseWriter();
        String clientId = cmd.getClientId();
        UIComponent form = (UIComponent) ComponentUtils.findParentForm(context, cmd);
        if(form == null) {
            throw new FacesException("LoadCommand '" + cmd.getName() + "'must be inside a form.");
        }
        
        StringBuilder onComplete = new StringBuilder();
        if (cmd.getOncomplete() != null) {
            onComplete.append("function (itemKey, statusText) {").append(cmd.getOncomplete()).append("}");
        } else {
            onComplete.append("null");
        }
       
        Object v = cmd.getValue();
        JSONSerializer s = new JSONSerializer();
        if (v == null) {
            throw new FacesException("LoadCommand '" + 
                    cmd.getName() + 
                    "': The value getter cannot ever return null. Return an empty object of the proper return type if no data is available.");
        }
        String schema = s.serializeObjectSchema(v.getClass());
        
        // Global variables populated by this load.
        String widgetName = "window." + cmd.resolveWidgetVar();
        
        // NOTE: must call this AFTER we call cmd.getValue above to create the request-scoped
        // bean. Otherwise this method will throw a null pointer exception.
        String keyVal = this.resolveCommand(context, cmd);
        
        writer.write("\n");
        startScript(writer, clientId);
        writer.write(widgetName + " = null;");
   
        writer.write("function " + cmd.getName() + "_load(schemaObj, params, itemKey){ ");
        
        writer.write("var loadingOptions = {");
        writer.write(" 'message' : '" + (cmd.getLoadingMessage() != null ? cmd.getLoadingMessage() : "") + "', ");
        writer.write(" 'theme' : '" + (cmd.getLoadingTheme() != null ? cmd.getLoadingTheme() : "") + "'");
        writer.write("};\n");
        
        writer.write("var requestOptions = {");
        writer.write(" 'loadKey' : '" + keyVal + "',");
        writer.write(" 'params' : params ");
        writer.write("};\n");
        
        writer.write("var syncOverrides = {");
        if (cmd.getSyncFieldsOverride() != null) {
            writer.append(" 'syncFields' : " + cmd.getSyncFieldsOverride());
        }
        writer.write("};\n");
        
        // Setup the widget.
        writer.write(MessageFormat.format("Helix.Ajax.ajaxBeanLoad(requestOptions, loadingOptions, syncOverrides, ''{0}'', schemaObj, {1}, itemKey);",
                new Object[] {
                    cmd.resolveWidgetVar(),
                    onComplete.toString()
                }));

        writer.write("}");
        
        // When the load command runs, first generate the schema if we have not done so yet. 
        // Then, oncomplete, call the load function.
        writer.write("function " + cmd.getName() + "(params, itemKey){ ");
        
        writer.write("Helix.DB.generatePersistenceSchema(");
        writer.write(schema);
        writer.write(", '");
        writer.write(cmd.resolveWidgetVar());
        writer.write("',");
        writer.write(cmd.getName());
        writer.write("_load,");
        writer.write("[params, itemKey]);");
        
        writer.write("}");
        
        endScript(writer);
    }
}