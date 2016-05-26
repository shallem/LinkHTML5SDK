/**
 * Default type mapper. Override to support more types or type options.
 */
var defaultTypeMapper = {
    /**
   * SQL type for ids
   */
    idType: "VARCHAR(32)",

    /**
   * SQL type for class names (used by mixins)
   */
    classNameType: "TEXT",

    /**
   * Returns SQL type for column definition
   */
    columnType: function(type){
        switch(type) {
            case 'JSON':
                return 'TEXT';
            case 'BOOL':
                return 'INT';
            case 'DATE':
                return 'INT';
            default:
                return type;
        }
    },

    inVar: function(str, type){
        return str;
    },
    outVar: function(str, type){
        return str;
    },
    outId: function(str){
        return "'" + str + "'";
    },
    /**
   * Converts a value from the database to a value suitable for the entity
   * (also does type conversions, if necessary)
   */
    dbValToEntityVal: function(val, type){
        if (val === null || val === undefined) {
            return val;
        }
        switch (type) {
            case 'DATE':
                // SQL is in seconds and JS in miliseconds
                if (val > 1000000000000) {
                    // usually in seconds, but sometimes it's milliseconds
                    return new Date(parseInt(val, 10));
                } else {
                    return new Date(parseInt(val, 10) * 1000);
                }
            case 'BOOL':
                return val === 1 || val === '1';
                break;
            case 'INT':
                return +val;
                break;
            case 'BIGINT':
                return +val;
                break;
            case 'JSON':
                if (val) {
                    return JSON.parse(val);
                }
                else {
                    return val;
                }
                break;
            default:
                return val;
        }
    },

    /**
   * Converts an entity value to a database value, inverse of
   *   dbValToEntityVal
   */
    entityValToDbVal: function(val, type){
        if (val === undefined || val === null) {
            return null;
        }
        else if (type === 'JSON' && val) {
            return JSON.stringify(val);
        }
        else if (val.id) {
            return val.id;
        }
        else if (type === 'BOOL') {
            if (val === 'false' || val === 'f' || val === '0') {
                return false;
            } else if (val === 'true' || val === 't' || val === '1') {
                return true;
            }
        
            return (val ? 1 : 0);
        }
        else if (type === 'DATE' || val.getTime) {
            // In order to make SQLite Date/Time functions work we should store
            // values in seconds and not as miliseconds as JS Date.getTime()
            val = new Date(val);
            return Math.round(val.getTime() / 1000);
        }
        else if (type === 'INT' && Helix.Utils.isString(val)) {
            return parseInt(val);
        }
        else {
            return val;
        }
    },
    /**
   * Shortcut for inVar when type is id -- no need to override
   */
    inIdVar: function(str){
        return this.inVar(str, this.idType);
    },
    /**
   * Shortcut for outVar when type is id -- no need to override
   */
    outIdVar: function(str){
        return this.outVar(str, this.idType);
    },
    /**
   * Shortcut for entityValToDbVal when type is id -- no need to override
   */
    entityIdToDbId: function(id){
        return this.entityValToDbVal(id, this.idType);
    }
}

function config(persistence, dialect) {
    var argspec = persistence.argspec;

    persistence.typeMapper = dialect.typeMapper || defaultTypeMapper;

    persistence.generatedTables = {}; // set

    /**
   * Synchronize the data model with the database, creates table that had not
   * been defined before
   *
   * @param tx
   *            transaction object to use (optional)
   * @param callback
   *            function to be called when synchronization has completed,
   *            takes started transaction as argument
   */
    persistence.schemaSync = function (tx, callback, emulate) {
        var args = argspec.getArgs(arguments, [
        {
            name: "tx", 
            optional: true, 
            check: persistence.isTransaction, 
            defaultValue: null
        },
        {
            name: "callback", 
            optional: true, 
            check: argspec.isCallback(), 
            defaultValue: function(){}
        },

        {
            name: "emulate", 
            optional: true, 
            check: argspec.hasType('boolean')
        }
        ]);
        tx = args.tx;
        callback = args.callback;
        emulate = args.emulate;

        if(!tx) {
            var session = this;
            this.transaction(function(tx) {
                session.schemaSync(tx, callback, emulate);
            });
            return;
        }
        var queries = [], meta, colDefs, otherMeta, tableName;

        var tm = persistence.typeMapper;
        var entityMeta = persistence.getEntityMeta();
        for (var entityName in entityMeta) {
            if (entityMeta.hasOwnProperty(entityName)) {
                meta = entityMeta[entityName];
                if (!meta.isMixin) {
                    colDefs = [];
                    for (var prop in meta.fields) {
                        if (meta.fields.hasOwnProperty(prop)) {
                            colDefs.push([prop, meta.fields[prop]]);
                        }
                    }
                    for (var rel in meta.hasOne) {
                        if (meta.hasOne.hasOwnProperty(rel)) {
                            otherMeta = meta.hasOne[rel].type.meta;
                            colDefs.push([rel, tm.idType]);
                            if (!persistence.generatedTables[meta.name]) {
                                queries.push([dialect.createIndex(meta.name, [rel]), null]);
                            }
                        }
                    }
                    if (!persistence.generatedTables[meta.name]) {
                        for (var i = 0; i < meta.indexes.length; i++) {
                            queries.push([dialect.createIndex(meta.name, meta.indexes[i].columns, meta.indexes[i]), null]);
                        }
                    }
                }
                for (var rel in meta.hasMany) {
                    if (meta.hasMany.hasOwnProperty(rel) && meta.hasMany[rel].manyToMany) {
                        tableName = meta.hasMany[rel].tableName;
                        if (!persistence.generatedTables[tableName]) {
                            var otherMeta = meta.hasMany[rel].type.meta;
                            var inv = meta.hasMany[rel].inverseProperty;
                            // following test ensures that mixin mtm tables get created with the mixin itself
                            // it seems superfluous because mixin will be processed before entitites that use it
                            // but better be safe than sorry.
                            if (otherMeta.hasMany[inv].type.meta != meta)
                                continue;
                            var p1 = meta.name + "_" + rel;
                            var p2 = otherMeta.name + "_" + inv;
                            queries.push([dialect.createIndex(tableName, [p1]), null]);
                            queries.push([dialect.createIndex(tableName, [p2]), null]);
                            var columns = [[p1, tm.idType], [p2, tm.idType]];
                            if (meta.isMixin)
                                columns.push([p1 + "_class", tm.classNameType])
                            if (otherMeta.isMixin)
                                columns.push([p2 + "_class", tm.classNameType])
                            queries.push([dialect.createTable(tableName, columns), null]);
                            persistence.generatedTables[tableName] = true;
                        }
                    }
                }
                if (!meta.isMixin && !persistence.generatedTables[meta.name]) {
                    colDefs.push(["id", tm.idType, "PRIMARY KEY"]);
                    persistence.generatedTables[meta.name] = true;
                    queries.push([dialect.createTable(meta.name, colDefs), null]);
                }
            }
        }
        var fns = persistence.schemaSyncHooks;
        for(var i = 0; i < fns.length; i++) {
            var moreQueries = fns[i](tx);
            if (moreQueries) {
                queries = queries.concat(moreQueries);
            }
        }
        fns = persistence.nextSchemaSyncHooks;
        for(i = 0; i < fns.length; i++) {
            moreQueries = fns[i](tx);
            if (moreQueries) {
                queries = queries.concat(moreQueries);
            }
        }
        // Only run on 1 sync.
        persistence.nextSchemaSyncHooks = [];
        if(emulate) {
            // Done
            callback(tx);
        } else {
            executeQueriesSeq(tx, queries, function(_, err) {
                callback(tx, err);
            });
        }
    };

    /**
   * Persists all changes to the database transaction
   *
   * @param tx
   *            transaction to use
   * @param callback
   *            function to be called when done
   * @param stopTracking
   *            indicate that we want to stop tracking the objects we flush; default
   *            is true, unless false is specified explicitly
   */
    persistence.flush = function (tx, callback, stopTracking) {
        var args = argspec.getArgs(arguments, [
        {
            name: "tx", 
            optional: true, 
            check: persistence.isTransaction
        },
        {
            name: "callback", 
            optional: true, 
            check: argspec.isCallback(), 
            defaultValue: null
        }
        ]);
        tx = args.tx;
        callback = args.callback;

        // Before we go any further see if we have anything to do. If not, just call the completion function.
        var session = this;
        if (Object.keys(session.trackedObjects).length === 0 &&
                Object.keys(session.objectsToRemove).length === 0) {
            // Nothing to track and nothing to remove.
            if (callback) {
                callback();
            }
            return;
        }

        // SAH - eliminate flush hooks. We want to add as many statements into a single
        // txn as possible. Allowing asynchronous delays can cause a transaction to flush
        // before we add required statements to it. Users of this API need to find another
        // way to 
        var persistObjArray = [];
        for (var id in session.trackedObjects) {
            if (session.trackedObjects.hasOwnProperty(id)) {
                persistObjArray.push(session.trackedObjects[id]);
            }
        }
        var removeObjArray = [];
        for (var id in session.objectsToRemove) {
            if (session.objectsToRemove.hasOwnProperty(id)) {
                removeObjArray.push([id, session.objectsToRemove[id]]);
                delete session.trackedObjects[id]; // Stop tracking
            }
        }
        
        // Stop tracking everything we flushed. This also ensures that if async calls
        // to flush happen at the same time only one of them attempts to persist the list
        // of tracked objects (which have now been moved into the local persistObjArray).
        if (stopTracking === true ||
            stopTracking === undefined) {
            for (var i = 0; i < persistObjArray.length; ++i) {
                id = persistObjArray[i].id;
                delete session.trackedObjects[id];            
            }         
        }
        
        var __doFlush = function(tx, callback, persistObjArray, removeObjArray) {
            session.objectsToRemove = {};
            if(callback) {
                persistence.asyncParForEach(removeObjArray, function(obj, callback) {
                    remove(obj, tx, callback);
                }, function(result, err, _persistArr) {
                    if (err) return callback(result, err);
                    persistence.asyncParForEach(_persistArr, function(obj, callback) {
                        save(obj, tx, callback);
                    }, function() {
                        callback();
                    });
                    return true;
                }, persistObjArray);
            } else { // More efficient
                for(var i = 0; i < removeObjArray.length; i++) {
                    remove(removeObjArray[i], tx);
                }
                for(var i = 0; i < persistObjArray.length; i++) {
                    save(persistObjArray[i], tx);
                }
            }
        };

        if(!tx) {
            this.transaction(function(tx) {
                __doFlush(tx, callback, persistObjArray, removeObjArray);
            });
        } else {
            __doFlush(tx, callback, persistObjArray, removeObjArray);
        }
    };

    /**
   * Remove all tables in the database (as defined by the model)
   */
    persistence.reset = function (tx, callback) {
        var args = argspec.getArgs(arguments, [
        {
            name: "tx", 
            optional: true, 
            check: persistence.isTransaction, 
            defaultValue: null
        },
        {
            name: "callback", 
            optional: true, 
            check: argspec.isCallback(), 
            defaultValue: function(){}
        }
        ]);
        tx = args.tx;
        callback = args.callback;

        var session = this;
        if(!tx) {
            session.transaction(function(tx) {
                session.reset(tx, callback);
            });
            return;
        }
        // First emulate syncing the schema (to know which tables were created)
        this.schemaSync(tx, function() {
            var tableArray = [];
            for (var p in persistence.generatedTables) {
                if (persistence.generatedTables.hasOwnProperty(p)) {
                    tableArray.push(p);
                }
            }
            function dropOneTable () {
                var tableName = tableArray.pop();
                tx.executeSql("DROP TABLE IF EXISTS `" + tableName + "`", null, function () {
                    if (tableArray.length > 0) {
                        dropOneTable();
                    } else {
                        cb();
                    }
                }, cb);
            }
            if(tableArray.length > 0) {
                dropOneTable();
            } else {
                cb();
            }

            function cb(result, err) {
                session.clean();
                persistence.generatedTables = {};
                if (callback) callback(result, err);
            }
        }, true);
    };

    /**
   * Converts a database row into an entity object
   */
    function rowToEntity(session, entityName, row, prefix) {
        prefix = prefix || '';
        var tm = persistence.typeMapper;
        var rowMeta = persistence.getMeta(entityName);
        var ent = persistence.define(entityName); // Get entity
        if(!row[prefix+'id']) { // null value, no entity found
            return null;
        }
        var o = null;
        if (session.trackedObjects[row[prefix + "id"]]) { // Cached version
            o = session.trackedObjects[row[prefix + "id"]];
        } else {
            o = new ent(session, undefined, true);
        }
        o.id = tm.dbValToEntityVal(row[prefix + 'id'], tm.idType);
        o._new = false;
        for ( var p in row) {
            if (row.hasOwnProperty(p)) {
                if (p.substring(0, prefix.length) === prefix) {
                    var prop = p.substring(prefix.length);
                    if (prop != 'id') {
                        o._data[prop] = tm.dbValToEntityVal(row[p], rowMeta.fields[prop] || tm.idType);
                    }
                }
            }
        }
        return o;
    }

    function saveObj(obj, tx, callback, properties, values, propertyPairs, qs) {
        var meta = persistence.getMeta(obj._type);
        var tm = persistence.typeMapper;
    
        obj._dirtyProperties = {};
        if (obj._new) {
            properties.push('id');
            values.push(tm.entityIdToDbId(obj.id));
            qs.push(tm.outIdVar('?'));
            var sql = "INSERT INTO `" + obj._type + "` (" + properties.join(", ") + ") VALUES (" + qs.join(', ') + ")";
            obj._new = false;
            tx.executeSql(sql, values, callback, function(t, e, badSQL, badArgs) {
                persistence.errorHandler(e.message, e.code, badSQL, badArgs);
                callback();                  
                return false;
            });
        } else if (propertyPairs.length > 0) {
            sql = "UPDATE `" + obj._type + "` SET " + propertyPairs.join(',') + " WHERE id = " + tm.outId(obj.id);
            tx.executeSql(sql, values, callback, function(t, e, badSQL, badArgs) {
                persistence.errorHandler(e.message, e.code, badSQL, badArgs);
                callback();                  
                return false;
            });
        } else {
            // Nothing to do. Just call the callback.
            if (callback) {
                callback();
            }
        }
    }

    /**
   * Internal function to persist an object to the database
   * this function is invoked by persistence.flush()
   */
    function save(obj, tx, callback) {
        var meta = persistence.getMeta(obj._type);
        var tm = persistence.typeMapper;
        var properties = [];
        var values = [];
        var qs = [];
        var propertyPairs = [];
        if(obj._new) { // Mark all properties dirty
            for (var p in meta.fields) {
                if(meta.fields.hasOwnProperty(p)) {
                    obj._dirtyProperties[p] = true;
                }
            }
        }
        for ( var p in obj._dirtyProperties) {
            if (obj._dirtyProperties.hasOwnProperty(p) && !(obj._ignoreProperties[p])) {
                properties.push("`" + p + "`");
                var type = meta.fields[p] || tm.idType;
                values.push(tm.entityValToDbVal(obj._data[p], type));
                qs.push(tm.outVar("?", type));
                propertyPairs.push("`" + p + "` = " + tm.outVar("?", type));
            }
        }
        var additionalQueries = [];
        for(var p in meta.hasMany) {
            if(meta.hasMany.hasOwnProperty(p)) {
                additionalQueries = additionalQueries.concat(persistence.get(obj, p).persistQueries());
            }
        }
        /*executeQueriesSeq(tx, additionalQueries, function(obj, callback, properties, values, propertyPairs, qs) {
        if (!obj._new && properties.length === 0) { // Nothing changed and not new
          if(callback) callback();
          return;
        }
        saveObj(obj, tx, callback, properties, values, propertyPairs, qs);
      }, obj, callback, properties, values, propertyPairs, qs);*/

        // Note that everything we do here is in 1 txn. We don't need to ensure that an object's
        // one-to-many targets are inserted before the object is inserted. We just need to make
        // sure that we don't assume the insert is done and invoke the callback until all one-to-many
        // objects are in the DB.
        var nQueries = additionalQueries.length + 1; // 1 extra for the insert/update of this object.
        var nDone = 0;
        var __callback = function() {
            ++nDone;
            if (nQueries === nDone && callback) {
                callback();
            }
        };
    
        for (var i = 0; i < additionalQueries.length; ++i) {
            var queryTuple = additionalQueries[i];
            tx.executeSql(queryTuple[0], queryTuple[1], __callback, function(_, err, badSQL, badArgs) {
                persistence.errorHandler(err.message, err.code, badSQL, badArgs);
                __callback();
            });
        }
    
        saveObj(obj, tx, __callback, properties, values, propertyPairs, qs);
    }

    persistence.save = save;

    function remove(removeObjPair, tx, callback) {
        var removeKeyValue = persistence.getRemoveKeyValuePair(removeObjPair[0]);
        var obj = removeObjPair[1];
        
        var meta = persistence.getMeta(obj._type);
        var tm = persistence.typeMapper;
        var queries = [];
        if (removeKeyValue[0] === 'id' && obj.id) {
            queries = [["DELETE FROM `" + obj._type + "` WHERE id = " + tm.outId(obj.id), null]];
            for (var rel in meta.hasMany) {
                if (meta.hasMany.hasOwnProperty(rel) && meta.hasMany[rel].manyToMany) {
                    var tableName = meta.hasMany[rel].tableName;
                    //var inverseProperty = meta.hasMany[rel].inverseProperty;
                    queries.push(["DELETE FROM `" + tableName + "` WHERE `" + meta.name + '_' + rel + "` = " + tm.outId(obj.id), null]);
                }
            }
        } else {
            queries = [["DELETE FROM `" + obj._type + "` WHERE " + removeKeyValue[0] + " = ?", [removeKeyValue[1]]]];
        }
        executeQueriesSeq(tx, queries, callback);
    }

    /**
   * Utility function to execute a series of queries in an asynchronous way
   * @param tx the transaction to execute the queries on
   * @param queries an array of [query, args] tuples
   * @param callback the function to call when all queries have been executed
   * @param delay Small delay to introduce in between statements; optional.
   */
    function executeQueriesSeq (tx, queries, callback, delay) {
        // queries.reverse();
        var callbackArgs = [];
        for ( var i = 4; i < arguments.length; i++) {
            callbackArgs.push(arguments[i]);
        }
        persistence.asyncForEach(queries, function(queryTuple, callback) {
            tx.executeSql(queryTuple[0], queryTuple[1], callback, function(_, err, badSQL, badArgs) {
                persistence.errorHandler(err.message, err.code, badSQL, badArgs);
                if(delay) {
                    setTimeout(function() {
                        callback(_, err.message);
                    }, delay);
                } else {
                    callback(_, err.message);
                }
            });
        }, function(result, err) {
            if (err && callback) {
                callback(result, err);
                return;
            }
            if(callback) callback.apply(null, callbackArgs);
        });
    }

    persistence.executeQueriesSeq = executeQueriesSeq;

    /////////////////////////// QueryCollection patches to work in SQL environment

    /**
   * Function called when session is flushed, returns list of SQL queries to execute
   * (as [query, arg] tuples)
   */
    persistence.QueryCollection.prototype.persistQueries = function() {
        return [];
    };

    var oldQCClone = persistence.QueryCollection.prototype.clone;

    persistence.QueryCollection.prototype.clone = function (cloneSubscribers) {
        var c = oldQCClone.call(this, cloneSubscribers);
        c._additionalJoinSqls = this._additionalJoinSqls.slice(0);
        c._additionalWhereSqls = this._additionalWhereSqls.slice(0);
        c._additionalGroupSqls = this._additionalGroupSqls.slice(0);
        c._manyToManyFetch = this._manyToManyFetch;
        return c;
    };

    var oldQCInit = persistence.QueryCollection.prototype.init;

    persistence.QueryCollection.prototype.init = function(session, entityName, constructor) {
        oldQCInit.call(this, session, entityName, constructor);
        this._manyToManyFetch = null;
        this._additionalJoinSqls = [];
        this._additionalWhereSqls = [];
        this._additionalGroupSqls = [];
    };

    var oldQCToUniqueString = persistence.QueryCollection.prototype.toUniqueString;

    persistence.QueryCollection.prototype.toUniqueString = function() {
        var s = oldQCToUniqueString.call(this);
        s += '|JoinSQLs:';
        for(var i = 0; i < this._additionalJoinSqls.length; i++) {
            s += this._additionalJoinSqls[i];
        }
        s += '|WhereSQLs:';
        for(var i = 0; i < this._additionalWhereSqls.length; i++) {
            s += this._additionalWhereSqls[i];
        }
        s += '|GroupSQLs:';
        for(var i = 0; i < this._additionalGroupSqls.length; i++) {
            s += this._additionalGroupSqls[i];
        }
        if(this._manyToManyFetch) {
            s += '|ManyToManyFetch:';
            s += JSON.stringify(this._manyToManyFetch); // TODO: Do something more efficient
        }
        return s;
    };

    persistence.NullFilter.prototype.sql = function (meta, alias, values) {
        return "1=1";
    };

    persistence.AndFilter.prototype.sql = function (meta, alias, values) {
        return "(" + this.left.sql(meta, alias, values) + " AND "
        + this.right.sql(meta, alias, values) + ")";
    };

    persistence.OrFilter.prototype.sql = function (meta, alias, values) {
        return "(" + this.left.sql(meta, alias, values) + " OR "
        + this.right.sql(meta, alias, values) + ")";
    };

    persistence.PropertyFilter.prototype.sql = function (meta, alias, values) {
        var tm = persistence.typeMapper;
        var aliasPrefix = alias ? "`" + alias + "`." : "";
        var sqlType = meta.fields[this.property] || tm.idType;
        if (this.operator === '=' && this.value === null) {
            return aliasPrefix + '`' + this.property + "` IS NULL";
        } else if (this.operator === '!=' && this.value === null) {
            return aliasPrefix + '`' + this.property + "` IS NOT NULL";
        } else if (this.operator === 'in') {
            var vals = this.value;
            var qs = [];
            for(var i = 0; i < vals.length; i++) {
                qs.push('?');
                values.push(tm.entityValToDbVal(vals[i], sqlType));
            }
            if(vals.length === 0) {
                // Optimize this a little
                return "1 = 0";
            } else {
                return aliasPrefix + '`' + this.property + "` IN (" + qs.join(', ') + ")";
            }
        } else if (this.operator === 'not in') {
            var vals = this.value;
            var qs = [];
            for(var i = 0; i < vals.length; i++) {
                qs.push('?');
                values.push(tm.entityValToDbVal(vals[i], sqlType));
            }

            if(vals.length === 0) {
                // Optimize this a little
                return "1 = 1";
            } else {
                return aliasPrefix + '`' + this.property + "` NOT IN (" + qs.join(', ') + ")";
            }
        } else {
            var value = this.value;
            if(value === true || value === false) {
                value = value ? 1 : 0;
            }
            values.push(tm.entityValToDbVal(value, sqlType));
            return aliasPrefix + '`' + this.property + "` " + this.operator + " " + tm.outVar("?", sqlType);
        }
    };

    // QueryColleciton's list

    /**
   * Asynchronous call to actually fetch the items in the collection
   * @param tx transaction to use
   * @param callback function to be called taking an array with
   *   result objects as argument
   */
    persistence.DbQueryCollection.prototype.list = function (tx, callback) {
        var args = argspec.getArgs(arguments, [
        {
            name: 'tx', 
            optional: true, 
            check: persistence.isTransaction, 
            defaultValue: null
        },
        {
            name: 'callback', 
            optional: false, 
            check: argspec.isCallback()
        }
        ]);
        tx = args.tx;
        callback = args.callback;

        var that = this;
        var session = this._session;
        if(!tx) { // no transaction supplied
            session.transaction(function(tx) {
                that.list(tx, callback);
            });
            return;
        }
        var entityName = this._entityName;
        var meta = persistence.getMeta(entityName);
        var tm = persistence.typeMapper;

        // handles mixin case -- this logic is generic and could be in persistence.
        if (meta.isMixin) {
            var result = [];
            persistence.asyncForEach(meta.mixedIns, function(realMeta, next) {
                var query = that.clone();
                query._entityName = realMeta.name;
                query.list(tx, function(array) {
                    result = result.concat(array);
                    next();
                });
            }, function() {
                var query = new persistence.LocalQueryCollection(result);
                query._orderColumns = that._orderColumns;
                query._reverse = that._reverse;
                // TODO: handle skip and limit -- do we really want to do it?
                query.list(null, callback);
            });
            return;
        }

        function selectAll (meta, tableAlias, prefix, excludes, includes) {
            var selectFields = [ tm.inIdVar("`" + tableAlias + "`.id") + " AS `" + prefix + "id`" ];
            for ( var p in meta.fields) {
                if (excludes && (p in excludes)) {
                    continue;
                }
                if (includes && !(p in includes)) {
                    continue;
                }
          
                if (meta.fields.hasOwnProperty(p)) {
                    selectFields.push(tm.inVar("`" + tableAlias + "`.`" + p + "`", meta.fields[p]) + " AS `"
                        + prefix + p + "`");
                }
            }
            for ( var p in meta.hasOne) {
                if (meta.hasOne.hasOwnProperty(p)) {
                    selectFields.push(tm.inIdVar("`" + tableAlias + "`.`" + p + "`") + " AS `"
                        + prefix + p + "`");
                }
            }
            selectFields.push(tm.inVar("`" + tableAlias + "`.`rowid`", 'INT') + " AS `"
                + prefix + "rowid`");
            return selectFields;
        }
        var args = [];
        //var mainPrefix = entityName + "_";
        var mainPrefix = meta.alias + "_";

        var mainAlias = 'root';
        var selectFields = selectAll(meta, mainAlias, mainPrefix, this._excludes, this._includes);

        var joinSql = '';
        var additionalWhereSqls = this._additionalWhereSqls.slice(0);
        var mtm = this._manyToManyFetch;
        if(mtm) {
            joinSql += "LEFT JOIN `" + mtm.table + "` AS mtm ON mtm.`" + mtm.inverseProp + "` = `root`.`id` ";
            additionalWhereSqls.push("mtm.`" + mtm.prop + "` = " + tm.outId(mtm.id));
        }

        joinSql += this._additionalJoinSqls.join(' ');

        for ( var i = 0; i < this._prefetchFields.length; i++) {
            var prefetchField = this._prefetchFields[i];
            var thisMeta = meta.hasOne[prefetchField].type.meta;
            if (thisMeta.isMixin)
                throw new Error("cannot prefetch a mixin");
            var tableAlias = thisMeta.name + '_' + prefetchField + "_tbl";
            selectFields = selectFields.concat(selectAll(thisMeta, tableAlias,
                prefetchField + "_"));
            joinSql += "LEFT JOIN `" + thisMeta.name + "` AS `" + tableAlias
            + "` ON `" + tableAlias + "`.`id` = `" + mainAlias + '`.`' + prefetchField + "` ";

        }

        var whereSql = "WHERE "
        + [ this._filter.sql(meta, mainAlias, args) ].concat(additionalWhereSqls).join(' AND ');

        var sql = "SELECT " + selectFields.join(", ") + " FROM `" + entityName
        + "` AS `" + mainAlias + "` " + joinSql + " " + whereSql;

        if(this._additionalGroupSqls.length > 0) {
            sql += this._additionalGroupSqls.join(' ');
        }

        if(this._orderColumns.length > 0) {
            sql += " ORDER BY "
            + this._orderColumns.map(
                function (c) {
                    var fldName = c[0];
                    var fldType = meta.fields[fldName];
                    if (fldType && fldType !== 'TEXT') {
                        c[2] = true;
                    }
                    return (c[2] ? "`" : "LOWER(`") + mainPrefix + fldName + (c[2] ? "` " : "`) ")
                        + (c[1] ? "ASC" : "DESC");                        
                }).join(", ");
        }
        if(this._limit >= 0) {
            sql += " LIMIT " + this._limit;
        }
        if(this._skip > 0) {
            sql += " OFFSET " + this._skip;
        }
        session.flush(tx, function () {
            tx.executeSql(sql, args, 
                function (rows) {
                    var results = [];
                    if(that._reverse) {
                        rows.reverse();
                    }
                    for ( var i = 0; i < rows.length; i++) {
                        var r = rows[i];
                        var e = rowToEntity(session, entityName, r, mainPrefix);
                        for ( var j = 0; j < that._prefetchFields.length; j++) {
                            var prefetchField = that._prefetchFields[j];
                            var thisMeta = meta.hasOne[prefetchField].type.meta;
                            e._data_obj[prefetchField] = rowToEntity(session, thisMeta.name, r, prefetchField + '_');
                            
                            // SAH - Do NOT track objects that we pull from the DB. We only start tracking them when
                            // they are modified.
                            //session.add(e._data_obj[prefetchField]);
                        }
                        results.push(e);
                            // SAH - Do NOT track objects that we pull from the DB. We only start tracking them when
                            // they are modified.
                            // session.add(e);
                    }
                    callback(results);
                }, function(tx, error, badSQL, badArgs) {
                    persistence.errorHandler(error.message, error.code, badSQL, badArgs);
                    callback(null, error);
                }
                );
        });
    }

    /**
   * Asynchronous call to remove all the items in the collection.
   * Note: does not only remove the items from the collection, but
   * the items themselves. Also NOTE, this DOES NOT flush the current
   * session to the DB. The reason is that this can have unintended consequences (e.g.,
   * deleting data that is not truly stale). The users controls flushing ...
   * However, this does mean that the user cannot delete an unflushed object as we also
   * do not do the extra DB query to determine the 'id' of all objects that are slated
   * for deletion. Again, it is up to the user to simply be careful. Don't manipulate objects
   * in the session then call destroyAll with unflushed changes that are included in the
   * destroy.
   * 
   * @param tx transaction to use
   * @param callback function to be called when clearing has completed
   */
    persistence.DbQueryCollection.prototype.destroyAll = function (tx, callback) {
        var args = argspec.getArgs(arguments, [
        {
            name: 'tx', 
            optional: true, 
            check: persistence.isTransaction, 
            defaultValue: null
        },
        {
            name: 'callback', 
            optional: true, 
            check: argspec.isCallback(), 
            defaultValue: function(){}
        }
        ]);
        tx = args.tx;
        callback = args.callback;

        var that = this;
        var session = this._session;
        if(!tx) { // no transaction supplied
            session.transaction(function(tx) {
                that.destroyAll(tx, callback);
            });
            return;
        }
        var entityName = this._entityName;
        var meta = persistence.getMeta(entityName);
        var tm = persistence.typeMapper;

        // handles mixin case -- this logic is generic and could be in persistence.
        if (meta.isMixin) {
            persistence.asyncForEach(meta.mixedIns, function(realMeta, next) {
                var query = that.clone();
                query._entityName = realMeta.name;
                query.destroyAll(tx, callback);
            }, callback);
            return;
        }

        var joinSql = '';
        var additionalWhereSqls = this._additionalWhereSqls.slice(0);
        var mtm = this._manyToManyFetch;
        if(mtm) {
            joinSql += "LEFT JOIN `" + mtm.table + "` AS mtm ON mtm.`" + mtm.inverseProp + "` = `root`.`id` ";
            additionalWhereSqls.push("mtm.`" + mtm.prop + "` = " + tm.outId(mtm.id));
        }

        joinSql += this._additionalJoinSqls.join(' ');

        var args = [];
        var whereSql = "WHERE "
        + [ this._filter.sql(meta, null, args) ].concat(additionalWhereSqls).join(' AND ');

        // var selectSql = "SELECT id FROM `" + entityName + "` " + joinSql + ' ' + whereSql;
        var deleteSql = "DELETE FROM `" + entityName + "` " + joinSql + ' ' + whereSql;
        var args2 = args.slice(0);

        tx.executeSql(deleteSql, args2, callback, function(tx, error, badSQL, badArgs) {
            persistence.errorHandler(error.message, error.code, badSQL, badArgs);
            callback(error);
        });
        
        /* SAH: NOTE; we are not clearing out all removed objects from the session. This means
         * we could have a tracked object that is not in the DB. If that object were subsequently
         * updated and flushed, we would hit an error b/c the object is gone in the underlying DB.
         * However, next to the option of an extra query on each call to destroyAll, this choice gives
         * better control of performance to the library user.  
         */
/*
        tx.executeSql(selectSql, args, function(results) {
            for(var i = 0; i < results.length; i++) {
                delete session.trackedObjects[results[i].id];
                session.objectsRemoved.push({
                    id: results[i].id, 
                    entity: entityName
                });
            }
            tx.executeSql(deleteSql, args2, callback, callback);
        }, callback); */
    };

    /**
   * Asynchronous call to update all the items in the collection. NOTE: this does NOT
   * flush all items in the DB.
   * 
   * @param tx transaction to use
   * @param fieldMap map from field names to values to update
   * @param callback function to be called when updating has completed
   */
    persistence.DbQueryCollection.prototype.updateAll = function (tx, fieldMap, callback) {
        var args = argspec.getArgs(arguments, [
        {
            name: 'tx', 
            optional: true, 
            check: persistence.isTransaction, 
            defaultValue: null
        },
        {
            name: 'fieldMap',
            optional: false,
            check: argspec.isMap()
        },
        {
            name: 'callback', 
            optional: true, 
            check: argspec.isCallback(), 
            defaultValue: function(){}
        }
        ]);
        tx = args.tx;
        callback = args.callback;
        fieldMap = args.fieldMap;

        var that = this;
        var session = this._session;
        if(!tx) { // no transaction supplied
            session.transaction(function(tx) {
                that.updateAll(tx, fieldMap, callback);
            });
            return;
        }

        var entityName = this._entityName;
        var meta = persistence.getMeta(entityName);
        var tm = persistence.typeMapper;

        // handles mixin case -- this logic is generic and could be in persistence.
        if (meta.isMixin) {
            persistence.asyncForEach(meta.mixedIns, function(realMeta, next) {
                var query = that.clone();
                query._entityName = realMeta.name;
                query.updateAll(tx, callback);
            }, callback);
            return;
        }
        var joinSql = '';
        var mtm = this._manyToManyFetch;
        if(mtm) {
            joinSql += "LEFT JOIN `" + mtm.table + "` AS mtm ON mtm.`" + mtm.inverseProp + "` = `root`.`id` ";
            additionalWhereSqls.push("mtm.`" + mtm.prop + "` = " + tm.outId(mtm.id));
        }

        joinSql += this._additionalJoinSqls.join(' ');

        // update params
        var updateArgs = [];
        var propertyPairs = [];
        var setSql = '';
        for (var fldName in fieldMap) {
            if (setSql) {
                setSql = setSql + ', ';
            }
            
            var type = meta.fields[fldName];
            var val = fieldMap[fldName];
            updateArgs.push(tm.entityValToDbVal(val, type));
            propertyPairs.push("`" + fldName + "` = " + tm.outVar("?", type));
        }
        
        var additionalWhereSqls = this._additionalWhereSqls.slice(0);

        var whereSql = "WHERE "
        + [ this._filter.sql(meta, null, []) ].concat(additionalWhereSqls).join(' AND ');

        var selectSql = "SELECT root.id FROM `" + entityName + "` as root " + joinSql + ' ' + whereSql;
        var updateSql = "UPDATE `" + entityName + "`" + " SET " + propertyPairs.join(',') + ' ';
        
        tx.executeSql(selectSql, [], function(results) {
            // Take these objects out of the tracked objects list so that we do
            // not mistakenly use a cached copy of them with a wrong value in it.
            var idsToUpdate = [];
            for(var i = 0; i < results.length; i++) {
                var nxtId = results[i].id;
                idsToUpdate.push(nxtId);
                delete session.trackedObjects[nxtId];
            }
            // Update them all.
            i = 0;
            while ((i * 25) < idsToUpdate.length) {
                // Update in batches of 25
                var startIdx = i * 25;
                var endIdx = startIdx + 24;
                var nxtIdArr = idsToUpdate.slice(startIdx, endIdx >= idsToUpdate.length ? idsToUpdate.length : endIdx);
                var idList = '';
                for (var j = 0; j < nxtIdArr.length; ++j) {
                    if (idList) {
                        idList = idList + ',';
                    }
                    idList = idList + "'" + nxtIdArr[j] + "'";
                }
                
                var nxtUpdateSql = updateSql + ' WHERE id IN (' +  idList + ')';
                tx.executeSql(nxtUpdateSql, updateArgs, callback, function(tx, error, badSQL, badArgs) {
                    persistence.errorHandler(error.message, error.code, badSQL, badArgs);
                    callback(error);
                });
                ++i;
            }
        }, function(tx, error, badSQL, badArgs) {
            persistence.errorHandler(error.message, error.code, badSQL, badArgs);
            callback(error);
        });
    };

    /**
   * Asynchronous call to count the number of items in the collection.
   * @param tx transaction to use
   * @param callback function to be called when clearing has completed
   */
    persistence.DbQueryCollection.prototype.count = function (tx, callback) {
        var args = argspec.getArgs(arguments, [
        {
            name: 'tx', 
            optional: true, 
            check: persistence.isTransaction, 
            defaultValue: null
        },
        {
            name: 'callback', 
            optional: false, 
            check: argspec.isCallback()
        }
        ]);
        tx = args.tx;
        callback = args.callback;

        var that = this;
        var session = this._session;
        if(tx && !tx.executeSql) { // provided callback as first argument
            callback = tx;
            tx = null;
        }
        if(!tx) { // no transaction supplied
            session.transaction(function(tx) {
                that.count(tx, callback);
            });
            return;
        }
        var entityName = this._entityName;
        var meta = persistence.getMeta(entityName);
        var tm = persistence.typeMapper;

        // handles mixin case -- this logic is generic and could be in persistence.
        if (meta.isMixin) {
            var result = 0;
            persistence.asyncForEach(meta.mixedIns, function(realMeta, next) {
                var query = that.clone();
                query._entityName = realMeta.name;
                query.count(tx, function(count) {
                    result += count;
                    next();
                });
            }, function() {
                callback(result);
            });
            return;
        }

        var joinSql = '';
        var additionalWhereSqls = this._additionalWhereSqls.slice(0);
        var mtm = this._manyToManyFetch;
        if(mtm) {
            joinSql += "LEFT JOIN `" + mtm.table + "` AS mtm ON mtm.`" + mtm.inverseProp + "` = `root`.`id` ";
            additionalWhereSqls.push("mtm.`" + mtm.prop + "` = " + tm.outId(mtm.id));
        }

        joinSql += this._additionalJoinSqls.join(' ');
        var args = [];
        var whereSql = "WHERE " + [ this._filter.sql(meta, "root", args) ].concat(additionalWhereSqls).join(' AND ');

        var sql = "SELECT COUNT(*) AS cnt FROM `" + entityName + "` AS `root` " + joinSql + " " + whereSql;

        session.flush(tx, function () {
            tx.executeSql(sql, args, function(results) {
                callback(parseInt(results[0].cnt, 10));
            });
        });
    };

    persistence.ManyToManyDbQueryCollection.prototype.persistQueries = function() {
        var queries = [];
        var meta = persistence.getMeta(this._obj._type);
        var inverseMeta = meta.hasMany[this._coll].type.meta;
        var tm = persistence.typeMapper;
        var rel = meta.hasMany[this._coll];
        var inv = inverseMeta.hasMany[rel.inverseProperty];
        var direct = rel.mixin ? rel.mixin.meta.name : meta.name;
        var inverse = inv.mixin ? inv.mixin.meta.name : inverseMeta.name;

        // Added
        for(var i = 0; i < this._localAdded.length; i++) {
            var columns = [direct + "_" + this._coll, inverse + '_' + rel.inverseProperty];
            var vars = [tm.outIdVar("?"), tm.outIdVar("?")];
            var args = [tm.entityIdToDbId(this._obj.id), tm.entityIdToDbId(this._localAdded[i].id)];
            if (rel.mixin) {
                columns.push(direct + "_" + this._coll + "_class");
                vars.push("?");
                args.push(meta.name);
            }
            if (inv.mixin) {
                columns.push(inverse + "_" + rel.inverseProperty + "_class");
                vars.push("?");
                args.push(inverseMeta.name);
            }
            queries.push(["INSERT INTO " + rel.tableName +
                " (`" + columns.join("`, `") + "`) VALUES (" + vars.join(",") + ")", args]);
        }
        this._localAdded = [];
        // Removed
        for(var i = 0; i < this._localRemoved.length; i++) {
            queries.push(["DELETE FROM  " + rel.tableName +
                " WHERE `" + direct + "_" + this._coll + "` = " + tm.outIdVar("?") + " AND `" +
                inverse + '_' + rel.inverseProperty +
                "` = " + tm.outIdVar("?"), [tm.entityIdToDbId(this._obj.id), tm.entityIdToDbId(this._localRemoved[i].id)]]);
        }
        this._localRemoved = [];
        return queries;
    };
};

if (typeof exports !== 'undefined') {
    exports.defaultTypeMapper = defaultTypeMapper;
    exports.config = config;
}
else {
    window = window || {};
    window.persistence = window.persistence || {};
    window.persistence.store = window.persistence.store || {};
    window.persistence.store.sql = {
        defaultTypeMapper: defaultTypeMapper,
        config: config
    };
}
