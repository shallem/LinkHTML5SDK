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
 * $Id: $
 */

package org.helix.mobile.application;

import java.util.UUID;
import javax.faces.application.Resource;
import javax.faces.application.ResourceWrapper;
import org.apache.commons.lang3.StringUtils;
import org.helix.mobile.util.VersionProvider;

/**
 * {@link ResourceWrapper} which appends the version of the Link SDK to the URL.
 *
 * @author Thomas Andraschko / last modified by $Author: $
 * @version $Revision: $
 * @since 0.5
 */
public class PrimeFacesResource extends ResourceWrapper {

	private Resource wrapped;
	private String version;

	public PrimeFacesResource(final Resource resource) {
		super();
		wrapped = resource;
		// get current version
		if (StringUtils.isNotBlank(VersionProvider.getVersion())) {
			version = "&amp;v=" + VersionProvider.getVersion();
		} else {
			version = UUID.randomUUID().toString();
		}
	}

	@Override
	public Resource getWrapped() {
		return wrapped;
	}

	@Override
	public String getRequestPath() {
		return super.getRequestPath() + version;
	}

	@Override
	public String getContentType() {
		return getWrapped().getContentType();
	}

	@Override
	public String getLibraryName() {
		return getWrapped().getLibraryName();
	}

	@Override
	public String getResourceName() {
		return getWrapped().getResourceName();
	}

	@Override
	public void setContentType(final String contentType) {
		getWrapped().setContentType(contentType);
	}

	@Override
	public void setLibraryName(final String libraryName) {
		getWrapped().setLibraryName(libraryName);
	}

	@Override
	public void setResourceName(final String resourceName) {
		getWrapped().setResourceName(resourceName);
	}

	@Override
	public String toString() {
		return getWrapped().toString();
	}
}
