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

            <form onsubmit="createContact(event)">
                <div class="input-wrapper">
                    <input type="text" id="contact-name" name="name" autocomplete="name" placeholder="Name" required>
                    <span type="button">
                        <img src="../assets/icons/person.svg" alt="show password">
                    </span>
                </div>
                <div class="input-wrapper">
                    <input type="email" id="contact-email" name="email" autocomplete="email" placeholder="Email" required>
                    <span type="button">
                        <img src="../assets/icons/mail.svg" alt="show password">
                    </span>
                </div>
                <div class="input-wrapper">
                    <input type="tel" id="contact-phone" name="phone" autocomplete="tel" placeholder="Phone" required>
                    <span type="button">
                        <img src="../assets/icons/phone.svg" alt="show password">
                    </span>
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

            <form onsubmit="saveContact(event)">
                <div class="input-wrapper">
                    <input type="text" id="contact-name" name="name" autocomplete="name" placeholder="Name" value="${contact.name}" required>
                    <span type="button">
                        <img src="../assets/icons/person.svg" alt="show password">
                    </span>
                </div>

                <div class="input-wrapper">
                    <input type="email" id="contact-email" name="email" autocomplete="email" placeholder="Email" value="${contact.email}" required>
                    <span type="button">
                        <img src="../assets/icons/mail.svg" alt="show password">
                    </span>
                </div>

                <div class="input-wrapper">
                    <input type="tel" id="contact-phone" name="phone" autocomplete="tel" placeholder="Phone" value="${contact.phone}" required>
                    <span type="button">
                        <img src="../assets/icons/phone.svg" alt="show password">
                    </span>
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

function renderAddTask() {
    return `<h1>Add Task</h1>
                <section class="add-task">
                    <form class="task-form-wrapper" onreset="resetTaskForm(this)">
                        <div class="add-task-form">
                            <!-- Left column -->
                            <div class="task-form">
                                <label for="task-title"> Title<span class="required">*</span> </label>
                                <input class="input-wrapper" id="task-title" name="title" type="text"
                                    placeholder="Enter a title" required />

                                <label for="task-description"> Description </label>
                                <div class="textarea-wrapper">
                                    <textarea class="input-wrapper" id="task-description" name="description"
                                        placeholder="Enter a Description"></textarea>
                                    <img class="textarea-resize-icon" src="../assets/icons/recurso.svg" alt="">
                                </div>

                                <label for="task-due-date"> Due date<span class="required">*</span> </label>
                                <input class="input-wrapper no-flex input-date" id="task-due-date" name="dueDate"type="date" required />
                            </div>

                            <!-- Right column -->
                            <div class="task-form">
                                <span>Priority</span>

                                <div class="task-priority">
                                    <div>
                                        <button class="button" type="button" onclick="selectTaskPriority(this, 'urgent')" aria-pressed="false">
                                            Urgent
                                            <img src="../assets/icons/priority_arrows_up.svg" alt="" />
                                        </button>
                                    </div>

                                    <div>
                                        <button class="button medium" type="button" id="priority-medium" onclick="selectTaskPriority(this, 'medium')" aria-pressed="true">
                                            Medium
                                            <img src="../assets/icons/priority_equal.svg" alt="" />
                                        </button>
                                    </div>

                                    <div>
                                        <button class="button" type="button" onclick="selectTaskPriority(this, 'low')" aria-pressed="false">
                                            Low
                                            <img src="../assets/icons/priority_arrows_down.svg" alt="" />
                                        </button>
                                    </div>
                                </div>

                                <fieldset class="assigned-dropdown">
                                    <legend>Assigned to</legend>

                                    <div class="input-wrapper">
                                        <input type="search" id="task-assigned" placeholder="Select contacts to assign"
                                            aria-label="Search contacts">
                                        <img src="../assets/icons/arrow_drop_down.svg" alt="">
                                    </div>

                                    <!-- Preview data: JavaScript will create these entries from the contacts JSON. -->
                                    <ul class="assigned-options" id="assigned-options" onmousedown="event.preventDefault()">
                                        <li>
                                            <label class="assigned-option">
                                                <span class="badge-user badge-user-blue-light">SM</span>
                                                <span>Sofia Müller (You)</span>
                                                <input type="checkbox" name="assignedTo" value="user">
                                            </label>
                                        </li>

                                        <li>
                                            <label class="assigned-option">
                                                <span class="badge-user badge-user-orange">AM</span>
                                                <span>Anton Mayer</span>
                                                <input type="checkbox" name="assignedTo" value="contact1">
                                            </label>
                                        </li>

                                        <li>
                                            <label class="assigned-option">
                                                <span class="badge-user badge-user-purple">AS</span>
                                                <span>Anja Schulz</span>
                                                <input type="checkbox" name="assignedTo" value="contact2" checked>
                                            </label>
                                        </li>

                                        <li>
                                            <label class="assigned-option">
                                                <span class="badge-user badge-user-blue-medium">BZ</span>
                                                <span>Benedikt Ziegler</span>
                                                <input type="checkbox" name="assignedTo" value="contact3">
                                            </label>
                                        </li>

                                        <li>
                                            <label class="assigned-option">
                                                <span class="badge-user badge-user-pink">DE</span>
                                                <span>David Eisenberg</span>
                                                <input type="checkbox" name="assignedTo" value="contact4" checked>
                                            </label>
                                        </li>
                                        <li>
                                            <label class="assigned-option">
                                                <span class="badge-user badge-user-yellow">EF</span>
                                                <span>Eva Fischer</span>
                                                <input type="checkbox" name="assignedTo" value="contact5" checked>
                                            </label>
                                        </li>
                                    </ul>

                                    <!-- Preview badges: JavaScript will create these from the selected contact IDs. -->
                                    <ul class="assigned-badges" id="assigned-badges" aria-label="Selected contacts">
                                        <li class="badge-user badge-user-blue-light">SM</li>
                                        <li class="badge-user badge-user-pink">DE</li>
                                        <li class="badge-user badge-user-yellow">EF</li>
                                    </ul>
                                </fieldset>

                                <fieldset class="category-field" id="task-category" onchange="selectTaskCategory(event)">
                                    <legend>Category<span class="required">*</span></legend>

                                    <button class="input-wrapper" type="button">
                                        <span>Select task category</span>
                                        <img src="../assets/icons/arrow_drop_down.svg" alt="">
                                    </button>

                                    <ul class="category-options" onmousedown="event.preventDefault()">
                                        <li>
                                            <label>
                                                <input type="radio" name="category" value="Technical Task" required>
                                                Technical Task
                                            </label>
                                        </li>
                                        <li>
                                            <label>
                                                <input type="radio" name="category" value="User Story" required>
                                                User Story
                                            </label>
                                        </li>
                                    </ul>
                                </fieldset>

                                <label for="subtask"> Subtasks </label>

                                <input class="input-wrapper" id="subtask" name="subtask" type="text"
                                    placeholder="Add new subtask" />
                            </div>
                        </div>

                        <div class="submit-task">
                            <p>
                                <span class="required">*</span>
                                This field is required
                            </p>

                            <div class="submit-task-send">
                                <button class="button button-bright" type="reset">
                                    <span>Clear</span>
                                    <img src="../assets/icons/cancel.svg" alt="">
                                </button>

                                <button class="button button-dark" type="submit">
                                    <span>Create Task</span>
                                    <img src="../assets/icons/check.svg" alt="">
                                </button>
                            </div>
                        </div>
                    </form>
                </section>
    `;
}

/**
 * Creates the HTML for one contact card.
 *
 * @param {string} contactId - The unique ID of the contact.
 * @param {Contact} contact - The contact displayed in the card.
 * @returns {string} The contact card HTML.
 */
function getContactCardTemplate(contactId, contact) {
    return `
        <article class="contact-card"
            data-contact-id="${contactId}"
            onclick="showContactDetails(this)">
            <div class="badge-user ${contact.colorClass}">
                <span>${contact.initials}</span>
            </div>
            <div>
                <p class="hover-bright">${contact.name}</p>
                <p class="adress">${contact.email}</p>
            </div>
        </article>
    `;
}

/**
 * Creates the HTML for a group of contacts sharing the same initial.
 *
 * @param {string} initial - The first letter of the contact names.
 * @param {string} contactCardsHtml - The rendered contact cards.
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
 * @returns {string} The contact details HTML.
 */
function getContactDetailsTemplate(contact) {
    return `
        <div>
            <div class="badge-user ${contact.colorClass}">
                <span>${contact.initials}</span>
            </div>
            <h3>${contact.name}</h3>
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