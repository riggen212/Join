/** @type {ContactDirectory} */
const contacts = {};
const CONTACT_COLOR_CLASSES = [
    "badge-user-orange",
    "badge-user-purple",
    "badge-user-pink",
    "badge-user-blue-medium",
    "badge-user-yellow",
    "badge-user-mint",
    "badge-user-blue-light",
    "badge-user-red",
    "badge-user-blue-dark",
];

/**
 * Loads and renders the guest user's contacts from Firebase.
 *
 * @returns {Promise<void>}
 */
async function initContacts() {
    try {
        const firebaseContacts = await getData(getContactPath());

        Object.assign(contacts, firebaseContacts ?? {});
        renderContactList(contacts);
    } catch (error) {
        console.error("Contacts could not be loaded:", error);
    };
}

/**
 * Sorts contacts by name and groups them by their first letter.
 *
 * @param {ContactDirectory} contactDirectory - The contacts to group.
 * @returns {Object<string, Array<[string, Contact]>>} The grouped contacts.
 */
function groupContactsByInitial(contactDirectory) {
    const contactEntries = Object.entries(contactDirectory);

    contactEntries.sort(([, first], [, second]) =>
        first.name.localeCompare(second.name)
    );

    return contactEntries.reduce((groups, contactEntry) => {
        const initial = contactEntry[1].name.charAt(0).toUpperCase();
        (groups[initial] ??= []).push(contactEntry);
        return groups;
    }, {});
}

/**
 * Creates the HTML for the contact cards of one group.
 *
 * @param {Array<[string, Contact]>} contactEntries - Contacts with their IDs.
 * @returns {string} The rendered contact cards.
 */
function getContactCardsHtml(contactEntries) {
    return contactEntries.map(([contactId, contact]) =>
        getContactCardTemplate(contactId, contact)).join("");
}

/**
 * Creates the HTML for all grouped contacts.
 *
 * @param {Object<string, Array<[string, Contact]>>} contactGroups
 * @returns {string} The rendered contact groups.
 */
function getContactGroupsHtml(contactGroups) {
    return Object.entries(contactGroups).map(([initial, entries]) =>
        getContactGroupTemplate(initial, getContactCardsHtml(entries))).join("");
}

/**
 * Renders all contacts inside the contact list.
 *
 * @param {ContactDirectory} contactDirectory - The contacts to render.
 * @returns {void}
 */
function renderContactList(contactDirectory) {
    const container = document.getElementById("contact-groups");
    const groups = groupContactsByInitial(contactDirectory);
    container.innerHTML = getContactGroupsHtml(groups);
}

/**
 * Renders the selected contact and stores its ID on the detail view.
 *
 * @param {string} contactId - The ID of the selected contact.
 * @returns {void}
 */
function renderContactDetails(contactId) {
    const contact = contacts[contactId];
    const contactDetails = document.getElementById("show-details");

    if (!contact) return;

    contactDetails.dataset.contactId = contactId;
    document.getElementById("contact-details-info").innerHTML = getContactDetailsTemplate(contact);
}

/**
 * Returns the currently selected contact together with its ID.
 *
 * @returns {{id: string, contact: Contact}|null} The selected contact entry.
 */
function getSelectedContactEntry() {
    const details = document.getElementById("show-details");
    const contactId = details.dataset.contactId;
    const contact = contacts[contactId];

    return contact ? { id: contactId, contact } : null;
}

/**
 * Creates initials from the first two parts of a name.
 *
 * @param {string} name - The complete contact name.
 * @returns {string} The generated initials.
 */
function getContactInitials(name) {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((namePart) => namePart.charAt(0))
        .join("")
        .toUpperCase();
}

/**
 * Reads and returns the values of a contact form.
 *
 * @param {HTMLFormElement} form - The submitted contact form.
 * @returns {Partial<Contact>} The entered contact information.
 */
function getContactFormValues(form) {
    const formData = new FormData(form);
    const name = String(formData.get("name")).trim();

    return {
        name,
        email: String(formData.get("email")).trim(),
        phone: String(formData.get("phone")).trim(),
        initials: getContactInitials(name),
    };
}

/**
 * Marks the corresponding contact card as selected after rerendering.
 *
 * @param {string} contactId - The ID of the selected contact.
 * @returns {void}
 */
function markContactCardSelected(contactId) {
    const card = document.querySelector(`[data-contact-id="${contactId}"]`);
    card?.classList.add("is-selected");
}

/**
 * Saves the submitted changes of the selected contact.
 *
 * @param {SubmitEvent} event - The Edit Contact form submit event.
 * @returns {Promise<void>}
 */
async function saveContact(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const selectedContact = getSelectedContactEntry();
    if (!selectedContact) return;

    const contact = {
        ...selectedContact.contact,
        ...getContactFormValues(form),
    };

    try {
        await saveEditedContact(selectedContact.id, contact);
        form.closest("dialog").requestClose();
    } catch (error) {
        console.error("Contact could not be updated:", error);
    };
}

/**
 * Creates the next available contact ID.
 *
 * @returns {string} A unique contact ID.
 */
function getNextContactId() {
    const contactNumbers = Object.keys(contacts)
        .map((contactId) => Number(contactId.replace("contact", "")))
        .filter(Number.isFinite);

    return `contact${Math.max(0, ...contactNumbers) + 1}`;
}

/**
 * Selects the next badge color for a new contact.
 *
 * @returns {string} A badge color CSS class.
 */
function getNextContactColorClass() {
    const colorIndex =
        Object.keys(contacts).length % CONTACT_COLOR_CLASSES.length;

    return CONTACT_COLOR_CLASSES[colorIndex];
}

/**
 * Creates and saves a contact from the submitted form.
 *
 * @param {SubmitEvent} event - The Add Contact form submit event.
 * @returns {Promise<void>}
 */
async function createContact(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const contactId = getNextContactId();
    const contact = getContactFormValues(form);

    contact.colorClass = getNextContactColorClass();

    try {
        await saveNewContact(contactId, contact);
        form.closest("dialog").requestClose();
    } catch (error) {
        console.error("Contact could not be created:", error);
    };
}

/**
 * Selects a contact card and opens its detail view.
 *
 * @param {string} contactId - The ID of the contact to display.
 * @returns {void}
 */
function showContactById(contactId) {
    const contactCard = document.querySelector(
        `[data-contact-id="${contactId}"]`
    );

    if (contactCard) showContactDetails(contactCard);
}

/**
 * Returns the Firebase path for the guest user's contacts.
 *
 * @param {string} contactId - An optional contact ID.
 * @returns {string} The contacts collection or contact path.
 */
function getContactPath(contactId = "") {
    const path = `${DB_USERS}${DB_GUEST_USER_ID}/contacts`;
    return contactId ? `${path}/${contactId}` : path;
}

/**
 * Saves a new contact in Firebase and updates the local view.
 *
 * @param {string} contactId - The new contact's ID.
 * @param {Contact} contact - The contact to save.
 * @returns {Promise<void>}
 */
async function saveNewContact(contactId, contact) {
    await putData(getContactPath(contactId), contact);
    contacts[contactId] = contact;
    renderContactList(contacts);
    showContactById(contactId);
}

/**
 * Saves an edited contact in Firebase and refreshes its views.
 *
 * @param {string} contactId - The edited contact's ID.
 * @param {Contact} contact - The updated contact data.
 * @returns {Promise<void>}
 */
async function saveEditedContact(contactId, contact) {
    await putData(getContactPath(contactId), contact);
    contacts[contactId] = contact;
    renderContactList(contacts);
    renderContactDetails(contactId);
    markContactCardSelected(contactId);
}

/**
 * Deletes a contact from Firebase and updates the local view.
 *
 * @param {string} contactId - The ID of the contact to delete.
 * @returns {Promise<void>}
 */
async function removeContact(contactId) {
    await deleteData(getContactPath(contactId));
    delete contacts[contactId];
    renderContactList(contacts);
    hideContactDetails();
    closeDialogAfterContactDeletion();
}

initContacts();