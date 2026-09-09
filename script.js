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

function openDialogTask() {
    const dialogRef = document.getElementById("dialog-task");

    dialogRef.innerHTML = getTaskOverlayTemplate();
    document.body.classList.add("overflow-hidden")
    
    dialogRef.showModal();
}

function closeDialogTask() {
    const dialogRef = document.getElementById("dialog-task");

    document.body.classList.remove("overflow-hidden")
    
    dialogRef.close();
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