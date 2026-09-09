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

function requestCloseTaskDialog() {
    const dialogRef = document.getElementById("dialog-task");

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

function closeProfileDialog(event) {
    if (event.animationName !== "slide-out-to-right") {
        return;
    }

    const dialogRef = document.getElementById("dialog-profile");

    dialogRef.classList.remove("dialog-profile-closing");
    document.body.classList.remove("overflow-hidden");

    closeDialog("dialog-profile");
}

// function dialogTaskSlideOut(event) {
//     event.preventDefault();
//     event.currentTarget.classList.add("dialog-task-closing");
// }

// function dialogProfileSlideOut(event) {
//     event.preventDefault();
//     event.currentTarget.classList.add("dialog-profile-closing");
// }

function dialogSlideOut(event, closingClass) {
    event.preventDefault();
    event.currentTarget.classList.add(closingClass);
}


function addNewContact() {
    const dialog = document.getElementById("addNewContact");

    if (!dialog.open) {
        dialog.showModal();
    }
}

function editContact() {
    
}

function deleteContact() {
    
}

function toggleContactActions() {
    const actions = document.getElementById("contact-actions");
    const menuButton = document.querySelector(".contact-details > .contact-add");
    const isOpen = actions.classList.toggle("is-open");

    menuButton.setAttribute("aria-expanded", isOpen);
}

function hideContactActions() {
    const actions = document.getElementById("contact-actions");
    const menuButton = document.querySelector(".contact-details > .contact-add");

    actions.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
}