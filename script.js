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