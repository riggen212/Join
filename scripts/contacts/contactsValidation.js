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
 * @returns {ContactFormValues} The entered contact information.
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
 * Validates the entered contact form values.
 *
 * @param {ContactFormValues} contact - The values to validate.
 * @returns {ContactValidationErrors} The validation errors by field name.
 */
function getContactValidationErrors(contact) {
    const errors = {};
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email);
    const isValidPhone = /^[+\d\s()/-]+$/.test(contact.phone) && /\d/.test(contact.phone);

    if (!contact.name) errors.name = "Please enter a name.";
    if (!contact.email) errors.email = "Please enter an email address.";
    else if (!isValidEmail) errors.email = "Please enter a valid email address.";
    if (!contact.phone) errors.phone = "Please enter a phone number.";
    else if (!isValidPhone) errors.phone = "Please enter a valid phone number.";
    return errors;
}


/**
 * Displays or clears the validation feedback of a contact form.
 *
 * @param {HTMLFormElement} form - The contact form to update.
 * @param {ContactValidationErrors} errors - The validation errors by field name.
 * @returns {void}
 */
function renderContactValidationErrors(form, errors) {
    ["name", "email", "phone"].forEach((fieldName) => {
        const input = form.querySelector(`[name="${fieldName}"]`);
        renderContactValidationError(input, errors[fieldName] ?? "");
    });
}


/**
 * Displays or clears the validation feedback of one input.
 *
 * @param {HTMLInputElement} input - The input to update.
 * @param {string} message - The error message, if one exists.
 * @returns {void}
 */
function renderContactValidationError(input, message) {
    const wrapper = input.closest(".input-wrapper");
    const error = input.form.querySelector(`#contact-${input.name}-error`);

    wrapper.classList.toggle("has-error", !!message);
    input.setAttribute("aria-invalid", String(!!message));
    error.textContent = message;
}


/**
 * Validates one contact input while the user is typing.
 *
 * @param {HTMLInputElement} input - The changed contact input.
 * @returns {void}
 */
function validateContactField(input) {
    if (input.name === "phone") input.value = input.value.replace(/[^\d+\s()/-]/g, "");
    const values = getContactFormValues(input.form);
    const errors = getContactValidationErrors(values);

    renderContactValidationError(input, errors[input.name] ?? "");
}


/**
 * Validates a contact form and returns its values only when they are valid.
 *
 * @param {HTMLFormElement} form - The submitted contact form.
 * @returns {ContactFormValues|null} The valid form values, or null on errors.
 */
function getValidContactFormValues(form) {
    const values = getContactFormValues(form);
    const errors = getContactValidationErrors(values);

    renderContactValidationErrors(form, errors);
    return Object.keys(errors).length ? null : values;
}