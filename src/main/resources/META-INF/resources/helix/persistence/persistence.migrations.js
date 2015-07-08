/**
 * @license
 * Copyright (c) 2010 Fábio Rehm <fgrehm@gmail.com>
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
function definePersistenceMigrations() {
  
    var Migrator = {
        migrations: [],
      
        version: function(t, callback) {
            if (!t) {
                persistence.transaction(function(tx){
                    Migrator.version(tx, callback);
                });
                return;
            }
          
            t.executeSql('SELECT current_version FROM schema_version', null, function(result){
                if (result.length == 0) {
                    t.executeSql('INSERT INTO schema_version VALUES (0)', null, function(){
                        callback(0);
                    });
                } else {
                    callback(result[0].current_version);
                }
            });
        },
      
        setVersion: function(allMigrations, v) {
            Migrator._version = v;
            allMigrations.unshift(['UPDATE schema_version SET current_version = ?', [v]]);
        },
      
        setup: function(t, callback) {
            if (!t) {
                persistence.transaction(function(tx){
                    Migrator.setup(tx, callback);
                });
                return;
            }
            t.executeSql('CREATE TABLE IF NOT EXISTS schema_version (current_version INTEGER)', null, function(){
                // Creates a dummy migration just to force setting schema version when cleaning DB
                Migrator.migration(0, {
                    up: function() { }, 
                    down: function() { }
                });
                if (callback) callback();
            });
        },
      
        // Method should only be used for testing
        reset: function() {
            // Creates a dummy migration just to force setting schema version when cleaning DB
            Migrator.migrations = [];
            Migrator.migration(0, {
                up: function() { }, 
                down: function() { }
            });
            Migrator.setVersion(allMigrations, 0);
        },
      
        migration: function(version, actions) {
            Migrator.migrations[version] = new Migration(version, actions);
            return Migrator.migrations[version];
        },
      
        migrateUpTo: function(allMigrations, curVersion, version) {
            var migrationsToRun = [];
            
            for (var v = curVersion + 1; v <= version; ++v) {
                migrationsToRun.push(Migrator.migrations[v]);
            }
                
            for (var i = 0; i < migrationsToRun.length; ++i) {
                var migration = migrationsToRun[i];
                migration.up(allMigrations);
            }
        },
      
        migrateDownTo: function(allMigrations, curVersion, version) {
            var migrationsToRun = [];
            
            for (var v = curVersion; v > version; v--) {
                migrationsToRun.push(Migrator.migrations[v]);
            }
                
            for (var i = 0; i < migrationsToRun.length; ++i) {
                var migration = migrationsToRun[i];
                migration.down(allMigrations);
            }
        },
      
        migrate: function(curVersion, newVersion) {
            var allMigrations = [];
            if (curVersion < newVersion)
                Migrator.migrateUpTo(allMigrations, curVersion, newVersion);
            else if (curVersion > newVersion)
                Migrator.migrateDownTo(allMigrations, curVersion, newVersion);
            else
                return;
            
            persistence.nextSchemaSyncHooks.push(function() {
                return allMigrations;
            });
        }
    }
    
    var Migration = function(version, body) {
        this.version = version;
        // TODO check if actions contains up and down methods
        this.body = body;
        this.actions = [];
    };
    
    Migration.prototype.executeActions = function(allMigrations, customVersion) {
        var actionsToRun = this.actions;
        var version = (customVersion!==undefined) ? customVersion : this.version;
      
        for (var i = 0; i < actionsToRun.length; ++i) {
            var action = actionsToRun[i];
            action(allMigrations);
        }
        Migrator.setVersion(allMigrations, version);
    }
    
    Migration.prototype.up = function(allMigrations) {
        if (this.body.up) {
            this.body.up.apply(this, allMigrations);
        }
        this.executeActions(allMigrations);
    }
    
    Migration.prototype.down = function(allMigrations) {
        if (this.body.down) {
            this.body.down.apply(this, allMigrations);
        }
        this.executeActions(allMigrations, this.version-1);
    }
    
    Migration.prototype.createTable = function(tableName, callback) {
        var table = new ColumnsHelper();
      
        if (callback) callback(table);
      
        var column;
        var sql = 'CREATE TABLE `' + tableName + '` (id VARCHAR(32) PRIMARY KEY';
        while (column = table.columns.pop()) {
            sql += ', ' + column;
        }
      
        this.executeSql(sql + ')');
    }
    
    Migration.prototype.dropTable = function(tableName) {
        var sql = 'DROP TABLE IF EXISTS `' + tableName + '`';
        this.executeSql(sql);
    }
    
    Migration.prototype.updateColumns = function(allColumns, allOldColumns, tableName, keyChanged, newKeyCol) {
        this.action(function(arr){
            var columnsSql = [];
            var selectColumns = [];
            for (var col in allColumns) {
                var colTarget = allColumns[col];
                var colName = col;
                if (Helix.Utils.isString(colTarget)) {
                    columnsSql.push(colName + " " + colTarget);
                } else {
                    // This is a relationship column.
                    colName = "`" + col + "`";
                    columnsSql.push(colName + " VARCHAR(32)");
                }
                
                if (col in allOldColumns) {
                    selectColumns.push(colName);
                } else {
                    selectColumns.push('NULL');
                }
            }
            // Add the 'id' column that exists on all tables managed by persistence JS.
            columnsSql.push('id VARCHAR(32) PRIMARY KEY');
            selectColumns.push('id');
            
            columnsSql = columnsSql.join(', ');
            selectColumns = selectColumns.join(', ');

            var quotedTblName = "`" + tableName + "_bkp`";
            arr.unshift(["DROP TABLE IF EXISTS " + quotedTblName + ";"])
            arr.unshift(["ALTER TABLE `" + tableName + "` RENAME TO " + quotedTblName + ";", null]);
            arr.unshift(["CREATE TABLE `" + tableName + "` (" + columnsSql + ");", null]);
            if (!keyChanged || (keyChanged && (newKeyCol in allOldColumns))) {
                // If the unique ID field of a table changed to a new field, then all old data in that table is invalidated
                // If we allow this insert to proceed, we will assign null as the unique key for all columns which is both logically invalid
                // and a violation of the table constraint.
                arr.unshift(["INSERT INTO `" + tableName + "` SELECT " + selectColumns + " FROM `" + tableName + "_bkp`;", null]);
            }
            arr.unshift(["DROP TABLE " + quotedTblName + ";", null]);
        });
    }
    
    Migration.prototype.addIndex = function(tableName, columnName, unique) {
        var sql = 'CREATE ' + (unique === true ? 'UNIQUE' : '') + ' INDEX IF NOT EXISTS `' + tableName + '_' + columnName + '` ON `' + tableName + '` (' + columnName + ')';
        this.executeSql(sql);
    }
    
    Migration.prototype.removeIndex = function(tableName, columnName) {
        var sql = 'DROP INDEX IF EXISTS `' + tableName + '_' + columnName + '`';
        this.executeSql(sql);
    }
    
    Migration.prototype.executeSql = function(sql, args) {
        this.action(function(arr){
            arr.unshift([sql, args]);
        });
    }
    
    Migration.prototype.action = function(callback) {
        this.actions.push(callback);
    }
    
    var ColumnsHelper = function() {
        this.columns = [];
    }
    
    ColumnsHelper.prototype.text = function(columnName) {
        this.columns.unshift(columnName + ' TEXT');
    }
    
    ColumnsHelper.prototype.integer = function(columnName) {
        this.columns.unshift(columnName + ' INT');
    }
    
    ColumnsHelper.prototype.real = function(columnName) {
        this.columns.unshift(columnName + ' REAL');
    }
    
    ColumnsHelper.prototype['boolean'] = function(columnName) {
        this.columns.unshift(columnName + ' BOOL');
    }
    
    ColumnsHelper.prototype.date = function(columnName) {
        this.columns.unshift(columnName + ' DATE');
    }
    
    ColumnsHelper.prototype.json = function(columnName) {
        this.columns.unshift(columnName + ' TEXT');
    }
    
    // Makes Migrator and Migration available to tests
    persistence.migrations = {};
    persistence.migrations.Migrator = Migrator;
    persistence.migrations.Migration = Migration;
    persistence.migrations.init = function() {
        Migrator.setup.apply(Migrator, Array.prototype.slice.call(arguments, 0))
    };
    
    persistence.migrate = function() {
        Migrator.migrate.apply(Migrator, Array.prototype.slice.call(arguments, 0))
    };
    persistence.defineMigration = function() {
        Migrator.migration.apply(Migrator, Array.prototype.slice.call(arguments, 0))
    };
    
}
