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
                        success(res.val ? $.parseJSON(res.val) : null);
                    }
                } else {
                    if (failure) {
                        failure(res.msg);
                    }
                }
            }
        }
    };
}