/**
 * @license
 * Copyright (c) 2010 Zef Hemel <zef@zef.me>
 * 
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

try {
    if(!window) {
        window = {};
    }
} catch(e) {
    window = {};
    exports.console = console;
}

var persistence = (window && window.persistence) ? window.persistence : {}; 

persistence.search = {};

persistence.search.config = function(persistence, dialect, options) {
    var filteredWords = {
        'and':true, 
        'the': true, 
        'are': true
    };

    var argspec = persistence.argspec;
    persistence.search.options = options;

    function normalizeWord(word, filterShortWords) {
        // Filter out <3 letter words
        if (filterShortWords && word.length < 3) {
            return null;
        }
        // Filter out numbers.
        if (word.match(/^\d+$/)) {
            return null;
        }
        
        return word;
    }

    /**
   * Does extremely basic tokenizing of text. Also includes some basic stemming.
   */
    function searchTokenizer(text) {
        var words = text.toLowerCase().split(/[^\w\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+/);
        var wordDict = {};
        // Prefixing words with _ to also index Javascript keywords and special fiels like 'constructor'
        for(var i = 0; i < words.length; i++) {
            var normalizedWord = normalizeWord(words[i], true);
            if(normalizedWord) {
                var word = '_' + normalizedWord;
                // Some extremely basic stemming
                if(word in wordDict) {
                    wordDict[word]++;
                } else {
                    wordDict[word] = 1;
                }
            }
        }
        return wordDict;
    }
  
    /**
   * Generate an SQL search phrase for a single word.
   */
    function generateQueryElement(word, indexTbl, prefixByDefault) {
        var sql = '(';
        if(word.search(/\*/) !== -1) {
            sql += "`" + indexTbl + "`.`word` LIKE '" + word.replace(/\*/g, '%') + "'";
        } else if(prefixByDefault) {
            sql += "`" + indexTbl + "`.`word` LIKE '" + word + "%'";
        } else {
            sql += "`" + indexTbl + "`.`word` = '" + word + "'";
        }
        /*if(restrictedToColumn) {
            sql += ' AND `' + indexTbl + "`.`prop` = '" + restrictedToColumn + "'";
        }
         * STRIPPING OUT FOR THE MOMENT BECAUSE THIS WOULD REQUIRE A JOIN ON THE NESTED IN CLAUSES
         * FOR NOW, WE DON'T NEED THIS FEATURE. ONE CAN SPECIFY A PROPERTY RESTRICTION FOR THE WHOLE
         * QUERY, BUT NOT PER WORD
         */
        sql += ')';
        return sql;
    }

    /**
   * Parses a search query and returns it as list SQL parts later to be OR'ed or AND'ed.
   */
    function searchPhraseParser(query, indexTbl, indexPropsTbl, prefixByDefault) {
        query = query.toLowerCase().replace(/['"]/, '').replace(/(^\s+|\s+$)/g, '');
        var words = query.split(/\s+/);
        var sqlParts = [];
        var isFirst = true;
        for(var i = 0; i < words.length; i++) {
            var word = normalizeWord(words[i]);
            if(!word) {
                continue;
            }
            if(isFirst && word.search(/:$/) !== -1) {
                var restrictedToColumn = word.substring(0, word.length-1);
                sqlParts.push("(`" + indexPropsTbl + "`.propName='" + restrictedToColumn + "'");
                continue;
            }
      
            // See if this is a comma separated list of words. If so, create a disjunction on
            // those words.
            var disjunctWords = word.split(/,/);
            var sql = null;
            if (disjunctWords.length > 1) {
                sql = '(';
                var djSql = [];
                for (var j = 0; j < disjunctWords.length; ++j) {
                    djSql.push(generateQueryElement(disjunctWords[j], indexTbl, prefixByDefault));
                }
                sql += djSql.join(' OR ');
                sql += ')';
            } else {
                sql = generateQueryElement(word, indexTbl, prefixByDefault);
            }
            if (isFirst) {
                isFirst = false;
            } else {
                sql = "(`" + indexTbl + "`.`entityId` IN (select entityId from `" +
                indexTbl + "` WHERE " + sql + "))";
            }
            sqlParts.push(sql);
        }
        return sqlParts.length === 0 ? ["1=1"] : sqlParts;
    }

    var queryCollSubscribers = {}; // entityName -> subscription obj
    persistence.searchQueryCollSubscribers = queryCollSubscribers;

    function SearchFilter(query, entityName) {
        this.query = query;
        this.entityName = entityName;
    }

    SearchFilter.prototype.match = function (o) {
        var meta = persistence.getMeta(this.entityName);
        var query = this.query.toLowerCase();
        var text = '';
        for(var p in o) {
            if(meta.textIndex.hasOwnProperty(p)) {
                if(o[p]) {
                    text += o[p];
                }
            }
        }
        text = text.toLowerCase();
        return text && text.indexOf(query) !== -1;
    }

    SearchFilter.prototype.sql = function (o) {
        return "1=1";
    }

    SearchFilter.prototype.subscribeGlobally = function(coll, entityName) {
        var meta = persistence.getMeta(entityName);
        for(var p in meta.textIndex) {
            if(meta.textIndex.hasOwnProperty(p)) {
                persistence.subscribeToGlobalPropertyListener(coll, entityName, p);
            }
        }
    };

    SearchFilter.prototype.unsubscribeGlobally = function(coll, entityName) {
        var meta = persistence.getMeta(entityName);
        for(var p in meta.textIndex) {
            if(meta.textIndex.hasOwnProperty(p)) {
                persistence.unsubscribeFromGlobalPropertyListener(coll, entityName, p);
            }
        }
    };

    SearchFilter.prototype.toUniqueString = function() {
        return "SEARCH: " + this.query;
    }

    function SearchQueryCollection(session, entityName, query, prefixByDefault) {
        this.init(session, entityName, SearchQueryCollection);
        this.subscribers = queryCollSubscribers[entityName];
        this._filter = new SearchFilter(query, entityName);

        if(query) {
            var indexTbl = entityName + '_Index';
            var indexPropsTbl = entityName + '_IndexFields';
            var indexEIDTbl = entityName + '_IndexEIDs';
            var joinSQL = '`' + indexTbl + '`,`' + indexPropsTbl + '`,`' + indexEIDTbl + '`'; 
            var joinWhereSQL = '`' + indexTbl +'`.`prop` = `' + indexPropsTbl + '`.`ROWID` AND `' + indexTbl + '`.`entityId` = `' + indexEIDTbl + '`.ROWID';
            this._additionalJoinSqls.push(', ' + joinSQL);
            this._additionalWhereSqls.push('`root`.id = `' + entityName + '_IndexEIDs`.`entityId`');
            this._additionalWhereSqls.push(joinWhereSQL);
            this._additionalWhereSqls.push('(' + searchPhraseParser(query, indexTbl, indexPropsTbl, prefixByDefault).join(' AND ') + ')');
            this._additionalGroupSqls.push(' GROUP BY (`' + entityName + '_Index`.`entityId`)');
        }
    }

    SearchQueryCollection.prototype = new persistence.DbQueryCollection();

    SearchQueryCollection.prototype.oldClone = SearchQueryCollection.prototype.clone;


    SearchQueryCollection.prototype.clone = function() {
        var clone = this.oldClone(false);
        var entityName = this._entityName;
        clone.subscribers = queryCollSubscribers[entityName];
        return clone;
    };

    SearchQueryCollection.prototype.oldOrder = SearchQueryCollection.prototype.order;
    SearchQueryCollection.prototype.order = function(property, ascending, caseSensitive) {
        if (this._usingDefaultOrder) {
            throw new Error("Imposing additional orderings is not support for search query collections.");
        }
        return this.oldOrder(property, ascending, caseSensitive);
    };
  
    SearchQueryCollection.prototype.defaultOrder = function() {
        var entityName = this._entityName;
        this._additionalGroupSqls.push(' ORDER BY SUM(`' + entityName + '_Index`.`occurrences`) DESC');
        this._usingDefaultOrder = true;
    };

    /*
  SearchQueryCollection.prototype.filter = function (property, operator, value) {
    var c = this.clone();
    c._filter = new persistence.AndFilter(this._filter, new persistence.PropertyFilter(property, operator, value));
    // Add global listener (TODO: memory leak waiting to happen!)
    //session.subscribeToGlobalPropertyListener(c, this._entityName, property);
    return c;
  };
  */

    persistence.entityDecoratorHooks.push(function(Entity) {
        /**
         * Declares a property to be full-text indexed.
         */
        Entity.textIndex = function(prop) {
            if(!Entity.meta.textIndex) {
                Entity.meta.textIndex = {};
                // We have not yet generated the index tables.
                Entity.meta.textIndex['__hx_generated'] = false;
            }
            Entity.meta.textIndex[prop] = true;
            
            // SAH - add a field to indicate if this object has been indexed if we
            // are doing async indexing.
            if (persistence.search.options.indexAsync) {
                if (!('__hx_indexed' in Entity.meta.fields)) {
                    Entity.meta.fields['__hx_indexed'] = 'BOOL';
                    //this.addField('__hx_indexed');
                }
            }
            
            // Subscribe
            var entityName = Entity.meta.name;
            if(!queryCollSubscribers[entityName]) {
                queryCollSubscribers[entityName] = {};
            }
        };

        /**
         * Returns a query collection representing the result of a search
         * @param query an object with the following fields:
         */
        Entity.search = function(session, query, prefixByDefault) {
            var args = argspec.getArgs(arguments, [
            {
                name: 'session', 
                optional: true, 
                check: function(obj) {
                    return obj.schemaSync;
                }, 
                defaultValue: persistence
            },
            {
                name: 'query', 
                optional: false, 
                check: argspec.hasType('string')
            },
            {
                name: 'prefixByDefault', 
                optional: false
            }
            ]);
            session = args.session;
            query = args.query;
            prefixByDefault = args.prefixByDefault;

            return session.uniqueQueryCollection(new SearchQueryCollection(session, Entity.meta.name, query, prefixByDefault));
        };
        
        Entity.indexAsync = function(ncalls) {
            // Launch asynchronous indexing, if that has been enabled. This will launch
            // a background task (essentially) to index a table in batches of 100 records
            // at a time.
            if (!persistence.search.options.indexAsync) {
                return;
            }
            if (this.__hx_indexing) {
                // We are already indexing ...
                return;
            }
            if (ncalls == 3) {
                // We only do this up to 3 times per index, otherwise the application can
                // be sluggish for far too long.
                Helix.Utils.statusMessage("Indexing", "Background indexing is complete.", "info");
                return;
            }
            
            // Pull up to 100 objects from the entity and iterate over them.
            var propList = [];
            if(this.meta.textIndex) {
                for ( var p in this.meta.textIndex) {
                    if (this.meta.textIndex.hasOwnProperty(p)) {
                        propList.push(p);
                    }
                }
            }
            if (propList.length == 0) {
                // Nothing to do ...
                return;
            }
            
            
            // Run a query to get 100 objects that are not yet indexed.
            var updateIDs = [];
            var updateObjs = [];
            var toIndex = 0;
            var that = this;
            var nxtCall = ++ncalls;
            that.__hx_indexing = true;
            this.all().filter('__hx_indexed', '=', 0).limit(50).order('rowid', false).include(propList.concat(['rowid'])).newEach({
                startFn: function(ct) {
                    toIndex = ct;
                    if (toIndex <= 0) {
                        that.__hx_indexing = false;
                    } else {
                        if (nxtCall == 1) {
                            Helix.Utils.statusMessage("Indexing", "Your data is being indexed in the background. The application may be slow while indexing is in progress. This may take a few minutes.", "info");
                        }
                    }
                },
                eachFn: function(elem) {
                    updateIDs.push(elem.id);
                    updateObjs.push(elem);
                },
                doneFn: function (ct) {
                    if (ct == 0) {
                        return;
                    }
                    persistence.transaction(function(tx) {
                        var propList = [];
                        for (var prop in that.meta.textIndex) {
                            if (prop !== '__hx_generated') {
                                propList.push(prop);
                            }
                        }
                        indexObjectList(updateIDs, updateObjs, that, propList, function() {
                            // Now start over ...
                            that.__hx_indexing = false;
                            that.indexAsync(nxtCall);
                        }, tx);
                    });
                }
            });
        }
    });

    persistence.schemaSyncHooks.push(function(tx) {
        var entityMeta = persistence.getEntityMeta();
        var queries = [];
        for(var entityName in entityMeta) {
            var meta = entityMeta[entityName];
            if(meta.textIndex && !(meta.textIndex['__hx_generated'])) {
                queries.push([dialect.createTable(entityName + '_Index', [['entityId', 'INTEGER'], ['prop', 'INTEGER'], ['word', 'VARCHAR(100)'], ['occurrences', 'INT']]), null]);
                queries.push([dialect.createIndex(entityName + '_Index', ['prop', 'word']), null]);
                queries.push([dialect.createIndex(entityName + '_Index', ['word']), null]);
                persistence.generatedTables[entityName + '_Index'] = true;
          
                queries.push([dialect.createTable(entityName + '_IndexFields', [['propName', 'VARCHAR(100)']]), null]);
                queries.push([dialect.createIndex(entityName + '_IndexFields', ['propName']), null]);
                persistence.generatedTables[entityName + '_IndexFields'] = true;
                
                queries.push([dialect.createTable(entityName + '_IndexEIDs', [['entityId', 'VARCHAR(32)']]), null]);
                queries.push([dialect.createIndex(entityName + '_IndexEIDs', ['entityId']), null]);
                persistence.generatedTables[entityName + '_IndexEIDs'] = true;
            }
        }
        queries.reverse();
        //persistence.executeQueriesSeq(tx, queries);
        return queries;
    });
  
    function indexObject(obj, propMap, eIDMap, insertRows) {
        if (obj.id in eIDMap) {
            var id = eIDMap[obj.id];
            for (var prop in propMap) {
                var propID = propMap[prop];
                var rawText = obj[prop];
                var occurrences = searchTokenizer(rawText);
                var insertValues = null;
                for(var word in occurrences) {
                    if(occurrences.hasOwnProperty(word)) {
                        insertValues = id + "," + propID + "," + "'" + _real_escape_string(word.substring(1)) + "'," + occurrences[word];
                        insertRows.push(insertValues);
                    }
                }
            }
        } else {
            alert("Could not find index EID in the database. The database is likely corrupt. Please delete the app cache and reload the app.");
        }
    }

    // Helper functions.
    function _real_escape_string (str) {
        return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (ch) {
            switch (ch) {
                case "\0":
                    return "\\0";
                case "\x08":
                    return "\\b";
                case "\x09":
                    return "\\t";
                case "\x1a":
                    return "\\z";
                case "\n":
                    return "\\n";
                case "\r":
                    return "\\r";
                case "\"":
                case "'":
                case "\\":
                case "%":
                    return "\\"+ch; // prepends a backslash to backslash, percent,
                                      // and double/single quotes
            }
        });
    }
    
    function makeStringVector(eidList) {
        var ret = null;
        for (var x = 0; x < eidList.length; ++x) {
            if (!ret) {
                ret = "'" + _real_escape_string(eidList[x]) + "'";
            } else {
                ret = ret + ",'" + _real_escape_string(eidList[x]) + "'";
            }
        }
        return ret;
    }
    
    function makeIntVector(eidList) {
        var ret = null;
        for (var x = 0; x < eidList.length; ++x) {
            if (!ret) {
                ret = eidList[x].toString();
            } else {
                ret = ret + "," + eidList[x].toString();
            }
        }
        return ret;
    }

    function getEIDMap(tx, entity, updateIDs, oncomplete) {
        var eIDMap = {};
        var eidTbl = entity.meta.name + '_IndexEIDs';
        var updateVec = makeStringVector(updateIDs);
        
        // Convert all of the entity IDs into integral IDs
        tx.executeSql('SELECT entityId, ROWID FROM `' + eidTbl + '` WHERE entityId IN (' + updateVec + ')', null, function(r, orig) {
            for (var x = 0; x < r.length; ++x) {
                var nxtROW = r[x];
                eIDMap[nxtROW.entityId] = nxtROW.rowid;
            }

            // See if we are missing row IDs.
            if (Object.keys(eIDMap).length != updateIDs.length) {
                // Create a single insert for all EIDs that have no ROWID
                var valuesList = null;
                for (x = 0; x < updateIDs.length; ++x) {
                    var nxtEID = updateIDs[x];
                    if (nxtEID in eIDMap) {
                        continue;
                    } else {
                        if (!valuesList) {
                            valuesList = "SELECT '" + nxtEID + "'";
                        } else {
                            valuesList = valuesList + " UNION SELECT '" + nxtEID + "'";
                        }
                    }
                }

                tx.executeSql('INSERT INTO `' + eidTbl + '` ' + valuesList, null, function(r, orig) {
                    // Rinse and repeat.
                    getEIDMap(tx, entity, updateIDs, oncomplete);
                }, function(t, e) {
                    persistence.errorHandler(e.message, e.code);
                });
            } else {
                oncomplete(eIDMap);
            }
        }, function(t, e) {
            persistence.errorHandler(e.message, e.code);
        });
    }

    function getPropNameMap(tx, entity, propArray, oncomplete) {
        var propertyVec = makeStringVector(propArray);
        var propMap = {};
        var propTbl = entity.meta.name + '_IndexFields';
        
        // Convert all of the entity IDs into integral IDs
        
        tx.executeSql('SELECT propName, ROWID FROM `' + propTbl + '` WHERE propName IN (' + propertyVec + ')', null, function(r, orig) {
            for (var x = 0; x < r.length; ++x) {
                var nxtROW = r[x];
                propMap[nxtROW.propName] = nxtROW.rowid;
            }

            // See if we are missing row IDs.
            if (Object.keys(propMap).length != propArray.length) {
                // Create a single insert for all properties that have no ROWID
                var valuesList = null;
                for (x = 0; x < propArray.length; ++x) {
                    var nxtProp = propArray[x];
                    if (nxtProp in propMap) {
                        continue;
                    } else {
                        if (!valuesList) {
                            valuesList = "SELECT '" + nxtProp + "'";
                        } else {
                            valuesList = valuesList + " UNION SELECT '" + nxtProp + "'";
                        }
                    }
                }

                tx.executeSql('INSERT INTO `' + propTbl + '` ' + valuesList, null, function(r, orig) {
                    // Rinse and repeat.
                    getPropNameMap(tx, entity, propArray, oncomplete);
                }, function(t, e) {
                    persistence.errorHandler(e.message, e.code);
                });
            } else {
                oncomplete(propMap);
            }
        }, function(t, e) {
            persistence.errorHandler(e.message, e.code);
        });
    }

    function indexObjectList(updateIDs, updateObjs, entity, propArray, oncomplete, tx) {
        // Step 1 - get a map from EIDs to ROWIDs in the EID table.
        getEIDMap(tx, entity, updateIDs, function(eIDMap) {
            // Step 2 - get a map from property names to property IDs.
            getPropNameMap(tx, entity, propArray, function(propMap) {
                // Step 3 - do the indexing.
                var indexRows = [];
                var indexQueries = [];
                var i;
                
                // Delete all existing index entries in one large delete.
                var indexTbl = entity.meta.name + '_Index';
                var deleteIDs = [];
                for (i = 0; i < updateIDs.length; ++i) {
                    deleteIDs.push(eIDMap[updateIDs[i]]);
                }
                var deleteVec = makeIntVector(deleteIDs);
                indexQueries.push(['DELETE FROM `' + indexTbl + '` WHERE `entityId` IN (' + deleteVec + ')', null]);
            
                for (i = 0; i < updateObjs.length; ++i) {
                    var elem = updateObjs[i];
                    indexObject(elem, propMap, eIDMap, indexRows);
                }
                
                // Turn the rows list into blocks of 50 inserts
                var maxRows = 0;
                var nxtInsert = null;
                for(var k = 0; k < indexRows.length; ++k) {
                    if (!nxtInsert) {
                        nxtInsert = "SELECT ";
                    } else {
                        nxtInsert = nxtInsert + " UNION SELECT ";
                    }
                    nxtInsert = nxtInsert + indexRows[k];
                    ++maxRows;
                    if (maxRows == 100) {
                        indexQueries.push(['INSERT INTO `' + indexTbl + '` ' + nxtInsert, null]);
                        nxtInsert = null;
                        maxRows = 0;
                    }
                }
                if (nxtInsert) {
                    indexQueries.push(['INSERT INTO `' + indexTbl + '` ' + nxtInsert, null]);
                }

                // Run the queries against the DB.
                indexQueries.reverse();
                persistence.executeQueriesSeq(tx, indexQueries, function() {
                    // Now mark everything we just indexed as indexed. Do it with a single SQL statement.
                    var updateQueries = [];
                    var updateVec = makeStringVector(updateIDs);
                    updateQueries.push(["UPDATE `" + elem._type + "` SET __hx_indexed=1 WHERE id IN (" + updateVec + ")", null]);
                    persistence.executeQueriesSeq(tx, updateQueries, function() {
                        // Mark the object as indexed, but do not use the setter because
                        // we don't want to mark the object as dirty on account of this update.
                        for (var z = 0; z < updateObjs.length; ++z) {
                            var obj = updateObjs[z];
                            if (obj) {
                                obj._data['__hx_indexed'] = true;
                            }
                        }
                        oncomplete();
                    });
                });
            });
        });
    }
  
    /*function handleInserts(queries, session, tx, callback) {
        var oncomplete = function(queries, tx, callback) {
            handleDeletes(queries, tx, callback);
        };
        
        var worklist = [];
        var objlist = [];
        for (var id in session.getTrackedObjects()) {
            if (session.getTrackedObjects().hasOwnProperty(id)) {
                worklist.push(id);
                objlist.push(session.getTrackedObjects()[id]);
            }
        }
        // Make sure we are going to index this row.
        var meta = session.define(obj._type).meta;
        var propList = [];
        if(meta.textIndex) {
            for ( var p in obj._dirtyProperties) {
                if (obj._dirtyProperties.hasOwnProperty(p) && p in meta.textIndex) {
                    propList.push(p);
                }
            }
        }
        
        if (propList.length == 0) {
            // Nothing to do ...
            processOne(worklist, session, queries, tx, callback);
            return;
        }
        
        indexObjectList(worklist, objlist, session.define(obj._type), propArray, oncomplete, tx)
        
        var processOne = function(worklist, session, queries, tx, callback) {
            if (worklist.length == 0) {
                oncomplete(queries, tx, callback);
                return;
            }
            
            var id = worklist.pop();
            // See if we have the entityId in our mapping.
            var obj = session.getTrackedObjects()[id];
            
            
            if (propList.length == 0) {
                // Nothing to do ...
                processOne(worklist, session, queries, tx, callback);
                return;
            }
            
            indexObject(session, obj, propList, queries, tx, function() {
                processOne(worklist, session, queries, tx, callback);
            });
        }
        processOne(worklist, session, queries, tx, callback);
    }*/
  
    function handleDeletes(queries, tx, callback) {
        for (var id in persistence.getObjectsToRemove()) {
            if (persistence.getObjectsToRemove().hasOwnProperty(id)) {
                var obj = persistence.getObjectsToRemove()[id];
                var meta = persistence.getEntityMeta()[obj._type];
                if(meta.textIndex) {
                    queries.push(['DELETE FROM `' + obj._type + '_Index` WHERE `entityId` IN (SELECT ROWID FROM `' + obj._type + '_IndexEIDs` WHERE `entityId`=?)', [id]]);
                    queries.push(['DELETE FROM `' + obj._type + '_IndexEIDs` WHERE `entityId`=?', [id]]);
                }
            }
        }
        //
        pushQueries(queries, tx, callback);
    }
  
    function pushQueries(queries, tx, callback) {
        queries.reverse();
        persistence.executeQueriesSeq(tx, queries, callback);
    }
  
    persistence.flushHooks.push(function(session, tx, callback) {
        var queries = [];
        if (!persistence.search.options.indexAsync) {
            // This is synchronous indexing, which means it happens when an object is flushed.
            // When you have lots of data to index this is a bad idea because the user cannot
            // proceed while indexing is in progress.
            // 
            // When handleInserts is done it will call handleDeletes, which will in turn push the
            // queries on to the execute list and invoke the callback with pushQueries
            //  handleInserts(queries, session, tx, callback);
        } else {
            handleDeletes(queries, tx, callback);
        }
    });
};

if(typeof exports === 'object') {
    exports.config = persistence.search.config;
}

