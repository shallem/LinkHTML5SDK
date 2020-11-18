function cdv_one(dom, event, successCB, errorCB) {
    function handler(e) {
	var cbArgs = e.detail;
	if (cbArgs.detail) {
	    cbArgs = cbArgs.detail;
	}	
	if (cbArgs.code === 0) {
	    if (successCB) {
		var v = (cbArgs.val ? $.parseJSON(cbArgs.val) : null);
		successCB.call(this, v);
	    }
	} else {
	    if (errorCB) {
		errorCB.call(this, cbArgs.msg);
	    }
	}
        this.removeEventListener(event, handler);
    }
    dom.addEventListener(event, handler); 
}    

function cordova_android_init() {
    window.cordova = {
        exec: function(success, failure, objName, methodName, args) {
            objName = "Native" + objName;
            if (objName in window) {
                var obj = window[objName];
                var finalArgs = [];
                for (var i = 0; i < args.length; ++i) {
                    var nxt = args[i];
                    if ($.isArray(nxt)) {
                        finalArgs.push(JSON.stringify(nxt));
                    } else if (nxt !== null && typeof nxt === 'object') {
                        finalArgs.push(JSON.stringify(nxt));
                    } else {
                        finalArgs.push(nxt);
                    }
                }
                
                var resStr = obj[methodName].apply(obj, finalArgs);
                var res = $.parseJSON(resStr);
                if (res.code === 0) {
                    if (success) {
                        var arg = null;
                        if (res.val) {
                            try {
                                arg = $.parseJSON(res.val);
                            } catch(e) {
                                arg = res.val;
                            }
                        }
                        success(arg);
                    }
                } else if (res.code === 9999) {
		    // Async
		    cdv_one(document, res.val, success, failure);
		} else {
                    if (failure) {
                        failure(res.msg);
                    }
                }
            }
        }
    };
}
