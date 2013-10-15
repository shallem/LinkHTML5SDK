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
 * Annotation used to indicate that a sub-object or an element of an array should
 * have a table name that is different from the type name. Tables can only be attached
 * in one-to-many or many-to-one relationships to one other table because we are not
 * using join tables at the moment (would need to do a major upgrade to persistenceJS).
 * Instead we just have multiple copies of the same table.
 * 
 * @author shallem
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(value = ElementType.METHOD)
public @interface ClientTableName {
    String tableName();
}
