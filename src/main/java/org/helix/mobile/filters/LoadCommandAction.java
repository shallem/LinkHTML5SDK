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
import java.util.Date;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.faces.FacesException;
import javax.servlet.http.HttpServletRequest;
import org.helix.mobile.model.ClientWSResponse;
import org.helix.mobile.model.JSONSerializer;

/**
 *
 * @author shallem
 */
public class LoadCommandAction {
    private static final Logger LOG = Logger.getLogger(LoadCommandAction.class.getName());
    
    private final Constructor ctor;
    private final Method loader;
    private final Method getter;
    private Method errorGetter;
    private Method postConstruct;
    private final String beanName;
    private final String key;
    private final Class beanClass;
    
    public LoadCommandAction(String key,
            String beanName,
            Class c,
            Constructor ctor,
            Method loader,
            Method getter) {
        this.key = key;
        this.ctor = ctor;
        this.loader = loader;
        this.getter = getter;
        this.beanName = beanName;
        this.beanClass = c;
        
        for (Method m : c.getMethods()) {
            if (m.getAnnotation(javax.annotation.PostConstruct.class) != null) {
                this.postConstruct = m;
            } else if (m.getName().equals("getLastError")) {
                this.errorGetter = m;
            }
        }
    }
    
    public Object doLoad(Object thisObject, HttpServletRequest req) throws FacesException {
        /*Object thisObject = null;
        try {
            thisObject = ctor.newInstance(new Object[]{});
            if (this.postConstruct != null) {
                this.postConstruct.invoke(thisObject, new Object[]{});
            } 
        } catch(Exception e) {

        }
        if (thisObject == null) {
            throw new FacesException("Failed to construct object with constructor " + ctor.toString());
        }*/
        try {
            /* NOTE: we use an explicit list of catch blocks here so that application specific
             * exceptions are not caught. This is intentional.
             */
            Date startTime = new Date();
            loader.invoke(thisObject, new Object[] { req });
            Date endTime = new Date();
            
            LOG.log(Level.FINE, "Load completed in {0} seconds.", (endTime.getTime() - startTime.getTime()) / 1000);
        } catch (IllegalAccessException ex) {
            LOG.log(Level.SEVERE, null, ex);
            throw new FacesException("Failed to invoke loader: " + ex.getMessage());
        } catch (IllegalArgumentException ex) {
            LOG.log(Level.SEVERE, null, ex);
            throw new FacesException("Failed to invoke loader: " + ex.getMessage());
        } catch (InvocationTargetException ex) {
            LOG.log(Level.SEVERE, null, ex);
            LOG.log(Level.SEVERE, null, ex.getTargetException());
            
            throw new FacesException("Failed to invoke loader: " + ex.getTargetException().getLocalizedMessage());
        }
        return thisObject;
    }
    
    public String getAndSerialize(Object thisObject) throws IOException {
        Object gotten = null;
        try {
            /* First check to see if an error occurred. If so, return an error object. */
            if (this.errorGetter != null) {
                ClientWSResponse resp = (ClientWSResponse)this.errorGetter.invoke(thisObject, new Object[] {});
                if (resp != null) {
                    return "{ \"error\" : " + resp.toJSON() + "}";
                }
            }
            
            
            /* NOTE: we use an explicit list of catch blocks here so that application specific
             * exceptions are not caught. This is intentional.
             */
            Date startTime = new Date();
            gotten = getter.invoke(thisObject, new Object[] {});
            Date endTime = new Date();
            
            LOG.log(Level.FINE, "Get completed in {0} seconds.", (endTime.getTime() - startTime.getTime()) / 1000);
        } catch (IllegalAccessException ex) {
            LOG.log(Level.SEVERE, null, ex);
            throw new FacesException("Failed to invoke loader: " + ex.getMessage());
        } catch (IllegalArgumentException ex) {
            LOG.log(Level.SEVERE, null, ex);
            throw new FacesException("Failed to invoke loader: " + ex.getMessage());
        } catch (InvocationTargetException ex) {
            LOG.log(Level.SEVERE, null, ex);
            throw new FacesException("Failed to invoke loader: " + ex.getTargetException().getMessage());
        } catch (NoSuchMethodException nme) {
            LOG.log(Level.SEVERE, null, nme);
            throw new FacesException("Failed to invoke loader: " + nme.getMessage());
        }
        if (gotten != null) {
            JSONSerializer s = new JSONSerializer();
            try {
                /* NOTE: we use an explicit list of catch blocks here so that application specific
                 * exceptions are not caught. This is intentional.
                 */
                return s.serializeObject(gotten);
            } catch (IllegalAccessException ex) {
                LOG.log(Level.SEVERE, null, ex);
                throw new FacesException("Failed to invoke getter: " + ex.getMessage());
            } catch (IllegalArgumentException ex) {
                LOG.log(Level.SEVERE, null, ex);
                throw new FacesException("Failed to invoke getter: " + ex.getMessage());
            } catch (InvocationTargetException ex) {
                LOG.log(Level.SEVERE, null, ex);
                throw new FacesException("Failed to invoke loader: " + ex.getTargetException().getMessage());
            } catch (NoSuchMethodException ex) {
                LOG.log(Level.SEVERE, null, ex);
                throw new FacesException("Failed to invoke getter: " + ex.getMessage());
            }
        } else {
            return "{ 'error' : 'Failed to serialize object.' }";
        }
    }

    public String getBeanName() {
        return beanName;
    }

    public Class getBeanClass() {
        return beanClass;
    }
    
    public Constructor getCTOR() {
        return this.ctor;
    }
}
