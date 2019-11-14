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

function __initHelix() {
    window.Helix = {
    
    };
}
(function() {
    if (window.Helix === undefined) {
        __initHelix();
    }
})();


Helix.Ajax = {
    
};

Helix.Utils = {
    
};

Helix.Layout = {
    
};

Helix.postInit = function(fn, thisArg, args) {
    if (!args) {
        args = [];
    }
    if (!thisArg) {
        thisArg = window;
    }
    if (Helix.ready) {
        fn.apply(thisArg, args);
    } else {
        $(document).one('helixinit', function() {
            fn.apply(thisArg, args);
        });
    }
};

Helix.stopEvent = function(ev) {
    ev.stopImmediatePropagation();
    return false;
};

Helix.ignoreErrors = false;

$(document).on('resign', function() {
    Helix.ignoreErrors = true;
});

$(document).on('active', function() {
    Helix.ignoreErrors = false;
    if (Helix.Ajax) {
        Helix.Ajax.inProgressLoads = {};
    }
});


Helix.ready = false;

(function($) {
    $(document).on('hxPersistenceReady', function() {
        /* Update the .val method on textareas to preserve newlines. See
         * http://api.jquery.com/val/
         */
        $.valHooks.textarea = {
            get: function( elem ) {
                return elem.value.replace( /\r?\n/g, "\r\n" );
            }
        };

        $(document).trigger('helixinit');
        Helix.ready = true;
        
        $(document).trigger('helixready');
    });

})(jQuery);

$(document).on('ready', function() {
    window.onerror = function (desc,page,line,chr) { 
        var msg = 'Captured javascript error "' + desc + '" on page "' + page + '" line "' + line + '"';
        console.log('[ERROR] ' + msg);
        if (Helix.showErrors) {
            Helix.Utils.statusMessage('Javascript Error', msg, 'severe');
        }
        if (Helix && Helix.errorHook) {
            Helix.errorHook(msg);
        }
    };
    document.onkeydown = function(e) {
        switch(e.keyCode) {
            case 9:
                if (e.metaKey === true) {
                    $('.hx-editor').trigger('shifttabpress');
                } else {
                    $('.hx-editor').trigger('tabpress');
                }
                break;
            case 37:
                moveCaret(-1);
                break;
            case 39:
                moveCaret(1);
                break;
        }
    };
});


function findLastTextNodeUnder(par) {
    var childNodes = par.childNodes;
    for (var i = childNodes.length - 1; i >= 0; --i) {
        if (childNodes[i].nodeType === 3) {
            return childNodes[i];
        } else if (childNodes[i].nodeType === 1) {
            var tn = findLastTextNodeUnder(childNodes[i]);
            if (tn) {
                return tn;
            }
        }
    }
    
    return null;
}

function findFirstTextNodeUnder(par) {
    var childNodes = par.childNodes;
    for (var i = 0; i < childNodes.length; ++i) {
        if (childNodes[i].nodeType === 3) {
            return childNodes[i];
        } else if (childNodes[i].nodeType === 1) {
            var tn = findLastTextNodeUnder(childNodes[i]);
            if (tn) {
                return tn;
            }
        }
    }
    
    return null;
}

function findPrevTextSib(tn) {
    var par = tn;
    while (par) {
        while (par && par.previousSibling === null) {
            par = par.parentElement;
        }
        if (par === null) {
            return null;
        }
        par = par.previousSibling;
        var tn = findLastTextNodeUnder(par);
        if (tn) {
            return tn;
        }
    }

    return null;
}

function findNextTextSib(tn) {
    var par = tn;
    while (par) {
        while (par && par.nextSibling === null) {
            par = par.parentElement;
        }
        if (par === null) {
            return null;
        }
        par = par.nextSibling;
        var tn = findFirstTextNodeUnder(par);
        if (tn) {
            return tn;
        }
    }

    return null;
}

function moveCaret(ct) {
    if (window.getSelection) {
        var sel = window.getSelection();
        if (sel.rangeCount > 0) {
            var tn = sel.focusNode;
            var newOffset = sel.focusOffset + ct;
            if (newOffset < 0) {
                // Move to the previous sibling.
                var prevSib = findPrevTextSib(tn);
                if (prevSib) {
                    window.getSelection().collapse(prevSib, prevSib.length);
                }
            } else if (newOffset > tn.length) {
                // Move to the next sibling.
                var nextSib = findNextTextSib(tn);
                if (nextSib) {
                    window.getSelection().collapse(nextSib, 0);
                }
            } else {
                sel.collapse(tn, Math.min(tn.length, newOffset));
            }
        }
    }
}