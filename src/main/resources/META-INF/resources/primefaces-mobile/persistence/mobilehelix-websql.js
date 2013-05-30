MobileHelixDatabase.queryQueue = {};

MobileHelixDatabase.createUUID = function() {
    exec(null, null, "MobileHelixStorage", "createUUID", []);
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
 * @param id   Query id
 * @param data Rows returned by the query
 */
function completeQuery(id, data) {
    var query = MobileHelixDatabase.queryQueue[id];
    if (query) {
        try {
            delete MobileHelixDatabase.queryQueue[id];

            // Get transaction
            var tx = query.tx;

            // If transaction hasn't failed
            // Note: We ignore all query results if previous query
            //       in the same transaction failed.
            if (tx && tx.queryList[id]) {

                // Save query results
                var r = new MobileHelixDatabase_Result();
                r.rows.resultSet = data;
                r.rows.length = data.length;
                try {
                    if (typeof query.successCallback === 'function') {
                        query.successCallback(query.tx, r);
                    }
                } catch (ex) {
                    console.log("executeSql error calling user success callback: "+ex);
                }

                tx.queryComplete(id);
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
 * @param id                Query id
 */
function failQuery(reason, id) {
    var query = MobileHelixDatabase.queryQueue[id];
    if (query) {
        try {
            delete MobileHelixDatabase.queryQueue[id];

            // Get transaction
            var tx = query.tx;

            // If transaction hasn't failed
            // Note: We ignore all query results if previous query
            //       in the same transaction failed.
            if (tx && tx.queryList[id]) {
                tx.queryList = {};

                try {
                    if (typeof query.errorCallback === 'function') {
                        query.errorCallback(query.tx, reason);
                    }
                } catch (ex) {
                    console.log("executeSql error calling user error callback: "+ex);
                }

                tx.queryFailed(id, reason);
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

    // The sql queries in this transaction have already been run, since
    // we really don't have a real transaction implemented in native code.
    // However, the user callbacks for the remaining sql queries in transaction
    // will not be called.
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
    exec(null, null, "MobileHelixStorage", "executeSql", [sql, params, query.id]);
};

var MobileHelixDatabase = function() {
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
        exec(null, null, "MobileHelixStorage", "beginTX", [ tx.db ]);
        process(tx);
        exec(tx.successCallback, tx.errorCallback, "MobileHelixStorage", "commitTX", [ tx.db ]);
    } catch (e) {
        exec(null, null, "MobileHelixStorage", "rollbackTX", [ tx.db ]);
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
    alert("Installing open DB.");

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
        exec(null, null, "MobileHelixStorage", "openDatabase", [name, version, display_name, size]);
        var db = new MobileHelixDatabase();
        db.name = name;
        return db;
    };
};

//document.addEventListener("deviceready", MobileHelixDatabase.install, false);