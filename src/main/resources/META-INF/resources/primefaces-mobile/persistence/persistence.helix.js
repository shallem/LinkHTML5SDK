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

/**
 * Integrates Persistence JS ORM with the PrimeFaces Mobile SDK.
 */

PrimeFaces.DB = {

    generatePersistenceFields: function(schemaTemplate,name,allVisited,recursiveFields,allSchemas) {
        var schemaFields = {};
        var subSchemas = {};

        var oneToMany = [];
        var manyToOne = [];
        var myRecursiveFields = [];

        // Check to see if this is a schema forward ref. If so, return null and 
        // let the caller fill in the actual schema after all peer fields have been
        // processed.
        if (schemaTemplate.__pm_schema_type == 1002) {
            return null;
        }

        for (var schemaField in schemaTemplate) {
            if (!schemaTemplate.hasOwnProperty(schemaField)) {
                continue;
            }
            if (schemaField === "__pm_sorts" ||
                schemaField === "__pm_key" ||
                schemaField === "__pm_schema_name" ||
                schemaField === "__pm_filters") {
                continue;
            } 
            var subSchema = schemaTemplate[schemaField];
            if (Object.prototype.toString.call(subSchema) === '[object Array]') {
                var elemSchema = this.generatePersistenceFields(subSchema[0],schemaField,allVisited,recursiveFields,allSchemas);
                if (elemSchema != null) {
                    subSchemas[schemaField] = elemSchema;
                    oneToMany.push({ "field" : schemaField, "table" : elemSchema.__pm_schema_name });
                } else {
                    myRecursiveFields.push({ 'schemaName': subSchema[0].__pm_schema_name, 'field' : schemaField, 'oneToMany' : true });
                }
            } else if (Object.prototype.toString.call(subSchema) === '[object Object]') {
                // This is a dependent object, which we assume is stored in another field.
                var fieldSchema = this.generatePersistenceFields(subSchema,schemaField,allVisited,recursiveFields,allSchemas);
                if (fieldSchema != null) {
                    subSchemas[schemaField] = fieldSchema;
                    manyToOne.push({ "field" : schemaField, "table" : fieldSchema.__pm_schema_name });
                } else {
                    myRecursiveFields.push({ 'schemaName' : subSchema.__pm_schema_name, 'field' : schemaField, 'oneToMany' : false });
                }
            } else {
                // Otherwise this is a scalar type and we handle all scalar types here mapping them
                // to SQLite data types. For now we don't support blob, but should add support
                // using HTML5's new support for binary data.
                if (Object.prototype.toString.call(subSchema) === '[object Date]') {
                    schemaFields[schemaField] = "DATE";
                } else if (Object.prototype.toString.call(subSchema) === '[object Boolean]') {
                    schemaFields[schemaField] = "BOOL";
                } else if (Object.prototype.toString.call(subSchema) === '[object String]') {
                    schemaFields[schemaField] = "TEXT";
                } else if (Object.prototype.toString.call(subSchema) === '[object Number]') {
                    if (Helix.DB.Utils.isInt(subSchema)) {
                        schemaFields[schemaField] = "INT";
                    } else {
                        schemaFields[schemaField] = "REAL";
                    }
                }
            }
        }
        // Create the persistence schema.
        var objSchema = persistence.define(schemaTemplate.__pm_schema_name, schemaFields, true);
        objSchema.__pm_schema_name = schemaTemplate.__pm_schema_name;
        objSchema.__pm_sorts = schemaTemplate.__pm_sorts;
        objSchema.__pm_filters = schemaTemplate.__pm_filters;

        objSchema.index(schemaTemplate.__pm_key, {unique: true});
        objSchema.__pm_key = schemaTemplate.__pm_key;
        
        objSchema.__pm_subSchemas = subSchemas;

        // Save a reference to the schema.
        window.__pmAllSchemas[schemaTemplate.__pm_schema_name] = objSchema;

        // Save the schemaFields and the relationships in the allSchemas array
        allSchemas.push({ 'schema': objSchema,
            'fields' : schemaFields,
            'keyField' : schemaTemplate.__pm_key,
            'sortFields' : schemaTemplate.__pm_sorts,
            'filterFields' : schemaTemplate.__pm_filters
        });

        // Insert all of the sub schemas.
        var i = 0;

        // Save off our forward references in the global list.
        var recurseIdx;
        for (recurseIdx = 0; recurseIdx < myRecursiveFields.length; ++recurseIdx) {
            var forwardRefObj = myRecursiveFields[recurseIdx];
            recursiveFields.push({ 'schemaName' : forwardRefObj.schemaName, 
                'field' : forwardRefObj.field,
                'name' : name,
                'schema' : objSchema,
                'oneToMany' : forwardRefObj.oneToMany
            });
        }

        // 1-many - i.e. this object has an array of these things.
        for (i = 0; i < oneToMany.length; ++i) {
            var oneToManyField = oneToMany[i].field;
            objSchema.hasMany(oneToManyField, subSchemas[oneToManyField], name);
        }
        // Many-to-1 - i.e. this object references an object that may be shared
        // with other objects.
        for (i = 0; i < manyToOne.length; ++i) {
            var manyToOneField = manyToOne[i].field;
            objSchema.hasOne(manyToOneField, subSchemas[manyToOneField]);
        }

        if (schemaTemplate.__pm_sorts) {
           for (var sortField in schemaTemplate.__pm_sorts) {
               objSchema.index(sortField);
           }
        }
        
        if (schemaTemplate.__pm_filters) {
            for (var filterField in schemaTemplate.__pm_filters) {
                if (!schemaTemplate.__pm_sorts[filterField]) {
                    objSchema.index(filterField);
                }
            }
        }

        return objSchema;
    },

    generatePersistenceSchema: function(schemaTemplate,name,oncomplete,opaque) {
        // Generate the schema from the supplied schema template and synchronize it with the 
        // database. Returned the generated schema.    
        var s;
        var recursiveFields = [];
        var allSchemas = [];

        if (!window.__pmAllSchemas) {
            window.__pmAllSchemas = {};
        }
        /* First, check to see if the schema was created in a recursive call. */
        if (this.createdSchemas[name]) {
            // We have already created all schemas associated with this widget.
            var oncompleteArgs = [ this.createdSchemas[name] ];
            oncompleteArgs = oncompleteArgs.concat(opaque);
            oncomplete.apply(this, oncompleteArgs);
            return;
        }
        /* Next, check to see if this specific schema is already available from a previous call to
         * generatePersistenceSchema. 
         */
        if (window.__pmAllSchemas[schemaTemplate.__pm_schema_name]) {
            // We have already created all schemas associated with this widget.
            oncompleteArgs = [ window.__pmAllSchemas[schemaTemplate.__pm_schema_name] ];
            oncompleteArgs = oncompleteArgs.concat(opaque);
            oncomplete.apply(this, oncompleteArgs);
            return;
        }
        

        if (Object.prototype.toString.call(schemaTemplate) === '[object Array]') {
            // The template provided references a list of table rows. The schema is
            // the individual table rows.
            s = this.generatePersistenceFields(schemaTemplate[0],name,{},recursiveFields,allSchemas);
        } else {
            // The template provided references a single table row.
            s = this.generatePersistenceFields(schemaTemplate,name,{},recursiveFields,allSchemas);   
        }

        // Recurse over all recursive fields and patch them back into subschemas.
        var recurseIdx;
        for (recurseIdx = 0; recurseIdx < recursiveFields.length; ++recurseIdx) {
            var recurseElem = recursiveFields[recurseIdx];
            var recurseSchema = recurseElem.schema.__pm_subSchemas[recurseElem.field] = window.__pmAllSchemas[recurseElem.schemaName];
            if (recurseElem.oneToMany) {
                recurseElem.schema.hasMany(recurseElem.field, recurseSchema, recurseElem.name);
            } else {
                recurseSchema.hasMany(recurseElem.name, recurseElem.schema, recurseElem.field);
            }
        }
        
        // Determine if any upgrades need to be generated and run.
        this.doMigrations(name,allSchemas,s,function(schemaObj) {
            var oncompleteArgs = [ schemaObj ];
            oncompleteArgs = oncompleteArgs.concat(opaque);
            oncomplete.apply(this, oncompleteArgs);
        });
        
        // We are done with this schema ...
        this.createdSchemas[name] = s;
    },

    doMigrations: function(metaName,allSchemas,schemaObj,oncomplete) {
        var allSchemasIdx;
        var nSchemasUpdated = 0;
        var migrateVer = 0;
        for (allSchemasIdx = 0; allSchemasIdx < allSchemas.length; ++allSchemasIdx) {
            var schema = allSchemas[allSchemasIdx];
            PrimeFaces.DB.migrateTable(schema, metaName, function(curVer) {
                ++nSchemasUpdated;
                
                if (curVer > 0) {
                    migrateVer = curVer;
                }
                
                if (nSchemasUpdated == allSchemas.length) {
                    if (migrateVer > 0) {
                        persistence.migrate(curVer, function() {
                            persistence.schemaSync(function() {
                                // Done with table updates. Call the continuation function.
                                oncomplete(schemaObj);
                            }); 
                        });
                    } else {
                        persistence.schemaSync(function() {
                            // Done with table updates. Call the continuation function.
                            oncomplete(schemaObj);
                        }); 
                    }
                }
            });
        }
    },

    generateSubSchemaFromDBRow: function(tableName,parentField,parentSchema,inverseField,isOneToMany,oncomplete) {
        PrimeFaces.DB.generatePersistenceSchemaFromDB(tableName, null, function(subSchema) {
            if (isOneToMany) {
                parentSchema.hasMany(parentField, subSchema, inverseField);
            } else {
                subSchema.hasMany(inverseField, parentSchema, parentField);
            }
            parentSchema.__pm_subSchemas[parentField] = subSchema;
            oncomplete(parentField, subSchema);
        });  
    },
    
    generatePersistenceSchemaFromDBRow: function(masterRow,oncomplete) {
        /* Generate the schema from this row. */
        var schema = persistence.define(masterRow.tableName, $.parseJSON(masterRow.tableFields) );
        schema.index(masterRow.keyField, { unique: true});
        schema.__pm_key = masterRow.keyField;
        schema.__pm_sorts = masterRow.sortFields;
        schema.__pm_filters = masterRow.filterFields;
        schema.__pm_subSchemas = {};
        if (window.__pmLocalSchemas) {
            window.__pmLocalSchemas[masterRow.tableName] = schema;
        }
        
        var toSync = {};
        var done = function(field) {
            if (field) {
                delete toSync[field];                
            }
            
            if (Object.keys(toSync).length == 0) {
                oncomplete(schema);
            }
        };
        
        
        var indexFields = $.parseJSON(masterRow.sortFields);
        if (indexFields) {
            for (var sortField in indexFields) {
                schema.index(sortField);
            }
        }
        
        var filterFields = $.parseJSON(masterRow.filterFields);
        if (filterFields) {
            for (var filterField in filterFields) {
                if (!indexFields[filterField]) {
                    schema.index(filterField);
                }
            }
        }
        
        /* Recurse over any dependent tables for which we don't have schema. */
        var field;
        
        /* Track all of the fields we need to sync so that we don't call the completion
         * until we are truly done.
         */
        var manyToOnes = $.parseJSON(masterRow.tableManyToOne);
        if (manyToOnes) {
            for (field in manyToOnes) {
                toSync[field] = true;
            }
        }
        var oneToManys = $.parseJSON(masterRow.tableOneToMany);
        if (oneToManys) {
            for (field in oneToManys) {
                toSync[field] = true;
            }
        }
        
        if (Object.keys(toSync).length == 0) {
            done(null);
            return;
        }
        
        if (manyToOnes) {
            for (field in manyToOnes) {
                PrimeFaces.DB.generateSubSchemaFromDBRow(manyToOnes[field].table,
                    field,
                    schema,
                    manyToOnes[field].inverse,
                    false,
                    done);
            }
        }        
        
        if (oneToManys) {
            for (field in oneToManys) {
                PrimeFaces.DB.generateSubSchemaFromDBRow(oneToManys[field].table,
                    field,
                    schema,
                    oneToManys[field].inverse,
                    true,
                    done);
            }
        }
    },

    /**
     * Generates schema for the given name, including all dependent schemas. This
     * function is intended to be called when the local client is trying to access
     * a schema that is generally synchronized from the server. The most common
     * case is to do this when the client is offline, however one might also do this
     * for data that is accessed locally prior to contacting the server or for data
     * that is only stored locally.
     * 
     * @param schemaName Name of the table (schema) we are generating
     * @param schemaTemplate Template object; this is optional, and is generally useful
     *      for schemas that are never synchronized from the server.
     * @param oncomplete This function is asynchronous; this function is called upon completion.
     */
    generatePersistenceSchemaFromDB: function(schemaName,schemaTemplate,oncomplete) {
        if (!window.__pmMasterDB) {
            throw "You must call initPersistence prior to calling this routine!";
        }
        /* First, check to see if the schema is already available. */
        if (window.__pmLocalSchemas) {
            if (window.__pmLocalSchemas[schemaName]) {
                oncomplete(window.__pmLocalSchemas[schemaName]);
                return;
            }
        } else {
            window.__pmLocalSchemas = {};
        }
        
        /* If we have a template, just generate the schema from that template. Otherwise
         * we either (a) read the schema from the DB, or (b) return null because the schema
         * does not exist.
         */
        if (schemaTemplate) {
            PrimeFaces.DB.generatePersistenceSchema(schemaTemplate,schemaName,oncomplete);
        } else {
            /* Next, lookup this schema in the master DB and generate the schema
             * from the DB. 
             */
            window.__pmAllTables.filter("tableName", "=", schemaName).one(function(masterRow) {
                if (masterRow) {
                    PrimeFaces.DB.generatePersistenceSchemaFromDBRow(masterRow,function(schema) {
                        persistence.schemaSync();
                        oncomplete(schema);
                    });
                } else {
                    oncomplete(null);
                }
            });
        }        
    },

    getSortsForTable: function(tableName) {
        if (!window.__pmAllSchemas) {
            return null;
        }
        
        var schema = window.__pmAllSchemas[tableName];
        return schema.__pm_sorts;
    },
    
    getFiltersForTable: function(tableName) {
        if (!window.__pmAllSchemas) {
            return null;
        }
        
        var schema = window.__pmAllSchemas[tableName];
        return schema.__pm_filters;
    },

    getSchemaForTable: function(tableName) {
        if (!window.__pmAllSchemas) {
            return null;
        }
        
        var schema = window.__pmAllSchemas[tableName];
        return schema;
    },

    convertRelationshipToString: function(relObject) {
        var f, r;
        var relSummary = {};
        if (relObject) {
            for (f in relObject) {
                r = relObject[f];
                relSummary[f] = {"table" : r.type.__pm_schema_name, "inverse": r.inverseProperty };
            }
        }
        return JSON.stringify(relSummary);
    },

    migrateTable: function(schema, metaName, oncomplete) {
        window.__pmMasterDB.findBy('tableName', schema.schema.meta.name, function(schemaRec) {
            if (schemaRec == null) {
                var newSchema = new window.__pmMasterDB();
                newSchema.metaName = metaName;
                newSchema.tableVersion = 0;
                newSchema.tableName = schema.schema.meta.name;
                newSchema.tableFields = JSON.stringify(schema.fields);
                newSchema.keyField = schema.keyField;
                newSchema.sortFields = JSON.stringify(schema.sortFields);
                newSchema.filterFields = JSON.stringify(schema.filterFields);

                // Convert relationships to JSON.
                newSchema.tableOneToMany = PrimeFaces.DB.convertRelationshipToString(schema.schema.meta.hasMany);
                newSchema.tableManyToOne = PrimeFaces.DB.convertRelationshipToString(schema.schema.meta.hasOne);

                persistence.add(newSchema);
                oncomplete(0);
            } else {
                var dirty = 0;
                var oldFields, newFields;
                var oldSorts, newSorts;
                var oldKey, newKey;
                var oldRefs, newRefs;
                var oldFilters, newFilters;
                
                var fieldsString = JSON.stringify(schema.fields);
                if (fieldsString !== schemaRec.tableFields) {
                    dirty = 1;
                    oldFields = $.parseJSON(schemaRec.tableFields);
                    newFields = schema.fields;
                    schemaRec.tableFields = fieldsString;
                }
                var oneToManyStr = PrimeFaces.DB.convertRelationshipToString(schema.schema.meta.hasMany);
                if (oneToManyStr !== schemaRec.tableOneToMany) {
                    dirty = 1;
                    schemaRec.tableOneToMany = oneToManyStr;
                }
                var manyToOneStr = PrimeFaces.DB.convertRelationshipToString(schema.schema.meta.hasOne);
                if (manyToOneStr !== schemaRec.tableManyToOne) {
                    dirty = 1;
                    oldRefs = $.parseJSON(schemaRec.tableManyToOne);
                    newRefs = $.parseJSON(manyToOneStr);
                    schemaRec.tableManyToOne = manyToOneStr;
                }
                var sortFields = JSON.stringify(schema.sortFields);
                if (sortFields !== schemaRec.sortFields) {
                    dirty = 1;
                    oldSorts = $.parseJSON(schemaRec.sortFields);
                    newSorts = schema.sortFields;
                    schemaRec.sortFields = sortFields;
                }
                var filterFields = JSON.stringify(schema.filterFields);
                if (filterFields !== schemaRec.filterFields) {
                    dirty = 1;
                    oldFilters = $.parseJSON(schemaRec.filterFields);
                    newFilters = schema.filterFields;
                    schemaRec.filterFields = filterFields;
                }
                
                if (schema.keyField !== schemaRec.keyField) {
                    dirty = 1;
                    oldKey = schemaRec.keyField;
                    newKey = schema.keyField;
                    schemaRec.keyField = schema.keyField;
                }
                if (dirty) {
                    schemaRec.tableVersion = schemaRec.tableVersion + 1;
                    currentDBVer = PrimeFaces.DB.defineTableMigration(schemaRec, 
                        oldFields, newFields,
                        oldSorts, newSorts,
                        oldKey, newKey,
                        oldRefs, newRefs,
                        oldFilters, newFilters,
                        oncomplete);
                } else {
                    oncomplete(0);
                }
            }
        });
    },
    
    defineTableMigration: function(schemaRec, oldFields, newFields,
            oldSorts, newSorts,
            oldKey, newKey,
            oldRefs, newRefs,
            oldFilters, newFilters,
            oncomplete) {
        persistence.migrations.Migrator.version(function(version) {
            persistence.defineMigration(version + 1, {
                up: function() {
                    var fld;
                    if (oldFields && newFields) {
                        for (fld in newFields) {
                            if (!oldFields[fld]) {
                                /* New column. */
                                this.addColumn(schemaRec.tableName, fld, newFields[fld]);
                            }
                        }
                        for (fld in oldFields) {
                            if (!newFields[fld]) {
                                /* New column. */
                                this.removeColumn(schemaRec.tableName, fld);
                            }
                        }                    
                    }
                    if (oldRefs && newRefs) {
                        for (fld in oldRefs) {
                            if (!newRefs[fld]) {
                                this.removeColumn(schemaRec.tableName, fld);
                            }
                        }
                        for (fld in newRefs) {
                            if (!oldRefs[fld]) {
                                this.addColumn(schemaRec.tableName, fld, "VARCHAR(32)");
                            }
                        }
                    }
                    if (oldSorts && newSorts) {
                        for (fld in oldSorts) {
                            if (!newSorts[fld]) {
                                this.removeIndex(schemaRec.tableName, fld);                            
                            }
                        }
                    }
                    if (oldFilters && newFilters) {
                        for (fld in oldFilters) {
                            if (!newSorts[fld] && !newFilters[fld]) {
                                this.removeIndex(schemaRec.tableName, fld);                            
                            }
                        }
                    }
                    if (oldKey && newKey) {
                        this.removeIndex(schemaRec.tableName, oldKey);
                    }
                }
            });
            oncomplete(version + 1);
        });
    },

    /**
     * Extract the key field from the schema.
     */
    getKeyField: function(schema) {
        return schema.__pm_key;
    },
    
    
    /**
     * Data synchronization routines.
     */
    
    addObjectToQueryCollection: function(obj,
        elemSchema, 
        queryCollection, 
        overrides,
        oncomplete, 
        oncompleteArg) {
            
        PrimeFaces.DB.synchronizeObjectFields(obj, null, elemSchema, function(finalObj) {
            queryCollection.add(finalObj);
            oncomplete(oncompleteArg);
        }, overrides);
    },
    
    addObjectMapToQueryCollection: function(newObjectMap, 
        elemSchema, 
        keyFieldName, 
        queryCollection, 
        oncomplete, 
        oncompleteArg,
        overrides) {
        
        var hasOwnFields = false;
        var fieldsToSync = {};
        var k;
        for (k in newObjectMap) {
            if (newObjectMap.hasOwnProperty(k)) {
                fieldsToSync[k] = 1;
                hasOwnFields = true;
            }
        }
        if (!hasOwnFields) {
            /* We did not recurse over any object fields, so call oncomplete. */
            oncomplete(oncompleteArg);
            return;
        }
        
        for (k in fieldsToSync) {
            var obj = newObjectMap[k];
            PrimeFaces.DB.addObjectToQueryCollection(obj,
                    elemSchema, queryCollection, 
                    overrides,
                    function(objKey) {
                        delete fieldsToSync[objKey];
                        if (Object.keys(fieldsToSync).length == 0) {
                            oncomplete(oncompleteArg);
                        }
                    }, k);
        }
    },
    
    cascadingRemoveQueryCollection: function(queryCollection, fld, oncomplete, overrides) {
        var toProcess = 0;
        var nProcessed = 0;
        
        queryCollection.forEach(function(elem) {
            PrimeFaces.DB.cascadingRemove(elem, function() {
                ++nProcessed;
                queryCollection.remove(elem);
                if (nProcessed >= toProcess) {
                    oncomplete(fld);                        
                }
            }, 
            overrides);
        },
        function(tot) {
            if (tot == 0) {
                oncomplete(fld);
            }
            toProcess = tot;
        });
    },
    
    cascadingRemove: function(persistentObj, oncomplete, overrides) {
        var cascadeFlds = {};
        var cascadeDone = function(fld) {
            if (fld != null) {
                delete cascadeFlds[fld];            
            }

            if (Object.keys(cascadeFlds).length == 0) {
                oncomplete(persistentObj, "remove");
                persistence.remove(persistentObj);
            }
        }
        
        for (var fld in persistentObj._data) {
            if (persistentObj.hasOwnProperty(fld)) {
                var getter = Object.getOwnPropertyDescriptor(persistentObj, fld).get;
                var subObj = getter();
                if (subObj && subObj.forEach) {
                    cascadeFlds[fld] = 1;
                    PrimeFaces.DB.cascadingRemoveQueryCollection(subObj, fld, cascadeDone, overrides);
                }
            }
        }
        cascadeDone(null);
    },
    
    synchronizeQueryCollection: function(newObjectMap, 
        queryCollection, 
        elemSchema, 
        keyFieldName, 
        oncomplete, 
        oncompleteArg,
        overrides) {

        var nElements = 0;
        var elementCount = 0;
        var elemSyncDone = function(persistentElem, op) {
            ++nElements;
            if (persistentElem && op && op == "remove") {
                queryCollection.remove(persistentElem);
            }

            if (nElements >= elementCount) {
                /* Add all objects remaining in newObjectMap to the query collection. */
                PrimeFaces.DB.addObjectMapToQueryCollection(newObjectMap, elemSchema, keyFieldName, 
                    queryCollection, oncomplete, oncompleteArg, overrides);
            }
        };

        queryCollection.each(function(qryElem) {
            var qryElemKeyValue = qryElem[keyFieldName];
            if (newObjectMap[qryElemKeyValue]) {
                /* The query collection has an object with the same key as an object
                 * in the newObjectMap. Synchronize fields and remove from the map.
                 */
                var newObj = newObjectMap[qryElemKeyValue];
                delete newObjectMap[qryElemKeyValue];

                PrimeFaces.DB.synchronizeObjectFields(newObj, qryElem, elemSchema, elemSyncDone, overrides);
            } else {
                /* The query collection has an object that is not in the newObjectMap. Remove it.
                 * We don't proceed until this is done, because otherwise other points in the
                 * sync may pick up stale objects.
                 */
                PrimeFaces.DB.cascadingRemove(qryElem,elemSyncDone, overrides);
            }
        },
        function(tot) {
            elementCount = tot;
            if (tot == 0) {
                elemSyncDone();
            }
        });
    },

    synchronizeArrayField: function(objArray, parentCollection, elemSchema, field, oncomplete, overrides) {
        /* Synchronize the query collection. First, we create a map from keys to objects
         * from the new objects in obj[arrLocalField].
         */
        var elemKeyField = PrimeFaces.DB.getKeyField(elemSchema);
        var elemMap = {};
            
        for (var i = 0; i < objArray.length; ++i) {
            var curElem = objArray[i];
            elemMap[curElem[elemKeyField]] = curElem;
        }
        
        /* Now sync the query collection against the elemMap. NOTE: delta objects are the more
         * efficient way to do this!
         */
        PrimeFaces.DB.synchronizeQueryCollection(elemMap, parentCollection, elemSchema, elemKeyField, oncomplete, field, overrides);
    },
    
    updateOneObject: function(updatedObj, keyField, toUpdateKey, elemSchema, oncomplete, overrides) {
        elemSchema.findBy(keyField, toUpdateKey, function(toUpdateObj) { 
            PrimeFaces.DB.synchronizeObjectFields(updatedObj,toUpdateObj,elemSchema,function(newObj) {
                oncomplete(newObj);
            }, overrides);
        });
    },
    
    synchronizeDeltaField: function(deltaObj, parentCollection, elemSchema, field, oncomplete, overrides) {
        var keyField = this.getKeyField(elemSchema);
        
        var toSync = { "adds" : true, "deletes" : true, "updates" : true };
        var syncDone = function(type) {
            delete toSync[type];
            if (Object.keys(toSync).length == 0) {
                oncomplete(field);
            }
        };
        
        // First handle deletes
        var i = 0;
        var toDeleteCollection;
        var nDeletes = 0;
        var totDeletes = deltaObj.deletes.length;
        if (deltaObj.deletes.length == 0) {
            syncDone("deletes");
        } else {
            for (i = 0; i < deltaObj.deletes.length; ++i) {
                var toDeleteKey = deltaObj.deletes[i];
                toDeleteCollection = parentCollection.filter(keyField, "=", toDeleteKey);
                toDeleteCollection.each(function(elem) { 
                    PrimeFaces.DB.cascadingRemove(elem, function() {
                        parentCollection.remove(elem);
                        persistence.remove(elem);
                        ++nDeletes;
                        if (nDeletes == totDeletes) {
                            syncDone("deletes");                    
                        }
                    }, overrides)
                });
            }            
        }

        // Next, handle updates.
        var totUpdates = deltaObj.updates.length;
        var nUpdates = 0;
        if (totUpdates == 0) {
            syncDone("updates");
        } else {
            for (i = 0; i < totUpdates; ++i) {
                var toUpdateKey = deltaObj.updates[i][keyField];
                var updatedObj = deltaObj.updates[i];
                PrimeFaces.DB.updateOneObject(updatedObj, keyField, toUpdateKey, elemSchema, function(newObj) {
                    ++nUpdates;
                    if (nUpdates == totUpdates) {
                        // Done sync'ing updates.
                        syncDone("updates");
                    }
                }, overrides);
            }            
        }

        // Finally, handle adds.
        var nAdds = 0;
        var totAdds = deltaObj.adds.length;
        if (totAdds == 0) {
            syncDone("adds");
        } else {
            for (i = 0; i < deltaObj.adds.length; ++i) {
                PrimeFaces.DB.addObjectToQueryCollection(deltaObj.adds[i],
                    elemSchema, 
                    parentCollection, 
                    overrides,
                    function() {
                        ++nAdds;

                        if (nAdds == totAdds) {
                            syncDone("adds");
                        }
                    });
            }            
        }
    },
    
    synchronizeDeltaObject: function(deltaObj, parentCollection, elemSchema, oncomplete, overrides) {
        PrimeFaces.DB.synchronizeDeltaField(deltaObj, parentCollection, elemSchema, null, function() {
            oncomplete(parentCollection);
        }, overrides);
    },
    
    synchronizeObjectField: function(obj, persistentObj, objSchema, field, keyField, oncomplete, overrides) {
        // Update the old object (if it exists) or add the new with a recursive call.
        var objLocalField = field;
        var setter = Object.getOwnPropertyDescriptor(persistentObj, objLocalField).set;
        objSchema.findBy(keyField, obj[keyField], function(dbObj) {
            PrimeFaces.DB.synchronizeObjectFields(obj,dbObj,objSchema,function(newObj) {
                setter(newObj);
                oncomplete(objLocalField);
            });
        }, overrides);
    },

    /**
     * Synchronizes the object fields against either (a) a fresh object, or (b) a 
     * populated object read from the database.
     */
    synchronizeObjectFields: function(obj, persistentObj, objSchema, oncomplete, overrides) {
        var setter;
        var fieldsToSync = { };
        if (!persistentObj) {
            persistentObj = new objSchema();
            persistence.add(persistentObj);        
        }
        persistentObj.__pm_schema = objSchema;
        persistentObj.__pm_key = obj[this.getKeyField(objSchema)];
        
        var syncDone = function(field) {
            delete fieldsToSync[field];

            if (Object.keys(fieldsToSync).length == 0) {
                oncomplete(persistentObj);
            }
        };

        /* First record all fields we need to sync. Then synchronize them to the
         * persistent object.
         */
        var field;
        for (field in obj) {        
            if (!obj.hasOwnProperty(field)) {
                continue;
            }
            if (field === "__pm_schema_type") {
                continue;
            }
            fieldsToSync[field] = 1;
        }

        for (field in fieldsToSync) {
            if (Object.prototype.toString.call(obj[field]) === '[object Array]') {
                if (!persistentObj[field]) {
                    setter = Object.getOwnPropertyDescriptor(persistentObj, field).set;
                    setter(objSchema.__pm_subSchemas[field].all().filter(field, "=", persistentObj.id));
                }
                /* Synchronize the array field - since this is not a delta object, we assume the returned
                 * object has all fields that should be in this data table.
                 */
                var objArray = obj[field];
                var elemSchema = objSchema.__pm_subSchemas[field];
                PrimeFaces.DB.synchronizeArrayField(objArray, persistentObj[field], elemSchema, field, syncDone, overrides);
            } else if (Object.prototype.toString.call(obj[field]) === '[object Object]') {
                var fieldSchema = objSchema.__pm_subSchemas[field];
                var keyField = this.getKeyField(fieldSchema);
                if (obj[field].__pm_type == 1001) {
                    var deltaObj = obj[field];
                    PrimeFaces.DB.synchronizeDeltaField(deltaObj, persistentObj[field], 
                            fieldSchema, field, syncDone, overrides);                 
                } else {
                    PrimeFaces.DB.synchronizeObjectField(obj[field], persistentObj, fieldSchema, field, keyField, syncDone, overrides); 
                }      
            } else {
                // Otherwise this is a built-in javascript type and we just update 
                // the data in the persistent object.
                setter = Object.getOwnPropertyDescriptor(persistentObj, field).set;
                if (!overrides.syncFields(setter, obj, field)) {
                    setter(obj[field]);
                }
                syncDone(field);
            }
        }
    },

    synchronizeArray: function(obj,objSchema,persistentObj,callback,overrides) {
        PrimeFaces.DB.synchronizeArrayField(obj, persistentObj, objSchema, null, function() {
            callback(persistentObj);
        }, overrides);
    },

    /**
     * Call this function to synchronize an object to the database after loading that
     * object from the remote server. This function first queries the database using the 
     * object's key field to see if it exists. If so, it updates the old object to 
     * match the new one. If not, it simply converts the object into a persistent object 
     * and flushes it to the DB. Invoke the callback on completion.
     */
    synchronizeObject: function(obj,objSchema,callback,opaque,overrides) {
        var keyField = this.getKeyField(objSchema);
        var syncDone = function(finalObj, opaque) {
            /* Store the schema in the final obj. */
            finalObj.__pm_schema = objSchema;
            
            /* We get here when the synchronize is done. */
            persistence.flush();
            /* This will either send an object to the callback. */
            callback(finalObj,opaque);
        };
        
        
        /* Check the overrides. IF we do not have overrides for the field sync then
         * install the default.
         */
        if (!overrides) {
            overrides = {};
        }
        if (!overrides.syncFields) {
            overrides.syncFields = Helix.DB.Utils.defaultFieldSync;
        }

        if (Object.prototype.toString.call(obj) === '[object Array]') {
            PrimeFaces.DB.synchronizeArray(obj,objSchema,objSchema.all(),function(finalObj) {
                syncDone(finalObj, opaque);
            },overrides);
        } else if (obj.__pm_type == 1001) {
            PrimeFaces.DB.synchronizeDeltaObject(obj,objSchema.all(),objSchema,function(finalObj) {
                syncDone(finalObj, opaque);
            },overrides);
        } else {
            objSchema.findBy(keyField, obj[keyField], function(persistentObj) {
                PrimeFaces.DB.synchronizeObjectFields(obj, persistentObj, objSchema, function(finalObj) {
                    syncDone(finalObj, opaque);
                }, overrides);
            });
        }
    },

    /**
     * In this case there is no new data to synchronize. We are really just pulling
     * an object from the database and handing it back to the caller.
     */
    synchronizeObjectByKey: function(key,objSchema,callback) {
        var loadDone = function(persistentObj) {
            callback(persistentObj);
        };
        var keyField = this.getKeyField(objSchema);
        objSchema.findBy(keyField, key, loadDone);
    },

    loadAllObjects: function(objSchema, callback) {
        var persistentObjs = objSchema.all();
        callback(persistentObjs);
    },

    /**
     * Called when this file is loaded. Creates the master table, which is used
     * to store the schemas of all other tables. The master schemas has a very simple
     * format - it is a 4 column table with the table name, the JSON for table fields,
     * the JSON for oneToMany relationships, and the JSON for manyToOne relationships.
     * The metaName is used to generate which loadCommand triggered this DB create.
     * 
     * We use this to check the schema for updates. If an update has occurred then
     * we run the update statements directly against the DB.
     */
    pmCreateMasterTable: function () {
        window.__pmMasterDB = persistence.define('MasterDB',{
            metaName : "TEXT",
            tableVersion: "INT",
            tableName: "TEXT",
            tableFields: "TEXT",
            keyField: "TEXT",
            sortFields: "TEXT",
            filterFields: "TEXT",
            tableOneToMany: "TEXT",
            tableManyToOne: "TEXT"
        });
        window.__pmMasterDB.index('tableName', { unique: true});
        persistence.schemaSync();
        persistence.flush();
        
        window.__pmAllTables = window.__pmMasterDB.all();
    },
    
    initPersistence: function () {
        /* Initialize PersistenceJS for use with WebSQL. Eventually need to add IndexedDB support. */
        persistence.store.websql.config(persistence, 'OfflineAppDB', 'Managed offline DB for app.', 5 * 1024 * 1024);
        
        /* Initialize PersistenceJS migrations. */
        persistence.migrations.init();
        
        /* Keep a master list of all widget schemas we have attempted to create. This ensures we
         * don't recreate the schema each time we run a load command.
         */
        this.createdSchemas = {};
        
        this.pmCreateMasterTable();
    }
};

(function() {
    PrimeFaces.DB.initPersistence();
})();