/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package org.helix.mobile.model;

import java.io.IOException;
import java.io.StringWriter;
import java.lang.reflect.InvocationTargetException;
import java.util.LinkedList;
import java.util.List;
import org.codehaus.jackson.JsonFactory;
import org.codehaus.jackson.JsonGenerator;

/**
 * JSON-serializable object intended for use as a response to a web services
 * call that manipulates the server side data model by updating or adding
 * objects. The returned object contains a status code, status message, and a
 * list of serializable objects (serialized according to the annotation scheme).
 * To serialize the object, the client calls the toJSON method.
 *
 * @author shallem
 */
public class ClientWSResponse {

    private int statusCode;
    private String statusMessage;
    private List<Object> responseObjects;

    public ClientWSResponse() {
        this.statusCode = -1;
        this.statusMessage = "Uninitialized.";
        this.responseObjects = new LinkedList<Object>();
    }
    
    public ClientWSResponse(int statusCode,
            String statusMessage) {
        this.statusCode = statusCode;
        this.statusMessage = statusMessage;
        this.responseObjects = new LinkedList<Object>();
    }

    public ClientWSResponse(int statusCode,
            String statusMessage,
            List<Object> objectList) {
        this.statusCode = statusCode;
        this.statusMessage = statusMessage;
        this.responseObjects = objectList;
    }

    public void addObject(Object o) {
        this.responseObjects.add(o);
    }

    public String toJSON() throws IOException,
            IllegalAccessException,
            IllegalArgumentException,
            InvocationTargetException,
            NoSuchMethodException {
        JSONSerializer js = new JSONSerializer();

        StringWriter outputString = new StringWriter();
        JsonFactory jsonF = new JsonFactory();

        JsonGenerator jg = jsonF.createJsonGenerator(outputString);
        jg.writeStartObject();
        jg.writeFieldName("status");
        jg.writeNumber(statusCode);
        jg.writeFieldName("msg");
        jg.writeString(statusMessage);
        jg.writeArrayFieldStart("objects");
        for (Object obj : this.responseObjects) {
            js.serializeObject(obj, jg);
        }
        jg.writeEndArray();
        jg.writeEndObject();
        jg.close();

        outputString.flush();

        return outputString.toString();
    }

    public int getStatusCode() {
        return statusCode;
    }

    public String getStatusMessage() {
        return statusMessage;
    }

    public void setStatusCode(int statusCode) {
        this.statusCode = statusCode;
    }

    public void setStatusMessage(String statusMessage) {
        this.statusMessage = statusMessage;
    }

    public static String SerializationFailureObject() {
        return "{ \"status\" : -4 }";
    }
}
