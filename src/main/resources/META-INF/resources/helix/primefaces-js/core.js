/**
 * PrimeFaces core functions
 * 
 * Direct copy of useful utility functions from the PrimeFaces project.
 */
PrimeFaces = {
    escapeClientId : function(id) {
        return "#" + id.replace(/:/g,"\\:");
    }
};