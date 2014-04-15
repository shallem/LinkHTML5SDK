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
package org.helix.mobile.component.outputscript;

import java.io.IOException;
import javax.faces.application.ProjectStage;
import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import org.helix.mobile.component.page.PageRenderer;
import org.primefaces.renderkit.CoreRenderer;

public class OutputScriptRenderer extends CoreRenderer {
    @Override
    public void encodeEnd(FacesContext context, UIComponent component) throws IOException {
        OutputScript os = (OutputScript) component;
        
        if (os.getPhase() != null) {
            if (os.getPhase().equalsIgnoreCase("DEVELOPMENT") &&
                    !context.isProjectStage(ProjectStage.Development)) {
                // Skip
                return;
            } else if (os.getPhase().equalsIgnoreCase("PRODUCTION") &&
                    !context.isProjectStage(ProjectStage.Production)) {
                // Skip
                return;
            }
        }
        
        PageRenderer.renderResource(context, 
                os.getName(), 
                "javax.faces.resource.Script", 
                os.getLibrary(), 
                os.getVersion());
        //context.getViewRoot().addComponentResource(context, component, "clientscript");
    }
}
