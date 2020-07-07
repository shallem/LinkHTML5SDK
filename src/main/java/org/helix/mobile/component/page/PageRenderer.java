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
package org.helix.mobile.component.page;

import java.io.IOException;
import java.util.List;
import java.util.ListIterator;
import java.util.Map;
import javax.faces.application.ProjectStage;
import javax.faces.component.UIComponent;
import javax.faces.component.UIOutput;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import javax.faces.render.Renderer;
import javax.servlet.http.HttpServletRequest;
import org.helix.mobile.component.loadcommand.LoadCommandScriptRenderer;

public class PageRenderer extends Renderer {

    public static final String HelixLibraryName = "helix";
    
    @Override
    public void encodeBegin(FacesContext context, UIComponent component) throws IOException {        
        ResponseWriter writer = context.getResponseWriter();
        Page page = (Page) component;
        UIComponent config = page.getFacet("config");
        UIComponent preinit = page.getFacet("preinit");
        UIComponent postinit = page.getFacet("postinit");
        
        writer.write("<!DOCTYPE html>\n");
        writer.startElement("html", page);
        if(page.getManifest() != null) {
            writer.writeAttribute("manifest", page.getManifest(), "manifest");
        }
        
        writer.startElement("head", page);
        
        //viewport meta
        writer.startElement("meta", null);
        writer.writeAttribute("name", "viewport", null);
        //writer.writeAttribute("content", "initial-scale=1.0", null);
        writer.writeAttribute("content", page.getViewport(), null);
        writer.endElement("meta");
        
        // Disable built-in iOS telephone/email detection.
        writer.startElement("meta", null);
        writer.writeAttribute("name", "format-detection", null);
        writer.writeAttribute("content", "telephone=no", null);
        writer.endElement("meta");

        writer.startElement("title", null);
        writer.write(page.getTitle());
        writer.endElement("title");
        
        // Get rid of favicon requests
        // <link rel="icon" href="data:;base64,iVBORw0KGgo=">
        writer.startElement("link", null);
        writer.writeAttribute("rel", "icon", null);
        writer.writeAttribute("href", "data:;base64,iVBORw0KGgo=", null);
        writer.endElement("link");
        
        if(preinit != null) {
            preinit.encodeAll(context);
        }
        
        
        // jQuery first
        if (context.isProjectStage(ProjectStage.Development)) {
            renderResource(context, "jquery-2.0.2.js", "javax.faces.resource.Script", HelixLibraryName, null);
        } else {
            renderResource(context, "jquery-2.0.2.min.js", "javax.faces.resource.Script", HelixLibraryName, null);
        }
        
        // config options; must happen before we include jQuery Mobile, otherwise
        // we miss the mobileinit event.
        writer.startElement("script", null);
        writer.writeAttribute("type", "text/javascript", null);
        
        String userAgent = ((HttpServletRequest)FacesContext.getCurrentInstance().getExternalContext().getRequest()).getHeader("User-Agent");
        if (userAgent != null) {
            writer.write("var __hxUserAgent = '" + userAgent + "';");
        }
        
        // Initialize jQuery Mobile
        writer.write("$(document).bind('mobileinit', function(){");
        writer.write("$.mobile.ajaxEnabled = false;");
        //writer.write("$.mobile.linkBindingEnabled = false;");
        writer.write("$.mobile.hashListeningEnabled = false;");
        writer.write("$.mobile.pushStateEnabled = false;");
        
        // Highlighting a button blue when you tap on it is not an iOS friendly way of doing things
        // This allows us to apply custom styling.
        writer.write("$.mobile.activeBtnClass = 'hx-btn-active';");
        
        if(page.getLoadingMessage() != null) {
            writer.write("$.mobile.loadingMessage = '" + page.getLoadingMessage() + "';");
        }
        if(page.getDefaultPageTransition() != null) {
            writer.write("$.mobile.defaultPageTransition = '" + page.getDefaultPageTransition() + "';");
        }
        if(page.getDefaultDialogTransition() != null) {
            writer.write("$.mobile.defaultDialogTransition = '" + page.getDefaultDialogTransition() + "';");
        }
        
        if(config != null) {
            config.encodeAll(context);
        }
        
        writer.write("});");
        
        writer.endElement("script");
        
        // Then override with pf-mobile content.
        renderResource(context, "helix-mobile-full.css", "javax.faces.resource.Stylesheet", HelixLibraryName, null);
        //renderResource(context, "css/helix.overrides.css", "javax.faces.resource.Stylesheet", HelixLibraryName, null);
        renderResource(context, "cordova-full.js", "javax.faces.resource.Script", HelixLibraryName, null);
        renderResource(context, "helix-mobile-full.js", "javax.faces.resource.Script", HelixLibraryName, null);
        
        writer.startElement("script", null);
        writer.writeAttribute("type", "text/javascript", null);
        
        // Set a global variable with the context root.
        writer.write("$(document).on('cordovaReady', function() { Helix.contextRoot = '" + context.getExternalContext().getRequestContextPath() + "'; });");
        
        writer.endElement("script");
        
        // Registered resources - from primefaces
        ListIterator<UIComponent> iter = (context.getViewRoot().getComponentResources(context, "head")).listIterator();
        while (iter.hasNext()) {
            writer.write("\n");
            UIComponent resource = (UIComponent) iter.next();
            resource.encodeAll(context);
        }

        // Then handle the user's postinit facet.
        if(postinit != null) {
            List<UIComponent> children = postinit.getChildren();
            for (UIComponent postinitChild : children) {
                postinitChild.encodeAll(context);
            }
        }
        writer.endElement("head");

        writer.startElement("body", page);
        writer.writeAttribute("style", "overflow: hidden;", null);
    }

    @Override
    public void encodeEnd(FacesContext context, UIComponent component) throws IOException {
        ResponseWriter writer = context.getResponseWriter();
        Page page = (Page) component;
        
        context.getRenderKit().addRenderer("javax.faces.Output", LoadCommandScriptRenderer.class.getCanonicalName(), new LoadCommandScriptRenderer());
        writer.startElement("script", null);
        writer.writeAttribute("type", "text/javascript", null);
        writer.write("$(document).on('ready', function() {");
        // Find all load commands
        ListIterator<UIComponent> iter = (context.getViewRoot().getComponentResources(context, "loadcommand")).listIterator();
        while (iter.hasNext()) {
            writer.write("\n");
            UIComponent resource = (UIComponent) iter.next();
            resource.encodeAll(context);
        }
        
        // Find all dialogs
        iter = (context.getViewRoot().getComponentResources(context, "dialog")).listIterator();
        while (iter.hasNext()) {
            writer.write("\n");
            UIComponent resource = (UIComponent) iter.next();
            resource.encodeAll(context);
        }
        writer.write("\n");
        writer.write("$(document).trigger('hxLayoutDone');");
        writer.write("});");
        writer.endElement("script");

        writer.endElement("body");
        writer.endElement("html");

    }

    public static void renderResource(FacesContext context, 
            String resourceName, 
            String renderer, 
            String library,
            String versionName) throws IOException {
        UIOutput resource = new UIOutput();
        resource.setRendererType(renderer);

        Map<String, Object> attrs = resource.getAttributes();
        if (versionName != null) {
            resourceName = resourceName + ";pmmVer=" + versionName;
        }
        attrs.put("name", resourceName);
        attrs.put("library", library);
        attrs.put("target", "head");
        
        resource.encodeAll(context);
    }
    
    public static void renderLoadCommand(FacesContext context,
            UIComponent component,
            String cmdContents) {
        UIOutput resource = new UIOutput();
        resource.setRendererType(LoadCommandScriptRenderer.class.getCanonicalName());

        Map<String, Object> attrs = resource.getAttributes();
        attrs.put("script", cmdContents);
        
        context.getViewRoot().addComponentResource(context, resource, "loadcommand");
    }
    
    public static void renderDialog(FacesContext context,
            UIComponent component,
            String cmdContents) {
        UIOutput resource = new UIOutput();
        resource.setRendererType(LoadCommandScriptRenderer.class.getCanonicalName());

        Map<String, Object> attrs = resource.getAttributes();
        attrs.put("script", cmdContents);
        
        context.getViewRoot().addComponentResource(context, resource, "dialog");
    }
}
