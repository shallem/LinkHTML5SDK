/* 
 * Simple class for storing a list of hints that should be displayed for the user
 * exactly once. The actual hint messages need not be stored in the local DB. What
 * we are really tracking is whether or not the hint has been shown. This class cannot
 * be used until the Link DB is in a ready state.
 */

/**
 * Init the HelixHints infrastructure. The input params are a list of hint objects, each of which
 * has a unique ID and a message, and a completion function. This function is asynchronous b/c
 * it must determine from the DB if the hints have been shown or not.
 */
function HelixHints(hints, oncomplete) {
    this._hints = {};
    for (var i = 0; i < hints.length; ++i) {
        var nxt = hints[i];
        this._hints[nxt.id] = { msg: nxt.msg,
            isShown: false,
            dbObj : null
        };
    }
    
    // Sync to the DB.
    this._schema = persistence.define('HelixHints', {
        isShown: "INT",
        hintTag: "TEXT"
    });
    var _self = this;
    persistence.schemaSync(function(tx) {   
        _self._schema.all().newEach({
            eachFn: function(row) {
                var hintObj = _self._hints[row.hintTag];
                if (hintObj) {
                    hintObj.dbObj = row;
                    hintObj.isShown = (row.isShown ? true : false);
                } else {
                    persistence.remove(row);
                }
            },
            doneFn: function() {
                var didAdd = false;
                for (var hintKey in _self._hints) {
                    var hintObj = _self._hints[hintKey];
                    if (!hintObj.dbObj) {
                        hintObj.dbObj = new _self._schema({
                            isShown : 0,
                            hintTag: hintKey
                        });
                        persistence.add(hintObj.dbObj);
                        didAdd = true;
                    }
                }
                if (didAdd) {
                    persistence.flush(function() {
                        oncomplete();
                    });
                } else {
                    oncomplete();
                }
            }
        });
    });
}

HelixHints.prototype.showHint = function(hintID) {
    // Check to see if the hint ID exists and is present.
    var hint = this._hints[hintID];
    if (hint && !hint.isShown) {
        Helix.Utils.statusMessage("Hint", hint.msg, "info");
        hint.dbObj.isShown = 1;
        hint.isShown = true;
        persistence.flush();
    }
};