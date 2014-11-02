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
package org.helix.mobile.filters;

import java.io.IOException;
import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 *
 * @author shallem
 */
public class LoadCommandServlet extends HttpServlet {
    private static final Logger LOG = Logger.getLogger(LoadCommandServlet.class.getName());
    
    private HashMap<String, LoadCommandAction> commandMap;
    private Class loadCommandClass;
    private String loadCommandClassName;
    
    @Override
    public void doPost(HttpServletRequest req, HttpServletResponse res) throws IOException, ServletException {
        String loadKey = req.getParameter("__hxLoadKey");
        LoadCommandAction lca;
        if (loadKey != null) {
            lca = commandMap.get(loadKey);
            
            if (lca == null) {
                lca = this.resolveLoadCommand(loadKey, 
                        req.getParameter("__hxLoadMethod"), 
                        req.getParameter("__hxGetMethod"));   
            }
            
            String err = null;
            try {
                Object thisObj = lca.getCTOR().newInstance(req);
                lca.doLoad(thisObj, req);
                String jsonToReturn = lca.getAndSerialize(thisObj);
                res.setContentType("application/json");
                res.setCharacterEncoding("UTF-8");
                res.getWriter().write(jsonToReturn);
                res.flushBuffer();
            } catch(IOException ioe) {
                Logger.getLogger(LoadCommandListener.class.getName()).log(Level.SEVERE, null, ioe);
                err = "Error when writing to servlet response: " + ioe.getMessage();
            } catch (InstantiationException ie) {
                LOG.log(Level.SEVERE, "Failed to instantiate load command class.", ie);
                err = "Error instantiating load command class: " + ie.getMessage();
            } catch (IllegalAccessException ile) {
                LOG.log(Level.SEVERE, "Failed to instantiate load command class.", ile);
                err = "Error instantiating load command class: " + ile.getMessage();
            } catch (InvocationTargetException ite) {
                LOG.log(Level.SEVERE, "Failed to instantiate load command class.", ite);
                err = "Error instantiating load command class: " + ite.getMessage();
            }
            
            if (err != null) {
                try {
                    res.getWriter().write("{ \"error\" : \"" + err + "\" }");
                    res.flushBuffer();
                } catch (IOException ex) {
                    Logger.getLogger(LoadCommandListener.class.getName()).log(Level.SEVERE, null, ex);
                }
            }
        } else {
            
        }
    }

    private LoadCommandAction resolveLoadCommand(String loadKey,
            String loadMethodName,
            String getMethodName) throws IOException {
        if (this.loadCommandClass == null) {
            try {
                this.loadCommandClass = Class.forName(this.loadCommandClassName, true, Thread.currentThread().getContextClassLoader());
            } catch (ClassNotFoundException ex) {
                Logger.getLogger(LoadCommandServlet.class.getName()).log(Level.SEVERE, 
                        "Failed to lookup load command class. Check the name in your web.xml.", ex);
                throw new IOException("Failed to lookup load command class: " + this.loadCommandClassName);
            }
        }
        
        Method loadMethod = null;
        try {
            loadMethod = this.loadCommandClass.getMethod(loadMethodName, new Class[]{ HttpServletRequest.class });
        } catch (Exception e) {

        }
        if (loadMethod == null) {
            throw new IOException(loadMethodName + " must refer to a 0 argument method of the bean of type " + this.loadCommandClass.getName());
        }
        
        Method getMethod = null;
        try {
            getMethod = this.loadCommandClass.getMethod(getMethodName, new Class[]{});
        } catch(Exception e) {
                        
        }
        if (getMethod == null) {
            throw new IOException("Failed to find method " + getMethodName + " corresponding to value attribute for class " + this.loadCommandClass.getName());
        }
                
        Constructor constr = null;
        try {
            constr = this.loadCommandClass.getConstructor(new Class[]{ HttpServletRequest.class });
        } catch(Exception e) {

        }
        if (constr == null) {
            throw new IOException(this.loadCommandClass.getName() + " must have a 0 argument constructor.");
        }
                
        LoadCommandAction lca = new LoadCommandAction(loadKey, null, this.loadCommandClass, 
                constr, loadMethod, getMethod);
        this.commandMap.put(loadKey, lca);
        return lca;
    }
    
    @Override
    public void init() throws ServletException {
        this.loadCommandClassName = this.getServletConfig().getInitParameter("className");
        this.commandMap = new HashMap<String, LoadCommandAction>();
    }

    @Override
    public void destroy() {
        //throw new UnsupportedOperationException("Not supported yet.");
    }

}
