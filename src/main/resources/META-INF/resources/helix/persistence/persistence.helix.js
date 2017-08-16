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

// Global dictionary use to map class name to class dictionary 
// in the JSON serialization;
var JSONKeyDictionary = [];

function initHelixDB() {
    Helix.DB = {
        
        __masterDBVer : 1,
        
        __schemaVersion: 0,
        
        __indexingMessageShown: false,
        
        __indexingCount: 0,
        
        indexFull: false,
        
        noAutoIndexing: false,
        
        reservedFields : {
            "__hx_sorts" : true,
            "__hx_key" : true,
            "__hx_schema_name" : true,
            "__hx_filters" : true,
            "__hx_text_index" : true,
            "__hx_schema_type" : true,
            "__hx_global_filters" : true
        },

        JSONDictionary: {},

        generatePersistenceFields: function(schemaTemplate,name,allVisited,recursiveFields,allSchemas) {
            var schemaFields = {};
            var subSchemas = {};

            var oneToMany = [];
            var manyToOne = [];
            var myRecursiveFields = [];

            // Check to see if this is a schema forward ref. If so, return null and 
            // let the caller fill in the actual schema after all peer fields have been
            // processed.
            if (schemaTemplate.__hx_schema_type === 1002) {
                return null;
            }

            for (var schemaField in schemaTemplate) {
                if (!schemaTemplate.hasOwnProperty(schemaField)) {
                    continue;
                }
                if (Helix.DB.reservedFields[schemaField]) {
                    continue;
                } 
                var subSchema = schemaTemplate[schemaField];
                if (Object.prototype.toString.call(subSchema) === '[object Array]') {
                    var elemSchema = this.generatePersistenceFields(subSchema[0],schemaField,allVisited,recursiveFields,allSchemas);
                    if (elemSchema !== null) {
                        subSchemas[schemaField] = elemSchema;
                        oneToMany.push({
                            "field" : schemaField, 
                            "table" : elemSchema.__hx_schema_name
                        });
                    } else {
                        myRecursiveFields.push({
                            'schemaName': subSchema[0].__hx_schema_name, 
                            'field' : schemaField, 
                            'oneToMany' : true
                        });
                    }
                } else if (Object.prototype.toString.call(subSchema) === '[object Object]') {
                    // This is a dependent object, which we assume is stored in another field.
                    var fieldSchema = this.generatePersistenceFields(subSchema,schemaField,allVisited,recursiveFields,allSchemas);
                    if (fieldSchema !== null) {
                        subSchemas[schemaField] = fieldSchema;
                        manyToOne.push({
                            "field" : schemaField, 
                            "table" : fieldSchema.__hx_schema_name
                        });
                    } else {
                        myRecursiveFields.push({
                            'schemaName' : subSchema.__hx_schema_name, 
                            'field' : schemaField, 
                            'oneToMany' : false
                        });
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
            var objSchema = persistence.define(schemaTemplate.__hx_schema_name, schemaFields, true);
            objSchema.__hx_schema_name = schemaTemplate.__hx_schema_name;
            objSchema.__hx_sorts = schemaTemplate.__hx_sorts;
            objSchema.__hx_filters = schemaTemplate.__hx_filters;
            objSchema.__hx_global_filters = schemaTemplate.__hx_global_filters;

            objSchema.index(schemaTemplate.__hx_key, {
                unique: true
            });
            objSchema.__hx_key = schemaTemplate.__hx_key;
        
            objSchema.__pm_subSchemas = subSchemas;

            // Save a reference to the schema.
            window.__pmAllSchemas[schemaTemplate.__hx_schema_name] = objSchema;

            // Save the schemaFields and the relationships in the allSchemas array
            allSchemas.push({
                'schema': objSchema,
                'fields' : schemaFields,
                'keyField' : schemaTemplate.__hx_key,
                'sortFields' : schemaTemplate.__hx_sorts,
                'filterFields' : schemaTemplate.__hx_filters,
                'globalFilterFields' : schemaTemplate.__hx_global_filters,
                'textIndexFields' : schemaTemplate.__hx_text_index
            });

            // Insert all of the sub schemas.
            var i = 0;

            // Save off our forward references in the global list.
            var recurseIdx;
            for (recurseIdx = 0; recurseIdx < myRecursiveFields.length; ++recurseIdx) {
                var forwardRefObj = myRecursiveFields[recurseIdx];
                recursiveFields.push({
                    'schemaName' : forwardRefObj.schemaName, 
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

            if (schemaTemplate.__hx_sorts) {
                for (var sortField in schemaTemplate.__hx_sorts) {
                    objSchema.index(sortField);
                }
            }
        
            if (schemaTemplate.__hx_filters) {
                for (var filterField in schemaTemplate.__hx_filters) {
                    if (!schemaTemplate.__hx_sorts[filterField]) {
                        objSchema.index(filterField);
                    }
                }
            }
            
            if (schemaTemplate.__hx_global_filters) {
                for (var gFilterField in schemaTemplate.__hx_global_filters) {
                    if (!schemaTemplate.__hx_sorts[gFilterField] &&
                        !schemaTemplate.__hx_filters[gFilterField]) {
                        objSchema.index(gFilterField);
                    }
                }
            }
            
            if (schemaTemplate.__hx_text_index) {
                for (i = 0; i < schemaTemplate.__hx_text_index.length; i++) {
                    var indexField = schemaTemplate.__hx_text_index[i];
                    objSchema.textIndex(indexField);
                }
            }
            return objSchema;
        },

        generatePersistenceSchemaFromTemplate: function(schemaTemplate,name,oncomplete,opaque,nRetries,noSync) {
            /* Next, check to see if this specific schema is already available from a previous call to
             * generatePersistenceSchema. 
             */
            var schemaNameToCheck = schemaTemplate.__hx_schema_name;
            
            // Generate the schema from the supplied schema template and synchronize it with the 
            // database. Returned the generated schema.    
            var s;
            var recursiveFields = [];
            var allSchemas = [];
            
            if (window.__pmAllSchemas[schemaNameToCheck]) {
                // We have already created all schemas associated with this widget.
                if (oncomplete) {
                    oncompleteArgs = [ window.__pmAllSchemas[schemaNameToCheck] ];
                    oncompleteArgs = oncompleteArgs.concat(opaque);
                    oncomplete.apply(this, oncompleteArgs);
                }
                if (name) {
                    this.createdSchemas[name] = window.__pmAllSchemas[schemaNameToCheck];
                }
                return;
            }
        

            s = this.generatePersistenceFields(schemaTemplate,name,{},recursiveFields,allSchemas);   

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
        
            // Determine if any upgrades need to be generated. The required SQL commands
            // are stored as schema sync hooks.
            var dirty = false;
            var masterDBAdds = [];
            if (Helix.DB.doMigrations(name,allSchemas,masterDBAdds)) {
                dirty = true;
            }
            
            if (noSync) {
                if (oncomplete) {
                    var oncompleteArgs = [ s ];
                    oncompleteArgs = oncompleteArgs.concat(opaque);
                    oncomplete.apply(this, oncompleteArgs);
                }                
            } else {
                // Flush all schemas.
                persistence.schemaSync(function(tx) {
                    // Add all tables created in this sync to the master DB, if needed.
                    for (var t = 0; t < masterDBAdds.length; ++t) {
                        persistence.add(masterDBAdds[t]);
                    }
                    
                    // Flush all master DB changes.
                    persistence.flush(function() {
                        if (dirty) {
                            // Clean out Persistence JS' cache of all tracked objects and cached
                            // query collections. Otherwise we can end up with stale objects/queries
                            // that refer to a field list that is out of sync with the flushed schema
                            // changes that we just completed. NOTE that everything we do here should
                            // happen before we are manipulating data from a particular table.
                            persistence.clean();
                        }

                        if (oncomplete) {
                            var oncompleteArgs = [ s ];
                            oncompleteArgs = oncompleteArgs.concat(opaque);
                            oncomplete.apply(this, oncompleteArgs);
                        }
                    });
                });
            }
        
            // We are done with this schema ...
            this.createdSchemas[name] = s;
        },

        generatePersistenceSchema: function(schemaTemplate,name,oncomplete,opaque,nRetries,noSync) {
            if (!Helix.DB.persistenceIsReady()) {
                $(document).on('hxPersistenceReady', function() {
                    Helix.DB.generatePersistenceSchema(schemaTemplate,name,oncomplete,opaque,nRetries+1);
                });
                return;
            }

            /* First, check to see if the schema was created in a recursive call. */
            if (this.createdSchemas[name]) {
                // We have already created all schemas associated with this widget.
                if (oncomplete) {
                    var oncompleteArgs = [ this.createdSchemas[name] ];
                    oncompleteArgs = oncompleteArgs.concat(opaque);
                    oncomplete.apply(this, oncompleteArgs);
                }
                return;
            }
            if ($.isArray(schemaTemplate)) {
                if (schemaTemplate[0].__hx_schema_name) {
                    Helix.DB.generatePersistenceSchemaFromTemplate(schemaTemplate[0], name, oncomplete, opaque, nRetries, noSync);
                } else {
                    // This is a standard array of independent sync items. Not an array field.
                    for (var i = 0; i < schemaTemplate.length; ++i) {
                        Helix.DB.generatePersistenceSchema(schemaTemplate[i], name, oncomplete, opaque, nRetries, noSync);
                    }
                }
            } else {
                Helix.DB.generatePersistenceSchemaFromTemplate(schemaTemplate, name, oncomplete, opaque, nRetries, noSync);
            }            
        },

        doAppMigrations: function(tableName, migrationOptions) {
            Helix.DB.defineTableMigration(Helix.DB.__schemaVersion,
                        tableName, 
                        migrationOptions.newFields, 
                        migrationOptions.oldFields, 
                        (migrationOptions.newFields && migrationOptions.oldFields),
                        migrationOptions.oldIndexes, 
                        migrationOptions.newIndexes,
                        null,
                        null,
                        null, 
                        null,
                        null, 
                        null,
                        null, 
                        null);
            persistence.migrate(Helix.DB.__schemaVersion, Helix.DB.__schemaVersion + 1);
            Helix.DB.__schemaVersion = Helix.DB.__schemaVersion + 1;
        },

        doMigrations: function(metaName,allSchemas,masterDBAdds) {
            // Migrate tables one at a time.
            if (allSchemas.length === 0) {
                return false;
            }

            var dirty = false;
            for (var i = 0; i < allSchemas.length; ++i) {
                var schema = allSchemas[i];
                var tableName = schema.schema.meta.name;
                var dirtyMap = {};

                if (schema.schema.meta.textIndex) {
                    schema.schema.meta.textIndex['__hx_generated'] = false;
                }
                var curVer = Helix.DB.migrateTable(Helix.DB.__schemaVersion, schema, metaName, dirtyMap, masterDBAdds);
                if (curVer > 0) {
                    // Migrations must be done.
                    dirty = true;
                    
                    persistence.migrate(Helix.DB.__schemaVersion, curVer);
                    Helix.DB.__schemaVersion = curVer;
                    
                    // This table exists. All updates to it are handle as sync hooks.
                    persistence.generatedTables[tableName] = true;
                    
                    if (!dirtyMap['textindex']) {
                        // Do not regenerate textIndex tables.
                        if (schema.schema.meta.textIndex) {
                            schema.schema.meta.textIndex['__hx_generated'] = true;
                        }
                    }
                } else if (curVer <= 0) {
                    if (curVer === 0) {
                        // This table is already in the DB. Mark it as a generated table.
                        persistence.generatedTables[tableName] = true;
                        // Do not regenerate textIndex tables.
                        if (schema.schema.meta.textIndex) {
                            schema.schema.meta.textIndex['__hx_generated'] = true;
                        }
                    }
                }
            }
            return dirty;
        },

        migrateTable: function(oldVersion, schema, metaName, dirtyMap, masterDBAdds) {
            var tableName = schema.schema.meta.name;
            var schemaRec = window.__pmAllTables[tableName];
            if (schemaRec === null || schemaRec === undefined) {
                // This is a new table.
                var newSchema = new window.__pmMasterDB();
                newSchema.metaName = metaName;
                newSchema.tableVersion = 0;
                newSchema.tableName = tableName;
                newSchema.tableFields = JSON.stringify(schema.fields);
                newSchema.keyField = schema.keyField;
                newSchema.sortFields = JSON.stringify(schema.sortFields);
                newSchema.filterFields = JSON.stringify(schema.filterFields);
                newSchema.globalFilterFields = JSON.stringify(schema.globalFilterFields);
                newSchema.textIndexFields = JSON.stringify(schema.textIndexFields);
                newSchema.masterDBVer = Helix.DB.__masterDBVer;

                // Convert relationships to JSON.
                newSchema.tableOneToMany = Helix.DB.convertRelationshipToString(schema.schema.meta.hasMany);
                newSchema.tableManyToOne = Helix.DB.convertRelationshipToString(schema.schema.meta.hasOne);

                masterDBAdds.push(newSchema);
                
                // New table - return -1;
                return -1;
            } else {
                var dirty = 0;
                var fieldsChanged = 0;
                var oldSorts, newSorts;
                var oldKey, newKey;
                var oldFilters, newFilters;
                var oldGlobalFilters, newGlobalFilters;
                var oldTextIndex, newTextIndex;
                var allNewFields = {};
                var allOldFields = {};

                var tf = $.parseJSON(schemaRec.tableFields);
                if (!Helix.Utils.objectsEqual(tf, schema.fields)) {
                    var fieldsString = JSON.stringify(schema.fields);
                    dirty = 1;
                    fieldsChanged = 1;
                    schemaRec.tableFields = fieldsString;
                    dirtyMap['fields'] = true;
                }
                $.extend(allOldFields, tf);
                $.extend(allNewFields, schema.fields);
                
                var manyToOneStr = Helix.DB.convertRelationshipToString(schema.schema.meta.hasOne);
                var oldManyToOne = $.parseJSON(schemaRec.tableManyToOne);
                if (manyToOneStr !== schemaRec.tableManyToOne) {
                    var allManyToOne = {};
                    $.extend(allManyToOne, oldManyToOne);
                    
                    // At this point, allManyToOne includes all old fields. We want to
                    // see if this schema sync is *adding* fields, in which case we mark
                    // the field list as dirty. We DO NOT delete many to one reference fields
                    // because we want to allow a single object type to have different parent
                    // objects in different load commands.
                    for (var newFld in schema.schema.meta.hasOne) {
                        if (!allManyToOne[newFld]) {
                            // we have a new relationship field ...
                            fieldsChanged = 1;
                            var r = schema.schema.meta.hasOne[newFld];
                            allManyToOne[newFld] = {
                                "table" : r.type.__hx_schema_name, 
                                "inverse": r.inverseProperty
                            };
                        }
                    }
                    dirty = 1;
                    
                    // XXX: for now, we never delete relationship fields. Eventually we
                    // might find a way to check and see if the table we are relating to
                    // is deleted, but first we need to invent a mechanism for table deletion.
                    manyToOneStr = JSON.stringify(allManyToOne);
                    schemaRec.tableManyToOne = manyToOneStr;
                    
                    $.extend(allNewFields, allManyToOne);
                    dirtyMap['manytoone'] = true;
                } else if (dirtyMap['fields']) {
                    // We are going to migrate all fields. Make sure we don't omit an id
                    // relationship field.    
                    $.extend(allNewFields, schema.schema.meta.hasOne);
                }
                $.extend(allOldFields, oldManyToOne);
                
                var oneToManyStr = Helix.DB.convertRelationshipToString(schema.schema.meta.hasMany);
                if (oneToManyStr !== schemaRec.tableOneToMany) {
                    dirty = 1;
                    schemaRec.tableOneToMany = oneToManyStr;
                    dirtyMap['onetomany'] = true;
                }
                
                var sortFields = JSON.stringify(schema.sortFields);
                if (sortFields !== schemaRec.sortFields) {
                    dirty = 1;
                    oldSorts = $.parseJSON(schemaRec.sortFields);
                    newSorts = schema.sortFields;
                    schemaRec.sortFields = sortFields;
                    dirtyMap['sorts'] = true;
                }
                var filterFields = JSON.stringify(schema.filterFields);
                if (filterFields !== schemaRec.filterFields) {
                    dirty = 1;
                    oldFilters = $.parseJSON(schemaRec.filterFields);
                    newFilters = schema.filterFields;
                    schemaRec.filterFields = filterFields;
                    dirtyMap['filters'] = true;
                }

                var globalFilterFields = JSON.stringify(schema.globalFilterFields);
                if (globalFilterFields !== schemaRec.globalFilterFields) {
                    dirty = 1;
                    oldGlobalFilters = $.parseJSON(schemaRec.globalFilterFields);
                    newGlobalFilters = schema.globalFilterFields;
                    schemaRec.globalFilterFields = globalFilterFields;
                    dirtyMap['globalfilters'] = true;
                }

                var textIndexFields = JSON.stringify(schema.textIndexFields);
                if (textIndexFields !== schemaRec.textIndexFields) {
                    dirty = 1;
                    oldTextIndex = $.parseJSON(schemaRec.textIndexFields);
                    newTextIndex = schema.textIndexFields;
                    schemaRec.textIndexFields = textIndexFields;
                    dirtyMap['textindex'] = true;
                }

                if (schema.keyField !== schemaRec.keyField) {
                    dirty = 1;
                    oldKey = schemaRec.keyField;
                    newKey = schema.keyField;
                    schemaRec.keyField = schema.keyField;
                    dirtyMap['key'] = true;
                }
                
                if (dirty) {
                    schemaRec.tableVersion = schemaRec.tableVersion + 1;
                    Helix.DB.defineTableMigration(oldVersion,
                        schemaRec.tableName, allNewFields, allOldFields, fieldsChanged,
                        oldSorts, newSorts,
                        oldKey, newKey,
                        oldFilters, newFilters,
                        oldGlobalFilters, newGlobalFilters,
                        oldTextIndex, newTextIndex);
                    
                    // > 0 - means we need to migrate.
                    return oldVersion + 1;
                } else {
                    // 0 means schema is unchanged.
                    return 0;
                }
            }
        },
    
        defineTableMigration: function(oldVersion,
            tableName, allNewFields, allOldFields, fieldsChanged,
            oldSorts, newSorts,
            oldKey, newKey,
            oldFilters, newFilters,
            oldGlobalFilters, newGlobalFilters,
            oldTextIndex, newTextIndex) {
            
            persistence.defineMigration(oldVersion + 1, {
                up: function() {
                    var allNewIndices = {};
                    var keyChanged = false;
                    if (oldKey && newKey) {
                        this.removeIndex(tableName, oldKey);
                        keyChanged = true;
                    }
                    if (fieldsChanged) {
                        this.updateColumns(allNewFields, allOldFields, tableName, keyChanged, newKey);              
                    }
                    if (oldSorts && newSorts) {
                        Helix.DB.migrateIndexes.call(this, tableName, oldSorts, newSorts, allNewIndices);
                    }
                    if (oldFilters && newFilters) {
                        Helix.DB.migrateIndexes.call(this, tableName, oldFilters, newFilters, allNewIndices);
                    }
                    if (oldGlobalFilters && newGlobalFilters) {
                        Helix.DB.migrateIndexes.call(this, tableName, oldGlobalFilters, newGlobalFilters, allNewIndices);
                    }
                    if (oldTextIndex && newTextIndex) {
                        Helix.DB.migrateIndexes.call(this, tableName, oldTextIndex, newTextIndex, allNewIndices);
                    }
                    if (oldKey && newKey) {
                        this.addIndex(tableName, newKey, true);
                    }
                    
                }
            });
        },
        
        migrateIndexes: function(tableName, oldIndexList, newIndexList, allNewIndices) {
            var fld = null;
            for (fld in oldIndexList) {
                if (!newIndexList[fld] && !allNewIndices[fld]) {
                    this.removeIndex(tableName, fld);                            
                }
            }
            for (fld in newIndexList) {
                if (oldIndexList[fld]) {
                    // Already indexed.
                    continue;
                }
                this.addIndex(tableName, fld);
                allNewIndices[fld] = true;
            }
        },

        generateSubSchemaFromDBRow: function(tableName,parentField,parentSchema,inverseField,isOneToMany,oncomplete) {
            Helix.DB.generatePersistenceSchemaFromDB(tableName, null, function(subSchema) {
                if (subSchema) {
                    if (isOneToMany) {
                        parentSchema.hasMany(parentField, subSchema, inverseField);
                    } else {
                        subSchema.hasMany(inverseField, parentSchema, parentField);
                    }
                }
                parentSchema.__pm_subSchemas[parentField] = subSchema;
                oncomplete(parentField, subSchema);
            });  
        },
    
        generatePersistenceSchemaFromDBRow: function(masterRow,oncomplete) {
            /* Generate the schema from this row. */
            var schema = persistence.define(masterRow.tableName, $.parseJSON(masterRow.tableFields) );
            /* SAH - mark this as a table that does not need to be re-created in the DB. */
            persistence.generatedTables[masterRow.tableName] = true;
            schema.index(masterRow.keyField, {
                unique: true
            });
            schema.__hx_key = masterRow.keyField;
            schema.__hx_sorts = masterRow.sortFields;
            schema.__hx_filters = masterRow.filterFields;
            schema.__hx_global_filters = masterRow.globalFilterFields;
            schema.__hx_text_indexes = masterRow.textIndexFields;
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
            
            var textIndexFields = $.parseJSON(masterRow.textIndexFields);
            for (var i = 0; i < textIndexFields.length; i++) {
                var indexField = textIndexFields[i];
                schema.textIndex(indexField);
            }
            // We read this from the DB - no need to attempt to re-generate the text index tables.
            if (schema.textIndex) {
                schema.textIndex['__hx_generated'] = true;
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
                    Helix.DB.generateSubSchemaFromDBRow(manyToOnes[field].table,
                        field,
                        schema,
                        manyToOnes[field].inverse,
                        false,
                        done);
                }
            }        
        
            if (oneToManys) {
                for (field in oneToManys) {
                    Helix.DB.generateSubSchemaFromDBRow(oneToManys[field].table,
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
     * @param nRetries Internal parameter - do not pass a value.
     */
        generatePersistenceSchemaFromDB: function(schemaName,schemaTemplate,oncomplete,nRetries) {
            if (!window.__pmMasterDB) {
                throw "You must call initPersistence prior to calling this routine!";
            }
            
            var __continuation = function() {
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
                    Helix.DB.generatePersistenceSchema(schemaTemplate,schemaName,oncomplete);
                } else {
                    /* Next, lookup this schema in the master DB and generate the schema
                     * from the DB. 
                     */
                    var masterRow = window.__pmAllTables[schemaName];
                    if (masterRow) {
                        Helix.DB.generatePersistenceSchemaFromDBRow(masterRow,function(schema) {
                            // This table is already in the DB. No need to call schemaSync.
                            oncomplete(schema);
                        });
                    } else {
                        oncomplete(null);
                    }
                }
            };
            
            if (!Helix.DB.persistenceIsReady()) {
                $(document).on('hxPersistenceReady', function() {
                    __continuation();
                });
            } else {
                __continuation();
            }    
        },


        prepareSchemaTemplate: function(templateObj, tableName, keyField, sorts, filters) {
            templateObj.__hx_schema_name = tableName;
            templateObj.__hx_key = keyField;
            templateObj.__hx_sorts = sorts;
            templateObj.__hx_filters = filters;

            return templateObj;
        },

        convertRelationshipToString: function(relObject) {
            var f, r;
            var relSummary = {};
            if (relObject) {
                for (f in relObject) {
                    r = relObject[f];
                    relSummary[f] = {
                        "table" : r.type.__hx_schema_name, 
                        "inverse": r.inverseProperty
                    };
                }
            }
            return JSON.stringify(relSummary);
        },

        /**
     * Extract the key field from the schema.
     */
        getKeyField: function(schema) {
            return schema.__hx_key;
        },
        
        getJSONKeyField: function(schema, obj) {
            // We need to translate the JSON field key into an actual field name
            // Lookup the dictionary for this schema in the global JSON dictionary.
            // The global dictionary is generated during compilation of the Java classes.
            var sch = schema.__hx_schema_name; 
            var key = JSONKeyDictionary[sch];
            
            if (!key) {
                key = schema.__hx_key;
                if (key in obj) {
                    // Use the unconverted key field name.
                } else {
                    var classDict = this.getClassDictionary(schema);

                    if (classDict) {
                        for (var k in classDict) {
                            if (classDict[k] === key) {
                                key = k;
                                break;
                            }
                        }
                    }
                    // Store the mapping ...
                    JSONKeyDictionary[sch] = key;
                }
                
            }
                
            return key;
        },
    
        // If this object uses a JSON dictionary to reduce its serialized
        // size, return the reverse mapped object (field names). Otherwise
        // return the input object.
        getJSONReverseMappedObject: function(obj, schema) {
            var classDict = this.getClassDictionary(schema);
            
            if (!classDict) {
                return obj;
            }
            
            for (var field in obj) {
                if (!obj.hasOwnProperty(field)) {
                    continue;
                }
                if (field in Helix.DB.reservedFields) {
                    continue;
                }
                if (field in classDict) {
                    // The class dictionary exists => translate field name
                    // and replace field in object.
                    var val = obj[field];
                    delete obj[field];
                    field = classDict[field];
                    obj[field] = val;
                }
            }
                
            return obj;
        },
        
        getClassDictionary: function(schema) {
            var sch;
            if (Helix.Utils.isString(schema)) {
                sch = schema;
            } else {    
                sch = schema.__hx_schema_name; 
            }
            var idx = sch.lastIndexOf('.');

            if (idx > 0) {
                sch = sch.substr(idx+1);
            }

            return Helix.DB.JSONDictionary[sch];
        },
        
        getSchemaForObject: function(obj) {
            if (obj.__hx_schema) {
                return obj.__hx_schema;
            } else if (obj._type) {
                return Helix.DB.getSchemaForTable(obj._type);
            } else if (obj._entityName) {
                return Helix.DB.getSchemaForTable(obj._entityName);
            }
            return null;
        },
        
        getSchemaNameForObject : function(obj) {
            if (Object.prototype.toString.call(obj) === '[object Array]') {
                if (obj.length > 0) {
                    return Helix.DB.getSchemaNameForObject(obj[0]);
                } else {
                    return null;
                }
            }
            return obj.__hx_schema.__hx_schema_name;
        },
    
        getSortsForTable: function(tableName) {
            if (!window.__pmAllSchemas) {
                return null;
            }
        
            var schema = window.__pmAllSchemas[tableName];
            return schema.__hx_sorts;
        },
    
        getFiltersForTable: function(tableName) {
            if (!window.__pmAllSchemas) {
                return null;
            }
        
            var schema = window.__pmAllSchemas[tableName];
            return schema.__hx_filters;
        },
        
        getGlobalFiltersForTable: function(tableName) {
            if (!window.__pmAllSchemas) {
                return null;
            }
        
            var schema = window.__pmAllSchemas[tableName];
            return schema.__hx_global_filters;
        },

        getSchemaForTable: function(tableName) {
            if (!window.__pmAllSchemas) {
                return null;
            }
        
            var schema = window.__pmAllSchemas[tableName];
            return schema;
        },

        getSchemaNameForField: function(persistentObj, fieldName) {
            if (fieldName in persistentObj.__hx_schema.__pm_subSchemas) {
                return persistentObj.__hx_schema.__pm_subSchemas[fieldName].__hx_schema_name;
            }
            return null;
        },
        
        getSchemaForField: function(persistentObj, fieldName) {
            if (persistentObj.__hx_schema && fieldName in persistentObj.__hx_schema.__pm_subSchemas) {
                return persistentObj.__hx_schema.__pm_subSchemas[fieldName];
            } else if (persistentObj[fieldName]._entityName) {
                return Helix.DB.getSchemaForTable(persistentObj[fieldName]._entityName);
            }
            return null;
        },
    
        createSchemaForTable: function(tableName, fields, indices, keyField, hasManys) {
            var newSchema = persistence.define(tableName, fields);
            window.__pmAllSchemas[tableName] = newSchema;
            var i = 0;
            if (keyField) {
                newSchema.index(keyField, {
                    unique: true
                });
            }
            if (indices) {
                for (i = 0; i < indices.length; ++i) {
                    newSchema.index(indices[i]);
                }            
            }
            if (hasManys) {
                for (i = 0; i < hasManys.length; ++i) {
                    var nxt = hasManys[i];
                    newSchema.hasMany(nxt[0], nxt[1], nxt[2]);
                }
            }
	    var dirty = false;
            var masterDBAdds = [];
	    var allSchemas = [{
		schema: newSchema,
		fields: fields,
		keyField: keyField,
		sortFields: indices,
		filterFields : [],
		globalFilterFields: [],
		textIndexFields: []
	    }];
            if (Helix.DB.doMigrations(tableName,allSchemas,masterDBAdds)) {
                dirty = true;
            }
	    for (var t = 0; t < masterDBAdds.length; ++t) {
                persistence.add(masterDBAdds[t]);
            }
                    
            return newSchema;
        },
    
        /**
         * Data synchronization routines.
         */
    
        cascadingRemoveQueryCollection: function(elemSchema, queryCollection, oncomplete, overrides) {
            var toDelete = [];
            var cascade = function() {
                if (toDelete.length === 0) {
                    oncomplete();
                    return;
                }
                
                var elem = toDelete.pop();
                Helix.DB.cascadingRemove(elemSchema, elem, function() {
                    queryCollection.remove(elem);
                    persistence.remove(elem);
                    if (overrides && overrides.deleteHook) {
                        overrides.deleteHook(elem);
                    }
                    cascade();
                }, overrides);
            };
        
            
            queryCollection.noFlush().newEach({
                eachFn: function(elem) {
                    toDelete.push(elem);
                },
                doneFn: function(ct) {
                    cascade();
                }
            });
        },
    
        cascadingRemove: function(elemSchema, persistentObj, oncomplete, overrides, opaque) {
            var recurseDown = function(toCascade) {
                if (toCascade.length === 0) {
                    oncomplete(persistentObj, "remove", opaque);
                    return;
                }
                
                var nxt = toCascade.pop();
                var nxtSchema = elemSchema.__pm_subSchemas[nxt.fld];
                if (nxt.obj.forEach) {
                    // Query collection.
                    Helix.DB.cascadingRemoveQueryCollection(nxtSchema, nxt.obj, function() {
                        recurseDown(toCascade);
                    }, overrides);
                } else {
                    Helix.DB.cascadingRemove(nxtSchema, nxt.obj, function(_pobj, op) { 
                        if (op === 'remove') {
                            persistence.remove(_pobj);
                        }
                        recurseDown(toCascade);
                    }, overrides);
                }
            };
            
            // First, save off the objects we need to delete recursively. When we are done, we call
            // recurseDown above.
            var _toCascade = [];
            for (var key in persistentObj) {
                if (elemSchema && key in elemSchema.__pm_subSchemas) {
                    // Make sure we only go down. We don't want to delete a parent object.
                } else {
                    continue;
                }
                try {
                    var getter = Object.getOwnPropertyDescriptor(persistentObj, key).get;
                    if (getter) {
                        var subObj = getter.call(persistentObj);
                        if (subObj && subObj.forEach) {
                            _toCascade.push({ obj: subObj, fld: key });
                        }
                    }
                } catch(err) {
                    persistentObj.fetch(key, function(obj) {
                        // This is a one-to-one relationship with an object.
                        if (obj) {
                            _toCascade.push({ obj: obj, fld: key });
                        }
                    });
                }
            }
            recurseDown(_toCascade);
        },
    
        addObjectToQueryCollection: function(allSchemas,
            obj,
            elemSchema, 
            queryCollection, 
            overrides,
            oncomplete,
            opaque) {
            Helix.DB.synchronizeObjectFields(allSchemas, obj, null, elemSchema, function(finalObj) {
                queryCollection.add(finalObj);
                oncomplete(finalObj, opaque);
            }, overrides);
        },
    
        synchronizeQueryCollection: function(allSchemas,
            newObjectMap, 
            parentCollection,
            compareCollection,
            elemSchema, 
            keyFieldName, 
            oncomplete, 
            oncompleteArg,
            overrides) {


            var syncObjs = [];
            var deleteObjs = [];
            var addObjs = [];
            compareCollection.noFlush().newEach({
                eachFn: function(qryElem) {
                    var qryElemKeyValue = qryElem[keyFieldName];
                    if (newObjectMap[qryElemKeyValue]) {
                        /* The query collection has an object with the same key as an object
                         * in the newObjectMap. Synchronize fields and remove from the map.
                         */
                        var newObj = newObjectMap[qryElemKeyValue];
                        delete newObjectMap[qryElemKeyValue];
                        syncObjs.push({  
                            'newObj' : newObj,
                            'oldObj' : qryElem
                        });
                    } else {
                        /* The query collection has an object that is not in the newObjectMap. Remove it.
                         * We don't proceed until this is done, because otherwise other points in the
                         * sync may pick up stale objects.
                         */
                        deleteObjs.push(qryElem);
                    }
                },
                doneFn: function() {
                    /* Called when the iteration over the query collection is done. */

                    /* First compile the list of objects remaining in the newObjectMap that we
                     * are going to add.
                     */
                    for (var k in newObjectMap) {
                        addObjs.push(newObjectMap[k]);
                    }

                    var doAdds = function() {
                        if (addObjs.length > 0) {
                            var toAdd = addObjs.pop();
                            Helix.DB.addObjectToQueryCollection(allSchemas, toAdd, elemSchema, parentCollection, overrides, doAdds);
                        } else {
                            oncomplete(oncompleteArg);
                        }
                    };

                    var removeFn = function(persistentObj) {
                        if (persistentObj) {
                            parentCollection.remove(persistentObj);
                            persistence.remove(persistentObj);
                            if (overrides && overrides.deleteHook) {
                                overrides.deleteHook(persistentObj);
                            }
                        }

                        if (deleteObjs.length > 0) {
                            var toDelete = deleteObjs.pop();
                            Helix.DB.cascadingRemove(elemSchema,toDelete,removeFn,overrides);
                        } else {
                            /* Nothing more to remove. Add in any new objects. */
                            doAdds();
                        }
                    };

                    var syncFn = function() {
                        if (syncObjs.length > 0) {
                            var toSync = syncObjs.pop();
                            Helix.DB.synchronizeObjectFields(allSchemas, toSync.newObj, toSync.oldObj, elemSchema, syncFn, overrides);
                        } else {
                            /* Nothing more to sync. Do all removes. */
                            removeFn();
                        }
                    };

                    syncFn();
                }
            });
        },

        synchronizeArrayField: function(allSchemas, objArray, parentObj, parentCollection, elemSchema, field, oncomplete, overrides) {
            /* Synchronize the query collection. First, we create a map from keys to objects
             * from the new objects in obj[arrLocalField].
             */
            
            /* Refine the query collection using a user-configured call. By default this is
             * an identity call (i.e, it just returns parentCollection). However, in some
             * cases the user knows that a load only loaded a subset of a data list from
             * the server. This call is used to refine the list for comparison.
             */
            var comparisonCollection = overrides.refineEntityArray(field, parentCollection);
            
            /* Handle the special case where the object array has 0 elements. In this case,
             * we just issue a delete. But we do NOT flush the session.
             */
            if (objArray.length === 0) {
                if (!parentObj || !parentObj._new) {
                    // We only need to destroy all child objects in an array relationship if
                    // the parent object is not new. If it is new, comparisonCollection will
                    // always be empty.
                    comparisonCollection.destroyAll();                
                }
                oncomplete(field);
                return true;
            }            
            
            var elemKeyField = Helix.DB.getKeyField(elemSchema);
            var elemMap = {};
            
            for (var i = 0; i < objArray.length; ++i) {
                var curElem = this.getJSONReverseMappedObject(objArray[i], elemSchema);
                if (curElem.__hx_type) {
                    // This is not a normal object array. Instead it is an array of delta objects or other
                    // special objects. Let SynchronizeObject handle it.
                    return false;
                } else {
                    elemMap[curElem[elemKeyField]] = curElem;                
                }
            }
        
            /* Now sync the query collection against the elemMap. NOTE: delta objects are the more
             * efficient way to do this!
             */
            Helix.DB.synchronizeQueryCollection(allSchemas, elemMap, parentCollection, comparisonCollection, elemSchema, elemKeyField, oncomplete, field, overrides);
            return true;
        },
    
        updateOneObject: function(allSchemas, persistentObjID, updatedObj, keyField, toUpdateKey, elemSchema, oncomplete, overrides, opaque) {
            // To truly "update" an object we would need to actually retrieve that object, then, one by one, update
            // each field of that object. This is incredibly inefficient. Instead, we use the entity ID of this object
            // from the DB to add it to the session and mark all properties in the object dirty (except those that the
            // sync override tells us not to override ...). Then we update the object.
            //elemSchema.findBy(keyField, toUpdateKey, function(toUpdateObj) {
            var toUpdateObj = new elemSchema();
            toUpdateObj.markPersistent(persistentObjID);
            Helix.DB.synchronizeObjectFields(allSchemas, updatedObj, toUpdateObj, elemSchema, function(newObj) {
                if (overrides.updateHook) {
                    overrides.updateHook(newObj);
                }
                oncomplete(newObj, opaque);
            }, overrides);
            //});
        },
    
        synchronizeDeltaField: function(allSchemas, _deltaObj, parentCollection, elemSchema, field, oncomplete, overrides) {
            var _self = this;
            var keyField = _self.getKeyField(elemSchema);
            
            // Defensively make sure the delta obj is well formed.
            if (!_deltaObj.adds) {
                _deltaObj.adds = [];
            }
            if (!_deltaObj.updates) {
                _deltaObj.updates = [];
            }

            var args = {
                nToAdd: _deltaObj.adds.length,
                nToUpdate: _deltaObj.updates.length,
                nAddsDone: 0,
                nUpdatesDone: 0,
                allAdds: [],
                deltaObj: _deltaObj,
                oncomplete: oncomplete
            };

            var addDone = function(pObj, args) {
                ++args.nAddsDone;
                args.allAdds.push(pObj);
                if (pObj && args.uidToEID) {
                    args.uidToEID[pObj[keyField]] = pObj.id;
                }
                if (args.nAddsDone === args.nToAdd) {
                    /* Nothing more to add - we are done. */
                    syncFn(args);
                }
            };
            
            var updateDone = function(args) {
                ++args.nUpdatesDone;
                if (args.nUpdatesDone >= args.nToUpdate) {
                    /* Nothing more to add - we are done. */
                    args.oncomplete(field, args.allAdds);
                }
            };
            
            var syncFn = function(args) {
                if (args.deltaObj.updates.length > 0) {
                    while (args.deltaObj.updates.length > 0) {
                       var updatedObj = args.deltaObj.updates.pop();
                       var toUpdateKey = updatedObj[_self.getJSONKeyField(elemSchema, updatedObj)];
                       var objId = args.uidToEID[toUpdateKey];
                       if (objId) {
                           Helix.DB.updateOneObject(allSchemas,objId,updatedObj,keyField,toUpdateKey,elemSchema,function(pObj,_args) {
                                updateDone(_args);
                               //syncFn(uidToEID);
                               //syncFn(pObj);
                           },overrides,args);
                       } else {
                           Helix.DB.addObjectToQueryCollection(allSchemas,updatedObj,elemSchema,parentCollection,overrides,syncFn,args);
                       }
                    }
                } else {
                    /* Nothing more to sync. Done. */
                    oncomplete(field, args.allAdds);
                }
            };

            var doAdds = function(args) {
                if (args.deltaObj.adds.length === 0) {
                    syncFn(args);
                } else {
                    while (args.deltaObj.adds.length > 0) {
                        var toAdd = args.deltaObj.adds.pop();
                        var toAddKey = toAdd[_self.getJSONKeyField(elemSchema, toAdd)];

                        var objId = args.uidToEID[toAddKey];
                        if (objId) {
                            Helix.DB.updateOneObject(allSchemas,objId,toAdd,keyField,toAddKey,elemSchema,function(pObj,_args) {
                                parentCollection.add(pObj);
                                addDone(pObj, _args);
                            },overrides,args);
                        } else {
                            Helix.DB.addObjectToQueryCollection(allSchemas,toAdd,elemSchema, parentCollection,overrides,addDone,args);
                        }                        
                    }                                     
                }
            };

            var createUIDToEIDMap = function(args) {
                args.uidToEID = {};
                if (args.deltaObj.adds.length === 0 &&
                    args.deltaObj.updates.length === 0) {
                    // Skip to the finish line ...
                    syncFn(args);
                } else {
                    persistence.transaction(function(tx) {
                        var sql = 'SELECT id, ' + keyField + ' FROM `' + elemSchema.meta.name + '`;';
                        tx.executeSql(sql, null, function(rows) {
                            for ( var i = 0; i < rows.length; i++) {
                                var r = rows[i];
                                if (r[keyField]) {
                                    args.uidToEID[r[keyField]] = r.id;
                                }
                            }
                            doAdds(args);
                        }, function(t, e, badSQL, badArgs) {
                            persistence.errorHandler(e.message, e.code, badSQL, badArgs);
                            doAdds(args);
                        });
                    });
                    /*
                    elemSchema.all().include([keyField]).noRelationships().noFlush().newEach({    
                        eachFn: function(elem) {
                            uidToEID[elem[keyField]] = elem.id;
                        }, 
                        doneFn: function() {
                            doAdds(uidToEID);
                        }
                    });*/
                }
            };
            
            var prepareAdds = function(args) {
                var addUniqueIDs = [];
                for (var i = 0; i < args.deltaObj.adds.length; ++i) {
                    var toAdd = args.deltaObj.adds[i];
                    addUniqueIDs.push(toAdd[_self.getJSONKeyField(elemSchema, toAdd)]);
                }
                createUIDToEIDMap(args);
            };
            
            var removeFn = function(persistentObj, args) {
                if (persistentObj) {
                    parentCollection.remove(persistentObj);
                    persistence.remove(persistentObj);
                    if (overrides && overrides.deleteHook){
                        overrides.deleteHook(persistentObj);
                    }
                }

                if (args.deltaObj.deletes && args.deltaObj.deletes.length > 0) {
                    var toDeleteKey = args.deltaObj.deletes.pop();
                    parentCollection.filter(keyField, "=", toDeleteKey).noFlush().newEach({
                        eachFn: function(elem) { 
                            if (elem) {
                                Helix.DB.cascadingRemove(elemSchema,elem,function(_obj, _op, _args) {
                                    removeFn(_obj, _args);
                                },overrides, args);
                            }
                        },
                        startFn: function(ct) {
                            if (ct === 0) {
                                removeFn(null, args);
                            }
                        }
                    });
                } else if (args.deltaObj.deleteSpec && args.deltaObj.deleteSpec.length > 0) {
                    var nxt = args.deltaObj.deleteSpec.pop();
                    if (nxt.op === 'CLEAR' && parentCollection) {
                        parentCollection.destroyAll(function() {
                            removeFn(null, args);
                        });
                    } else {
                        elemSchema.all().filter(nxt.field, nxt.op, nxt.value).destroyAll(function() {
                            removeFn(null, args);
                        });
                    }
                } else {
                    /* Make sure all deletes are in the DB. */
                    persistence.flush(function() {
                        /* Nothing more to remove. Add in any new objects. */
                        prepareAdds(args);                
                    });
                }
            };

            if ((_deltaObj.deleteSpec && _deltaObj.deleteSpec.length > 0) ||
                    (_deltaObj.deletes && _deltaObj.deletes.length > 0)) {
                /* Handle deletes, then sync. Then we handle modifications and adds. */
                removeFn(null, args);
            } else {
                /* Nothing to remove; move on to adds ... */
                prepareAdds(args);
            }
        },
    
        synchronizeDeltaObject: function(allSchemas, deltaObj, parentCollection, elemSchema, oncomplete, overrides) {
            Helix.DB.synchronizeDeltaField(allSchemas, deltaObj, parentCollection, elemSchema, null, function(fld, allAdds) {
                oncomplete(allAdds);
            }, overrides);
        },
    
        synchronizeObjectField: function(allSchemas, obj, persistentObj, objSchema, field, key, oncomplete, overrides) {
            // Update the old object (if it exists) or add the new with a recursive call.
            var objLocalField = field;
            var setter = Object.getOwnPropertyDescriptor(persistentObj, objLocalField).set;
            objSchema.findBy(Helix.DB.getKeyField(objSchema), key, function(dbObj) {
                Helix.DB.synchronizeObjectFields(allSchemas, obj,dbObj,objSchema,function(newObj) {
                    setter.call(persistentObj, newObj);
                    oncomplete(objLocalField);
                }, overrides);
            });
        },

        /**
         * Synchronizes the object fields against either (a) a fresh object, or (b) a 
         * populated object read from the database.
         */
        synchronizeObjectFields: function(allSchemas, obj, persistentObj, objSchema, oncomplete, overrides, opaque) {
            /* First determine what fields we will need to handle asynchronously. We are going
             * to execute a recursive descent algorithm, going into sub-arrays and sub-objects of
             * obj and synchronizing them before we synchronize obj itself. The reason is that
             * when we update persistentObj (or create it) the persistence mechanism marks that
             * object as dirty. If a sub-array sync operation triggers a flush to the DB (which it does)
             * then we will asynchronously execute many simultaneous flushes of the same object. This
             * causes a lot of extra DB churn and it will over-populate the full text index.
             */
            var asyncFields = [];
            var scalarFields = [];
            allSchemas[objSchema.__hx_schema_name] = objSchema;
            
            // We need to translate the JSON field key into an actual field name
            // Lookup the dictionary for this schema in the global JSON dictionary.
            // The global dictionary is generated during compilation of the Java classes.
            var classDict = this.getClassDictionary(objSchema);
            
            for (var field in obj) {
                if (!obj.hasOwnProperty(field)) {
                    continue;
                }
                if (field in Helix.DB.reservedFields) {
                    continue;
                }
                if (classDict && field in classDict) {
                    // The class dictionary exists => translate field name
                    // and replace field in object.
                    var val = obj[field];
                    delete obj[field];
                    field = classDict[field];
                    obj[field] = val;
                }
                if (Object.prototype.toString.call(obj[field]) === '[object Array]' ||
                    Object.prototype.toString.call(obj[field]) === '[object Object]') {
                    asyncFields.push(field);    
                } else {
                    scalarFields.push(field);
                }
            }
            
            if (!persistentObj) {
                persistentObj = new objSchema();
                persistence.add(persistentObj);
            }
            objSchema.__indexingDirty = true;
            persistentObj.__hx_schema = objSchema;
            persistentObj.__hx_key = obj[this.getKeyField(objSchema)];
            persistentObj.__hx_indexed = false;
            
            /* Now synchronize all scalar fields (i.e. non-object, non-array) to ensure that we don't 
             * make a bunch of objects dirty and flush them over and over again as
             * we recurse through their children. We make all non-relation changes before
             * we do anything that might trigger a flush.
             */
            while (scalarFields.length > 0) {
                field = scalarFields.pop();
                /* Use the setter to make sure the object is marked as dirty appropriately. */
                var prop = Object.getOwnPropertyDescriptor(persistentObj, field);
                if (prop) {
                    var setter = prop.set;
                    if (!overrides.syncFields(setter, obj, field, persistentObj)) {
                        setter.call(persistentObj, obj[field]);
                    }
                }
            }
            
            /* Called when an asynchronous relationship field is done sync'ing. */
            var syncDone = function() {
                if (overrides.addHook) {
                    overrides.addHook(persistentObj);
                }
                
                oncomplete(persistentObj, opaque);
            };
            
            /* Now handle relationship fields. We must handle them ONE at a time. Otherwise we get multiple asynchronous
             * calls to persistence.flush which stomp all over each other ...
             */
            var handleAsyncFields = function() {
                /* See if we are done. */
                if (asyncFields.length === 0) {
                    syncDone();
                    return;
                }
                
                var field = asyncFields.pop();
                var fieldSchema = objSchema.__pm_subSchemas[field];
                var fieldVal = obj[field];
                if (Object.prototype.toString.call(fieldVal) === '[object Array]') {
                    /* Synchronize the array field - since this is not a delta object, we assume the returned
                     * object has all fields that should be in this data table.
                     */
                    if (!Helix.DB.synchronizeArrayField(allSchemas, fieldVal, persistentObj, persistentObj[field], fieldSchema, field, handleAsyncFields, overrides)) {
                        var nDone = 0;
                        for (var _q = 0; _q < fieldVal.length; ++_q) {
                            Helix.DB._synchronizeObject(fieldVal[_q], fieldSchema, function() {
                                ++nDone;
                                if (nDone === fieldVal.length) {
                                    handleAsyncFields();
                                }
                            }, null, overrides);
                        }
                    }
                } else if (Object.prototype.toString.call(fieldVal) === '[object Object]') {
                    if (fieldVal.__hx_type === 1001) {
                        Helix.DB.synchronizeDeltaField(allSchemas, fieldVal, persistentObj[field], fieldSchema, field, handleAsyncFields, overrides);                 
                    } else {
                        var keyField = Helix.DB.getJSONKeyField(fieldSchema, fieldVal);
                        Helix.DB.synchronizeObjectField(allSchemas, fieldVal, persistentObj, fieldSchema, field, fieldVal[keyField], handleAsyncFields, overrides); 
                    }      
                }                
            };
            
            /* Handle all asynchronous fields. */
            handleAsyncFields();
        },

        synchronizeArray: function(allSchemas, obj,objSchema,persistentObj,callback,opaque,overrides) {
            return Helix.DB.synchronizeArrayField(allSchemas, obj, null, persistentObj, objSchema, null, function() {
                callback(persistentObj);
            }, overrides);            
        },


        launchIndexing: function() {
            if (!Helix.DB.noAutoIndexing) {
                for (var schemaName in window.__pmAllSchemas) { 
                    var indexSchema = window.__pmAllSchemas[schemaName];
                    if (indexSchema.__indexingDirty) {
                        indexSchema.indexAsync(0, Helix.DB.indexFull);
                        indexSchema.__indexingDirty = false;
                    }
                }
            }
        },

        /**
         * Call this function to synchronize an object to the database after loading that
         * object from the remote server. This function first queries the database using the 
         * object's key field to see if it exists. If so, it updates the old object to 
         * match the new one. If not, it simply converts the object into a persistent object 
         * and flushes it to the DB. Invoke the callback on completion.
         */
        synchronizeObject: function(obj,objSchema,callback,opaque,overrides) {
            Helix.DB._synchronizeObject(obj,objSchema,function(finalObj, opaque) {
                /* We get here when the synchronize is done. */
                persistence.flush(function() {
                    /* Launch async indexing ... these calls do nothing if there are
                       no fields to index or if async indexing is not enabled. */
                    Helix.DB.launchIndexing();
                    setTimeout(function() {
                        // Use setTimeout to make sure that any open transactions are finished before we invoke
                        // the callback.
                        callback(finalObj, opaque);                    
                    }, 0);
                });
            },opaque,overrides);
        },
        
        _synchronizeObject: function(obj,objSchema,callback,opaque,overrides) {
            var allSchemas = {};
        
            /* Check the overrides. IF we do not have overrides for the field sync then
             * install the default.
             */
            if (!overrides) {
                overrides = {};
            }
            if (!overrides.syncFields) {
                overrides.syncFields = Helix.DB.Utils.defaultFieldSync;
            }
            if (!overrides.refineEntityArray) {
                overrides.refineEntityArray = Helix.DB.Utils.identityRefineEntityArray;
            }
            
            if (Object.prototype.toString.call(obj) === '[object Array]') {
                var isHandled = Helix.DB.synchronizeArray(allSchemas, obj,objSchema,objSchema.all(),function(finalObj) {
                    callback(finalObj, opaque);
                },opaque,overrides);
                if (!isHandled) {
                    for (var i = 0; i < obj.length; ++i) {
                        var nxtOpaque = opaque;
                        if (opaque && opaque.params && $.isArray(opaque.params)) {
                            nxtOpaque = $.extend({}, opaque, { params: opaque.params[i], isDone: (i === (obj.length - 1)) ? true : false, callback: callback });
                        }    
                        Helix.DB._synchronizeObject(obj[i], objSchema, function(finalObj, o) {
                            if (o.isDone) {
                                o.callback(finalObj, o);
                            }
                        }, nxtOpaque, overrides);
                    }
                }
            } else if (obj.__hx_type === 1001) {
                Helix.DB.synchronizeDeltaObject(allSchemas, obj,objSchema.all(),objSchema,function(finalObj) {
                    callback(finalObj, opaque);
                },overrides);
            } else if (obj.__hx_type === 1003) {
                // This is an aggregate load command. Each object field represents a distinct object that
                // should be synchronized independently of the others.
                var toSync = Object.keys(obj).slice(0);
                var resultObj = {};
                var paramObj = {};
                
                var syncObjects = function(syncObject, paramObject, loadCommandConfig, nxt) {
                    if (syncObject.length === 0) {
                        syncComponent();
                    } else {
                        var syncNxt = syncObject.pop();
                        Helix.DB._synchronizeObject(syncNxt, loadCommandConfig.schema, function(finalObj, o) {
                            resultObj[o.name] = finalObj;
                            if (o.param) {
                                paramObj[o.name] = o.param;
                            }
                            syncObjects(syncObject, paramObject, loadCommandConfig, nxt);
                        }, { name: nxt, param: paramObject }, loadCommandConfig.syncOverrides);
                    }
                };
                
                /* Serialize synchronization of each component so that we never have >1 flush in progress. */
                var syncComponent = function() {
                    if (toSync.length === 0) {
                        if (Object.keys(paramObj).length > 0) {
                            opaque.params = paramObj;
                        }
                        callback(resultObj, opaque);
                        return;
                    }
                    
                    var nxt = toSync.pop();
                    if (nxt === "__hx_type") {
                        syncComponent();
                        return;
                    }
                    
                    if (obj[nxt].error) {
                        resultObj[nxt] = obj[nxt];
                        syncComponent();
                    } else {
                        var syncObject = null;
                        var paramObject = null;
                        if (obj[nxt].__hx_type === 1004) {
                            syncObject = obj[nxt].sync;
                            paramObject = obj[nxt].param;
                            if (!$.isArray(syncObject)) {
                                syncObject = [ syncObject ];
                            }
                        } else {
                            syncObject = [ obj[nxt] ];
                        }
                        var loadCommandConfig = overrides.schemaMap[nxt];
                        syncObjects(syncObject, paramObject, loadCommandConfig, nxt);
                    }
                };
                syncComponent();
            } else {
                var dbKeyField = Helix.DB.getKeyField(objSchema);
                var objKeyField = Helix.DB.getJSONKeyField(objSchema, obj);
                objSchema.findBy(dbKeyField, obj[objKeyField], function(persistentObj) {
                    Helix.DB.synchronizeObjectFields(allSchemas, obj, persistentObj, objSchema, function(finalObj) {
                        /* Store the schema in the final obj. */
                        finalObj.__hx_schema = objSchema;
                        callback(finalObj, opaque);
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
                if (persistentObj) {
                    persistentObj.__hx_schema = objSchema;
                }
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
                globalFilterFields: "TEXT",
                textIndexFields: "TEXT",
                tableOneToMany: "TEXT",
                tableManyToOne: "TEXT",
                masterDBVer: "INT"
            });
            window.__pmMasterDB.index('tableName', {
                unique: true
            });
            
            var allTables = {};
            var masterDBVer = 0;
            persistence.schemaSync(function(tx) {
                window.__pmMasterDB.all().newEach({
                    eachFn: function(elem) {
                        if (elem.masterDBVer) {
                            masterDBVer = elem.masterDBVer;
                        }
                        
                        allTables[elem.tableName] = elem;
                    }, 
                    doneFn: function(ct) {
                        var masterDBDirty = false;
                        if (masterDBVer === 0 && ct > 0) {
                            persistence.nextSchemaSyncHooks.push(function() {
                                var queries = [];
                                queries.push(["ALTER TABLE MasterDB ADD COLUMN masterDBVer TEXT" , null]);
                                queries.push(["ALTER TABLE MasterDB ADD COLUMN textIndexFields TEXT" , null]);
                                return queries.reverse();
                            });
                            masterDBDirty = true;
                        }
                        if (masterDBVer !== Helix.DB.__masterDBVer) {
                            persistence.nextSchemaSyncHooks.push(function() {
                                var queries = [];
                                queries.push(["UPDATE MasterDB SET masterDBVer=?", [ Helix.DB.__masterDBVer ]]);
                                return queries;
                            });
                            masterDBDirty = true;
                        }
                        
                        var __triggerReady = function() {
                            var schemasDone = [];
                            // Must make persistence ready PRIOR to triggering hxGenerateSchemas, which calls generatePersistenceSchema for
                            // SDK schemas.
                            window.__persistenceReady = true;
                            window.__pmAllTables = allTables;
                            if (!window.__pmAllSchemas) {
                                window.__pmAllSchemas = {};
                            }
                            $(document).trigger('hxGenerateSchemas', [ schemasDone ]);
                            
                            if (schemasDone.length > 0) {
                                persistence.schemaSync(function(tx) {
                                    // Flush any MasterDB changes triggered by SDK generated schemas.
                                    persistence.flush(function() {
                                        persistence.clean();
                                        $(document).trigger('hxPersistenceReady');                                
                                    });
                                });
                            } else {
                                $(document).trigger('hxPersistenceReady');                            
                            }
                        };
                        
                        if (masterDBDirty) {
                            persistence.schemaSync(__triggerReady);
                        } else {
                            __triggerReady();
                        }
                    }
                })
            });
        },
    
        initPersistence: function () {
            window.__persistenceReady = false;
            
            /* Initialize PersistenceJS for use with WebSQL. Eventually need to add IndexedDB support. */
            persistence.store.websql.config(persistence, 'OfflineAppDB', 'Managed offline DB for app.', 5 * 1024 * 1024);
            
            /* Initialize PersistenceJS searching. */
            persistence.search.config(persistence, persistence.store.websql.sqliteDialect, {
                indexAsync : true
            });
            
            if (window.__hxInitJSONDictionary) {
                Helix.DB.JSONDictionary = window.__hxInitJSONDictionary();
            }
            
            /* Keep a master list of all widget schemas we have attempted to create. This ensures we
             * don't recreate the schema each time we run a load command.
             */
            this.createdSchemas = {};

            /* Initialize PersistenceJS migrations. */
            persistence.transaction(function(tx) {
                persistence.migrations.init(tx, function() {
                    persistence.migrations.Migrator.version(tx, function(schemaVer) {
                        Helix.DB.__schemaVersion = schemaVer;
                    });
                    Helix.DB.pmCreateMasterTable();
                });
            });
        },
    
        persistenceIsReady: function() {
            if (!window.__persistenceReady) {
                return false;
            }
        
            return true;
        }
    };
    
    initHelixDBUtils();
}
