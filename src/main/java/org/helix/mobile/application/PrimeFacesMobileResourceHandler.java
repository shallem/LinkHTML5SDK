/*
 * Copyright 2011-2012 PrimeFaces Extensions.
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
 *
 * $Id: PrimeFacesExtensionsResourceHandler.java 1449 2012-09-17 19:15:08Z ovaraksin@googlemail.com $
 */
package org.helix.mobile.application;

import javax.faces.application.ProjectStage;
import javax.faces.application.Resource;
import javax.faces.application.ResourceHandler;
import javax.faces.application.ResourceHandlerWrapper;
import javax.faces.context.FacesContext;
import org.helix.mobile.util.Constants;
import org.helix.mobile.util.ContextParametersProvider;

/**
 * {@link ResourceHandlerWrapper} which wraps PrimeFaces Extensions resources
 * and appends the version of PrimeFaces Extensions in the
 * {@link PrimeFacesExtensionsResource}.
 *
 * @author Thomas Andraschko / last modified by $Author:
 * ovaraksin@googlemail.com $
 * @version $Revision: 1449 $
 * @since 0.1
 */
public class PrimeFacesMobileResourceHandler extends ResourceHandlerWrapper {

    private final ResourceHandler wrapped;
    private static final String pmmVerString = ";pmmVer=";

    public PrimeFacesMobileResourceHandler(final ResourceHandler resourceHandler) {
        super();

        wrapped = resourceHandler;
    }

    @Override
    public ResourceHandler getWrapped() {
        return wrapped;
    }

    @Override
    public Resource createResource(final String resourceName, final String libraryName) {
        String versionName = null;
        String finalResourceName = resourceName;
        int versionNameIdx = resourceName.indexOf(pmmVerString);
        if (versionNameIdx != -1) {
            versionName = resourceName.substring(versionNameIdx + pmmVerString.length());
            finalResourceName = resourceName.substring(0, versionNameIdx);
        }

        Resource resource = super.createResource(finalResourceName, libraryName);
        if (resource != null && libraryName != null) {
            if (libraryName.equalsIgnoreCase("helix")) {
                if (deliverUncompressedFile(resourceName)) {
                    //get uncompressed resource if project stage == development
                    resource = super.createResource(resourceName, Constants.LIBRARY_UNCOMPRESSED);
                }
                
                resource = new PrimeFacesMobileResource(resource);
            } else if (versionName != null) {
                resource = new PrimeFacesMobileResource(resource, versionName);
            }
        }

        return resource;
    }

    protected boolean deliverUncompressedFile(final String resourceName) {
        final FacesContext context = FacesContext.getCurrentInstance();

        if (ContextParametersProvider.getInstance().isDeliverUncompressedResources()
                && context.isProjectStage(ProjectStage.Development)) {

            if (resourceName.endsWith(Constants.EXTENSION_CSS) || 
                    resourceName.endsWith(Constants.EXTENSION_JS)) {
                return ContextParametersProvider.getInstance().isDeliverUncompressedResources();
            }
        }

        return false;
    }
}
