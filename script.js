const DB_BASE_URL = "https://join-4092e-default-rtdb.europe-west1.firebasedatabase.app/";
const DB_USERS = "users/";
const DB_PROFILE = "/profile";
const DB_TASKS = "/tasks";
const DB_SUBTASKS = "/subtasks";
const DB_GUEST_USER_ID = "0";
let loggedUserId = null;

/**
 * Loads data from Firebase at the requested database path.
 *
 * @param {string} [path=""] - The Firebase path to load.
 * @param {string} [id=""] - An optional additional path segment.
 * @returns {Promise<Object|null>} The data returned by Firebase.
 * @throws {Error} If the HTTP response is not successful.
 */
async function getData(path = "", id = "") {
    const response = await fetch(DB_BASE_URL + path + id + ".json");

    if (!response.ok) {
        throw new Error(`HTTP-Fehler: ${response.status}`);
    }

    return await response.json();
}

/**
 * Writes data to a fixed Firebase database path.
 *
 * @param {string} path - The database path without the `.json` suffix.
 * @param {Object|null} value - The data written to Firebase.
 * @returns {Promise<Object|null>} The saved Firebase data.
 * @throws {Error} If the HTTP response is not successful.
 */
async function putData(path, value) {
    const response = await fetch(DB_BASE_URL + path + ".json", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
    });

    if (!response.ok) {
        throw new Error(`HTTP-Fehler: ${response.status}`);
    }

    return await response.json();
}

/**
 * Updates specific data to a fixed Firebase database path.
 *
 * @param {string} path - The database path without the `.json` suffix.
 * @param {Object|null} value - The data overwritten to Firebase.
 * @returns {Promise<Object|null>} The saved Firebase data.
 * @throws {Error} If the HTTP response is not successful.
 */
async function patchData(path = "", value = {}) {
    const response = await fetch(DB_BASE_URL + path + ".json", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
    });

    if (!response.ok) {
        throw new Error(`HTTP-Fehler: ${response.status}`);
    }

    return await response.json();
}

/**
 * Deletes data from a Firebase database path.
 *
 * @param {string} path - The database path to delete.
 * @returns {Promise<null>} Resolves after the data has been deleted.
 */
function deleteData(path) {
    return putData(path, null);
}

/**
 * Selects a contact card and opens its detail view.
 *
 * @param {HTMLElement} card - The contact card that was clicked.
 * @returns {void}
 */
function showContactDetails(card) {
    const contactDetails = document.getElementById("show-details");
    const selectedContact = document.querySelector(".contact-card.is-selected");
    if (selectedContact === card) return hideContactDetails();
    selectedContact?.classList.remove("is-selected");
    card.classList.add("is-selected");
    renderContactDetails(card.dataset.contactId);
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
 * @returns {void}
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

/**
 * Hides the contact details and clears the current selection.
 *
 * @returns {void}
 */
function hideContactDetails() {
    const contactDetails = document.getElementById("show-details");

    contactDetails.classList.remove("is-open");
    document.documentElement.classList.remove("contact-details-open");
    document.body.classList.remove("contact-details-open");
    document.querySelector(".contact-card.is-selected")?.classList.remove("is-selected");

    hideContactActions();
    delete contactDetails.dataset.contactId;
    document.getElementById("contact-details-info").innerHTML = "";
}

/**
 * Hides the contact actions and resets the mobile menu button.
 *
 * @returns {void}
 */
function hideContactActions() {
    const actions = document.getElementById("contact-actions");
    const menuButton = document.querySelector(".contact-details > .contact-add");

    actions?.classList.remove("is-open");
    menuButton?.setAttribute("aria-expanded", "false");
}

/**
 * Opens a modal dialog and prevents background scrolling.
 *
 * @param {string} dialogId - The ID of the dialog to open.
 * @returns {void}
 */
function openDialog(dialogId) {
    const dialog = document.getElementById(dialogId);

    document.body.classList.add("overflow-hidden");

    dialog.showModal();
}

/**
 * Finishes the closing animation of the contact form dialog.
 *
 * @param {AnimationEvent} event - The dialog animation event.
 * @returns {void}
 */
function closeContactDialog(event) {
    closeAnimatedDialog(event, "contact-closing");
}

/**
 * Finishes the closing animation of a profile-style dialog.
 *
 * @param {AnimationEvent} event - The dialog animation event.
 * @returns {void}
 */
function closeProfileDialog(event) {
    closeAnimatedDialog(event, "dialog-profile-closing");
}

/**
 * Starts the closing animation of a dialog.
 *
 * @param {Event} event - The dialog cancel event.
 * @param {string} closingClass - The CSS class for the closing animation.
 * @returns {void}
 */
function dialogSlideOut(event, closingClass) {
    event.preventDefault();
    event.currentTarget.classList.add(closingClass);
}

/**
 * Opens the dialog for creating a new contact.
 *
 * @returns {void}
 */
function addNewContact() {
    const dialog = document.getElementById("contact");

    if (!dialog.open) {
        dialog.classList.remove("contact-edit");
        dialog.innerHTML = renderAddContactTemplate();
        openDialog("contact");
    }
}

/**
 * Opens the edit dialog with the currently selected contact's data.
 * Closes the mobile contact actions dialog before showing the edit form.
 *
 * @returns {void}
 */
function editContact() {
    const dialog = document.getElementById("contact");
    const actionsDialog = document.getElementById("dialog-edit-contact");
    const selectedContact = getSelectedContactEntry();

    if (!selectedContact || dialog.open) return;
    if (actionsDialog.open) actionsDialog.close();

    dialog.classList.add("contact-edit");
    dialog.innerHTML = renderEditContactTemplate(selectedContact.contact);
    openDialog("contact");
}

/**
 * Deletes the currently selected contact.
 *
 * @returns {Promise<void>}
 */
async function deleteContact() {
    const selectedContact = getSelectedContactEntry();
    if (!selectedContact) return;

    try {
        await removeContact(selectedContact.id);
    } catch (error) {
        console.error("Contact could not be deleted:", error);
    }
}

/**
 * Closes a dialog after its closing animation has finished.
 *
 * @param {AnimationEvent} event - The dialog animation event.
 * @param {string} closingClass - The class controlling the closing animation.
 * @returns {void}
 */
function closeAnimatedDialog(event, closingClass) {
    const dialog = event.currentTarget;

    if (event.target !== dialog || !dialog.classList.contains(closingClass)) {
        return;
    }

    dialog.classList.remove(closingClass);
    document.body.classList.remove("overflow-hidden");
    dialog.close();
}

/**
 * Closes the dialog from which a contact was deleted.
 * The mobile actions dialog closes immediately to release its backdrop.
 *
 * @returns {void}
 */
function closeDialogAfterContactDeletion() {
    const contactDialog = document.getElementById("contact");
    const actionsDialog = document.getElementById("dialog-edit-contact");

    if (actionsDialog.open) {
        actionsDialog.close();
        document.body.classList.remove("overflow-hidden");
    }

    if (contactDialog.open) contactDialog.requestClose();
}

/**
 * Closes the task dialog immediately and clears its state.
 *
 * @param {HTMLDialogElement} dialog - The task dialog to close.
 * @returns {void}
 */
function closeTaskDialogImmediately(dialog) {
    dialog.classList.remove("dialog-task-closing");
    dialog.dataset.taskId = "";
    dialog.dataset.taskStatus = "";
    document.body.classList.remove("overflow-hidden");
    dialog.close();
}

async function loadCurrentUser() {
    const userKey = getUserKey();
    const user = await getData(DB_USERS, userKey);

    setUserIdsToNavLinks(userKey);
    await setInitialsToProfileButton(userKey);

    return user;
}

function getUserKey() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('user');
}

function setUserIdsToNavLinks(userId) {
    document.querySelectorAll("[data-nav-link]").forEach(link => {
        const url = new URL(link.href);
        
        url.searchParams.set("user", userId);
        link.href = url.href;
    })
}

async function setInitialsToProfileButton(userId) {
    const button = document.querySelector(".header-profile-initials-button");
    const userProfile = await getData(DB_USERS + userId + DB_PROFILE);
    const userInitials = userProfile.initials;
    
    button.innerText = userInitials;
}
