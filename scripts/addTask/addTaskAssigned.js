/**
 * Maximum selected contact badges displayed before the overflow badge.
 * @type {number}
 */
const MAX_VISIBLE_BADGES = 4;

/**
 * Loads contacts and the current user's email concurrently, then renders assignment options.
 * Propagates errors from either request or rendering without handling them locally.
 *
 * @param {HTMLFormElement} form - The task form receiving the options.
 * @param {Task|null} [task] - Existing task whose assignees are checked, if supplied.
 * @returns {Promise<void>} Resolves after options and badges render; rejects if loading or rendering fails.
 */
async function loadAssignedContacts(form, task) {
    const [contacts, loggedUserEmail] = await Promise.all([getData(DB_CONTACTS), getLoggedInUserEmail()]);

    renderAssignedOptions(form, contacts ?? {}, task, loggedUserEmail);
}

/**
 * Renders the contacts in the "Assigned to" list.
 *
 * @param {HTMLFormElement} form - The task form.
 * @param {ContactDirectory} contacts - Contacts indexed by ID.
 * @param {Task|null|undefined} task - Existing task whose assignees are checked, if supplied.
 * @param {string|null} loggedUserEmail - Email of the logged-in user.
 * @returns {void}
 */
function renderAssignedOptions(form, contacts, task, loggedUserEmail) {
    const assignedTo = task && task.assignedTo ? task.assignedTo : {};
    const contactIds = getSortedContactIds(contacts);

    form.querySelector("#assigned-options").innerHTML = getAssignedOptionsHtml(
        contacts,
        contactIds,
        assignedTo,
        loggedUserEmail,
    );

    renderAssignedBadges(form);
}

/**
 * Returns the IDs of all contacts with a name, sorted by name.
 *
 * @param {ContactDirectory} contacts - Contacts indexed by ID.
 * @returns {ContactId[]} IDs of named contacts in alphabetical order.
 */
function getSortedContactIds(contacts) {
    const contactIds = Object.keys(contacts).filter((id) => contacts[id].name);
    return contactIds.sort((a, b) => contacts[a].name.localeCompare(contacts[b].name));
}

/**
 * Builds the assignment options HTML in the supplied contact order.
 *
 * @param {ContactDirectory} contacts - Contacts indexed by ID.
 * @param {ContactId[]} contactIds - Contact IDs in display order.
 * @param {Object.<ContactId, boolean>} assignedTo - Existing contact assignments.
 * @param {string|null} loggedUserEmail - Email of the logged-in user.
 * @returns {string} The combined HTML of all assignment options.
 */
function getAssignedOptionsHtml(contacts, contactIds, assignedTo, loggedUserEmail) {
    let assignedOptionsHtml = "";

    for (const contactId of contactIds) {
        assignedOptionsHtml += getAssignedContactOptionHtml(
            contactId,
            contacts[contactId],
            assignedTo,
            loggedUserEmail,
        );
    }

    return assignedOptionsHtml;
}

/**
 * Builds one assignment option using the contact's initials and selection state.
 * Generates initials from the contact's name if none are stored.
 *
 * @param {ContactId} contactId - The contact's ID.
 * @param {Contact} contact - The contact to display.
 * @param {Object.<ContactId, boolean>} assignedTo - Existing contact assignments.
 * @param {string|null} loggedUserEmail - Email of the logged-in user.
 * @returns {string} The HTML of the contact's assignment option.
 */
function getAssignedContactOptionHtml(contactId, contact, assignedTo, loggedUserEmail) {
    const initials = contact.initials || getInitialsFromName(contact.name);

    return getAssignedOptionTemplate(contactId, contact, initials, assignedTo[contactId] === true, loggedUserEmail);
}

/**
 * Shows at most MAX_VISIBLE_BADGES selected contact badges and an overflow badge for the rest.
 *
 * @param {HTMLFormElement} form - The task form.
 * @returns {void}
 */
function renderAssignedBadges(form) {
    const checkedBoxes = form.querySelectorAll('input[name="assignedTo"]:checked');
    let html = "";

    for (let i = 0; i < checkedBoxes.length && i < MAX_VISIBLE_BADGES; i++) {
        html += getBadgeHtmlFromCheckbox(checkedBoxes[i]);
    }

    if (checkedBoxes.length > MAX_VISIBLE_BADGES) {
        html += getMoreBadgeTemplate(checkedBoxes.length - MAX_VISIBLE_BADGES);
    }

    form.querySelector("#assigned-badges").innerHTML = html;
}

/**
 * Creates the badge HTML for the contact of a checked checkbox.
 *
 * @param {HTMLInputElement} checkbox - The checked checkbox.
 * @returns {string} The HTML of the badge.
 */
function getBadgeHtmlFromCheckbox(checkbox) {
    const option = checkbox.closest(".assigned-option");
    const badge = option.querySelector(".badge-user");
    const name = option.querySelectorAll("span")[1].textContent;

    return getAssignedBadgeTemplate(badge.className, badge.textContent, name);
}

/**
 * Filters contact options by their full displayed text, including the current-user suffix.
 *
 * @param {HTMLFormElement} form - The task form.
 * @returns {void}
 */
function filterAssignedOptions(form) {
    const searchText = form.querySelector("#task-assigned").value.trim().toLowerCase();
    const options = form.querySelectorAll("#assigned-options > li");

    for (let i = 0; i < options.length; i++) {
        const name = options[i].textContent.toLowerCase();
        options[i].hidden = !name.includes(searchText);
    }
}

/**
 * Opens or closes the "Assigned to" list when the field or arrow is clicked.
 * A click into the search field only closes the list if nothing is typed.
 * Uses is-collapsed to close the list while keeping focus on its search input.
 *
 * @param {MouseEvent} event - The mousedown event.
 * @returns {void}
 */
function toggleAssignedDropdown(event) {
    const searchInput = event.currentTarget.querySelector("#task-assigned");
    const field = searchInput.closest("fieldset");
    const wasOpen = field.matches(":focus-within") && !field.classList.contains("is-collapsed");

    if (event.target === searchInput && searchInput.value !== "" && wasOpen) return;

    event.preventDefault();
    searchInput.focus();
    field.classList.toggle("is-collapsed", wasOpen);
}

/**
 * Opens the contact list or toggles a contact with Enter.
 * Delegates Escape handling to closeAssignedOnEscape().
 *
 * @param {KeyboardEvent} event - The contact field's keydown event.
 * @returns {void}
 */
function handleAssignedKeydown(event) {
    if (event.key === "Escape") return closeAssignedOnEscape(event);
    if (event.key !== "Enter") return;

    const input = event.target;
    if (input.id !== "task-assigned" && !input.matches('input[name="assignedTo"]')) return;

    event.preventDefault();
    event.stopPropagation();
    if (input.id === "task-assigned") event.currentTarget.classList.remove("is-collapsed");
    else input.click();
}

/**
 * Closes the "Assigned to" list with Escape when the search field is empty.
 * Handles Escape from both the search input and the contact options.
 * Preserves the search text and selection, then restores search input focus.
 *
 * @param {KeyboardEvent} event - The keydown event.
 * @returns {void}
 */
function closeAssignedOnEscape(event) {
    if (event.key !== "Escape") return;

    const field = event.currentTarget;
    if (field.classList.contains("is-collapsed")) return;

    event.preventDefault();
    event.stopPropagation();
    field.querySelector("#task-assigned").focus();
    field.classList.add("is-collapsed");
}

/**
 * Returns the checked contacts, e.g. { contact1: true, contact3: true }.
 *
 * @param {HTMLFormElement} form - The task form.
 * @returns {Object.<ContactId, true>} Selected contact IDs mapped to true; empty if none are selected.
 */
function getAssignedContacts(form) {
    const checkedBoxes = form.querySelectorAll('input[name="assignedTo"]:checked');
    /** @type {Object.<ContactId, true>} */
    const assignedTo = {};

    for (let i = 0; i < checkedBoxes.length; i++) {
        assignedTo[checkedBoxes[i].value] = true;
    }

    return assignedTo;
}
