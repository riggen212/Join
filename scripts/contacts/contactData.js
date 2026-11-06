/** @type {ContactColorClass[]} */
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
 * Creates a contact ID and contact object without saving them.
 *
 * @param {Object} data - The source data.
 * @param {string} data.name - The contact's name.
 * @param {string} data.email - The contact's email address.
 * @param {string} [data.phone] - The phone number; defaults to an empty string.
 * @param {ContactDirectory} existingContacts - The existing contacts.
 * @returns {{contactId: ContactId, contact: Contact}} The contact ID and data.
 */
function createContactData(data, existingContacts) {
    const contactId = getNextContactId(existingContacts);

    const contact = {
        name: data.name,
        email: data.email,
        phone: data.phone ?? "",
        initials: getInitialsFromName(data.name),
        colorClass: getNextContactColorClass(existingContacts),
    };

    return { contactId, contact };
}

/**
 * Creates a contact ID using the highest existing number plus one.
 *
 * @param {ContactDirectory} existingContacts - The existing contacts.
 * @returns {ContactId} The next contact ID based on the supplied contacts.
 */
function getNextContactId(existingContacts) {
    const contactNumbers = Object.keys(existingContacts)
        .map((contactId) => Number(contactId.replace("contact", "")))
        .filter(Number.isFinite);

    return `contact${Math.max(0, ...contactNumbers) + 1}`;
}

/**
 * Selects a badge color based on the number of existing contacts.
 *
 * @param {ContactDirectory} existingContacts - The existing contacts.
 * @returns {ContactColorClass} The selected badge color CSS class.
 */
function getNextContactColorClass(existingContacts) {
    const colorIndex = Object.keys(existingContacts).length % CONTACT_COLOR_CLASSES.length;

    return CONTACT_COLOR_CLASSES[colorIndex];
}
