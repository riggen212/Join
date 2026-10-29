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