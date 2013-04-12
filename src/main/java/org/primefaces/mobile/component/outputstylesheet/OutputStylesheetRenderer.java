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
package org.primefaces.mobile.component.outputstylesheet;

import java.io.IOException;
import java.text.MessageFormat;
import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import org.primefaces.renderkit.CoreRenderer;

public class OutputStylesheetRenderer extends CoreRenderer {

    @Override
    public void encodeEnd(FacesContext context, UIComponent component) throws IOException {
        OutputStylesheet os = (OutputStylesheet) component;
        /*PageRenderer.renderResource(context, 
                os.getName(), 
                "javax.faces.resource.Stylesheet", 
                os.getLibrary(), 
                os.getVersion());*/
        String resourceName = os.getName();
        if (os.getVersion() != null) {
            resourceName = resourceName + ";pmmVer=" + os.getVersion();
        }
        
        ResponseWriter writer = context.getResponseWriter();
        writer.startElement("link", os);
        writer.writeAttribute("href", 
                MessageFormat.format("{0}/faces/javax.faces.resources/{1}?ln={2}", 
                    context.getExternalContext().getRequestContextPath(), 
                    resourceName, 
                    os.getLibrary()), 
                null);
        writer.writeAttribute("type", "text/css", null);
        writer.writeAttribute("rel", "stylesheet", null);
        
        StringBuilder mediaValue = new StringBuilder();
        if (os.getMaxwidth() != 0) {
            mediaValue.append("and (max-device-width: ")
                    .append(Integer.toString(os.getMaxwidth()))
                    .append("px)");
        }
        if (os.getMinwidth() != 0) {
            mediaValue.append("and (min-device-width: ")
                    .append(Integer.toString(os.getMaxwidth()))
                    .append("px)");            
        }
        
        if (mediaValue.length() == 0 && os.getMedia() != null) {
            switch (os.getMedia()) {
                case "phone":
                    mediaValue.append("and (max-device-width: 480px)");
                    break;
                case "phone,phablet":
                    mediaValue.append("and (max-device-width: 767px)");
                    break;
                case "phablet,tablet":
                case "tablet":    
                    mediaValue.append("and (min-device-width: 481px)");
                    break;
                case "phablet":
                    mediaValue.append("and (min-device-width: 481px)");
                    mediaValue.append("and (max-device-width: 767px)");
                    break;
            }
        }
        
        if (mediaValue.length() > 0) {
            mediaValue.insert(0, "only screen ");
            writer.writeAttribute("media", mediaValue.toString(), null);
        }
        
        writer.endElement("link");
        //context.getViewRoot().addComponentResource(context, component, "styleoverride");
    }
}
