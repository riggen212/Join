/**
 * Whether a login request is currently pending.
 * @type {boolean}
 */
let isLoginPending = false;

/**
 * Initializes the login page by showing a sign-up success notification
 * when requested and removing the signup parameter from the URL.
 * Moves focus to the email field after returning from the sign-up page.
 *
 * @returns {void}
 */
function initLoginPage() {
  const url = new URL(window.location.href);

  if (url.searchParams.get("signup") === "success") {
    showNotification("You Signed Up successfully");
    url.searchParams.delete("signup");
    window.history.replaceState(null, "", url);
  }

  if (window.location.hash === "#login") {
    requestAnimationFrame(() => document.getElementById("emailField").focus());
  }
}

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

  const form = event.currentTarget;
  clearFormError(form);
  setLoginBusy(true);

  await handleLoginAttempt(event);
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
    showLoginConnectionError();
  } finally {
    finishLoginAttempt(event.submitter);
  }
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
 * Reads and validates credentials before loading users and checking the login.
 *
 * @returns {Promise<void>} Resolves after checking the login or a validation return.
 * @throws {Error} If loading users fails.
 */
async function loadAndCheckLoginCredentials() {
  const email = document.getElementById("emailField").value.trim();
  const password = document.getElementById("passwortField").value;

  if (!validateLoginData({ email, password })) return;

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

  if (!loginSuccessful) showLoginError("Check your email and password. Please try again.");
}

/**
 * Validates login input and displays any error below the fields.
 * Focuses the first empty field when validation fails.
 *
 * @param {{email: string, password: string}} data - The entered credentials.
 * @returns {boolean} Whether both required fields are filled.
 */
function validateLoginData(data) {
  const error = getLoginValidationError(data);
  if (!error) return true;

  showLoginError(error);
  focusFirstInvalidLoginField(data);
  return false;
}

/**
 * Checks whether email and password are filled.
 *
 * @param {{email: string, password: string}} data - The entered credentials.
 * @returns {string} The error message, or an empty string if valid.
 */
function getLoginValidationError(data) {
  if (!data.email || !data.password) {
    return "Please enter your email and password.";
  }

  return "";
}

/**
 * Focuses the first login field without a value.
 *
 * @param {{email: string, password: string}} data - The entered credentials.
 * @returns {void}
 */
function focusFirstInvalidLoginField(data) {
  const fieldId = !data.email ? "emailField" : "passwortField";

  document.getElementById(fieldId).focus();
}

/**
 * Displays an error below the inputs and marks both login fields as invalid.
 *
 * @param {string} message - The error message to display.
 * @returns {void}
 */
function showLoginError(message) {
  const form = document.getElementById("emailField").form;
  showFormError(form, message, ["emailField", "passwortField"]);
}

/**
 * Announces that login is unavailable because user data could not be loaded.
 * Does not mark the entered credentials as invalid.
 *
 * @returns {void}
 */
function showLoginConnectionError() {
  const form = document.getElementById("emailField").form;
  showFormError(form, "Login is currently unavailable. Please try again later.");
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
 * Synchronizes the icon with the updated password visibility.
 *
 * @returns {void}
 */
function toggleLoginPasswordVisibility() {
  const passwordInput = document.getElementById("passwortField");
  const toggleButton = document.getElementById("toggle-login-password");
  const passwordIsHidden = passwordInput.type === "password";
  const eyeIcon = document.getElementById("augeIcon");

  passwordInput.type = passwordIsHidden ? "text" : "password";
  toggleButton.setAttribute("aria-pressed", String(passwordIsHidden));
  toggleButton.setAttribute("aria-label", passwordIsHidden ? "Hide password" : "Show password");

  eyeIcon.src = passwordIsHidden ? "./assets/icons/eyeOpen.svg" : "./assets/icons/eyeClose.svg";
}

/**
 * Updates the password icon using field contents and password visibility.
 * Resets the password visibility and button ARIA state when the field becomes empty.
 * Enables the visibility toggle only when the password field has a value.
 *
 * @returns {void}
 */
function updatePasswordIcon() {
  const passwordInput = document.getElementById("passwortField");
  const toggleButton = document.getElementById("toggle-login-password");
  const eyeIcon = document.getElementById("augeIcon");

  if (!passwordInput.value) resetPasswordVisibility(passwordInput, toggleButton);

  toggleButton.disabled = !passwordInput.value;
  eyeIcon.src = getPasswordIconPath(passwordInput);
}

/**
 * Hides the password and resets the visibility button's ARIA state.
 *
 * @param {HTMLInputElement} passwordInput - The password field.
 * @param {HTMLButtonElement} toggleButton - The password visibility button.
 * @returns {void}
 */
function resetPasswordVisibility(passwordInput, toggleButton) {
  passwordInput.type = "password";
  toggleButton.setAttribute("aria-pressed", "false");
  toggleButton.setAttribute("aria-label", "Show password");
}

/**
 * Returns the icon path based on password visibility and field contents.
 *
 * @param {HTMLInputElement} passwordInput - The password field.
 * @returns {string} The relative path to the password icon.
 */
function getPasswordIconPath(passwordInput) {
  return passwordInput.type === "text"
    ? "./assets/icons/eyeOpen.svg"
    : passwordInput.value
      ? "./assets/icons/eyeClose.svg"
      : "./assets/icons/showPassword.svg";
}

initLoginPage();
