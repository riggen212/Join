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
    const dialog = document.getElementById(dialogId);

    document.body.classList.add("overflow-hidden");

    dialog.showModal();
}

function openTaskDialog() {
    const dialog = document.getElementById("dialog-task");

    dialog.innerHTML = getTaskOverlayTemplate();
    openDialog("dialog-task");
}

function closeTaskDialog(event) {
    const dialog = event.currentTarget;

    if (
        event.target !== dialog ||
        !dialog.classList.contains("dialog-task-closing") 
    ) {
        return;
    }

    dialog.classList.remove("dialog-task-closing");
    document.body.classList.remove("overflow-hidden");
    dialog.close()
}

function closeContactDialog(event) {
    const dialog = event.currentTarget;

    if (
        event.target !== dialog ||
        !dialog.classList.contains("contact-closing") 
    ) {
        return;
    }

    dialog.classList.remove("contact-closing");
    document.body.classList.remove("overflow-hidden");
    dialog.close()
}

function closeProfileDialog(event) {
    const dialog = event.currentTarget;

    if (
        event.target !== dialog ||
        !dialog.classList.contains("dialog-profile-closing") 
    ) {
        return;
    }

    dialog.classList.remove("dialog-profile-closing");
    document.body.classList.remove("overflow-hidden");
    dialog.close()
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
