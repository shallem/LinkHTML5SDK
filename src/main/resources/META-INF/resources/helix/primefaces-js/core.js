/**
 * PrimeFaces core functions
 * 
 * Direct copy of useful utility functions from the PrimeFaces project.
 */
window.PrimeFaces = {
    escapeClientId : function(id) {
        return "#" + id.replace(/:/g,"\\:");
    }
};