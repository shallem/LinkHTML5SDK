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
package org.helix.mobile.model;

import java.util.Map;
import java.util.TreeMap;

/**
 * Represents an "aggregate" object, which includes a list of component objects from
 * multiple individual load commands.
 * 
 * @author shallem
 */
public class AggregateObject {
    private Map<String, Object> aggregateMap;
    
    public AggregateObject() {
        this.aggregateMap = new TreeMap<String, Object>();
    }

    public Map<String, Object> getAggregateMap() {
        return aggregateMap;
    }
    
    public void addAggregateResult(String key, Object result) {
        this.aggregateMap.put(key, result);
    }
}
