/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package org.helix.mobile.model;

/**
 * Represents a "delta" object, which includes a list of objects to add to the client-side
 * data cache, a list of keys referencing objects to remove from the cache, and
 * a list of objects to update.
 * 
 * @author shallem
 */
public interface DeltaObject {
    /**
     * Return the list of adds.
     */
    @ClientData
    public Object[] getAdds();
    
    /**
     * Return the list of keys to delete.
     */
    @ClientData
    public String[] getDeletes();
    
    /**
     * Return the list of updates.
     */
    @ClientData
    public Object[] getUpdates();
}
