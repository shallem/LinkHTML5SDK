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
        
        Entity.indexAsync = function(callback) {
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
            var indexQueries = [];
            var updateQueries = [];
            var toIndex = 0;
            var nIndexed = 0;
            var that = this;
            that.__hx_indexing = true;
            this.all().filter('__hx_indexed', '=', 0).limit(25).newEach({
                startFn: function(ct) {
                    toIndex = ct;
                    if (toIndex <= 0) {
                        that.__hx_indexing = false;
                    }
                },
                eachFn: function(elem) {
                    persistence.transaction(function(tx) {
                        indexObject(persistence, elem, propList, indexQueries, tx, function() {
                            updateQueries.push(["UPDATE `" + elem._type + "` SET __hx_indexed=1 WHERE id='" + elem.id + "'", null]);

                            ++nIndexed;
                            if (nIndexed == toIndex) {
                                // Run the queries against the DB.
                                indexQueries.reverse();
                                persistence.executeQueriesSeq(tx, indexQueries, function() {
                                    // Now mark everything we just indexed as indexed. No need to reverse because
                                    // update ordering doesn't matter.
                                    persistence.executeQueriesSeq(tx, updateQueries, function() {
                                        // Mark the object as indexed, but do not use the setter because
                                        // we don't want to mark the object as dirty on account of this update.
                                        elem._data['__hx_indexed'] = true;

                                        // Now start over ...
                                        that.__hx_indexing = false;
                                        that.indexAsync();
                                    });
                                });
                            }
                        });
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
            if(meta.textIndex) {
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


    // Mapping from property names to the DB ID.
    var propMap = {};
    var entityIdMap = {};
  
    function handleProperties(tx, obj, indexProperties, queries, id, oncomplete) {
        var pushQueries = function(tx, obj, indexProperties, queries, id, oncomplete, propID, rawText) {
            var indexTbl = obj._type + '_Index';
            queries.push(['DELETE FROM `' + indexTbl + '` WHERE `entityId` = ? AND `prop` = ?', [id, propID]]);
            var occurrences = searchTokenizer(rawText);
            for(var word in occurrences) {
                if(occurrences.hasOwnProperty(word)) {
                    queries.push(['INSERT INTO `' + indexTbl + '` VALUES (?, ?, ?, ?)', [id, propID, word.substring(1), occurrences[word]]]);
                }
            }
            processOne(tx, obj, indexProperties, queries, id, oncomplete);
        };
        
        var processOne = function(tx, obj, indexProperties, queries, id, oncomplete) {
            if (indexProperties.length == 0) {
                oncomplete();
                return;
            }
            
            var propTbl = obj._type + '_IndexFields';
            var p = indexProperties.pop();
            var rawText = obj._data[p];
            var propID;
            if (p in propMap) {
                propID = propMap[p];
                pushQueries(tx, obj, indexProperties, queries, id, oncomplete, propID, rawText);
            } else {
                tx.executeSql('SELECT ROWID FROM `' + propTbl + '` WHERE propName=?', [ p ], function(r, orig) {
                    if (r.length == 0) {
                        tx.executeSql('INSERT INTO `' + propTbl + '` VALUES(?)', [p], function(r, orig) {
                            propMap[p] = orig.insertId;
                            pushQueries(tx, obj, indexProperties, queries, id, oncomplete, orig.insertId, rawText);
                        }, function(t, e) {
                            persistence.errorHandler(e.message, e.code);
                        });
                    } else {
                        propMap[p] = r[0].ROWID;
                        pushQueries(tx, obj, indexProperties, queries, id, oncomplete, r[0].ROWID, rawText);
                    }
                }, function(t, e) {
                    persistence.errorHandler(e.message, e.code);
                });
            }
        }
        processOne(tx, obj, indexProperties, queries, id, oncomplete);
    }
  
    function indexObject(session, obj, propList, queries, tx, callback) {
        if (obj.id in entityIdMap) {
            handleProperties(tx, obj, propList.slice(0), queries, entityIdMap[obj.id], function() {
                callback();
            });
        } else {
            var eidTbl = obj._type + '_IndexEIDs';
            tx.executeSql('SELECT ROWID FROM `' + eidTbl + '` WHERE entityId=?', [ obj.id ], function(r, orig) {
                if (r.length == 0) {
                    tx.executeSql('INSERT INTO `' + eidTbl + '` VALUES(?)', [ obj.id ], function(r, orig) {
                        entityIdMap[obj.id] = orig.insertId;
                        handleProperties(tx, obj, propList.slice(0), queries, orig.insertId, function() {
                            callback();
                        });
                    }, function(t, e) {
                        persistence.errorHandler(e.message, e.code);
                    });
                } else {
                    entityIdMap[obj.id] = r[0].ROWID;
                    handleProperties(tx, obj, propList.slice(0), queries, r[0].ROWID, function() {
                        callback();
                    });
                }
            }, function(t, e) {
                persistence.errorHandler(e.message, e.code);
            });
        }
    }
  
    function handleInserts(queries, session, tx, callback) {
        var oncomplete = function(queries, tx, callback) {
            handleDeletes(queries, tx, callback);
        };
        
        var worklist = [];
        for (var id in session.getTrackedObjects()) {
            if (session.getTrackedObjects().hasOwnProperty(id)) {
                worklist.push(id);
            }
        }
        
        var processOne = function(worklist, session, queries, tx, callback) {
            if (worklist.length == 0) {
                oncomplete(queries, tx, callback);
                return;
            }
            
            var id = worklist.pop();
            // See if we have the entityId in our mapping.
            var obj = session.getTrackedObjects()[id];
            
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
            
            indexObject(session, obj, propList, queries, tx, function() {
                processOne(worklist, session, queries, tx, callback);
            });
        }
        processOne(worklist, session, queries, tx, callback);
    }
  
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
            handleInserts(queries, session, tx, callback);
        } else {
            handleDeletes(queries, tx, callback);
        }
    });
};

if(typeof exports === 'object') {
    exports.config = persistence.search.config;
}

