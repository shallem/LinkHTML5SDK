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
package org.helix.mobile.component.loadcommand;

import java.io.IOException;
import java.lang.reflect.Constructor;
import java.lang.reflect.Method;
import java.security.MessageDigest;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.el.ValueExpression;
import javax.faces.FacesException;
import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import javax.servlet.http.HttpServletRequest;
import org.helix.mobile.model.JSONSerializer;
import org.helix.mobile.filters.LoadCommandAction;
import org.primefaces.renderkit.CoreRenderer;

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
    
    public static String generateLoadCommandKey(Class c, 
            Method loadMethod, 
            Method getMethod) throws IOException {
        String key = null;
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            md.update(c.getCanonicalName().getBytes());
            md.update(loadMethod.getName().getBytes());
            md.update(getMethod.getName().getBytes());
            byte[] b = md.digest();
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < b.length; i++) {
                sb.append(Integer.toString((b[i] & 0xff) + 0x100, 16).substring(1));
            }
            key = sb.toString();
        } catch(Exception e) {
            throw new IOException("Could not generate key for load command.");
        }
        
        //context.getExternalContext().getApplicationMap().put(key, new LoadCommandAction(key, beanName, c, ctor, loadMethod, getMethod));
        return key;
    }
    
    @SuppressWarnings("unchecked")
    public static <T> T findBean(String beanName) {
        FacesContext context = FacesContext.getCurrentInstance();
        return (T) context.getApplication().evaluateExpressionGet(context, "#{" + beanName + "}", Object.class);
    }
    
    protected String resolveCommand(FacesContext context,
            String loadCommandName,
            ValueExpression valE,
            javax.el.MethodExpression commandExpr,
            StringBuilder loadMethodName,
            StringBuilder getMethodNameRet) throws IOException {
        Matcher m = commandPattern.matcher(commandExpr.getExpressionString());
        if (m.matches()) {
            String beanName = m.group(1);
            String methodName = m.group(2);
            
            Object bean = LoadCommandRenderer.findBean(beanName);//context.getExternalContext().getRequestMap().get(beanName);
            if (bean != null) {
                Class<?> c = bean.getClass();
                Method loadMethod = null;
                try {
                    loadMethod = c.getMethod(methodName, new Class[]{ HttpServletRequest.class });
                } catch (Exception e) {
                    
                }
                if (loadMethod == null) {
                    throw new IOException(methodName + " used as the load method for command " + loadCommandName + 
                            " must refer to a 1 argument method whose argument is an HttpServletRequest of the bean of type " + c.getName());
                }
                loadMethodName.append(methodName);
                
                Method getMethod = null;
                String valStr = valE.getExpressionString();
                Matcher getM = commandPattern.matcher(valStr);
                String getMethodName;
                if (getM.matches()) {
                    getMethodName = getM.group(2);
                    
                    /* Convert getMethodName to a getter by capitalizing the first letter and prefixing
                     * with "get".
                     */
                    getMethodName = "get" + getMethodName.substring(0, 1).toUpperCase() + getMethodName.substring(1);
                    try {
                        getMethod = c.getMethod(getMethodName, new Class[]{});
                    } catch(Exception e) {
                        
                    }
                } else {
                    throw new IOException("Failed to parse value expression: " + valE.getExpressionString());
                }
                if (getMethod == null) {
                    throw new IOException("Failed to find method " + valStr + " corresponding to value attribute for class " + c.getName());
                }
                getMethodNameRet.append(getMethodName);
                
                Object thisObject = null;
                Constructor constr = null;
                try {
                    constr = c.getConstructor(new Class[]{ HttpServletRequest.class });
                } catch(Exception e) {
                    
                }
                if (constr == null) {
                    throw new IOException(c.getName() + " must have a 1 argument constructor whose argument is an HttpServletRequest.");
                }
                
                return generateLoadCommandKey(c, loadMethod, getMethod);
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
        
        String url = context.getExternalContext().getRequestContextPath() + 
                //context.getExternalContext().getRequestServletPath() +
                "/__hxload/index.xhtml";
        
        StringBuilder onComplete = new StringBuilder();
        if (cmd.getOncomplete() != null) {
            onComplete.append("function (itemKey, commandName, obj, isAggregate, param, loadOptions) {").append(cmd.getOncomplete()).append("}");
        } else {
            onComplete = null;
        }
        
        StringBuilder onStart = new StringBuilder();
        if (cmd.getOnstart() != null) {
            onStart.append("function (commandName) { ").append(cmd.getOnstart()).append("}");
        } else {
            onStart = null;
        }
        
        Object v = cmd.getValue();
        
        if (v == null) {
            throw new FacesException("LoadCommand '" + 
                    cmd.getName() + 
                    "': The value getter cannot ever return null. Return an empty object of the proper return type if no data is available.");
        }
        String schema = JSONSerializer.serializeObjectSchema(v.getClass());
        
        // Global variables populated by this load.
        String widgetName = "window." + cmd.resolveWidgetVar();
        
        // NOTE: must call this AFTER we call cmd.getValue above to create the request-scoped
        // bean. Otherwise this method will throw a null pointer exception.
        StringBuilder loadMethod = new StringBuilder();
        StringBuilder getMethod = new StringBuilder();
        String keyVal = this.resolveCommand(context, cmd.getName(), cmd.getValueExpression("value"), cmd.getCmd(),
                loadMethod, getMethod);
        
        writer.write("\n");
        startScript(writer, clientId);
        writer.write(widgetName + " = null;");
        writer.write("Helix.Ajax.loadCommands['" + cmd.getName() + "'] = {");
        writer.write(" 'name' : '" + cmd.resolveWidgetVar() + "',");
        if (onComplete != null) {
            writer.write(" 'oncomplete' : " + onComplete.toString() + ",");
        }
        if (onStart != null) {
            writer.write(" 'onstart' : " + onStart.toString() + ",");
        }
        if (cmd.getOnerror() != null) {
            writer.write(" 'onerror' : " + cmd.getOnerror() + ",");
        } else {
            writer.write(" 'onerror' : Helix.Ajax.defaultOnError,");
        }
        writer.write(" 'schemaFactory' : " + cmd.getName() + "_genSchema,");
        writer.write(" 'loadingOptions' : {");
        writer.write(" 'message' : '" + (cmd.getLoadingMessage() != null ? cmd.getLoadingMessage() : "") + "', ");
        writer.write(" 'color' : '"  + (cmd.getLoadingColor() != null ? cmd.getLoadingColor() : "") + "', ");
        writer.write(" 'async' : " + (cmd.isLoadingAsync()) + ", ");
        writer.write(" 'theme' : '" + (cmd.getLoadingTheme() != null ? cmd.getLoadingTheme() : "") + "'");
        writer.write("},");
        if (cmd.getSyncingMessage() != null) {
            writer.write(" 'syncingOptions' : {");
            writer.write(" 'message' : '" + (cmd.getSyncingMessage() != null ? cmd.getSyncingMessage() : "") + "', ");
            writer.write(" 'theme' : '" + (cmd.getLoadingTheme() != null ? cmd.getLoadingTheme() : "") + "'");
            writer.write("},");
        }
        writer.write(" 'requestOptions' : {");
        writer.write(" 'loadKey' : '" + keyVal + "',");
        writer.write(" 'loadMethod' : '" + loadMethod.toString() + "',");
        writer.write(" 'getMethod' : '" + getMethod.toString() + "',");
        writer.write(" 'postBack' : '" + url + "',");
        writer.write("},");
        writer.write(" 'syncOverrides' : {");
        boolean needsComma = false;
        if (cmd.getSyncFieldsOverride() != null) {
            writer.append(" 'syncFields' : " + cmd.getSyncFieldsOverride());
            needsComma = true;
        }
        if (cmd.getRefineOverride() != null) {
            if (needsComma) {
                writer.append(",");
            } else {
                needsComma = true;
            }
            writer.append(" 'refineEntityArray' : " + cmd.getRefineOverride());
        }
        if (cmd.getAddHook() != null) {
            if (needsComma) {
                writer.append(",");
            } else {
                needsComma = true;
            }
            writer.append(" 'addHook' : " + cmd.getAddHook());
        }
        if (cmd.getDeleteHook() != null) {
            if (needsComma) {
                writer.append(",");
            }
            writer.append(" 'deleteHook' : " + cmd.getDeleteHook());
        }
        if (cmd.getUpdateHook() != null) {
            if (needsComma) {
                writer.append(",");
            }
            writer.append(" 'updateHook' : " + cmd.getUpdateHook());
        }
        writer.write("}");
        writer.write("};\n");
        
        writer.write("function " + cmd.getName() + "_load(schemaObj, options, itemKey){ ");
        writer.write("var loadCommandOptions = Helix.Ajax.loadCommands['" + cmd.getName() + "'];");
        writer.write("loadCommandOptions.schema = schemaObj;");
        
        // Setup the widget.
        writer.write("Helix.Ajax.ajaxBeanLoad($.extend({}, loadCommandOptions, options), itemKey);");

        writer.write("}");
        
        // When the load command runs, first generate the schema if we have not done so yet. 
        // Then, oncomplete, call the load function.
        writer.write("function " + cmd.getName() + "(options, itemKey){ ");
        writer.write("if (Helix.Ajax.loadInProgress('" + cmd.resolveWidgetVar() + "')) return false;");
        writer.write(cmd.getName() + "_genSchema(");
        writer.write(cmd.getName() + "_load,");
        writer.write("[options, itemKey]);");
        
        writer.write("return true; }\n");
        
        writer.write("function " + cmd.getName() + "_genSchema(callback,args,noSync) {");
        writer.write("Helix.DB.generatePersistenceSchema(");
        writer.write(schema);
        writer.write(", '");
        writer.write(cmd.resolveWidgetVar());
        writer.write("',callback,args,0,noSync);");
        writer.write("}");
        
        writer.write("$(document).on('hxGenerateSchemas', function() {" + cmd.getName() + "_genSchema(null, null, true); });");
        endScript(writer);
    }
}
