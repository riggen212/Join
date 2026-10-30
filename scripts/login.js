/**
 * Whether a login request is currently pending.
 * @type {boolean}
 */
let isLoginPending = false;

/**
 * Prevents native submission and checks the entered login credentials.
 * Shows an accessible error message if loading user data fails.
 * Clears previous login errors before starting a new attempt.
 * Blocks repeated submissions while a request is pending.
 * Restores the controls and, if necessary, submitter focus in finally.
 * 
 * @param {SubmitEvent} event - The login form's submit event.
 * @returns {Promise<void>} Resolves after the login attempt or error handling.
 */
async function login(event) {
    event.preventDefault();
    if (isLoginPending) return;
    clearLoginError();
    setLoginBusy(true);
    try {
        await loadAndCheckLoginCredentials();
    } catch (error) {
        console.error("Login failed:", error);
        showLoginConnectionError();
    } finally {
        finishLoginAttempt(event.submitter);
    }
}

function checkLoginData(users, email, password) {

    let loginSuccessful = false;

    for (let key in users) {
        if (
            users[key].email === email &&
            users[key].password === password
        ) {
            loginSuccessful = true;
            window.location.href = `./pages/summaryPage.html?user=${key}&animation=true`;
        }
    }
        if (!loginSuccessful) showLoginError();   
}

function showLoginError() {
    document.getElementById('loginTextError').innerText =
            'Check your email and password. Please try again.';

    document.getElementById("emailField").setAttribute("aria-invalid", "true");
    document.getElementById("passwortField").setAttribute("aria-invalid", "true");
    document.getElementById('loginEmailRed').classList.add('login-fail');
    document.getElementById('loginPasswordRed').classList.add('login-fail');
    document.getElementById('loginTextError').classList.add('login-text-fail');
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

function guestLogin() {

    window.location.href = "./pages/summaryPage.html?user=0&animation=true";
}

/**
 * Toggles the visibility of the login password.
 *
 * @returns {void}
 */
function toggleLoginPasswordVisibility() {
    const passwordInput = document.getElementById("passwortField");
    const toggleButton = document.getElementById("toggle-login-password");
    const passwordIsHidden = passwordInput.type === "password";

    passwordInput.type = passwordIsHidden ? "text" : "password";
    toggleButton.setAttribute("aria-pressed", String(passwordIsHidden));
    toggleButton.setAttribute("aria-label", passwordIsHidden ? "Hide password" : "Show password");
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
    form.querySelectorAll("button").forEach(button => {
        button.disabled = busy;
    });
    document.getElementById("login-status").textContent = busy ? "Logging in…" : "";
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