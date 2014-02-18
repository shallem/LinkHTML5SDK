/*
 * Copyright 2013 Mobile Helix, Inc.
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

function collectAttachments() {
    var allAttachments = [];
    $(composeForm.getFieldElement('AttachmentsGrid')).find('[data-role="attach-contain"]').each(function() {
        var type = $(this).find('input[name="type"]').val();
        var name = $(this).find('input[name="name"]').val();
        if (type === "file") {
            /* File attachments. */
            var folder = $(this).find('input[name="fullpath"]').val();
            var fileid = $(this).find('input[name="fileid"]').val();
            allAttachments.push({
                'type' : type,
                'name' : name,
                'folder' : folder,
                'file' : fileid
            });
        } else {
            /* Image attachments. */
            var imgData = $(this).find('input[name="data"]').val();
            allAttachments.push({
                'type' : type,
                'name' : name,
                'data' : imgData
            });
        }
    });

    return allAttachments;
}

function collectEmailAddresses(id) {
    var emailAddrs = [];
    $(id).find('.ui-btn-text').each(function() {
        emailAddrs.push($(this).text());
    });
    return emailAddrs.join();
}

function sendSuccess(obj, saveDraft) {
    if (obj.status == 0) {
        if (!saveDraft) {
            Helix.Utils.statusMessage("Success", "Your e-mail has been sent.", "info");
        } else {
            Helix.Utils.statusMessage("Success", "Your e-mail has been saved.", "info");
        }

        leaveComposePage();
    } else {
        if (!saveDraft) {
            Helix.Utils.statusMessage("Error", "Your e-mail has not been sent! " + obj.msg, "severe");
        } else {
            Helix.Utils.statusMessage("Error", "Your e-mail has not been saved! " + obj.msg, "severe");
        }
    }
}

function executeSendMessage(saveDraft) {
    // Collect the body of the e-mail.
    var submitBody = composeForm.serialize();

    // Collect the attachments and append to the e-mail body.
    var allAttachments = collectAttachments();
    var aidx = 0;
    for (aidx = 0; aidx < allAttachments.length; ++aidx) {
        var curAttach = allAttachments[aidx];
        for (var prop in curAttach) {
            submitBody = submitBody + "&attach_" + prop + "_" + aidx + "=" + encodeURIComponent(curAttach[prop]);
        }
    }

    // If we are saving a draft, set draft=true
    if (saveDraft) {
        submitBody = submitBody + "&draft=true"
    } else {
        submitBody = submitBody + "&draft=false"
    }

    if (navigator.onLine) {
        // Show the loader.
        Helix.Ajax.showLoader("Sending.");
        
        // Send the e-mail.
        $.ajax({
            type: 'POST',
            url: '/clientws/email/send',
            data: submitBody,
            contentType: 'application/x-www-form-urlencoded',
            success: function(obj) {
                sendSuccess(obj, saveDraft);
                if (saveDraft) {
                    /* For some reason, the exchange server does not update the folder record
                     * and provide an updated count when we re-sync after send.
                     */
                    currentFolder.totalMessageCount--;
                    persistence.flush();
                }
            },
            dataType: 'json',
            error: function() {
                if (saveDraft) {
                    Helix.Utils.statusMessage("Send error." , "Failed to send e-mail.", "severe");
                } else {
                    Helix.Utils.statusMessage("Send error." , "Failed to save draft.", "severe");
                }
            },
            complete: function() {
                $('#SendEmailButton').show();
                Helix.Ajax.hideLoader();
            }
        });
    } else {
        // Queue a post for the next time the container is online.
        if (!window.CordovaInstalled) {
            alert("This device is offline and the browser does not support JavaScript extensions. Please try sending this email again when you are online.");
        } else {
            // Collect the data we will need to continue this offline draft.
            var refreshValues = {};
            if (saveDraft) {
                refreshValues['ComposeToInput'] = composeForm.getValue('ComposeTo');
                refreshValues['ComposeCCInput'] = composeForm.getValue('ComposeCC');
                refreshValues['ComposeBCCInput'] = composeForm.getValue('ComposeBCC');
                refreshValues['ComposeSubject'] = composeForm.getValue('ComposeSubject');
                refreshValues['ComposeBody'] = composeForm.getValue('ComposeBody');
                refreshValues['urgent'] = composeForm.getValue('urgent');
                refreshValues['Attachments'] = allAttachments; 
            }
            
            window.OfflinePost.savePost('/clientws/email/send', 'application/x-www-form-urlencoded', submitBody, JSON.stringify(refreshValues), 
            function() {
                if (saveDraft) {
                    Helix.Utils.statusMessage("Draft saved.", "This draft will be saved to your mailbox when you are online again.", "info");
                } else {
                    Helix.Utils.statusMessage("Send queued.", "This message will be sent when you are online again.", "info");
                }
                $('#SendEmailButton').show();
                leaveComposePage();
            }, 
            function(msg) {
                if (saveDraft) {
                    Helix.Utils.statusMessage("Save draft error.", msg, "severe");
                } else {
                    Helix.Utils.statusMessage("Send error.", msg, "severe");
                }
                $('#SendEmailButton').show();
            });
        }
    }
    
}

function sendMessage(saveDraft) {
    var warnMessages = [];
    $('#SendEmailButton').hide();

    // Collect the "to", "cc", and "bcc" email addresses
    var toAddrs = collectEmailAddresses(composeForm.getFieldElement('SendTo'));
    $(composeForm.getFieldElement('ComposeTo')).val(toAddrs);

    var ccAddrs = collectEmailAddresses(composeForm.getFieldElement('SendCC'));
    $(composeForm.getFieldElement('ComposeCC')).val(ccAddrs);

    var bccAddrs = collectEmailAddresses(composeForm.getFieldElement('SendBCC'));
    $(composeForm.getFieldElement('ComposeBCC')).val(bccAddrs);

    // Only validate non-drafts.
    if (!saveDraft) {
        // Validate every field in the form layout. Get back a list of fields that failed
        // validation and the associated messages.
        var validationErrors = composeForm.validate();
        if ("ComposeTo" in validationErrors &&
            "ComposeCC" in validationErrors &&
            "ComposeBCC" in validationErrors) {
            alert("Cannot send a message with no destination addresses. Specify at least one 'to', 'cc', or 'bcc'.")
            $('#SendEmailButton').show();
            return;
        }

        for (var failedFld in validationErrors) {
            if (failedFld === 'ComposeSubject') {
                warnMessages.push('an empty subject');
            } else if (failedFld === 'ComposeBody') {
                warnMessages.push('an empty body');
            }
        }
        var dialogMessage = "Are you sure you want to send this email? It has ";
        if (warnMessages.length > 0) {
            if (warnMessages.length == 1) {
                dialogMessage = dialogMessage + warnMessages[0] + ".";
            } else if (warnMessages.length == 2) {
                dialogMessage = dialogMessage + warnMessages[0] + " and " + warnMessages[1] + ".";
            }

            Helix.Layout.createConfirmDialog({
                    title: "Confirm Send",
                    message: dialogMessage,
                    styleClass: "normalValue",
                    onclick: function() {
                        return true;
                    },
                    onconfirm: function() {
                        executeSendMessage();
                    },
                    ondismiss: function() {
                        $('#SendEmailButton').show();
                    }
                });
        } else {
            executeSendMessage(saveDraft);
        }
    } else {
        executeSendMessage(saveDraft);
    }
}

function saveMessageDraft() {
    sendMessage(true);
}

function leaveComposePage() {
    $.mobile.changePage('#Mailbox', { reverse: true });
}

function cancelCompose(e) {
    var event = e || window.event;

    // Get the to/cc/bcc/subject/body. If any of them are non-empty, ask the user if he/she wants to
    // save a draft.
    var toAddrs = collectEmailAddresses(composeForm.getFieldElement('SendTo'));
    var ccAddrs = collectEmailAddresses(composeForm.getFieldElement('SendCC'));
    var bccAddrs = collectEmailAddresses(composeForm.getFieldElement('SendBCC'));
    var subj = composeForm.getValue('ComposeSubject');
    var body = composeForm.getValue('ComposeBody');
    if (toAddrs || ccAddrs || bccAddrs || subj || body) {
        // The user changed something meaningful
        saveDraft.show();
    } else {
        $.mobile.changePage('#Mailbox', { reverse: true });
    }

    event.stopPropagation();
    event.preventDefault();
}

function isNewMessage(obj) {
    if (!obj) {
        return true;
    }

    var composeType = obj.ComposeType;
    return (composeType == 4);
}

/**
 * Attach the photo attachment to the DOM.
 */
function addPhotoAttachment(serializedForm) {
    var obj = newAttachDlg.__obj;

    /* The form should just have 'name'=name */
    var keyVals = serializedForm.split("=");
    appendAttach(obj.thumb, obj.data, keyVals[1]);
}

/**
 * Create and open the photo attachment dialog box.
 */
function openAttachNameDialog(attachThumb, attachData) {
    var formLayout = {};
    var formElems = formLayout.items = [];
    formLayout.modes = "edit"; /* Not edit mode. */
    formLayout.currentMode = "edit";
    formLayout.separateElements = false /* Show separators */;
    formElems.push({
        "fieldTitle" : "Name:",
        "styleClass" : "titleValue",
        "value" : "",
        "name" : "name",
        "type" : "text",
        "style" : "width: 100%"
    });
    newAttachDlg.__obj = {
        'thumb' : attachThumb,
        'data' : attachData
    };
    newAttachDlg.show(formLayout);
}

/**
 * Appends an image to the attachment list.
 */
function appendAttach(imageObj, imageData, imageName) {
    var $attachTable = $(composeForm.getFieldElement('AttachmentsGrid'));
    var $attachParent = $('<div/>').attr({
        'data-role' : 'attach-contain',
        'style' : 'display: inline-block',
        'height' : 'auto'
    }).append(imageObj)
    .appendTo($attachTable)
    .on('tap', function() {
            $(this).remove();
    });

    // Add input elements for the attachment date and mime type (jpeg).
    $('<input/>').attr({
        'type' : 'hidden',
        'name' : 'data',
        'value' : imageData
    }).appendTo($attachParent);

    $('<input/>').attr({
        'type' : 'hidden',
        'name' : 'type',
        'value' : 'image/jpeg'
    }).appendTo($attachParent);

    $('<input/>').attr({
        'type': 'hidden',
        'name': 'name',
        'value': imageName
    }).appendTo($attachParent);
}

/**
 * Called when the picture is taken.
 */
function onPhotoDataSuccess(imageData) {
    // Uncomment to view the base64 encoded image data
    // console.log(imageData);

    // Display a dialog to get the name of the image.

    // Get image handle for a thumbnail.
    var smallImage = $('<img/>');
    smallImage.css('display', 'block');
    smallImage.css('width', '64px');
    smallImage.css('height', '64px');

    // Show the captured photo
    // The inline CSS rules are used to resize the image
    smallImage.attr('src', "data:image/jpeg;base64," + imageData);

    /* Show the dialog to get a name for this attachment. */
    openAttachNameDialog(smallImage, imageData);
}

/**
 * Called when we fail to get a photo.
 */
function onPhotoFail(message) {
    if (message == 'no image selected') {
        return;
    }
    Helix.Utils.statusMessage('Error', 'Failed to retrieve photo because: ' + message, 'fatal');
}

/**
 * Capture a picture directly from the device camera.
 */
function capturePhotoEdit() {
    // Take picture using device camera, allow edit, and retrieve image as base64-encoded string
    navigator.camera.getPicture(onPhotoDataSuccess, onPhotoFail,
    {
        destinationType : Camera.DestinationType.DATA_URL,
        quality: 50,
        allowEdit: true,
        EncodingType: Camera.EncodingType.JPEG
    });
}

/**
 * Capture a picture from the photo roll or its device-specific equivalent.
 */
function getPhoto() {
    // Retrieve image file location from specified source
    var source = navigator.camera.PictureSourceType.PHOTOLIBRARY;
    navigator.camera.getPicture(onPhotoDataSuccess, onPhotoFail, {
        destinationType : Camera.DestinationType.DATA_URL,
        quality: 50,
        sourceType: source,
        EncodingType: Camera.EncodingType.JPEG
    });
}

/**
 * Called to open the list of files a user can attach to an e-mail.
 */
function openFileAttachmentPanel(ev) {
    ev.preventDefault();
    if (!currentFileList) {
        currentFolderDigest = "ROOT";
        loadFileList({}, "ROOT");
    } else {
       $("#fileAttachmentPanel").panel("open");
    }
}

function refreshFileAttachmentOverlay() {
    if (!currentFileList) {
        Helix.Utils.statusMessage("Error", "Could not load file directories. This function may not be available offline.", "severe");
        return;
    }

    //var itemSchema = Helix.DB.getSchemaForObject(currentFileList);
    fileSelectList.refreshList(currentFileList,true, null, function(_list) {
        $("#fileAttachmentPanel").trigger("updatelayout");
        $("#fileAttachmentPanel").panel("open");
    });
}

function addAttachmentToComposeGrid(row) {
    var attachGrid = composeForm.getFieldElement('AttachmentsGrid');
    if ($(attachGrid).find('[data-role="attach-contain"]').length == 0) {
        $(attachGrid).empty();
    }

    var nameMarkup = $('<div/>').attr({
        'class' : 'attachName',
        'style' : 'width: 80px'
    }).append($('<span/>').append(row.itemName).addClass('wordBreak'));
    var imageMarkup = $('<div/>').attr({
        'class': 'attachIcon attachIconContainer'
    });
    var $attachParent = $('<div/>').attr({
        'style' : 'display: inline-block; padding-right: 5px;',
        'data-role' : 'attach-contain'
    }).append(imageMarkup)
      .append(nameMarkup)
      .appendTo($(attachGrid)).on('tap', function() {
        $(this).remove();
        if (attachGrid.find('.attachIcon').length == 0) {
            $(attachGrid).css('height', '0px');
            $(attachGrid).css('padding-top', '0px');
        }
    });
    $(attachGrid).css('height', 'auto');

    // Add input elements for the attachment date and mime type (jpeg).
    $('<input/>').attr({
        'type' : 'hidden',
        'name' : 'fullpath',
        'value' : row.fullPathDigest
    }).appendTo($attachParent);

    $('<input/>').attr({
        'type' : 'hidden',
        'name' : 'fileid',
        'value' : row.itemID
    }).appendTo($attachParent);

    $('<input/>').attr({
        'type': 'hidden',
        'name': 'name',
        'value': row.itemName
    }).appendTo($attachParent);

    $('<input/>').attr({
        'type': 'hidden',
        'name': 'type',
        'value': 'file'
    }).appendTo($attachParent);
}

function selectFileAttachment(row) {
    if (row.itemIsFolder) {
        // Navigate to the selected item.
        currentFolderDigest = row.itemID;
        loadFileList({
            params: [{
                name : 'key',
                value : row.itemID
            }]
        }, row.itemID);
    } else {
        addAttachmentToComposeGrid(row);
        $("#fileAttachmentPanel").panel("close");
    }
}

function renderFileItem(parentDiv, list, row) {
    var renderName = row.itemName;
    if (row.itemName === "aaaaParent") {
        renderName = "Parent";
    }

    var nameMarkup = $('<div/>').attr({
        'class' : 'attachName wordBreak',
        'style' : 'width: 80%'
    }).append($('<span/>').append(renderName));
    var imageMarkup;
    if (row.itemIsFolder) {
        imageMarkup = $('<div/>').attr({
            'class': 'folderIcon folderIconContainer'
        });
    } else {
        imageMarkup = $('<div/>').attr({
            'class': 'attachIcon attachIconContainer'
        })
    }

    list.createListRow(parentDiv, {
        'body' : $('<div/>').append(imageMarkup).append(nameMarkup)
    });
    return true;
}

/**
 * Called when the user clicks on a contact from the Compose:To overlay.
 */
function addTextEmailAddresses(input) {
    parseEmailsIntoButtons(input, composeForm.getFieldElement('SendTo'));
}

function addTextCCAddresses(input) {
    parseEmailsIntoButtons(input, composeForm.getFieldElement('SendCC'));
}

function addTextBCCAddresses(input) {
    parseEmailsIntoButtons(input, composeForm.getFieldElement('SendBCC'));
}