/**
 * Creates the HTML for the Add Contact dialog.
 *
 * @returns {string} The Add Contact dialog HTML.
 */
function renderAddContactTemplate() {
    return `<div>
                <button class="button button-close" type="button" onclick="this.closest('dialog').requestClose()" aria-label="Close dialog">
                    <img src="../assets/icons/cancel.svg" alt="">
                </button>
                <img class="contact-dialog-logo" src="../assets/icons/logo_bright.svg" alt="">
                <h1>Add contact</h1>
                <p>Tasks are better with a team!</p>
            </div>

            <div class="badge-user">
                <img src="../assets/icons/person.svg" alt="">
            </div>

            <form novalidate onsubmit="createContact(event)">
                <div class="contact-form-field">
                    <div class="input-wrapper">
                        <input type="text" id="contact-name" name="name" autocomplete="name" placeholder="Name" aria-label="Name" aria-describedby="contact-name-error" oninput="validateContactField(this)">
                        <span type="button">
                            <img src="../assets/icons/person.svg" alt="show password">
                        </span>
                    </div>
                    <p class="contact-form-error" id="contact-name-error" aria-live="polite"></p>
                </div>
                <div class="contact-form-field">
                    <div class="input-wrapper">
                        <input type="email" id="contact-email" name="email" autocomplete="email" placeholder="Email" aria-label="Email address" aria-describedby="contact-email-error" oninput="validateContactField(this)">
                        <span type="button">
                            <img src="../assets/icons/mail.svg" alt="show password">
                        </span>
                    </div>
                    <p class="contact-form-error" id="contact-email-error" aria-live="polite"></p>
                </div>
                <div class="contact-form-field">
                    <div class="input-wrapper">
                        <input type="tel" id="contact-phone" name="phone" autocomplete="tel" placeholder="Phone" aria-label="Phone number" aria-describedby="contact-phone-error" oninput="validateContactField(this)">
                        <span type="button">
                            <img src="../assets/icons/phone.svg" alt="show password">
                        </span>
                    </div>
                <p class="contact-form-error" id="contact-phone-error" aria-live="polite"></p>
                </div>
                <div class="contact-form-actions">
                    <button class="button button-bright button-cancel" type="button" onclick="this.closest('dialog').requestClose()">
                        <span>Cancel</span>
                        <img src="../assets/icons/cancel.svg" alt="">
                    </button>
                    <button class="button button-dark" type="submit">
                        <span>Create contact</span>
                        <img src="../assets/icons/check.svg" alt="">
                    </button>
                </div>
            </form>
        `;
}


/**
 * Creates the prefilled HTML for the Edit Contact dialog.
 *
 * @param {Contact} contact - The contact to edit.
 * @returns {string} The Edit Contact dialog HTML.
 */
function renderEditContactTemplate(contact) {
    return `<div>
                <button class="button button-close" type="button" onclick="this.closest('dialog').requestClose()" aria-label="Close dialog">
                    <img src="../assets/icons/cancel.svg" alt="">
                </button>
                <img class="contact-dialog-logo" src="../assets/icons/logo_bright.svg" alt="">
                <h1>Edit Contact</h1>
            </div>

            <div class="badge-user ${contact.colorClass}">
                <span>${contact.initials}</span>
            </div>

            <form novalidate onsubmit="saveContact(event)">
                <div class="contact-form-field">
                    <div class="input-wrapper">
                        <input type="text" id="contact-name" name="name" autocomplete="name" placeholder="Name" value="${contact.name}" aria-label="Name" aria-describedby="contact-name-error" oninput="validateContactField(this)">
                        <span type="button">
                            <img src="../assets/icons/person.svg" alt="show password">
                        </span>
                    </div>
                    <p class="contact-form-error" id="contact-name-error" aria-live="polite"></p>
                </div>
                <div class="contact-form-field">
                    <div class="input-wrapper">
                        <input type="email" id="contact-email" name="email" autocomplete="email" placeholder="Email" value="${contact.email}" aria-label="Email address" aria-describedby="contact-email-error" oninput="validateContactField(this)">
                        <span type="button">
                            <img src="../assets/icons/mail.svg" alt="show password">
                        </span>
                    </div>
                    <p class="contact-form-error" id="contact-email-error" aria-live="polite"></p>
                </div>
                <div class="contact-form-field">
                    <div class="input-wrapper">
                        <input type="tel" id="contact-phone" name="phone" autocomplete="tel" placeholder="Phone" value="${contact.phone}" aria-label="Phone number" aria-describedby="contact-phone-error" oninput="validateContactField(this)">
                        <span type="button">
                            <img src="../assets/icons/phone.svg" alt="show password">
                        </span>
                    </div>
                    <p class="contact-form-error" id="contact-phone-error" aria-live="polite"></p>
                </div>
                <div class="contact-form-actions">
                    <button class="button button-bright button-delete" type="button" onclick="deleteContact()">
                        Delete
                    </button>

                    <button class="button button-dark" type="submit">
                        <span>Save</span>
                        <img src="../assets/icons/check.svg" alt="">
                    </button>
                </div>
            </form>
            `;
}


/**
 * Creates the HTML for one contact card.
 *
 * @param {ContactId} contactId - The unique ID of the contact.
 * @param {Contact} contact - The contact displayed in the card.
 * @param {string|null} loggedUserEmail - Email of the logged-in user.
 * @returns {string} The contact card HTML.
 */
function getContactCardTemplate(contactId, contact, loggedUserEmail) {
    const currentUserSuffix = getCurrentUserSuffix(
        contact.email,
        loggedUserEmail
    );

    return `
        <article class="contact-card" data-contact-id="${contactId}"
            onclick="showContactDetails(this)">
            <div class="badge-user ${contact.colorClass}">
                <span>${contact.initials}</span>
            </div>
            <div>
                <p class="hover-bright">${contact.name}${currentUserSuffix}</p>
                <p class="adress">${contact.email}</p>
            </div>
        </article>
    `;
}


/**
 * Creates the HTML for a group of contacts sharing the same initial.
 *
 * @param {string} initial - The first letter of the contact names.
 * @param {string} contactCardsHtml - The HTML for the contact cards.
 * @returns {string} The complete contact group HTML.
 */
function getContactGroupTemplate(initial, contactCardsHtml) {
    return `
        <section class="contact-group">
            <h2>${initial}</h2>
            ${contactCardsHtml}
        </section>
    `;
}


/**
 * Creates the detail view for the selected contact.
 *
 * @param {Contact} contact - The contact whose information is displayed.
 * @param {string|null} loggedUserEmail - Email of the logged-in user.
 * @returns {string} The contact details HTML.
 */
function getContactDetailsTemplate(contact, loggedUserEmail) {
    const currentUserSuffix = getCurrentUserSuffix(
        contact.email,
        loggedUserEmail
    );

    return `
        <div>
            <div class="badge-user ${contact.colorClass}">
                <span>${contact.initials}</span>
            </div>
            <h3>${contact.name}${currentUserSuffix}</h3>
            ${getContactActionsTemplate()}
        </div>
        <p>Contact Information</p>
        <h4>Email</h4>
        <span class="detail-info">${contact.email}</span>
        <h4>Phone</h4>
        <span>${contact.phone}</span>
    `;
}


/**
 * Creates the action buttons of the contact detail view.
 *
 * @returns {string} The contact action buttons HTML.
 */
function getContactActionsTemplate() {
    return `
        <div id="contact-actions">
            <button class="button button-task-overlay" onclick="editContact()">
                <img src="../assets/icons/edit.svg" alt="">
                <span>Edit</span>
            </button>
            <button class="button button-task-overlay" onclick="deleteContact()">
                <img src="../assets/icons/delete.svg" alt="">
                <span>Delete</span>
            </button>
        </div>
    `;
}