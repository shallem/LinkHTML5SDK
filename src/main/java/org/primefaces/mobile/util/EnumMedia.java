/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package org.primefaces.mobile.util;

/**
 *
 * @author bob.reaman
 */
public enum EnumMedia {

    PHONE("phone"), 
    TABLET("tablet"), 
    PHABLET("phablet"), 
    PHONE_AND_PHABLET("phone,phablet"), 
    PHABLET_AND_TABLET("phablet,tablet"),
    UNKNOWN("unknown");

    private String text;

    private EnumMedia(String text) {
        this.text = text;
    }

    public String getText() {
        return this.text;
    }

    public static EnumMedia getEnumFromString(String text) 
            throws IllegalArgumentException {
        if (text != null) {
            for (EnumMedia ve : EnumMedia.values()) {
                if (text.equalsIgnoreCase(ve.text)) {
                    return ve;
                }
            }
        }
        //return EnumMedia.UNKNOWN; //or default EnumMedia.TABLET;
        throw new IllegalArgumentException("No EnumMedia with text '" + text + "' found"); 
    }
}
