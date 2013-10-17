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
 * Currently a 0 argument annotation that indicates that a particular class member
 * should be indexed on the client by adding a DB index on this field.
 * 
 * @author shallem
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(value = ElementType.METHOD)
public @interface ClientTextIndex {
    
}
