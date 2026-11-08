/**
 * Validates registration data and refreshes the displayed form errors.
 * Displays all detected errors beside their corresponding fields.
 * Moves focus to the first invalid form field.
 *
 * @param {Object} data - The registration data.
 * @returns {boolean} Whether the registration data is valid.
 */
function validateSignUpData(data) {
    const errors = getSignUpValidationErrors(data);
    const form = document.getElementById("signUpForm");

    clearFormError(form);
    showFormFieldErrors(form, errors);
    if (Object.keys(errors).length) focusFirstInvalidSignUpField(errors);

    return Object.keys(errors).length === 0;
}

/**
 * Moves focus to the first field with a validation error.
 *
 * @param {Object.<string, string>} errors - Validation errors by field ID.
 * @returns {void}
 */
function focusFirstInvalidSignUpField(errors) {
    const firstInvalidField = Object.keys(errors)[0];

    document.getElementById(firstInvalidField)?.focus();
}

/**
 * Validates a field after leaving it or while correcting its value.
 *
 * @param {HTMLInputElement} input - Changed or blurred field.
 * @param {boolean} [markTouched=false] - Whether to enable live validation.
 * @returns {void}
 */
function handleSignUpFieldValidation(input, markTouched = false) {
    if (markTouched) input.dataset.touched = "true";

    if (input.id === "passwordField" || input.id === "confirmPasswordField") {
        revalidateSignUpPasswords(input.form);
    } else if (input.dataset.touched === "true" || input.hasAttribute("aria-invalid")) {
        validateSignUpField(input);
    }
}

/**
 * Validates one field and updates its displayed error.
 *
 * @param {HTMLInputElement} input - Field to validate.
 * @returns {void}
 */
function validateSignUpField(input) {
    const message = getSignUpFieldError(input.id, getSignUpData());

    clearFormFieldError(input.form, input.id);
    if (message) {
        showFormFieldErrors(input.form, { [input.id]: message });
    }
}

/**
 * Refreshes validation for password fields already interacted with.
 *
 * @param {HTMLFormElement} form - Sign-up form.
 * @returns {void}
 */
function revalidateSignUpPasswords(form) {
    for (const fieldId of ["passwordField", "confirmPasswordField"]) {
        const input = form.querySelector(`#${fieldId}`);
        if (input.dataset.touched === "true" || input.hasAttribute("aria-invalid")) {
            validateSignUpField(input);
        }
    }
}

/**
 * Collects validation errors for all sign-up fields.
 *
 * @param {Object} data - Registration data to validate.
 * @returns {Object.<string, string>} Errors indexed by field ID.
 */
function getSignUpValidationErrors(data) {
    const fieldIds = ["nameField", "emailField", "passwordField", "confirmPasswordField", "acceptPolicy"];
    const errors = {};

    for (const fieldId of fieldIds) {
        const message = getSignUpFieldError(fieldId, data);
        if (message) errors[fieldId] = message;
    }
    return errors;
}

/**
 * Returns the validation error for one sign-up field.
 *
 * @param {string} fieldId - ID of the field to validate.
 * @param {Object} data - Current registration data.
 * @returns {string} Error message or an empty string.
 */
function getSignUpFieldError(fieldId, data) {
    const passwordErrors = getSignUpPasswordErrors(data);

    const errors = {
        nameField: data.name ? "" : "Please enter your name.",
        emailField: getSignUpEmailError(data.email),
        passwordField: passwordErrors.passwordField ?? "",
        confirmPasswordField: passwordErrors.confirmPasswordField ?? "",
        acceptPolicy: data.acceptPolicy ? "" : "Please accept the Privacy Policy.",
    };

    return errors[fieldId] ?? "";
}

/**
 * Returns the validation error for an email address.
 *
 * @param {string} email - Email address to validate.
 * @returns {string} Error message or an empty string.
 */
function getSignUpEmailError(email) {
    if (!email) return "Please enter your email.";
    if (!isValidEmail(email)) return "Please enter a valid email address.";
    return "";
}

/**
 * Checks password presence, confirmation and equality in that order.
 * Marks only the first password when empty, only an empty confirmation
 * when the first password is filled, or both fields when their values differ.
 *
 * @param {{password: string, confirmPassword: string}} data - The entered passwords.
 * @returns {Object.<string, string>} Error messages indexed by password input ID,
 * or an empty object if valid.
 */
function getSignUpPasswordErrors(data) {
    if (!data.password) return { passwordField: "Please enter a password." };
    if (!data.confirmPassword) return { confirmPasswordField: "Please confirm your password." };
    if (data.password !== data.confirmPassword)
        return {
            passwordField: "Passwords do not match.",
            confirmPasswordField: "Passwords do not match.",
        };
    return {};
}
