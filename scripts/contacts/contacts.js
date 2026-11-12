/** @type {ContactDirectory} */
const contacts = {};

/**
 * Current user's email address, used to mark their matching contact.
 * Null before loading or when using the guest account.
 *
 * @type {string|null}
 */
let loggedInUserEmail = null;

/**
 * Initializes the current user and loads the contact list.
 * Stops if no valid user is available and displays loading errors.
 * Disables contact buttons during initialization and restores them afterwards.
 *
 * @returns {Promise<void>} Resolves after initialization, error handling or an early return.
 */
async function initContacts() {
  setContactButtonsDisabled(true);

  try {
    if (!(await initializeCurrentUser())) return;
    loggedInUserEmail = await getLoggedInUserEmail();
    await loadAndRenderContacts();
  } catch (error) {
    showNotification("Contacts could not be loaded.", "error");
  } finally {
    setContactButtonsDisabled(false);
  }
}

/**
 * Loads shared contacts from Firebase, updates the local directory and renders the list.
 *
 * @returns {Promise<void>} Resolves after loading and rendering the contacts.
 * @throws {Error} If loading or rendering the contacts fails.
 */
async function loadAndRenderContacts() {
  const firebaseContacts = await getData(getContactPath());
  Object.assign(contacts, firebaseContacts ?? {});
  renderContactList(contacts);
}

/**
 * Renders all contacts inside the contact list.
 *
 * @param {ContactDirectory} contactDirectory - The contacts to render.
 * @returns {void}
 */
function renderContactList(contactDirectory) {
  const container = document.getElementById("contact-groups");
  const groups = groupContactsByInitial(contactDirectory);

  container.innerHTML = getContactGroupsHtml(groups, loggedInUserEmail);
}

/**
 * Sorts contacts by name and groups them by their first letter.
 *
 * @param {ContactDirectory} contactDirectory - The contacts to group.
 * @returns {ContactGroups} The grouped contacts.
 */
function groupContactsByInitial(contactDirectory) {
  const contactEntries = Object.entries(contactDirectory);

  contactEntries.sort(([, first], [, second]) => first.name.localeCompare(second.name));

  return contactEntries.reduce((groups, contactEntry) => {
    const initial = contactEntry[1].name.charAt(0).toUpperCase();
    (groups[initial] ??= []).push(contactEntry);
    return groups;
  }, {});
}

/**
 * Creates the HTML for all grouped contacts.
 *
 * @param {ContactGroups} contactGroups - The grouped contacts.
 * @param {string|null} loggedUserEmail - Email of the logged-in user.
 * @returns {string} The HTML for all contact groups.
 */
function getContactGroupsHtml(contactGroups, loggedUserEmail) {
  return Object.entries(contactGroups)
    .map(([initial, entries]) => {
      const cardsHtml = getContactCardsHtml(entries, loggedUserEmail);
      return getContactGroupTemplate(initial, cardsHtml);
    })
    .join("");
}

/**
 * Creates the HTML for the contact cards of one group.
 *
 * @param {ContactListEntry[]} contactEntries - Contacts with their IDs.
 * @param {string|null} loggedUserEmail - Email of the logged-in user.
 * @returns {string} The HTML for the contact cards.
 */
function getContactCardsHtml(contactEntries, loggedUserEmail) {
  return contactEntries
    .map(([contactId, contact]) => getContactCardTemplate(contactId, contact, loggedUserEmail))
    .join("");
}

/**
 * Opens the dialog for creating a new contact.
 *
 * @returns {void}
 */
function addNewContact() {
  const dialog = document.getElementById("contact");

  if (!dialog.open) {
    dialog.classList.remove("contact-edit");
    dialog.innerHTML = renderAddContactTemplate();
    openDialog("contact");
    initializeContactDialogScrollbar(dialog);
  }
}

/**
 * Validates, creates, saves, and confirms a contact from the submitted form.
 *
 * @param {SubmitEvent} event - The Add Contact form submit event.
 * @returns {Promise<void>}
 */
async function createContact(event) {
  event.preventDefault();
  const form = /** @type {HTMLFormElement} */ (event.currentTarget);
  const formValues = getValidContactFormValues(form);
  if (!formValues) return;

  const contact = createContactData(formValues, contacts);
  try {
    await runWithDisabledContactButtons(() => saveNewContact(contact));
    closeContactFormWithNotification(form, "Contact successfully created");
  } catch (error) {
    showNotification("Contact could not be created. Please try again.", "error");
  }
}

/**
 * Generates a UUID and saves the new contact via PUT.
 * Adds the contact to the local directory, refreshes the list and shows its details.
 *
 * @param {Contact} contact - The contact data to save.
 * @returns {Promise<void>} Resolves after saving and updating the local view.
 * @throws {Error} If ID generation, saving or updating the local view fails.
 */
async function saveNewContact(contact) {
  const contactId = crypto.randomUUID();
  await putData(DB_CONTACTS + contactId, contact);
  contacts[contactId] = contact;
  renderContactList(contacts);
  showContactById(contactId);
}

/**
 * Validates the submitted form and starts saving the selected contact.
 * Stops if no contact is selected or the form values are invalid.
 *
 * @param {SubmitEvent} event - The Edit Contact form submit event.
 * @returns {Promise<void>} Resolves after saving, error handling or an early return.
 */
async function saveContact(event) {
  event.preventDefault();
  const form = /** @type {HTMLFormElement} */ (event.currentTarget);
  const selectedContact = getSelectedContactEntry();
  const formValues = getValidContactFormValues(form);
  if (!selectedContact || !formValues) return;

  await handleSaveContact(form, formValues, selectedContact);
}

/**
 * Saves the validated contact changes while contact buttons are disabled.
 * Closes the form with a success notification or displays an error.
 *
 * @param {HTMLFormElement} form - The submitted Edit Contact form.
 * @param {ContactFormValues} formValues - The validated contact form values.
 * @param {ContactEntry} selectedContact - The selected contact and its ID.
 * @returns {Promise<void>} Resolves after saving and confirmation or error handling.
 */
async function handleSaveContact(form, formValues, selectedContact) {
  const contact = { ...selectedContact.contact, ...formValues };

  try {
    await runWithDisabledContactButtons(() => saveEditedContact(selectedContact.id, contact));
    closeContactFormWithNotification(form, "Contact successfully updated");
  } catch (error) {
    showNotification("Contact could not be updated. Please try again.", "error");
  }
}

/**
 * Saves an edited contact in Firebase and refreshes its views.
 *
 * @param {ContactId} contactId - The edited contact's ID.
 * @param {Contact} contact - The updated contact data.
 * @returns {Promise<void>}
 */
async function saveEditedContact(contactId, contact) {
  await putData(getContactPath(contactId), contact);

  contacts[contactId] = contact;

  renderContactList(contacts);
  renderContactDetails(contactId);
  markContactCardSelected(contactId);
}

/**
 * Deletes the currently selected contact.
 *
 * @returns {Promise<void>}
 */
async function deleteContact() {
  const selectedContact = getSelectedContactEntry();
  if (!selectedContact) return;

  try {
    await runWithDisabledContactButtons(() => removeContact(selectedContact.id));
  } catch (error) {
    showNotification("Contact could not be deleted. Please try again.", "error");
  }
}

/**
 * Deletes a contact and its task assignments in a single Firebase update.
 * Updates the local contact list and closes the details and dialogs after success.
 * Propagates loading and update errors to the caller.
 *
 * @param {ContactId} contactId - The ID of the contact to delete.
 * @returns {Promise<void>} Resolves after deletion and local view updates.
 */
async function removeContact(contactId) {
  const updates = { [getContactPath(contactId)]: null };
  await getContactsTaskAssignings(contactId, updates);
  await patchData("", updates);
  delete contacts[contactId];

  renderContactList(contacts);
  hideContactDetails();
  closeDialogAfterContactDeletion("Contact successfully deleted");
  setNewFocusOnFirstContactcard();
}

/**
 * Loads all tasks and adds deletion paths for the contact's assignments.
 * Mutates the supplied update object using paths relative to the database root.
 * Propagates task loading errors to the caller.
 *
 * @param {ContactId} contactId - The contact whose task assignments should be removed.
 * @param {Object.<string, null>} updates - Firebase update object to extend with deletion paths.
 * @returns {Promise<void>} Resolves after all matching assignment paths have been added.
 */
async function getContactsTaskAssignings(contactId, updates) {
  const tasks = (await getData(DB_TASKS)) ?? {};

  Object.entries(tasks).forEach(([taskId, task]) => {
    if (task.assignedTo?.[contactId]) {
      updates[`${DB_TASKS}${taskId}/assignedTo/${contactId}`] = null;
    }
  });
}

/**
 * Closes the contact dialog and shows a notification afterwards.
 *
 * @param {string} message - The text displayed in the notification.
 * @param {"success" | "error"} [type="success"] - The notification type.
 * @returns {void}
 */
function closeDialogAfterContactDeletion(message) {
  const contactDialog = document.getElementById("contact");

  hideContactActions();

  if (!contactDialog.open) return showNotification(message, "show-details");
  contactDialog.dataset.notification = message;
  contactDialog.dataset.notificationContainer = "show-details";
  contactDialog.requestClose();
}

/**
 * Closes a contact form dialog and schedules its success notification.
 *
 * @param {HTMLFormElement} form - The submitted contact form.
 * @param {string} message - The success message to show after closing.
 * @returns {void}
 */
function closeContactFormWithNotification(form, message) {
  const dialog = form.closest("dialog");

  dialog.dataset.notification = message;
  dialog.dataset.notificationContainer = "show-details";
  dialog.requestClose();
}

/**
 * Runs a database request while contact buttons are disabled.
 *
 * @param {() => Promise<void>} request - The database request to run.
 * @returns {Promise<void>}
 */
async function runWithDisabledContactButtons(request) {
  setContactButtonsDisabled(true);

  try {
    await request();
  } finally {
    setContactButtonsDisabled(false);
  }
}

/**
 * Enables or disables all action buttons of the contacts page.
 *
 * @param {boolean} isDisabled - True while a database request is running.
 * @returns {void}
 */
function setContactButtonsDisabled(isDisabled) {
  const buttons = document.querySelectorAll(".contacts-content button, #contact button");

  for (let i = 0; i < buttons.length; i++) {
    buttons[i].disabled = isDisabled;
  }
}

/**
 * Returns the Firebase path for the contacts collection or a single contact.
 *
 * @param {ContactId} [contactId] - The optional ID of one contact.
 * @returns {string} The database path without the `.json` suffix.
 */
function getContactPath(contactId) {
  return contactId ? `${DB_CONTACTS}${contactId}` : DB_CONTACTS;
}

initContacts();
