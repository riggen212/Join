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
    const signUpButton = document.getElementById("signUpButton");
    signUpButton.disabled = true;

    try {
        const signUpSuccessful = await processSignUp(data);
        if (signUpSuccessful) window.location.href = "../index.html?signup=success#login";
    } catch (error) {
        showNotification("Registration failed. Please try again.", "error");
    } finally {
        signUpButton.disabled = false;
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
 * Validates registration data and shows the first error as a notification.
 *
 * @param {Object} user - Registration data.
 * @returns {boolean} Whether the registration data is valid.
 */
function validateSignUpData(user) {
    const error = getSignUpValidationError(user);
    if (!error) return true;

    showNotification(error, "error");
    return false;
}

/**
 * Checks required fields, email format, matching passwords and policy acceptance.
 *
 * @param {Object} user - Registration data.
 * @returns {string} The first error message, or an empty string if valid.
 */
function getSignUpValidationError(user) {
    if (!user.name || !user.email || !user.password || !user.confirmPassword)
        return "Please fill in all fields.";
    if (!isValidEmail(user.email))
        return "Please enter a valid email address.";
    if (user.password !== user.confirmPassword)
        return "Passwords do not match.";
    if (!user.acceptPolicy)
        return "Please accept the Privacy Policy.";
    return "";
}

/**
 * Checks email availability and saves the new user and contact.
 * Shows a notification if the email is already registered.
 *
 * @param {Object} data - Validated registration data.
 * @returns {Promise<boolean>} True after saving, false if the email already exists.
 * @throws {Error} If a database request fails.
 */
async function processSignUp(data) {
    const exists = await doesEmailAlreadyExist(data.email);
    
    if (exists) {
        showNotification("This email address is already registered.", "error");
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
 * Updates the password button based on the required input fields.
 *
 * @param {string} fieldId - ID of the password input.
 * @param {string} iconId - ID of the eye icon.
 * @returns {void}
 */
function updateSignUpPasswordIcon(fieldId, iconId) {
    const input = document.getElementById(fieldId);
    const icon = document.getElementById(iconId);
    const button = icon.closest("button");
    const canShowPassword = checkSignUpFields(input);

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
 * Updates the eye icon and accessibility label.
 *
 * @param {HTMLInputElement} input - Password input element.
 * @param {HTMLImageElement} icon - Eye icon element.
 * @param {HTMLButtonElement} button - Password toggle button.
 * @param {boolean} hasPassword - Whether the required fields are filled.
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
 * Updates the visibility icons of both sign-up password fields.
 *
 * @returns {void}
 */
function updateSignUpPasswordIcons() {
    updateSignUpPasswordIcon("passwordField", "passwordEyeIcon");
    updateSignUpPasswordIcon("confirmPasswordField", "confirmPasswordEyeIcon");
}

/**
 * Checks whether the name, email and password fields contain values.
 *
 * @param {HTMLInputElement} input - Password input to check.
 * @returns {boolean} True if all required fields contain values.
 */
function checkSignUpFields(input) {
    const name = document.getElementById("nameField").value.trim();
    const email = document.getElementById("emailField").value.trim();

    return name !== "" && email !== "" && input.value.length > 0;
}
