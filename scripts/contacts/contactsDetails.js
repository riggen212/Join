/**
 * Renders the selected contact and stores its ID on the detail view.
 *
 * @param {ContactId} contactId - The ID of the selected contact.
 * @returns {void}
 */
function renderContactDetails(contactId) {
    const contact = contacts[contactId];
    const contactDetails = document.getElementById("show-details");

    if (!contact) return;

    contactDetails.dataset.contactId = contactId;
    document.getElementById("contact-details-info").innerHTML = getContactDetailsTemplate(contact, loggedInUserEmail);
}

/**
 * Returns the currently selected contact together with its ID.
 *
 * @returns {ContactEntry|null} The selected contact entry.
 */
function getSelectedContactEntry() {
    const details = document.getElementById("show-details");
    const contactId = details.dataset.contactId;
    const contact = contacts[contactId];

    return contact ? { id: contactId, contact } : null;
}

/**
 * Marks the corresponding contact card as selected after rerendering.
 *
 * @param {ContactId} contactId - The ID of the selected contact.
 * @returns {void}
 */
function markContactCardSelected(contactId) {
    const card = document.querySelector(`[data-contact-id="${contactId}"]`);
    card?.classList.add("is-selected");
}

/**
 * Finishes the closing animation of the contact form dialog.
 * Returns focus to the contact actions button after editing a contact.
 *
 * @param {AnimationEvent} event - The dialog animation event.
 * @returns {void}
 */
function closeContactDialog(event) {
    const dialog = event.currentTarget;
    const pointMenuButton = document.getElementById("pointMenu");

    closeAnimatedDialog(event, "contact-closing");

    if (dialog.classList.contains("contact-edit") && !dialog.open) {
        pointMenuButton.focus();
    }
}

/**
 * Selects a contact card and opens its detail view.
 * Closes the detail view when the currently selected card is activated again.
 * Renders the contact information and restarts the detail animation.
 * Moves focus to the back button on mobile and to Edit on desktop.
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
    focusContactDetailsControl(contactDetails);
    document.documentElement.classList.add("contact-details-open");
    document.body.classList.add("contact-details-open");
}

/**
 * Moves focus to the appropriate contact details control for the viewport.
 * Disables the contact list while the mobile detail view is open.
 *
 * @param {HTMLElement} contactDetails - The open contact details element.
 * @returns {void}
 */
function focusContactDetailsControl(contactDetails) {
    if (window.innerWidth < 1280) {
        const backToListView = contactDetails.querySelector("button.button-close");
        const contactList = document.getElementById("contact-groups");
        backToListView.focus();
        contactList.inert = true;
    } else {
        const editButton = document.getElementById("contact-actions").querySelector(".button-task-overlay");
        editButton.focus({ preventScroll: true });
        editButton.focus();
    }
}

/**
 * Hides the contact details and clears the current selection.
 * Hides contact actions and removes the detail view's page state.
 * Clears the stored contact ID and rendered contact information.
 *
 * @returns {void}
 */
function hideContactDetails() {
    const contactDetails = document.getElementById("show-details");
    const selectedContact = document.querySelector(".contact-card.is-selected");

    selectedContact?.classList.remove("is-selected");
    resetContactDetailsView(contactDetails);
    selectedContact?.focus();
}

/**
 * Resets the visible state of the contact details view.
 *
 * @param {HTMLElement} contactDetails - The contact details element to reset.
 * @returns {void}
 */
function resetContactDetailsView(contactDetails) {
    contactDetails.classList.remove("is-open");
    document.documentElement.classList.remove("contact-details-open");
    document.body.classList.remove("contact-details-open");
    hideContactActions();
    delete contactDetails.dataset.contactId;
    document.getElementById("contact-details-info").innerHTML = "";
    document.getElementById("contact-groups").inert = false;
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
 * Selects a contact card and opens its detail view.
 *
 * @param {ContactId} contactId - The ID of the contact to display.
 * @returns {void}
 */
function showContactById(contactId) {
    const contactCard = document.querySelector(`[data-contact-id="${contactId}"]`);

    if (contactCard) showContactDetails(contactCard);
}

/**
 * Focuses the first remaining contact card or the add contact button.
 *
 * @returns {void}
 */
function setNewFocusOnFirstContactcard() {
    const firstContactCard = document.getElementById("contact-groups").querySelector(".contact-card");

    if (firstContactCard) {
        firstContactCard.focus();
    } else {
        document.getElementById("addNewContactButton").focus();
    }
}

function handleContactCardKeydown(card, event) {
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        showContactDetails(card);
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
