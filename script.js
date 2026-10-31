const DB_BASE_URL = "https://join-4092e-default-rtdb.europe-west1.firebasedatabase.app/";
const DB_USERS = "users/";
const DB_TASKS = "tasks/";
const DB_CONTACTS = "contacts/";
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
    document.querySelector(`[aria-controls="${dialogId}"]`)?.setAttribute("aria-expanded", "true");
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
    document.querySelector(`[aria-controls="${dialog.id}"]`)?.setAttribute("aria-expanded", "false");
    dialog.querySelector("#notification")?.classList.remove("is-visible", "is-closing");
    showDialogNotification(dialog);
}

/**
 * Validates the user ID from the URL and updates navigation and profile.
 * Redirects invalid users to login unless the current page is public.
 *
 * @param {boolean} isMetaPage - Whether the page allows access without a valid user.
 * @returns {Promise<UserId|null>} The valid user ID, or null if validation fails.
 */
async function loadCurrentUser(isMetaPage) {
    const userId = getUserIdFromUrl();
    const user = await loadUserById(userId, isMetaPage);

    if (!user) {
        if (!isMetaPage) {
            window.location.href = `../index.html`;
        }
        return null;
    }

    updateNavbarAndProfile(userId, user);
    return userId;
}

/**
 * Adds the user ID to navigation links and updates the profile button.
 *
 * @param {UserId} userId - The validated user ID.
 * @param {User} user - The loaded user data.
 * @returns {void}
 */
function updateNavbarAndProfile(userId, user) {
    setUserIdsToNavLinks(userId);
    setInitialsToProfileButton(user);
}

/**
 * Reads the user ID from the URL without validating it.
 *
 * @returns {UserId|null} The user query parameter, or null if absent.
 */
function getUserIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("user");
}

/**
 * Loads a user by ID.
 *
 * @param {UserId|null} userId - The user ID to load.
 * @param {boolean} [isMetaPage=false] - Whether loading failures allow public access.
 * 
 * @returns {Promise<User|null>} The user, or null if unavailable.
 * @throws {Error} If loading fails on a non-public page.
 */
async function loadUserById(userId, isMetaPage = false) {
    if (!userId) return null;

    try {
        return await getData(DB_USERS, userId);
    } catch (error) {
        if (!isMetaPage) throw error;
        return null;
    }
}

/**
 * Returns the email address of the logged-in account.
 * Guest access deliberately has no email for UI markers.
 *
 * @returns {Promise<string|null>} Email address or null for guest access.
 */
async function getLoggedInUserEmail() {
    const userId = getUserIdFromUrl();

    if (userId === DB_GUEST_USER_ID) return null;

    return getData(DB_USERS + userId + "/email");
}

/**
 * Returns the UI suffix for the logged-in user's matching contact.
 *
 * @param {string} contactEmail Email address of the displayed contact.
 * @param {string|null} loggedUserEmail Email address of the logged-in user.
 * @returns {string} The "(you)" suffix or an empty string.
 */
function getCurrentUserSuffix(contactEmail, loggedUserEmail) {
    const isCurrentUser = contactEmail?.toLowerCase() === loggedUserEmail?.toLowerCase();

    return isCurrentUser ? " (you)" : "";
}

/**
 * Updates the nav links with the currently logged user.
 *
 * @param {UserId} userId - The ID of the currently logged user.
 */
function setUserIdsToNavLinks(userId) {
    document.querySelectorAll("[data-nav-link]").forEach((link) => {
        const url = new URL(link.href);

        url.searchParams.set("user", userId);
        link.href = url.href;
    });
}

/**
 * Updates the profile button using the loaded user's initials and type.
 *
 * @param {User} user - The loaded user data.
 * @returns {void}
 */
function setInitialsToProfileButton(user) {
    const button = document.querySelector(".header-profile-initials-button");
    const userInitials = user.initials;

    if (user.type === "guest") {
        button.classList.add(user.type);
    }

    button.textContent = userInitials;
    button.setAttribute("aria-label", "Open service links and log out");
}
