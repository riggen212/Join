function showContactDetails() {
    const contactDetails = document.getElementById("show-details");

    contactDetails.classList.add("is-open");
    document.documentElement.classList.add("contact-details-open");
    document.body.classList.add("contact-details-open");
}

function hideContactDetails() {
    const contactDetails = document.getElementById("show-details");

    contactDetails.classList.remove("is-open");
    document.documentElement.classList.remove("contact-details-open");
    document.body.classList.remove("contact-details-open");

    hideContactActions();
}

function hideContactActions() {
    const actions = document.getElementById("contact-actions");
    const menuButton = document.querySelector(".contact-details > .contact-add");

    actions.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
}

function openDialog(dialogId) {
    const dialogRef = document.getElementById(dialogId);

    document.body.classList.add("overflow-hidden");

    dialogRef.showModal();
}

function closeDialog(dialogId) {
    const dialogRef = document.getElementById(dialogId);

    dialogRef.close();
}

function openTaskDialog() {
    const dialogRef = document.getElementById("dialog-task");

    dialogRef.innerHTML = getTaskOverlayTemplate();
    openDialog("dialog-task");
}

function requestCloseDialog(dialogId) {
    const dialogRef = document.getElementById(dialogId);

    dialogRef.requestClose();
}

function closeTaskDialog(event) {
    if (event.animationName !== "slide-out-from-center-to-right") {
        return;
    }

    const dialogRef = document.getElementById("dialog-task");

    dialogRef.classList.remove("dialog-task-closing");
    document.body.classList.remove("overflow-hidden");

    closeDialog("dialog-task");
}

function closeContactDialog(event) {
    if (
        event.animationName !== "slide-out-from-center-to-bottom" &&
        event.animationName !== "slide-out-from-center-to-right"
    ) {
        return;
    }

    const dialogRef = document.getElementById("contact");

    dialogRef.classList.remove("contact-closing");
    document.body.classList.remove("overflow-hidden");

    closeDialog("contact");
}

function closeProfileDialog(event, dialogId) {
    if (event.animationName !== "slide-out-to-right") {
        return;
    }

    const dialogRef = document.getElementById(dialogId);

    dialogRef.classList.remove("dialog-profile-closing");
    document.body.classList.remove("overflow-hidden");

    closeDialog(dialogId);
}

function dialogSlideOut(event, closingClass) {
    event.preventDefault();
    event.currentTarget.classList.add(closingClass);
}

function addNewContact() {
    const dialog = document.getElementById("contact");

    if (!dialog.open) {
        dialog.classList.remove("contact-edit");
        dialog.innerHTML = renderAddContactTemplate();
        openDialog("contact");
    }
}

const dummyContact = {
    name: "Anton Mayer",
    email: "anton@gmail.com",
    phone: "+49 1111 111 11 1",
    initials: "AM",
    colorClass: "badge-user-orange",
};

function editContact() {
    const dialog = document.getElementById("contact");

    if (!dialog.open) {
        dialog.classList.add("contact-edit");
        dialog.innerHTML = renderEditContactTemplate(dummyContact);
        openDialog("contact");
    }
}

function deleteContact() {}
