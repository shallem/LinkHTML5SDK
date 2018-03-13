/*
 * Copyright 2009-2011 Prime Technology.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.helix.mobile.component.formfield;

import java.io.IOException;
import java.io.StringWriter;
import javax.faces.FacesException;
import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.context.ResponseWriter;
import org.helix.mobile.component.fieldlabel.FieldLabel;
import org.helix.mobile.component.iconbutton.IconButton;
import org.helix.mobile.component.pickitem.PickItem;
import org.primefaces.renderkit.CoreRenderer;

public class FormFieldRenderer extends CoreRenderer {

    @Override
    public void encodeEnd(FacesContext context, UIComponent component) throws IOException {
        ResponseWriter writer = context.getResponseWriter();
        FormField ffield = (FormField) component;
        if (ffield.isEditOnly() && ffield.isViewOnly()) {
            throw new FacesException("Cannot specify that a form field is both viewOnly and editOnly.");
        }
        writer.write("{");
        if (ffield.getName() != null) {
            writer.write("'name' : '" + ffield.getName() + "',");
        } else {
            writer.write("'name' : Helix.Utils.getUniqueID(),");
        }
        writer.write("'type' : '" + ffield.getType() + "',");
        if (ffield.isViewOnly()) {
            writer.write("'mode' : 'view',");
        } else if (ffield.isEditOnly()) {
            writer.write("'mode' : 'edit',");
        } else {
            writer.write("'mode' : 'all',");
        }
        if (ffield.getWidthMap() != null) {
            writer.write("'width' : " + ffield.getWidthMap() + ",");
        } else if (ffield.getWidth() != null) {
            writer.write("'width' : '" + ffield.getWidth() + "',");
        }
        if (ffield.getHeight() != null) {
            writer.write("'height' : '" + ffield.getHeight() + "',");
        }
        if (ffield.getMinHeight() != null) {
            writer.write("'minHeight' : '" + ffield.getMinHeight() + "',");
        }
        if (ffield.getStyleMap() != null) {
            writer.write("'style' : " + ffield.getStyleMap() + ",");
        } else if (ffield.getStyle() != null) {
            writer.write("'style' : '" + ffield.getStyle() + "',");
        }
        
        if (ffield.getStyleClassMap() != null) {
            writer.write("'styleClass' : " + ffield.getStyleClassMap() + ",");
        } else if (ffield.getStyleClass() != null) {
            writer.write("'styleClass' : '" + ffield.getStyleClass() + "',");
        }
        
        if (ffield.getValueText() != null) {
            writer.write("'defaultValue' : '" + ffield.getValueText() + "'");
        } else {
            writer.write("'defaultValue' : ''");
        }
        if (ffield.getTitleStyleClass() != null) {
            writer.write(", 'titleStyleClass' : '" + ffield.getTitleStyleClass() + "'");
        }
        if (ffield.getDirection() != null) {
            writer.write(", 'direction' : '" + ffield.getDirection() + "'");
        }
        if (ffield.getCondition() != null) {
            writer.write(", 'condition' : '" + ffield.getCondition() + "'");
        }
        if (ffield.getOnclick() != null) {
            writer.write(", 'onclick' : " + ffield.getOnclick());
        }
        if (ffield.getOnchange() != null) {
            writer.write(", 'onchange' : " + ffield.getOnchange());
        }
        if (ffield.getOnfocus() != null) {
            writer.write(", 'onfocus' : " + ffield.getOnfocus());
        }
        if (ffield.getAutocomplete() != null) {
            writer.write(", 'autocomplete' : " + ffield.getAutocomplete());
        }
        if (ffield.getAutocompleteSelect() != null) {
            writer.write(", 'autocompleteSelect' : " + ffield.getAutocompleteSelect());
        }
        if (ffield.getAutocompleteThreshold() != null) {
            writer.write(", 'autocompleteThreshold' : " + ffield.getAutocompleteThreshold());
        }
        if (ffield.getAutocompleteTimeout() != null) {
            writer.write(", 'autocompleteTimeout' : " + ffield.getAutocompleteTimeout());
        }
        if (ffield.getOptions() != null) {
            writer.write(", 'options' : " + ffield.getOptions());
        }
        if (ffield.isIsScroller()) {
            writer.write(", 'isScroller' : " + Boolean.toString(ffield.isIsScroller()));
        }
        if (ffield.isNoHTML()) {
            writer.write(", 'noHTML' : " + Boolean.toString(ffield.isNoHTML()));
        }
        if (ffield.isNoBody()) {
            writer.write(", 'noBody' : " + Boolean.toString(ffield.isNoBody()));
        }
        if (ffield.isNoHead()) {
            writer.write(", 'noHead' : " + Boolean.toString(ffield.isNoHead()));
        }
        if (ffield.isNoCollapse()) {
            writer.write(", 'noCollapse' : " + Boolean.toString(ffield.isNoCollapse()));
        }
        if (ffield.getPanelMode() != null) {
            writer.write(", 'panelMode' : '" + ffield.getPanelMode() + "'");
        }
        if (ffield.isReadOnly()) {
            writer.write(", 'readOnly' : true");
        }
        if (ffield.isDisabled()) {
            writer.write(", 'inputDisabled' : true");
        }
        if (ffield.getTheme() != null) {
            writer.write(", 'theme' : '" + ffield.getTheme() + "'");
        }
        
        if (ffield.getTitle() != null) {
            writer.write(",'fieldTitle' : '" + ffield.getTitle() + "'");
        } else {
            if (ffield.getChildCount() > 0) {
                for (UIComponent c : ffield.getChildren()) {
                    if (c instanceof FieldLabel) {
                        FieldLabel fl = (FieldLabel)c;
                        writer.write(",'fieldTitle' : $($.parseHTML('" );
                        writeFieldTitleMarkup(context, ffield);
                        writer.write("'))");
                        writer.write(",'fieldTitleType' : '" + fl.getType() + "'");
                    }
                }
            }
        }
        if (ffield.getType().equals("buttonGroup")) {
            writer.write(",'buttons' : [");
            boolean firstButton = true;
            for (UIComponent c : ffield.getChildren()) {
                if (firstButton) {
                    firstButton = false;
                } else {
                    writer.write(",");
                }
                if (c instanceof IconButton) {
                    IconButton ic = (IconButton)c;
                    writer.write("{");
                    writer.write("'iconClass' : '" + ic.getImage() + "'");
                    if (ic.getHref() != null) {
                        writer.write(",'href' : '" + ic.getHref() + "'");
                    }
                    if (ic.getOnclick() != null) {
                        writer.write(",'onclick' : function(tgt,ev) {" + ic.getOnclick() + "}");
                    }
                    if (ic.getValue() != null) {
                        writer.write(",'fieldTitle' : '" + ic.getValue() + "'");
                    }
                    writer.write(",'theme' : '" + ic.getTheme() + "'");
                    writer.write("}");
                }
            }
            writer.write("]");
        } else if (ffield.getType().equals("controlset") ||
                ffield.getType().equals("radio")) {
            writer.write(",'controls' : [");
            boolean firstButton = true;
            for (UIComponent c : ffield.getChildren()) {
                if (firstButton) {
                    firstButton = false;
                } else {
                    writer.write(",");
                }
                if (c instanceof FormField) {
                    c.encodeAll(context);
                }
            }
            writer.write("]");
        } else if (ffield.getType().equals("pickList")) {
            writer.write(",'options' : [");
            boolean firstOption = true;
            for (UIComponent c : ffield.getChildren()) {
                if (firstOption) {
                    firstOption = false;
                } else {
                    writer.write(",");
                }
                if (c instanceof PickItem) {
                    c.encodeAll(context);
                }
            }
            writer.write("]");
        } else if (ffield.getType().equals("checkbox")) {
            if (ffield.getTrueText() != null) {
                writer.write(",'truetext': '" + ffield.getTrueText() + "'");
            }
            if (ffield.getFalseText() != null) {
                writer.write(",'falsetext': '" + ffield.getFalseText() + "'");
            }
        } else if (ffield.getType().equals("text")) {
            if (ffield.getDataType() != null) {
                writer.write(",'dataType': '" + ffield.getDataType() + "'");
            }
        } else if (ffield.getType().equals("subPanel") ||
                ffield.getType().equals(("horizontalBlock"))) {
            writer.write(", 'items': [");
            int idx = 0;
            for (UIComponent c : ffield.getChildren()) {
                c.encodeAll(context);
                if (++idx < ffield.getChildren().size()) {
                    writer.write(",");
                }
            }
            writer.write("]");
        }
        
        if (ffield.getValidator() != null) {
            writer.write(",'validator': '" + ffield.getValidator() + "'");
        } else if (ffield.getValidatorFn() != null) {
            writer.write(",'validatorFn': " + ffield.getValidatorFn());
        }
        
        if (ffield.getOnblur() != null) {
            writer.write(",'onblur' : function() {" + ffield.getOnblur() + "; }");
        }
        if (ffield.getOnspace() != null) {
            writer.write(",'onspace' : function() {" + ffield.getOnspace() + "; }");
        }
        if (ffield.getOnenter() != null) {
            writer.write(",'onenter' : function() {" + ffield.getOnenter() + "; }");
        }
        
        writer.write("}");
    }
    
    private void writeFieldTitleMarkup(FacesContext context, FormField ffield) throws IOException {
        /* Write the markup to a string. */
        ResponseWriter origWriter = context.getResponseWriter();
        StringWriter sw = new StringWriter();
        ResponseWriter newWriter = origWriter.cloneWithWriter(sw);
        context.setResponseWriter(newWriter);
        
        UIComponent c = ffield.getChildren().get(0);
        c.encodeAll(context);

        /* Restore the original writer. */
        context.setResponseWriter(origWriter);
        
        StringBuffer labelMarkup = sw.getBuffer();
        String markupString = labelMarkup.toString();
        /* Escape single quotes. */
        markupString = markupString.replace("'", "\\'");
        markupString = markupString.trim();
        
        ResponseWriter writer = context.getResponseWriter();
        writer.writeText(markupString, null);
    }
    
    @Override
    public void encodeChildren(FacesContext context, UIComponent component) throws IOException {
        //Rendering happens on encodeEnd
    }
    
    @Override
    public boolean getRendersChildren() {
        return true;
    }
}
