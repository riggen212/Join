/**
 * Whether a login request is currently pending.
 * @type {boolean}
 */
let isLoginPending = false;

/**
 * Prevents native submission and starts a regular or guest login attempt.
 * Clears previous errors and blocks repeated submissions while pending.
 *
 * @param {SubmitEvent} event - The login form's submit event.
 * @returns {Promise<void>} Resolves after the attempt and cleanup, or an early return.
 */
async function login(event) {
    event.preventDefault();
    if (isLoginPending) return;

    clearLoginError();
    setLoginBusy(true);
    await handleLoginAttempt(event);
}

/**
 * Clears the login error message, visual error markers and invalid states.
 *
 * @returns {void}
 */
function clearLoginError() {
    const errorText = document.getElementById("loginTextError");
    errorText.textContent = "";
    errorText.classList.remove("login-text-fail");
    document.getElementById("emailField").removeAttribute("aria-invalid");
    document.getElementById("passwortField").removeAttribute("aria-invalid");
    document.getElementById("loginEmailRed").classList.remove("login-fail");
    document.getElementById("loginPasswordRed").classList.remove("login-fail");
}

/**
 * Updates the login form's busy state, buttons and loading announcement.
 *
 * @param {boolean} busy - Whether a login request is pending.
 * @returns {void}
 */
function setLoginBusy(busy) {
    const form = document.getElementById("emailField").form;
    isLoginPending = busy;
    form.setAttribute("aria-busy", String(busy));
    form.querySelectorAll("button").forEach((button) => {
        button.disabled = busy;
    });
    document.getElementById("login-status").textContent = busy ? "Logging in…" : "";
}

/**
 * Loads the guest account before storing its ID and redirecting to the summary page.
 *
 * @returns {Promise<void>} Resolves after initiating the redirect.
 * @throws {Error} If loading fails or the guest account does not exist.
 */
async function guestLogin() {
    const guestUser = await getData(DB_USERS + DB_GUEST_USER_ID);

    if (!guestUser) throw new Error("Guest user does not exist.");

    putToSessionStorage("userId", DB_GUEST_USER_ID);
    window.location.href = "./pages/summaryPage.html?animation=true";
}

/**
 * Runs the login flow selected by the submitting button.
 * Displays an availability error if the selected login flow throws.
 * Restores controls and, if needed, submitter focus in finally.
 *
 * @param {SubmitEvent} event - The submit event identifying the selected login type.
 * @returns {Promise<void>} Resolves after the attempt and cleanup.
 */
async function handleLoginAttempt(event) {
    try {
        if (event.submitter?.value === "guest") await guestLogin();
        else if (event.submitter?.value === "regular") await loadAndCheckLoginCredentials();
    } catch (error) {
        console.error("Login failed:", error);
        showLoginConnectionError();
    } finally {
        finishLoginAttempt(event.submitter);
    }
}

/**
 * Reads the entered credentials, loads users and checks the login.
 *
 * @returns {Promise<void>} Resolves after checking the credentials.
 */
async function loadAndCheckLoginCredentials() {
    const email = document.getElementById("emailField").value;
    const password = document.getElementById("passwortField").value;
    const users = await getData(DB_USERS);
    checkLoginData(users, email, password);
}

/**
 * Stores the matching user ID in session storage and redirects to the summary page.
 * Displays a credentials error if no match is found.
 *
 * @param {UserDirectory} users - The users loaded from the database.
 * @param {string} email - The entered email address.
 * @param {string} password - The entered password.
 * @returns {void}
 */
function checkLoginData(users, email, password) {
    let loginSuccessful = false;

    for (let key in users) {
        if (users[key].email === email && users[key].password === password) {
            loginSuccessful = true;
            putToSessionStorage("userId", key);
            window.location.href = `./pages/summaryPage.html?animation=true`;
        }
    }

    if (!loginSuccessful) showLoginError();
}

/**
 * Displays a credentials error and marks both login fields as invalid.
 *
 * @returns {void}
 */
function showLoginError() {
    document.getElementById("loginTextError").innerText = "Check your email and password. Please try again.";

    document.getElementById("emailField").setAttribute("aria-invalid", "true");
    document.getElementById("passwortField").setAttribute("aria-invalid", "true");
    document.getElementById("loginEmailRed").classList.add("login-fail");
    document.getElementById("loginPasswordRed").classList.add("login-fail");
    document.getElementById("loginTextError").classList.add("login-text-fail");
}

/**
 * Announces that login is unavailable because user data could not be loaded.
 * Does not mark the entered credentials as invalid.
 *
 * @returns {void}
 */
function showLoginConnectionError() {
    const errorText = document.getElementById("loginTextError");
    errorText.classList.add("login-text-fail");
    errorText.textContent = "Login is currently unavailable. Please try again later.";
}

/**
 * Restores login controls and returns focus if disabling them removed it.
 *
 * @param {HTMLElement|null} submitter - The control that submitted the form.
 * @returns {void}
 */
function finishLoginAttempt(submitter) {
    setLoginBusy(false);
    if (document.activeElement === document.body) {
        submitter?.focus();
    }
}

/**
 * Toggles the visibility of the login password.
 *
 * @returns {void}
 */
function toggleLoginPasswordVisibility() {
    const passwordInput = document.getElementById("passwortField");
    const toggleButton = document.getElementById("toggle-login-password");
    const eyeIcon = document.getElementById("augeIcon");
    const passwordIsHidden = passwordInput.type === "password";

    passwordInput.type = passwordIsHidden ? "text" : "password";
    toggleButton.setAttribute("aria-pressed", String(passwordIsHidden));
    toggleButton.setAttribute("aria-label", passwordIsHidden ? "Hide password" : "Show password");

    eyeIcon.src = passwordIsHidden ? "./assets/icons/eyeOpen.svg" : "./assets/icons/showPassword.svg";
}

function updatePasswordIcon() {
    const email = document.getElementById("emailField").value.trim();
    const password = document.getElementById("passwortField").value;
    const eyeIcon = document.getElementById("augeIcon");

    if (email && password) {
        eyeIcon.src = "./assets/icons/eyeClose.svg";
    } else {
        eyeIcon.src = "./assets/icons/showPassword.svg";
    }
}
