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
 * Implementation of WebSQL that uses Apache Cordova to access native database
 * operations that are integrated with the Mobile Helix encryption infrastructure.
 */

var MobileHelixDatabase = function() {
};

MobileHelixDatabase.queryQueue = {};

MobileHelixDatabase.createUUID = function() {
    return Math.uuid(16);
};

/**
 * SQL result set object
 * PRIVATE METHOD
 * @constructor
 */
var MobileHelixDatabase_Rows = function() {
    this.resultSet = [];    // results array
    this.length = 0;        // number of rows
};

/**
 * Get item from SQL result set
 *
 * @param row           The row number to return
 * @return              The row object
 */
MobileHelixDatabase_Rows.prototype.item = function(row) {
    return this.resultSet[row];
};

/**
 * SQL result set that is returned to user.
 * PRIVATE METHOD
 * @constructor
 */
var MobileHelixDatabase_Result = function() {
    this.rows = new MobileHelixDatabase_Rows();
};

/**
 * Callback from native code when query is complete.
 * PRIVATE METHOD
 *
 * @param query   Query object that is completing.
 * @param data Rows returned by the query
 */
function completeQuery(query, data) {
    if (query) {
        try {
            delete MobileHelixDatabase.queryQueue[query.id];

            // Get transaction
            var tx = query.tx;

            // If transaction hasn't failed
            // Note: We ignore all query results if previous query
            //       in the same transaction failed.
            if (tx && tx.queryList[query.id]) {

                // Save query results
                var r = new MobileHelixDatabase_Result();
                r.rows.resultSet = data.items;
                r.rows.length = data.length;
                try {
                    if (typeof query.successCallback === 'function') {
                        query.successCallback(query.tx, r);
                    }
                } catch (ex) {
                    console.log("executeSql error calling user success callback: "+ex);
                }

                tx.queryComplete(query.id);
            }
        } catch (e) {
            console.log("executeSql error: "+e);
        }
    }
}

/**
 * Callback from native code when query fails
 * PRIVATE METHOD
 *
 * @param reason            Error message
 * @param query                Query object
 */
function failQuery(reason, query) {
    if (query) {
        try {
            delete MobileHelixDatabase.queryQueue[query.id];

            // Get transaction
            var tx = query.tx;

            // If transaction hasn't failed
            // Note: We ignore all query results if previous query
            //       in the same transaction failed.
            if (tx && tx.queryList[query.id]) {
                tx.queryList = {};

                try {
                    if (typeof query.errorCallback === 'function') {
                        if (!query.errorCallback(query.tx, reason)) {
                            /* If the callback returns false, per the standard, move on. */
                            return;
                        }
                    }
                } catch (ex) {
                    console.log("executeSql error calling user error callback: "+ex);
                }

                tx.queryFailed(query.id, reason);
            }

        } catch (e) {
            console.log("executeSql error: "+e);
        }
    }
}

/**
 * SQL query object
 * PRIVATE METHOD
 *
 * @constructor
 * @param tx                The transaction object that this query belongs to
 */
var MobileHelix_Query = function(tx) {

    // Set the id of the query
    this.id = MobileHelixDatabase.createUUID();

    // Add this query to the queue
    MobileHelixDatabase.queryQueue[this.id] = this;

    // Init result
    this.resultSet = [];

    // Set transaction that this query belongs to
    this.tx = tx;

    // Add this query to transaction list
    this.tx.queryList[this.id] = this;

    // Callbacks
    this.successCallback = null;
    this.errorCallback = null;

};

/**
 * Transaction object
 * PRIVATE METHOD
 * @constructor
 */
var MobileHelix_Tx = function() {

    // Set the id of the transaction
    this.id = MobileHelixDatabase.createUUID();

    // Callbacks
    this.successCallback = null;
    this.errorCallback = null;

    // Query list
    this.queryList = {};
};

/**
 * Mark query in transaction as complete.
 * If all queries are complete, call the user's transaction success callback.
 *
 * @param id                Query id
 */
MobileHelix_Tx.prototype.queryComplete = function(id) {
    delete this.queryList[id];

    // If no more outstanding queries, then fire transaction success
    if (this.successCallback) {
        var count = 0;
        var i;
        for (i in this.queryList) {
            if (this.queryList.hasOwnProperty(i)) {
                count++;
            }
        }
        if (count === 0) {
            try {
                this.successCallback();
            } catch(e) {
                console.log("Transaction error calling user success callback: " + e);
            }
        }
    }
};

/**
 * Mark query in transaction as failed.
 *
 * @param id                Query id
 * @param reason            Error message
 */
MobileHelix_Tx.prototype.queryFailed = function(id, reason) {

    // Rollback the transaction.
    cordova.exec(null, null, "MobileHelixStorage", "rollbackTX", [ this.db ]);
    
    // Prevent any more sql queries from being run
    this.queryList = {};

    if (this.errorCallback) {
        try {
            this.errorCallback(reason);
        } catch(e) {
            console.log("Transaction error calling user error callback: " + e);
        }
    }
};

/**
 * Execute SQL statement
 *
 * @param sql                   SQL statement to execute
 * @param params                Statement parameters
 * @param successCallback       Success callback
 * @param errorCallback         Error callback
 */
MobileHelix_Tx.prototype.executeSql = function(sql, params, successCallback, errorCallback) {
    // Init params array
    if (typeof params === 'undefined') {
        params = [];
    }

    // Create query and add to queue
    var query = new MobileHelix_Query(this);
    MobileHelixDatabase.queryQueue[query.id] = query;

    // Save callbacks
    query.successCallback = successCallback;
    query.errorCallback = errorCallback;

    // Call native code
    cordova.exec(function(successObj) {
        completeQuery(query, successObj.rows);
    }, 
    function(errMsg) {
        if (!errorCallback) {
            persistence.errorHandler(errMsg);
        }
        failQuery(errMsg, query);
    }, 
    "MobileHelixStorage", "executeSql", [this.db, sql, params, query.id]);
};

/**
 * Start a transaction.
 * Does not support rollback in event of failure.
 *
 * @param process {Function}            The transaction function
 * @param successCallback {Function}
 * @param errorCallback {Function}
 */
MobileHelixDatabase.prototype.transaction = function(process, errorCallback, successCallback) {
    var tx = new MobileHelix_Tx();
    tx.db = this.name;
    tx.successCallback = successCallback;
    tx.errorCallback = errorCallback;
    try {
        cordova.exec(function() {
            // Txn is created - run the process function.
            process(tx);
            
            // Now commit the txn.
            cordova.exec(function() {
                
            }, function(errMsg) {
                alert("Error committing a transaction: " + errMsg);
            }, "MobileHelixStorage", "commitTX", [ tx.db ]);
        }, 
        function(errMsg) {
            alert("Error creating a transaction: " + errMsg);
        }, "MobileHelixStorage", "beginTX", [ tx.db ]);
    } catch (e) {
        console.log("Transaction error: "+e);
        if (tx.errorCallback) {
            try {
                tx.errorCallback(e);
            } catch (ex) {
                console.log("Transaction error calling user error callback: "+e);
            }
        }
    }
};

MobileHelixDatabase.install = function() {
    /**
     * Open database
     *
     * @param name              Database name
     * @param version           Database version
     * @param display_name      Database display name
     * @param size              Database size in bytes
     * @return                  Database object
     */
    window.openDatabase = function(name, version, display_name, size) {
        cordova.exec(null, function(err) {
            persistence.errorHandler(err);
        }, "MobileHelixStorage", "openDatabase", [name, version, display_name, size]);
        var db = new MobileHelixDatabase();
        db.name = name;
        return db;
    };
};