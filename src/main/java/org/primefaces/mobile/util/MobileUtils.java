/*
 * Copyright 2009-2012 Prime Teknoloji.
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
package org.primefaces.mobile.util;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import javax.faces.context.FacesContext;

public class MobileUtils {
    
    public static String buildNavigation(String value) {
        String outcome = value;
        
        //convert href outcomes to pm outcomes
        if(outcome.startsWith("#")) {
            outcome = outcome.replace("#", "pm:");
        }
        
        String viewMeta = outcome.split("pm:")[1];
        int optionsIndex = viewMeta.indexOf("?");
        String viewName = (optionsIndex == -1) ? viewMeta : viewMeta.substring(0, optionsIndex);

        StringBuilder command = new StringBuilder();
        command.append("PrimeFaces.navigate('#").append(viewName).append("',{");

        //parse navigation options like reverse and transition
        if(optionsIndex != -1) {
            String[] paramStrings = viewMeta.substring(optionsIndex + 1, viewMeta.length()).split("&");
            Map<String,String> params = new HashMap<String, String>();

            for(String paramString : paramStrings) {
                String[] tokens = paramString.split("=");
                params.put(tokens[0], tokens[1]);
            }

            for(Iterator<String> it = params.keySet().iterator(); it.hasNext();) {
                String name = it.next();

                command.append(name).append(":").append("'").append(params.get(name)).append("'");

                if(it.hasNext())
                    command.append(",");
            }
        }

        command.append("});");
        
        return command.toString();
    }
    
    public static boolean isMini(FacesContext context) {
        return context.getAttributes().containsKey(Constants.MINI_FORMS);
    }
}