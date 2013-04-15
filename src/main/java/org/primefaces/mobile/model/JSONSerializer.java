/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package org.primefaces.mobile.model;

import java.io.IOException;
import java.io.StringWriter;
import java.lang.annotation.Annotation;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.LinkedList;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import org.codehaus.jackson.JsonFactory;
import org.codehaus.jackson.JsonGenerator;

/**
 * Accept as input a class that represents a JSON schema to be transmitted to
 * the client, primarily via the pm:loadCommand JSF tag. Translate this into a
 * generic JSON description of the corresponding schema. The schema differs from
 * actual data in that we are trying to show what is potentially included in a
 * returned data object, not what is returned in any particular load command. If
 * we don't explore the space of what's possible, our schema on the client side
 * would change every time particular fields are or are not present in the data
 * model.
 *
 * The resulting schema is a JSON string that fills in default values for all
 * primitive types, makes all arrays singleton arrays containing a specification
 * of the underlying object type, and makes all referenced objects into JSON
 * specifications of the schema.
 *
 * Object fields that are included in the client-side schema must be marked with
 * the
 *
 * @ClientData annotation. To avoid infinite loops, we only attempt to serialize
 * the schema for each class once.
 *
 * @author shallem
 */
public class JSONSerializer {

    private ClientData clientDataPrototype;
    private ClientSort sortPrototype;

    public JSONSerializer() {
    }

    public String serializeObject(Object obj) throws IOException, 
            IllegalAccessException,
            IllegalArgumentException,
            InvocationTargetException,
            NoSuchMethodException {
        TreeSet<String> visitedClasses = new TreeSet<>();
        StringWriter outputString = new StringWriter();
        JsonFactory jsonF = new JsonFactory();
        JsonGenerator jg = jsonF.createJsonGenerator(outputString);

        serializeObjectFields(jg, obj, visitedClasses);

        return jg.toString();
    }
    
    private void serializeObjectFields(JsonGenerator jg,
            Object obj,
            Set<String> visitedClasses) throws IOException, 
                IllegalAccessException, 
                IllegalArgumentException, 
                InvocationTargetException,
                NoSuchMethodException {
        Class<?> c = obj.getClass();

        /* Prevent infinite loops. If we have already visited this object back out. */
        if (visitedClasses.contains(c.getCanonicalName())) {
            return;
        }
        visitedClasses.add(c.getCanonicalName());

        /* Determine if this is a DeltaObject and mark it privately so the client
         * will know to handle it accordingly.
         */
        for (Class<?> ifaces : c.getInterfaces()) {
            if (ifaces.equals(org.primefaces.mobile.model.DeltaObject.class)) {
                jg.writeFieldName("__pm_type");
                jg.writeNumber(1001);
            }
        }
        
        /* Next, iterate over all methods looking for property getters, of the form
         * get<prop name>. Find those annotated with the ClientData annotation. Presuming
         * the name format is right, convert the method name to a field name and add
         * to the schema. Throw an IO exception is an annotated method has the wrong
         * name format.
         */
        for (Method m : c.getMethods()) {
            Annotation clientDataAnnot = m.getAnnotation(org.primefaces.mobile.model.ClientData.class);
            if (clientDataAnnot != null) {
                /* Extract the field name. */
                String fieldName = this.extractFieldName(m.getName());
                
                /* Based on the type of the method, add to the JSON schema/object 
                 * appropriately.
                 */
                Class<?> returnType = m.getReturnType();
                
                /* Serialize the genericized version of this return type. */
                if (this.isSimpleType(returnType)) {
                    jg.writeFieldName(fieldName);
                    this.addSimpleData(jg, obj, m);
                } else {
                    /* Handle arrays by recursing over the elements. */
                    if (returnType.isArray()) {
                        Class<?> componentType = returnType.getComponentType();
                        jg.writeArrayFieldStart(fieldName);
                        for (Object elem : (Object[])m.invoke(obj, new Object[]{})) {
                            if (isSimpleType(componentType)) {
                                this.addSimpleData(jg, elem, m);
                            } else {
                                this.serializeObjectFields(jg, elem, visitedClasses);
                            }
                        }
                        jg.writeEndArray();
                    } else {
                        /* Finally, handle arbitrary object types. Either these objects
                         * encapsulate other objects (as evidenced by having ClientData-
                         * annotated methods or they have a toString
                         */
                        if (this.hasClientDataMethods(returnType)) {
                            this.serializeObjectFields(jg, returnType, visitedClasses);
                        } else {
                            jg.writeFieldName(fieldName);
                            Object subObj = (Object)m.invoke(obj, new Object[]{});
                            Method toStringM = subObj.getClass().getMethod("toString", new Class[]{});
                            jg.writeString((String)toStringM.invoke(subObj, new Object[]{}));
                        }
                    }
                }
            }
        }
    }
    
    public String serializeObjectSchema(Object obj) throws IOException {
        TreeSet<String> visitedClasses = new TreeSet<>();
        StringWriter outputString = new StringWriter();
        JsonFactory jsonF = new JsonFactory();
        JsonGenerator jg = jsonF.createJsonGenerator(outputString);

        serializeObjectForSchema(jg, obj.getClass(), visitedClasses);

        return jg.toString();
    }

    private boolean serializeObjectForSchema(JsonGenerator jg,
            Class<?> c,
            Set<String> visitedClasses) throws IOException {
        boolean hasFields = false;

        /* Prevent infinite loops. If we have already visited this object back out. */
        if (visitedClasses.contains(c.getCanonicalName())) {
            return true;
        }
        visitedClasses.add(c.getCanonicalName());

        /* Next, iterate over all methods looking for property getters, of the form
         * get<prop name>. Find those annotated with the ClientData annotation. Presuming
         * the name format is right, convert the method name to a field name and add
         * to the schema. Throw an IO exception is an annotated method has the wrong
         * name format.
         */
        List<String> sortFields = new LinkedList<>();
        List<String> keyFields = new LinkedList<>();
        for (Method m : c.getMethods()) {
            Annotation clientDataAnnot = m.getAnnotation(clientDataPrototype.getClass());
            if (clientDataAnnot != null) {
                /* We want to include this field in the client data. */
                hasFields = true;

                /* Check the format of the method name. */
                String methodName = m.getName();
                if (!methodName.startsWith("get")) {
                    throw new IOException("All methods annotated with the ClientData annotation should have the form get<field name>.");
                }
                if (methodName.length() < 4) {
                    throw new IOException("All methods annotated with the ClientData annotation should have the form get<field name>.");
                }

                /* Extract the field name. */
                String fieldName = this.extractFieldName(methodName);

                /* Determine if this field is a sort field. */
                Annotation sortAnnot = 
                        m.getAnnotation(org.primefaces.mobile.model.ClientSort.class);
                if (sortAnnot != null) {
                    sortFields.add(fieldName);
                }
                
                /* Determine if this field is a key field. */
                Annotation keyAnnot = 
                        m.getAnnotation(org.primefaces.mobile.model.ClientDataKey.class);
                if (keyAnnot != null) {
                    keyFields.add(fieldName);
                }
                
                /* Based on the type of the method, add to the JSON schema/object 
                 * appropriately.
                 */
                Class<?> returnType = m.getReturnType();
                if (returnType == null) {
                    throw new IOException("Getters must return a non-void value. " + m.getName() + " does not.");
                }

                
                /* Serialize the genericized version of this return type. */
                if (this.isSimpleType(returnType)) {
                    jg.writeFieldName(fieldName);
                    this.addSimpleType(jg, returnType);
                } else {
                    /* Handle arrays by recursing over the element type. */
                    if (returnType.isArray()) {
                        Class<?> componentType = returnType.getComponentType();
                        jg.writeArrayFieldStart(fieldName);
                        if (isSimpleType(componentType)) {
                            this.addSimpleType(jg, returnType);
                        } else if (!this.serializeObjectForSchema(jg, 
                                returnType.getComponentType(),
                                visitedClasses)) {
                            throw new IOException("Array types returned by ClientData methods must be simple types or object types with at least one ClientData field.");
                        }
                        jg.writeEndArray();
                    } else {
                        /* Finally, handle arbitrary object types. Either these objects
                         * encapsulate other objects (as evidenced by having ClientData-
                         * annotated methods or they have a toString
                         */
                        if (this.hasClientDataMethods(returnType)) {
                            this.serializeObjectForSchema(jg, returnType, visitedClasses);
                        } else if (this.hasToString(returnType)) {
                            jg.writeFieldName(fieldName);
                            jg.writeString("");
                        } else {
                            /* The object neither has any fields marked as ClientData nor
                             * does it have a toString method - this is not legal.
                             */
                            throw new IOException("Object types must either have fields marked ClientData or have a toString method.");
                        }
                    }
                }
            }
        }
        jg.writeArrayFieldStart("__pm_keys");
        for (String k : keyFields) {
            jg.writeString(k);
        }
        jg.writeEndArray();
        
        jg.writeArrayFieldStart("__pm_sorts");
        for (String s : sortFields) {
            jg.writeString(s);
        }
        jg.writeEndArray();
        
        return hasFields;
    }

    private boolean isNumberType(Class<?> returnType) {
        if (returnType.getSuperclass().equals(java.lang.Number.class)) {
            return true;
        }
        return false;
    }

    private boolean isString(Class<?> returnType) {
        if (returnType.equals(java.lang.String.class)) {
            return true;
        }
        return false;
    }

    private boolean isBoolean(Class<?> returnType) {
        if (returnType.equals(java.lang.Boolean.class)) {
            return true;
        }
        return false;
    }

    private boolean isSimpleType(Class<?> objType) {
        return objType.isPrimitive()
                || isNumberType(objType)
                || isString(objType)
                || isBoolean(objType);
    }

    private void addSimpleData(JsonGenerator jg, Object obj, Method m) 
            throws IOException, IllegalAccessException, IllegalArgumentException, InvocationTargetException {
        switch (obj.getClass().getName()) {
            case "boolean":
            case "java.lang.Boolean":
                jg.writeBoolean((Boolean)m.invoke(obj, new Object[]{}));
                break;
            case "byte":
            case "java.lang.Byte":
                jg.writeNumber((Byte)m.invoke(obj, new Object[]{}));
                break;
            case "java.lang.Short":
            case "short":
                jg.writeNumber((Short)m.invoke(obj, new Object[]{}));
                break;
            case "java.lang.Integer":
            case "java.lang.AtomicInteger":
            case "int":
                jg.writeNumber((Integer)m.invoke(obj, new Object[]{}));
                break;
            case "java.lang.Long":
            case "java.lang.AtomicLong":
            case "long":
                jg.writeNumber((Long)m.invoke(obj, new Object[]{}));
                break;
            case "char":
                jg.writeRaw('a');
                break;
            case "float":
            case "java.lang.Float":
                jg.writeNumber((Float)m.invoke(obj, new Object[]{}));
            case "double":
            case "java.lang.Double":
                jg.writeNumber((Double)m.invoke(obj, new Object[]{}));
                break;
            case "java.lang.String":
                jg.writeString((String)m.invoke(obj, new Object[]{}));
                break;
            case "java.lang.BigInteger":
                jg.writeNumber((BigInteger)m.invoke(obj, new Object[]{}));
                break;
            case "java.lang.BigDecmial":
                jg.writeNumber((BigDecimal)m.invoke(obj, new Object[]{}));
                break;
        }
    }
    
    private void addSimpleType(JsonGenerator jg, Class<?> objType) throws IOException {
        switch (objType.getName()) {
            case "boolean":
            case "java.lang.Boolean":
                jg.writeBoolean(true);
                break;
            case "byte":
            case "java.lang.Byte":
                jg.writeNumber((int) 1);
                break;
            case "java.lang.Short":
            case "short":
                jg.writeNumber((int) 1);
                break;
            case "java.lang.Integer":
            case "java.lang.AtomicInteger":
            case "int":
                jg.writeNumber((int) 1);
                break;
            case "java.lang.Long":
            case "java.lang.AtomicLong":
            case "long":
                jg.writeNumber((long) 1);
                break;
            case "char":
                jg.writeRaw('a');
                break;
            case "float":
            case "java.lang.Float":
                jg.writeNumber((float) 1.0);
            case "double":
            case "java.lang.Double":
                jg.writeNumber((double) 1.0);
                break;
            case "java.lang.String":
                jg.writeString("empty");
                break;
            case "java.lang.BigInteger":
                jg.writeNumber(BigInteger.ONE);
                break;
            case "java.lang.BigDecmial":
                jg.writeNumber(BigDecimal.ONE);
                break;
        }
    }
    
    private boolean hasClientDataMethods(Class<?> c) {
        for (Method m : c.getMethods()) {
            Annotation clientDataAnnot = m.getAnnotation(clientDataPrototype.getClass());
            if (clientDataAnnot != null) {
                return true;
            }
        }
        return false;
    }

    private boolean hasToString(Class<?> c) {
        try {
            Method toStringM = c.getMethod("toString", new Class[]{});
            if (toStringM != null) {
                return true;
            }
        } catch(Exception e) {
            /* Ignore  - we are just trying to determine if this method exists. */
        }
        
        return false;
    }
    
    private String extractFieldName(String methodName) {
        String fieldName = methodName.substring(3);
        fieldName = Character.toLowerCase(fieldName.charAt(0))
                        + (fieldName.length() > 1 ? fieldName.substring(1) : "");
        return fieldName;
    }
}
