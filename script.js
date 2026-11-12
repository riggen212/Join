/** @type {string} Base URL of the Firebase Realtime Database. */
const DB_BASE_URL = "https://join-4092e-default-rtdb.europe-west1.firebasedatabase.app/";

/** @type {string} Database path for user records. */
const DB_USERS = "users/";

/** @type {string} Database path for tasks. */
const DB_TASKS = "tasks/";

/** @type {string} Database path for contacts. */
const DB_CONTACTS = "contacts/";

/** @type {string} Relative database path for a task's subtasks. */
const DB_SUBTASKS = "/subtasks";

/** @type {UserId} Database ID of the guest account. */
const DB_GUEST_USER_ID = "0";

/** @type {UserId|null} Current user ID, or null before initialization or without a valid user. */
let loggedUserId = null;

/**
 * Initializes the current user on a protected page.
 * Stores the validated user ID in loggedUserId and updates the profile button.
 * Redirects to login if the user is missing or invalid.
 *
 * @returns {Promise<boolean>} True if a valid user was loaded; otherwise false.
 * @throws {Error} If loading the user or updating the profile fails.
 */
async function initializeCurrentUser() {
  loggedUserId = await loadCurrentUser(false);

  if (!loggedUserId) return false;
  else return true;
}

/**
 * Validates the user ID from session storage and updates the profile.
 * Redirects invalid users to login unless the current page is public.
 *
 * @param {boolean} isMetaPage - Whether the page allows access without a valid user.
 * @returns {Promise<UserId|null>} The valid user ID, or null if validation fails.
 */
async function loadCurrentUser(isMetaPage) {
  const userId = getFromSessionStorage("userId");
  const user = await loadUserById(userId, isMetaPage);

  if (!user) {
    if (!isMetaPage) {
      window.location.href = `../index.html`;
    }
    return null;
  }

  setInitialsToProfileButton(user);
  return userId;
}

/**
 * Loads a user by ID.
 * Returns null if the ID is missing or the user does not exist.
 * Suppresses loading errors on public pages.
 *
 * @param {UserId|null} userId - The user ID to load.
 * @param {boolean} [isMetaPage=false] - Whether the current page is public.
 * @returns {Promise<User|null>} The user, or null if missing or loading fails on a public page.
 * @throws {Error} If loading fails on a non-public page.
 */
async function loadUserById(userId, isMetaPage = false) {
  if (!userId) return null;

  try {
    return await getData(DB_USERS, userId);
  } catch (error) {
    if (!isMetaPage) throw error;
    return null;
  }
}

/**
 * Returns the account email using the user ID stored in session storage.
 * Guest access deliberately has no email for UI markers.
 *
 * @returns {Promise<string|null>} Email address or null for guest access.
 */
async function getLoggedInUserEmail() {
  const userId = getFromSessionStorage("userId");

  if (userId === DB_GUEST_USER_ID) return null;

  return getData(DB_USERS + userId + "/email");
}

/**
 * Updates the profile button using the loaded user's initials and type.
 *
 * @param {User} user - The loaded user data.
 * @returns {void}
 */
function setInitialsToProfileButton(user) {
  const button = document.querySelector(".header-profile-initials-button");
  const userInitials = user.initials;

  if (user.type === "guest") {
    button.classList.add(user.type);
  }

  button.textContent = userInitials;
  button.setAttribute("aria-label", "Open service links and log out");
}

/**
 * Returns the UI suffix for the logged-in user's matching contact.
 *
 * @param {string} contactEmail Email address of the displayed contact.
 * @param {string|null} loggedUserEmail Email address of the logged-in user.
 * @returns {string} The "(you)" suffix or an empty string.
 */
function getCurrentUserSuffix(contactEmail, loggedUserEmail) {
  const isCurrentUser = contactEmail?.toLowerCase() === loggedUserEmail?.toLowerCase();

  return isCurrentUser ? " (you)" : "";
}

/**
 * Handles pages restored from the back/forward cache without a stored user ID.
 * Leaves normal page loads and pages with a stored user ID unchanged.
 *
 * @param {PageTransitionEvent} event - The pageshow event.
 * @returns {void}
 */
function checkLoginStateOnPageShow(event) {
  if (!event.persisted || getFromSessionStorage("userId")) return;

  handleLoggedOutPage();
}

/**
 * Reloads legal and privacy pages to refresh their logged-out navigation.
 * Replaces all other current pages with the login page.
 *
 * @returns {void}
 */
function handleLoggedOutPage() {
  const path = window.location.pathname;
  const isMetaPage = path.endsWith("legalNotice.html") || path.endsWith("privacyPolicy.html");

  if (isMetaPage) {
    window.location.reload();
    return;
  }

  window.location.replace("../index.html");
}

/**
 * Loads data from Firebase at the requested database path.
 *
 * @param {string} [path=""] - The Firebase path to load.
 * @param {string} [id=""] - An optional additional path segment.
 * @returns {Promise<Object|null>} The data returned by Firebase.
 * @throws {Error} If the HTTP response is not successful.
 */
async function getData(path = "", id = "") {
  const response = await fetch(DB_BASE_URL + path + id + ".json");

  if (!response.ok) {
    throw new Error(`HTTP-Fehler: ${response.status}`);
  }

  return await response.json();
}

/**
 * Writes data to a fixed Firebase database path.
 *
 * @param {string} path - The database path without the `.json` suffix.
 * @param {Object|null} value - The data written to Firebase.
 * @returns {Promise<Object|null>} The saved Firebase data.
 * @throws {Error} If the HTTP response is not successful.
 */
async function putData(path, value) {
  const response = await fetch(DB_BASE_URL + path + ".json", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(value),
  });

  if (!response.ok) {
    throw new Error(`HTTP-Fehler: ${response.status}`);
  }

  return await response.json();
}

/**
 * Updates specific data to a fixed Firebase database path.
 *
 * @param {string} path - The database path without the `.json` suffix.
 * @param {Object|null} value - The data overwritten to Firebase.
 * @returns {Promise<Object|null>} The saved Firebase data.
 * @throws {Error} If the HTTP response is not successful.
 */
async function patchData(path = "", value = {}) {
  const response = await fetch(DB_BASE_URL + path + ".json", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(value),
  });

  if (!response.ok) {
    throw new Error(`HTTP-Fehler: ${response.status}`);
  }

  return await response.json();
}

/**
 * Deletes data from a Firebase database path.
 *
 * @param {string} path - The database path to delete.
 * @returns {Promise<null>} Resolves after the data has been deleted.
 */
function deleteData(path) {
  return putData(path, null);
}

/**
 * Serializes a value as JSON and stores it in session storage.
 *
 * @param {string} key - The storage key.
 * @param {*} value - The JSON-serializable value to store.
 * @returns {void}
 */
function putToSessionStorage(key, value) {
  sessionStorage.setItem(key, JSON.stringify(value));
}

/**
 * Reads and parses a JSON value from session storage.
 * Returns null when reading or parsing fails.
 *
 * @param {string} key - The storage key.
 * @returns {*} The parsed value, or null if the key is missing or reading fails.
 */
function getFromSessionStorage(key) {
  try {
    return JSON.parse(sessionStorage.getItem(key));
  } catch (error) {
    return null;
  }
}

/**
 * Opens a modal dialog and updates its trigger's expanded state.
 *
 * @param {string} dialogId - The ID of the dialog to open.
 * @returns {void}
 */
function openDialog(dialogId) {
  const dialog = document.getElementById(dialogId);

  dialog.showModal();
  document.querySelector(`[aria-controls="${dialogId}"]`)?.setAttribute("aria-expanded", "true");
}

/**
 * Finishes the closing animation of a profile-style dialog.
 *
 * @param {AnimationEvent} event - The dialog animation event.
 * @returns {void}
 */
function closeProfileDialog(event) {
  closeAnimatedDialog(event, "dialog-profile-closing");
}

/**
 * Starts the closing animation of a dialog.
 *
 * @param {Event} event - The dialog cancel event.
 * @param {string} closingClass - The CSS class for the closing animation.
 * @returns {void}
 */
function dialogSlideOut(event, closingClass) {
  event.preventDefault();
  event.currentTarget.classList.add(closingClass);
}

/**
 * Closes a dialog after its closing animation has finished.
 *
 * @param {AnimationEvent} event - The dialog animation event.
 * @param {string} closingClass - The class controlling the closing animation.
 * @returns {void}
 */
function closeAnimatedDialog(event, closingClass) {
  const dialog = event.currentTarget;

  if (event.target !== dialog || !dialog.classList.contains(closingClass)) {
    return;
  }

  dialog.classList.remove(closingClass);
  dialog.close();
  document.querySelector(`[aria-controls="${dialog.id}"]`)?.setAttribute("aria-expanded", "false");
  dialog.querySelector("#notification")?.classList.remove("is-visible", "is-closing");
  showDialogNotification(dialog);
}

/**
 * Creates initials from the first two parts of a name.
 *
 * @param {string} name - The full name.
 * @returns {string} The uppercase initials.
 */
function getInitialsFromName(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}
