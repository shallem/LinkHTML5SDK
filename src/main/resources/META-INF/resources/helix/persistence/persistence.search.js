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

    var indexedOnce = false;

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
            var joinSQL = '`' + indexTbl + '`,`' + indexPropsTbl + '`';
            var joinWhereSQL = '`' + indexTbl +'`.`prop` = `' + indexPropsTbl + '`.`ROWID` AND `' + indexTbl + '`.`entityId` = `root`.ROWID';
            this._additionalJoinSqls.push(', ' + joinSQL);
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
        
        Entity.indexAsync = function(ncalls, __indexFull, __indexParams) {
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
            if (ncalls == 40 && !__indexFull) {
                // We only do this up to 40 times per index, otherwise the application can
                // be sluggish for far too long.
                indexedOnce = true;
                
                Helix.DB.__indexingCount--;
                if (Helix.DB.__indexingCount == 0) {
                    Helix.Utils.statusMessage("Indexing", "Background indexing is complete.", "info");
                }
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
            
            if (ncalls == 0) {
                ++Helix.DB.__indexingCount;
            }
            
            // Run a query to get 100 objects that are not yet indexed.
            if (!__indexParams) {
                __indexParams = {};
                __indexParams.deleteDone = false;
            }
            __indexParams.updateIDs = [];
            __indexParams.updateObjs = [];
            __indexParams.nxtCall = ++ncalls;
            __indexParams.delaySecs = (__indexFull ? 1 : 3);
            __indexParams.toIndex = 0;
            __indexParams.nObjects = 20;
            
            var that = this;
            that.__hx_indexing = true;
            this.all().filter('__hx_indexed', '=', 0).limit(__indexParams.nObjects).order('rowid', false).include(propList.concat(['rowid'])).newEach({
                startFn: function(ct, params) {
                    params.toIndex = ct;
                    if (params.toIndex <= 0) {
                        that.__hx_indexing = false;
                        
                        --Helix.DB.__indexingCount;
                        if (Helix.DB.__indexingCount == 0 && Helix.DB.__indexingMessageShown && ncalls > 0 && (__indexFull || params.nxtCall >= 20)) {
                            Helix.Utils.statusMessage("Indexing", "Background indexing is complete.", "info");
                            Helix.DB.__indexingMessageShown = false;
                        }
                    } else {
                        // Only show a message if we are indexing a lot of data - at least 100 records where nObjects is 20
                        if (params.nxtCall == 5) {
                            if (!Helix.DB.__indexingMessageShown) {
                                Helix.DB.__indexingMessageShown = true;
                                // Only display if we are going to index many times.
                                Helix.Utils.statusMessage("Indexing", "Your data is being indexed. The application will be slow while indexing is in progress. A message is displayed when indexing is done.", "info");
                            }
                        }
                    }
                },
                eachFn: function(elem, params) {
                    params.updateIDs.push(elem._data['rowid']);
                    params.updateObjs.push(elem);
                },
                doneFn: function (ct, params) {
                    if (ct == 0) {
                        return;
                    }
                    
                    var propList = [];
                    for (var prop in that.meta.textIndex) {
                        if (prop !== '__hx_generated') {
                            propList.push(prop);
                        }
                    }
                    
                    
                    var __doIndex = function(params) {
                        indexObjectList(params.updateIDs, params.updateObjs, that, params.propMap, function() {
                            // Now start over ...
                            that.__hx_indexing = false;
                            if (!indexedOnce && ct == params.nObjects) {
                                // Checking that ct == nObjects ensures that we only recurse if we really need to.
                                that.indexAsync(params.nxtCall, __indexFull, params);
                            } else {
                                // When the user has already endured one round of indexing, we don't force them
                                // to endure multiple slow rounds of indexing. Instead we just do 1 shot of indexing
                                // and stop.
                                return;
                            }
                        });
                    };
                    
                    var __getProps = function(params) {
                        if (params.propMap) {
                            __doIndex(params);
                        } else {
                            getPropNameMap(that, propList, function(propMap) {
                                params.propMap = propMap;
                                __doIndex(params);
                            });
                        }                        
                    };
                    
                    var __doDelete = function(params) {
                        if (!params.deleteDone) {
                            // Delete all existing index entries from the DB where the
                            // entity from which that entry was derived is now being re-indexed.
                            var indexTbl = that.meta.name + '_Index';
                            var deleteQry = 'DELETE FROM `' + indexTbl + 
                                '` WHERE entityId IN (SELECT ROWID FROM `' + 
                                    that.meta.name + '` WHERE __hx_indexed=0)';
                            persistence.transaction(function(tx) {
                                tx.executeSql(deleteQry, null, function() {
                                    params.deleteDone = true;
                                    __getProps(params);
                                }, function(t, e) {
                                    persistence.errorHandler(e.message, e.code);
                                });
                            });
                        } else {
                            __getProps(params);
                        }                
                    };
                    
                    __doDelete(params);
                }
            }, (__indexParams ? __indexParams : {}));
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
            }
        }
        queries.reverse();
        //persistence.executeQueriesSeq(tx, queries);
        return queries;
    });
  
    function indexObject(obj, propMap, insertRows) {
        var id = obj._data['rowid'];
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

    function getPropNameMap(entity, propArray, oncomplete) {
        var propertyVec = makeStringVector(propArray);
        var propMap = {};
        var propTbl = entity.meta.name + '_IndexFields';
        
        // Convert all of the entity IDs into integral IDs
        persistence.transaction(function(tx) {
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

                    persistence.transaction(function(tx) {
                        tx.executeSql('INSERT INTO `' + propTbl + '` ' + valuesList, null, function(r, orig) {
                            // Rinse and repeat.
                            getPropNameMap(entity, propArray, oncomplete);
                        }, function(t, e) {
                            persistence.errorHandler(e.message, e.code);
                        });                        
                    });
                } else {
                    oncomplete(propMap);
                }
            }, function(t, e) {
                persistence.errorHandler(e.message, e.code);
            });            
        });
    }

    function indexObjectList(updateIDs, updateObjs, entity, propMap, oncomplete, tx) {
        // Do the indexing.
        var indexRows = [];
        var indexQueries = [];
        var i;
        var indexTbl = entity.meta.name + '_Index';

        for (i = 0; i < updateObjs.length; ++i) {
            var elem = updateObjs[i];
            indexObject(elem, propMap, indexRows);
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
        
        var updateVec = makeIntVector(updateIDs);
        indexQueries.push(["UPDATE `" + elem._type + "` SET __hx_indexed=1 WHERE rowid IN (" + updateVec + ")", null])

        // Run the queries against the DB. The UPDATE goes last, and we only finish all statements in the array on
        // success.
        indexQueries.reverse();
        persistence.transaction(function(tx) {
            persistence.executeQueriesSeq(tx, indexQueries, function() {
                // Mark the object as indexed, but do not use the setter because
                // we don't want to mark the object as dirty on account of this update.
                for (var z = 0; z < updateObjs.length; ++z) {
                    var obj = updateObjs[z];
                    if (obj) {
                        obj._data['__hx_indexed'] = true;
                    }
                }
                oncomplete();
            }, 100);
        });
    }
  
    function handleDeletes(queries, tx, callback) {
        for (var id in persistence.getObjectsToRemove()) {
            if (persistence.getObjectsToRemove().hasOwnProperty(id)) {
                var obj = persistence.getObjectsToRemove()[id];
                var meta = persistence.getEntityMeta()[obj._type];
                if(meta.textIndex) {
                    queries.push(['DELETE FROM `' + obj._type + '_Index` WHERE `entityId` IN (SELECT ROWID FROM `' + obj._type + '` WHERE `id`=?)', [id]]);
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
  
    /* SAH - we don't support synchronous indexing. */
};

if(typeof exports === 'object') {
    exports.config = persistence.search.config;
}

