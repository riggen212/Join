let isSignUpSaving = false;

/**
 * Prevents native submission and starts sign-up for valid form data.
 *
 * @param {SubmitEvent} event - The sign-up form's submit event.
 * @returns {Promise<void>} Resolves after the attempt or an early validation return.
 */
async function signUp(event) {
    event.preventDefault();

    const data = getSignUpData();
    if (!validateSignUpData(data)) return;

    await handleSignUp(data);
}

/**
 * Runs sign-up with the button disabled and redirects after success.
 * Displays request errors and restores the button in finally.
 *
 * @param {Object} data - Validated registration data.
 * @returns {Promise<void>} Resolves after the attempt and cleanup.
 */
async function handleSignUp(data) {
    if (isSignUpSaving) return;

    setSignUpSaving(true);

    try {
        await attemptSignUp(data);
    } finally {
        setSignUpSaving(false);
    }
}

/**
 * Updates the saving state and refreshes the sign-up button.
 *
 * @param {boolean} isSaving - Whether registration is being saved.
 * @returns {void}
 */
function setSignUpSaving(isSaving) {
    isSignUpSaving = isSaving;
    updateSignUpButton();
}

/**
 * Processes registration, redirects on success and displays errors.
 *
 * @param {Object} data - Validated registration data.
 * @returns {Promise<void>}
 */
async function attemptSignUp(data) {
    try {
        const successful = await processSignUp(data);
        if (successful) {
            window.location.href = "../index.html?signup=success#login";
        }
    } catch (error) {
        const form = document.getElementById("signUpForm");
        showFormError(form, "Registration failed. Please try again.");
    }
}

/**
 * Reads the input values from the sign-up form.
 * @returns {Object} User registration data.
 */
function getSignUpData() {
    return {
        name: document.getElementById("nameField").value.trim(),
        email: document.getElementById("emailField").value.trim().toLowerCase(),
        password: document.getElementById("passwordField").value,
        confirmPassword: document.getElementById("confirmPasswordField").value,
        acceptPolicy: document.getElementById("acceptPolicy").checked,
    };
}

/**
 * Validates registration data and refreshes the displayed form errors.
 * Displays all detected errors beside their corresponding fields.
 *
 * @param {Object} data - The registration data.
 * @returns {boolean} Whether the registration data is valid.
 */
function validateSignUpData(data) {
    const errors = getSignUpValidationErrors(data);
    const form = document.getElementById("signUpForm");

    clearFormError(form);
    showFormFieldErrors(form, errors);

    return Object.keys(errors).length === 0;
}

/**
 * Checks required fields, email format, passwords and policy acceptance.
 *
 * @param {Object} data - The registration data.
 * @returns {Object.<string, string>} Error messages indexed by input ID,
 * or an empty object if valid.
 */
function getSignUpValidationErrors(data) {
    const errors = {};

    if (!data.name) errors.nameField = "Please enter your name.";
    if (!data.email) errors.emailField = "Please enter your email.";
    else if (!isValidEmail(data.email)) errors.emailField = "Please enter a valid email address.";

    Object.assign(errors, getSignUpPasswordErrors(data));

    if (!data.acceptPolicy) errors.acceptPolicy = "Please accept the Privacy Policy.";

    return errors;
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

/**
 * Checks email availability and saves the new user and contact.
 * Displays a field error if the email is already registered.
 *
 * @param {Object} data - Validated registration data.
 * @returns {Promise<boolean>} True after saving, false if the email already exists.
 * @throws {Error} If a database request fails.
 */
async function processSignUp(data) {
    const exists = await doesEmailAlreadyExist(data.email);

    if (exists) {
        const form = document.getElementById("signUpForm");
        showFormFieldErrors(form, {
            emailField: "This email address is already registered.",
        });
        return false;
    }

    await signUpUser(createUserObject(data));
    return true;
}

/**
 * Checks whether an email is already registered.
 * @param {string} email - Email to check.
 * @returns {Promise<boolean>} True if email exists.
 */
async function doesEmailAlreadyExist(email) {
    const users = await getData(DB_USERS);

    if (!users) {
        return false;
    }

    return Object.values(users).some((user) => user.email?.toLowerCase() === email);
}

/**
 * Creates initials from the user's name.
 *
 * @param {string} name - Full name of the user.
 * @returns {string} User initials.
 */
function getUserInitials(name) {
    const names = name.trim().split(/\s+/);

    return names
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");
}

/**
 * Creates the user object for Firebase.
 * @param {Object} data - Validated registration data.
 * @returns {Object} New user.
 */
function createUserObject(data) {
    return {
        name: data.name,
        email: data.email,
        password: data.password,
        initials: getUserInitials(data.name),
        colorClass: "badge-user-blue-light",
    };
}

/**
 * Creates IDs and contact data, then saves the new user and contact.
 *
 * @param {Object} user - The new user data.
 * @returns {Promise<void>} Resolves after saving the user and contact.
 * @throws {Error} If the user ID exists or a database request fails.
 */
async function signUpUser(user) {
    const users = (await getData(DB_USERS)) || {};
    const userNumbers = getExistingUserIdNumbers(users);
    const userId = getNewUserId(userNumbers);

    if (users[userId]) {
        throw new Error("User ID already exists.");
    }

    const { contactId, contact } = await getContactData(user);
    await saveSignUpUser(userId, user, { contactId, contact });
}

/**
 * Extracts numeric suffixes from existing user IDs.
 *
 * @param {Object} users - Users indexed by their database IDs.
 * @returns {number[]} Numeric suffixes, with 0 for unmatched IDs.
 */
function getExistingUserIdNumbers(users) {
    const userNumbers = Object.keys(users).map((key) => {
        const match = key.match(/^FIREBASE_UID_USER_(\d+)$/);
        return match ? Number(match[1]) : 0;
    });

    return userNumbers;
}

/**
 * Creates a user ID using the highest existing number plus one.
 *
 * @param {number[]} userNumbers - The existing user ID numbers.
 * @returns {string} The next user ID.
 */
function getNewUserId(userNumbers) {
    const nextNumber = Math.max(0, ...userNumbers) + 1;
    return `FIREBASE_UID_USER_${nextNumber}`;
}

/**
 * Loads existing contacts and prepares contact data for the new user.
 *
 * @param {Object} user - User data containing a name and email.
 * @returns {Promise<{contactId: ContactId, contact: Contact}>} The contact ID and data.
 * @throws {Error} If loading the contacts fails.
 */
async function getContactData(user) {
    const existingContacts = (await getData(DB_CONTACTS)) || {};
    return createContactData(user, existingContacts);
}

/**
 * Saves the user and contact in a single database update.
 *
 * @param {string} userId - The new user's ID.
 * @param {Object} user - The user data to save.
 * @param {{contactId: ContactId, contact: Contact}} contactData - The contact ID and data.
 * @returns {Promise<void>} Resolves after saving both entries.
 * @throws {Error} If the database update fails.
 */
async function saveSignUpUser(userId, user, { contactId, contact }) {
    await patchData("", {
        [`${DB_USERS}${userId}`]: user,
        [`${DB_CONTACTS}${contactId}`]: contact,
    });
}

/**
 * Toggles password visibility and updates the eye icon.
 *
 * @param {string} fieldId - ID of the password input.
 * @param {string} iconId - ID of the eye icon.
 * @returns {void}
 */
function toggleSignUpPassword(fieldId, iconId) {
    const passwordInput = document.getElementById(fieldId);
    const eyeIcon = document.getElementById(iconId);
    const button = eyeIcon.closest("button");
    const isHidden = passwordInput.type === "password";

    passwordInput.type = isHidden ? "text" : "password";
    eyeIcon.src = isHidden ? "../assets/icons/eyeOpen.svg" : "../assets/icons/eyeClose.svg";

    button.setAttribute("aria-pressed", String(isHidden));
    button.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
}

/**
 * Updates the visibility button and icon based on the password field's content.
 *
 * @param {string} fieldId - ID of the password input.
 * @param {string} iconId - ID of the eye icon.
 * @returns {void}
 */
function updateSignUpPasswordIcon(fieldId, iconId) {
    const input = document.getElementById(fieldId);
    const icon = document.getElementById(iconId);
    const button = icon.closest("button");
    const canShowPassword = input.value.length > 0;

    button.disabled = !canShowPassword;

    if (!canShowPassword) resetSignUpPassword(input, button);
    updateSignUpEyeIcon(input, icon, button, canShowPassword);
}

/**
 * Resets the password input to its hidden state.
 *
 * @param {HTMLInputElement} input - Password input element.
 * @param {HTMLButtonElement} button - Password toggle button.
 * @returns {void}
 */
function resetSignUpPassword(input, button) {
    input.type = "password";
    button.setAttribute("aria-pressed", "false");
}

/**
 * Updates the password icon and accessibility label for the current field state.
 *
 * @param {HTMLInputElement} input - The password input element.
 * @param {HTMLImageElement} icon - The password visibility icon.
 * @param {HTMLButtonElement} button - The password visibility toggle button.
 * @param {boolean} hasPassword - Whether this password input contains text.
 * @returns {void}
 */
function updateSignUpEyeIcon(input, icon, button, hasPassword) {
    const isVisible = input.type === "text";

    button.setAttribute("aria-label", !hasPassword ? "Password empty" : isVisible ? "Hide password" : "Show password");

    icon.src = !hasPassword
        ? "../assets/icons/showPassword.svg"
        : isVisible
          ? "../assets/icons/eyeOpen.svg"
          : "../assets/icons/eyeClose.svg";
}

/**
 * Enables sign-up when all required fields are filled and policy is accepted.
 *
 * @returns {void}
 */
function updateSignUpButton() {
    const data = getSignUpData();
    const isComplete = data.name && data.email && data.password && data.confirmPassword && data.acceptPolicy;

    document.getElementById("signUpButton").disabled = !isComplete || isSignUpSaving;
}
