/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package org.helix.mobile.model;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation that marks a given field as a key field. On the client side this
 * triggers the creation of a unique index on that key. Also, any object that
 * participates in a DeltaObject must have a marked key field.
 * 
 * @author shallem
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(value = ElementType.METHOD)
public @interface ClientDataKey {
    
}
