/*
 * Copyright 2015 Mobile Helix, Inc.
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
package org.helix.mobile.component.outputschema;

import java.io.IOException;
import java.io.StringWriter;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.faces.FacesException;
import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.render.Renderer;
import org.helix.mobile.component.page.PageRenderer;
import org.helix.mobile.model.JSONSerializer;

/**
 *
 * @author Seth
 */
public class OutputSchemaRenderer extends Renderer {
    
    @Override
    public void encodeBegin(FacesContext context, UIComponent component) throws IOException {
        OutputSchema os = (OutputSchema) component;
        this.encodeScript(context, os);
    }
    
     protected void encodeScript(FacesContext context, OutputSchema os) throws IOException {
        Class<?> c = null;
        try {
            c = Class.forName(os.getName(), true, Thread.currentThread().getContextClassLoader());
        } catch (ClassNotFoundException ex) {
            Logger.getLogger(OutputSchemaRenderer.class.getName()).log(Level.SEVERE, "The class " + os.getName() + " was not found in the class loader.", ex);
            throw new FacesException("OutputSchema '" + 
                    os.getName() + 
                    "': The class was not found in the context class loader.");
        }
        if (c == null) {
            throw new FacesException("OutputSchema '" + 
                    os.getName() + 
                    "': The class was not found in the context class loader.");
        }
        String schema = JSONSerializer.serializeObjectSchema(c);        
        
        
        StringWriter writer = new StringWriter(4096);
        writer.write("Helix.Ajax.loadSchemas['" + os.getName() + "'] = ");
        writer.write(schema);
        writer.write(";\n");
        PageRenderer.renderLoadCommand(context, os, writer.toString());
    }
}
