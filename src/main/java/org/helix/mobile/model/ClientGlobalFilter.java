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
 * Annotation used to identify a field as a filter field. On the client side this
 * will force creation of an index on this field and it integrates with the dataList/
 * table objects to automatically create filters.
 * 
 * @author shallem
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(value = ElementType.METHOD)
public @interface ClientGlobalFilter {
    String displayName();
    String[] values() default {};
    int[] intValues() default {};
    String[] valueNames() default {};
}
