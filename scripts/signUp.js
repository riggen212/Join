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
        acceptPolicy: document.getElementById("acceptPolicy").checked
    };
}


/**
 * Validates the registration data.
 * @param {Object} user - Registration data.
 * @returns {boolean} Whether the data is valid.
 */
function validateSignUpData(user) {
    if (!user.name || !user.email || !user.password) {
        alert("Please fill in all fields.");
        return false;
    }

    if (!user.email.includes("@")) {
        alert("Please enter a valid email address.");
        return false;
    }

    if (user.password !== user.confirmPassword) {
        alert("Passwords do not match.");
        return false;
    }

    if (!user.acceptPolicy) {
        alert("Please accept the Privacy Policy.");
        return false;
    }

    return true;
}


/**
 * Checks whether an email is already registered.
 * @param {string} email - Email to check.
 * @returns {Promise<boolean>} True if email exists.
 */
async function emailAlreadyExists(email) {
    const users = await getData(DB_USERS);

    if (!users) return false;

    return Object.values(users).some(user =>
        user.email?.toLowerCase() === email
    );
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
        .map(part => part.charAt(0).toUpperCase())
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
        colorClass: "badge-user-blue-light"
    };
}


/**
 * Saves a new user with the next available Firebase user ID.
 *
 * @param {Object} user - The new user data.
 * @returns {Promise<string>} The newly created user ID.
 */
async function saveSignUpUser(user) {
    const users = await getData(DB_USERS) || {};

    const userNumbers = Object.keys(users)
        .map(key => {
            const match = key.match(/^FIREBASE_UID_USER_(\d+)$/);
            return match ? Number(match[1]) : 0;
        });

    const nextNumber = Math.max(0, ...userNumbers) + 1;

    const userId = `FIREBASE_UID_USER_${nextNumber}`;

    if (users[userId]) {
        throw new Error("User ID already exists.");
    }

    await putData(DB_USERS + userId, user);

    return userId;
}


/**
 * Handles the complete sign-up process.
 */
async function handleSignUp() {
    const data = getSignUpData();

    if (!validateSignUpData(data)) return;

    const signUpButton = document.getElementById("signUpButton");
    signUpButton.disabled = true;

    try {
        const exists = await emailAlreadyExists(data.email);

        if (exists) {
            alert("This email address is already registered.");
            return;
        }

        const newUser = createUserObject(data);

        const userKey = await saveSignUpUser(newUser);

        console.log("New user created:", userKey);

        alert("Registration successful!");

        window.location.href = "../index.html#login";

    } catch (error) {
        console.error("Sign-up failed:", error);
        alert("Registration failed. Please try again.");
    } finally {
        signUpButton.disabled = false;
    }
}


/**
 * Initializes the sign-up button.
 */
document.getElementById("signUpButton").addEventListener("click", handleSignUp);

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
    eyeIcon.src = isHidden
        ? "../assets/icons/eyeOpen.svg"
        : "../assets/icons/eyeClose.svg";

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

    button.setAttribute("aria-label",
        !hasPassword ? "Password empty" : isVisible ? "Hide password" : "Show password");

    icon.src = !hasPassword
        ? "../assets/icons/showPassword.svg"
        : isVisible ? "../assets/icons/eyeOpen.svg" : "../assets/icons/eyeClose.svg";
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