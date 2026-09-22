const DB_BASE_URL = "https://join-4092e-default-rtdb.europe-west1.firebasedatabase.app/";
const DB_USERS = "users/";
const DB_GUEST_USER_ID = "0";

async function getData(path = "", id = "") {
        const response = await fetch(DB_BASE_URL + path + id + ".json");

        if (!response.ok) {
            throw new Error(`HTTP-Fehler: ${response.status}`);
        }

        return await response.json();
}

/**
 * Selects a contact, or hides its details when it is clicked again.
 * Restarts the slide-in animation when another contact is selected.
 *
 * @param {HTMLElement} card - The contact card that was clicked.
 */
function showContactDetails(card) {
    const contactDetails = document.getElementById("show-details");
    const selectedContact = document.querySelector(".contact-card.is-selected");

    if (selectedContact === card) return hideContactDetails();

    selectedContact?.classList.remove("is-selected");
    card.classList.add("is-selected");

    restartContactDetailsAnimation(contactDetails);
    contactDetails.classList.add("is-open");
    document.documentElement.classList.add("contact-details-open");
    document.body.classList.add("contact-details-open");
}

/**
 * Plays the contact details slide-in animation again if it already exists.
 * On the first click, the CSS class starts the animation instead.
 *
 * @param {HTMLElement} contactDetails - The contact details container.
 */
function restartContactDetailsAnimation(contactDetails) {
    const animation = contactDetails
        .querySelector(".contact-details-info")
        .getAnimations()
        .find((animation) => animation.animationName === "contact-details-slide-in");

    if (!animation) return;

    animation.currentTime = 0;
    animation.play();
}

function hideContactDetails() {
    const contactDetails = document.getElementById("show-details");

    contactDetails.classList.remove("is-open");
    document.documentElement.classList.remove("contact-details-open");
    document.body.classList.remove("contact-details-open");

    document.querySelector(".contact-card.is-selected")?.classList.remove("is-selected");
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

function closeContactDialog(event) {
    const dialog = event.currentTarget;

    if (event.target !== dialog || !dialog.classList.contains("contact-closing")) {
        return;
    }

    dialog.classList.remove("contact-closing");
    document.body.classList.remove("overflow-hidden");
    dialog.close();
}

function closeProfileDialog(event) {
    const dialog = event.currentTarget;

    if (event.target !== dialog || !dialog.classList.contains("dialog-profile-closing")) {
        return;
    }

    dialog.classList.remove("dialog-profile-closing");
    document.body.classList.remove("overflow-hidden");
    dialog.close();
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
