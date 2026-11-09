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
 * Prepares contact data with initials and a badge color without saving it.
 *
 * @param {Object} data - The source data.
 * @param {string} data.name - The contact's name.
 * @param {string} data.email - The contact's email address.
 * @param {string} [data.phone] - The phone number; defaults to an empty string.
 * @param {ContactDirectory} existingContacts - Existing contacts used to select the badge color.
 * @returns {Contact} The prepared contact data.
 */
function createContactData(data, existingContacts) {
    const contact = {
        name: data.name,
        email: data.email,
        phone: data.phone ?? "",
        initials: getContactInitials(data.name),
        colorClass: getNextContactColorClass(existingContacts),
    };

    return contact;
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

/**
 * Creates uppercase initials from the first two parts of a name.
 *
 * @param {string} name - The contact's full name.
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
