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
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.lang.reflect.TypeVariable;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.codehaus.jackson.JsonFactory;
import org.codehaus.jackson.JsonGenerator;
import org.primefaces.mobile.util.EnumDataTypes;
import static org.primefaces.mobile.util.EnumDataTypes.BOOLEAN;
import static org.primefaces.mobile.util.EnumDataTypes.BYTE;
import static org.primefaces.mobile.util.EnumDataTypes.CHAR;
import static org.primefaces.mobile.util.EnumDataTypes.DOUBLE;
import static org.primefaces.mobile.util.EnumDataTypes.FLOAT;
import static org.primefaces.mobile.util.EnumDataTypes.INT;
import static org.primefaces.mobile.util.EnumDataTypes.JAVA_LANG_ATOMICLONG;
import static org.primefaces.mobile.util.EnumDataTypes.JAVA_LANG_AUTOMICINTEGER;
import static org.primefaces.mobile.util.EnumDataTypes.JAVA_LANG_BIGDECMIAL;
import static org.primefaces.mobile.util.EnumDataTypes.JAVA_LANG_BIGINTEGER;
import static org.primefaces.mobile.util.EnumDataTypes.JAVA_LANG_BOOLEAN;
import static org.primefaces.mobile.util.EnumDataTypes.JAVA_LANG_BYTE;
import static org.primefaces.mobile.util.EnumDataTypes.JAVA_LANG_DOUBLE;
import static org.primefaces.mobile.util.EnumDataTypes.JAVA_LANG_FLOAT;
import static org.primefaces.mobile.util.EnumDataTypes.JAVA_LANG_INTEGER;
import static org.primefaces.mobile.util.EnumDataTypes.JAVA_LANG_LONG;
import static org.primefaces.mobile.util.EnumDataTypes.JAVA_LANG_SHORT;
import static org.primefaces.mobile.util.EnumDataTypes.JAVA_LANG_STRING;
import static org.primefaces.mobile.util.EnumDataTypes.LONG;
import static org.primefaces.mobile.util.EnumDataTypes.SHORT;

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

    public JSONSerializer() {
    }

    public String serializeObject(Object obj) throws IOException,
            IllegalAccessException,
            IllegalArgumentException,
            InvocationTargetException,
            NoSuchMethodException {
        TreeSet<String> visitedClasses = new TreeSet<String>();
        StringWriter outputString = new StringWriter();
        JsonFactory jsonF = new JsonFactory();
        
        JsonGenerator jg = jsonF.createJsonGenerator(outputString);
        serializeObjectFields(jg, obj, visitedClasses, null);
        jg.close();
        
        outputString.flush();
        
        return outputString.toString();
    }

    private boolean serializeObjectFields(JsonGenerator jg,
            Object obj,
            Set<String> visitedClasses,
            String fieldName) throws IOException, IllegalAccessException, IllegalArgumentException, InvocationTargetException, NoSuchMethodException {
        Class<?> c = obj.getClass();

        if (this.isSimpleType(c)) {
            if (fieldName != null) {
                jg.writeFieldName(fieldName);
            }
            this.addSimpleData(jg, obj);
            return true;
        } else if (c.isArray()) {
            if (fieldName != null) {
                jg.writeArrayFieldStart(fieldName);
            } else {
                jg.writeStartArray();
            }
            for (Object elem : (Object[]) obj) {
                this.serializeObjectFields(jg, elem, visitedClasses, null);
            }
            jg.writeEndArray();
            return true;
        } else {
            /* Next, iterate over all methods looking for property getters, of the form
             * get<prop name>. Find those annotated with the ClientData annotation. Presuming
             * the name format is right, convert the method name to a field name and add
             * to the schema. Throw an IO exception is an annotated method has the wrong
             * name format.
             */
            if (fieldName != null) {
                jg.writeFieldName(fieldName);
            }
            if (this.hasClientDataMethods(c)) {
                jg.writeStartObject();
                
                /* Determine if this is a DeltaObject and mark it privately so the client
                 * will know to handle it accordingly.
                 */
                if (!this.isDeltaObject(c)) {
                    /* Write the object type so that we can get the Schema back. */
                    jg.writeFieldName("__pm_schema_type");
                    jg.writeString(c.getName());
                } else {
                    jg.writeFieldName("__pm_type");
                    jg.writeNumber(1001);
                    
                    Method m = c.getDeclaredMethod("getAdds", new Class<?>[]{});
                    Class<?> returnType = m.getReturnType();
                    jg.writeFieldName("__pm_schema_type");
                    jg.writeString(returnType.getName());
                }
                
                for (Method m : c.getMethods()) {
                    Annotation clientDataAnnot = m.getAnnotation(org.primefaces.mobile.model.ClientData.class);
                    if (clientDataAnnot != null) {
                        /* Extract the field name. */
                        String nxtFieldName = this.extractFieldName(m.getName());

                        /* Finally, handle arbitrary object types. Either these objects
                         * encapsulate other objects (as evidenced by having ClientData-
                         * annotated methods or they have a toString
                         */
                        Object subObj = (Object) m.invoke(obj, new Object[]{});
                        if (subObj != null && !this.serializeObjectFields(jg, subObj, visitedClasses, nxtFieldName)) {
                            /* Should never happen. */
                            throw new IOException("Serialization unexpectedly encountered a class with no ClientData: " + subObj.getClass().getName());
                        }
                    }
                }
                jg.writeEndObject();
                return true;
            } else if (this.hasToString(c)) {
                /* This is just a simple type. */
                Method toStringM = obj.getClass().getMethod("toString", new Class[]{});
                jg.writeString((String) toStringM.invoke(obj, new Object[]{}));
            }
        }
        
        return false;
    }

    public String serializeObjectSchema(Class<?> cls) throws IOException {
        TreeSet<String> visitedClasses = new TreeSet<String>();
        StringWriter outputString = new StringWriter();
        JsonFactory jsonF = new JsonFactory();
        JsonGenerator jg = jsonF.createJsonGenerator(outputString);
        
        if (!serializeObjectForSchema(jg, cls, visitedClasses, null)) {
            throw new IOException("Attempting to generate schema for an object with no client data.");
        }

        jg.close();
        outputString.flush();
        return outputString.getBuffer().toString();
    }

    private boolean serializeObjectForSchema(JsonGenerator jg,
            Class<?> c,
            Set<String> visitedClasses,
            String fieldName) throws IOException {
        /* Serialize the genericized version of this return type. */
        if (this.isSimpleType(c)) {
            if (fieldName != null) {
                jg.writeFieldName(fieldName);
            }
            this.addSimpleType(jg, c);
            return true;
        } else if (c.isArray()) {
            /* Handle arrays by recursing over the element type. */
            Class<?> componentType = c.getComponentType();
            if (fieldName != null) {
                jg.writeArrayFieldStart(fieldName);
            } else {
                jg.writeStartArray();
            }
            if (!this.serializeObjectForSchema(jg,
                    componentType,
                    visitedClasses,
                    null)) {
                throw new IOException("Array types returned by ClientData methods must be simple types or object types with at least one ClientData field. Class " + componentType.getName() + " does not comply.");
            }
            jg.writeEndArray();
            return true;
        } else {
            /* Check is this is a delta object. If so, just iterate over the object type of the
             * getAdds method.
             */
            if (this.isDeltaObject(c)) {
                try {
                    Method m = c.getDeclaredMethod("getAdds", new Class<?>[]{});
                    Class<?> returnType = m.getReturnType();
                    if (!this.serializeObjectForSchema(jg, returnType, visitedClasses, fieldName)) {
                        /* The object neither has any fields marked as ClientData nor
                         * does it have a toString method - this is not legal.
                        */
                        throw new IOException("Object types must either have fields marked ClientData or have a toString method.");
                    }
                } catch (NoSuchMethodException ex) {
                    throw new IOException("Invalid contents of DeltaObject. Missing getAdds method.");
                } catch (SecurityException  ex) {
                    throw new IOException("Invalid contents of DeltaObject. Missing getAdds method.");
                }
            }
            
            /* Finally, handle arbitrary object types. Either these objects
             * encapsulate other objects (as evidenced by having ClientData-
             * annotated methods or they have a toString
             */
            
            /* Next, iterate over all methods looking for property getters, of the form
             * get<prop name>. Find those annotated with the ClientData annotation. Presuming
             * the name format is right, convert the method name to a field name and add
             * to the schema by recursing. Throw an IO exception is an annotated method has the wrong
             * name format.
             */
            if (this.hasClientDataMethods(c)) {
                if (fieldName != null) {
                    /* This is an object that will exist in its own table on the client side. */
                    jg.writeFieldName(fieldName);
                }
                
                List<String> sortFields = new LinkedList<String>();
                String keyField = null;
                
                jg.writeStartObject();
                
                jg.writeFieldName("__pm_schema_name");
                jg.writeString(c.getName());
                
                
                /* Prevent infinite loops. If we have already visited this object then
                 * we have already defined its schema. Just return true. However, we do 
                 * need to put in a reference to the master schema so that the client
                 * knows that there is a schema relationship here.
                 */
                if (visitedClasses.contains(c.getCanonicalName())) {
                    // Indicate that this is, essentially, a forward ref.
                    jg.writeFieldName("__pm_schema_type");
                    jg.writeNumber(1002);
                    
                    jg.writeEndObject();
                    return true;
                }
                visitedClasses.add(c.getCanonicalName());
                
                for (Method m : c.getMethods()) {
                    Annotation clientDataAnnot = m.getAnnotation(org.primefaces.mobile.model.ClientData.class);
                    if (clientDataAnnot != null) {
                        /* Check the method name. Throws an IOException if the name is ill-formed. */
                        String methodName = m.getName();
                        checkMethodName(methodName);

                        /* Extract the field name. */
                        String nxtFieldName = this.extractFieldName(methodName);

                        /* Determine if this field is a sort field. */
                        Annotation sortAnnot =
                                m.getAnnotation(org.primefaces.mobile.model.ClientSort.class);
                        if (sortAnnot != null) {
                            sortFields.add(nxtFieldName);
                        }

                        /* Determine if this field is a key field. */
                        Annotation keyAnnot =
                                m.getAnnotation(org.primefaces.mobile.model.ClientDataKey.class);
                        if (keyAnnot != null) {
                            if (keyField != null) {
                                throw new IOException("Client data can only have one field annotated as a ClientDataKey.");
                            }
                            keyField = nxtFieldName;
                        }

                        /* Recurse over the method. */
                        Class<?> returnType = m.getReturnType();
                        if (!this.serializeObjectForSchema(jg, returnType, visitedClasses, nxtFieldName)) {
                            /* The object neither has any fields marked as ClientData nor
                             * does it have a toString method - this is not legal.
                            */
                            throw new IOException("Object types must either have fields marked ClientData or have a toString method.");
                        }
                    }
                }

                /* Store the keys and sort fields in the object schema. */
                if (keyField == null) {
                    throw new IOException("Client data must have at least one field annotated as a ClientDataKey.");
                }
                jg.writeFieldName("__pm_key");
                jg.writeString(keyField);

                jg.writeArrayFieldStart("__pm_sorts");
                for (String s : sortFields) {
                    jg.writeString(s);
                }
                jg.writeEndArray();

                jg.writeEndObject();
                return true;
            }  else if (this.hasToString(c)) {
                /* The object has a toString method and no ClientData objects. Hence,
                 * it is no different than a simple string field.
                 */
                if (fieldName != null) {
                    jg.writeFieldName(fieldName);
                }
                jg.writeString("toString");
                
                return true;
            }
            
            /* No client data fields in this object. */
            return false;
        }
    }

    private void checkMethodName(String methodName) throws IOException {
        /* Check the format of the method name. */
        if (!methodName.startsWith("get")
                && !methodName.startsWith("is")) {
            throw new IOException("All methods annotated with the ClientData annotation should have the form get<field name>.");
        }
        if (methodName.startsWith("get")
                && methodName.length() < 4) {
            throw new IOException("All getters annotated with the ClientData annotation should have the form get<field name>.");
        }
        if (methodName.startsWith("is")
                && methodName.length() < 3) {
            throw new IOException("All getters annotated with the ClientData annotation should have the form is<field name>.");
        }
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

    private void addSimpleData(JsonGenerator jg, Object obj)
            throws IOException, IllegalAccessException, IllegalArgumentException, InvocationTargetException {
        EnumDataTypes dtc;
        try {
            dtc = EnumDataTypes.getEnumFromString(obj.getClass().getName());
        } catch (IllegalArgumentException iae) {
            // Data type unknown
            dtc = EnumDataTypes.UNKNOWN;
        }
        switch (dtc) {
            case BOOLEAN:
            case JAVA_LANG_BOOLEAN:
                jg.writeBoolean((Boolean) obj);
                break;
            case BYTE:
            case JAVA_LANG_BYTE:
                jg.writeNumber((Byte) obj);
                break;
            case JAVA_LANG_SHORT:
            case SHORT:
                jg.writeNumber((Short) obj);
                break;
            case JAVA_LANG_INTEGER:
            case JAVA_LANG_AUTOMICINTEGER:
            case INT:
                jg.writeNumber((Integer) obj);
                break;
            case LONG:
            case JAVA_LANG_LONG:
            case JAVA_LANG_ATOMICLONG:
                jg.writeNumber((Long) obj);
                break;
            case CHAR:
                jg.writeRaw('a');
                break;
            case FLOAT :
            case JAVA_LANG_FLOAT:
                jg.writeNumber((Float) obj);
            case DOUBLE:
            case JAVA_LANG_DOUBLE:
                jg.writeNumber((Double) obj);
                break;
            case JAVA_LANG_STRING:
                jg.writeString((String) obj);
                break;
            case JAVA_LANG_BIGINTEGER:
                jg.writeNumber((BigInteger) obj);
                break;
            case JAVA_LANG_BIGDECMIAL:
                jg.writeNumber((BigDecimal) obj);
                break;
        }
    }

    private void addSimpleType(JsonGenerator jg, Class<?> objType) throws IOException {
        EnumDataTypes dtc;
        try {
            dtc = EnumDataTypes.getEnumFromString(objType.getName());
        } catch (IllegalArgumentException iae) {
            dtc = EnumDataTypes.UNKNOWN; // TODO: write error message ?
        }
        switch (dtc) {
            case BOOLEAN:
            case JAVA_LANG_BOOLEAN:
                jg.writeBoolean(true);
                break;
            case BYTE:
            case JAVA_LANG_BYTE:
                jg.writeNumber((int) 1);
                break;
            case SHORT:
            case JAVA_LANG_SHORT:
                jg.writeNumber((int) 1);
                break;
            case JAVA_LANG_INTEGER:
            case JAVA_LANG_AUTOMICINTEGER:
            case INT:
                jg.writeNumber((int) 1);
                break;
            case JAVA_LANG_LONG:
            case JAVA_LANG_ATOMICLONG:
            case LONG:
                jg.writeNumber((long) 1);
                break;
            case CHAR:
                jg.writeRaw('a');
                break;
            case FLOAT:
            case JAVA_LANG_FLOAT:
                jg.writeNumber((float) 1.0);
            case DOUBLE:
            case JAVA_LANG_DOUBLE:
                jg.writeNumber((double) 1.0);
                break;
            case JAVA_LANG_STRING:
                jg.writeString("empty");
                break;
            case JAVA_LANG_BIGINTEGER:
                jg.writeNumber(BigInteger.ONE);
                break;
            case JAVA_LANG_BIGDECMIAL:
                jg.writeNumber(BigDecimal.ONE);
                break;


        }
    }

    private boolean hasClientDataMethods(Class<?> c) {
        for (Method m : c.getMethods()) {
            Annotation clientDataAnnot = m.getAnnotation(org.primefaces.mobile.model.ClientData.class);
            if (clientDataAnnot
                    != null) {
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
        } catch (Exception e) {
            /* Ignore  - we are just trying to determine if this method exists. */
        }

        return false;
    }

    private boolean isDeltaObject(Class<?> c) {
        boolean isDelta = false;
        for (Class<?> ifaces : c.getInterfaces()) {
            if (ifaces.equals(org.primefaces.mobile.model.DeltaObject.class)) {
                isDelta = true;
                break;
            }
        }
        return isDelta;
    }
    
    private String extractFieldName(String methodName) {
        int startIdx = 2;
        if (methodName.startsWith("get")) {
            startIdx = 3;
        }
        String fieldName = methodName.substring(startIdx);
        fieldName = Character.toLowerCase(fieldName.charAt(0))
                + (fieldName.length() > 1 ? fieldName.substring(1) : "");
        return fieldName;
    }
}
