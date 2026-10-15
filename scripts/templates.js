

/**
 * Returns the HTML of the task form.
 *
 * @param {boolean} [isEditMode=false] - True renders the form for editing an existing task
 *   (no heading, no Clear button, "Ok" instead of "Create Task").
 * @returns {string} The task form HTML.
 */
function renderAddTask(isEditMode = false) {
    return `${isEditMode ? "" : "<h1>Add Task</h1>"}
                <section class="add-task${isEditMode ? " edit-task" : ""}">
                    <form class="task-form-wrapper" onreset="resetTaskForm(this)">
                        <div class="add-task-form">
                            <!-- Left column -->
                            <div class="task-form">
                                <label for="task-title"> Title<span class="required">*</span> </label>
                                <input class="input-wrapper" id="task-title" name="title" type="text"
                                    placeholder="Enter a title" aria-describedby="task-title-error" required />
                                <p class="field-error" id="task-title-error" aria-live="polite"></p>

                                <label for="task-description"> Description </label>
                                <div class="textarea-wrapper">
                                    <textarea class="input-wrapper" id="task-description" name="description"
                                        placeholder="Enter a Description"></textarea>
                                    <img class="textarea-resize-icon" src="../assets/icons/recurso.svg" alt="">
                                </div>

                                <label for="task-due-date"> Due date<span class="required">*</span> </label>
                                <input class="input-wrapper no-flex input-date" id="task-due-date" name="dueDate" type="date"
                                    aria-describedby="task-due-date-error" required />
                                <p class="field-error" id="task-due-date-error" aria-live="polite"></p>
                            </div>

                            <!-- Right column -->
                            <div class="task-form">
                                <span id="task-priority-label">Priority</span>

                                <div class="task-priority" role="group" aria-labelledby="task-priority-label">
                                    <div>
                                        <button class="button" type="button" id="priority-urgent" onclick="selectTaskPriority(this, 'urgent')" aria-pressed="false">
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
                                        <button class="button" type="button" id="priority-low" onclick="selectTaskPriority(this, 'low')" aria-pressed="false">
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

                                    <ul class="assigned-options" id="assigned-options" onmousedown="event.preventDefault()"></ul>
                                    <ul class="assigned-badges" id="assigned-badges" aria-label="Selected contacts"></ul>
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
                                    <p class="field-error" id="task-category-error" aria-live="polite"></p>
                                </fieldset>

                                <label for="subtask"> Subtasks </label>

                                <div class="subtask-input-wrapper">
                                    <input class="input-wrapper" id="subtask" name="subtask" type="text"
                                        placeholder="Add new subtask" autocomplete="off" />
                                    <button class="subtask-add-button" type="button" id="add-subtask"
                                        aria-label="Add subtask" onclick="addSubtask(this.form)">
                                        <img src="../assets/icons/add_mobile_blue.svg" alt="" />
                                    </button>
                                </div>
                                <ul class="subtask-list" id="subtask-list" aria-label="Subtasks"></ul>
                            </div>
                        </div>

                        <div class="submit-task">
                            <p>
                                <span class="required">*</span>
                                This field is required
                            </p>

                            <div class="submit-task-send">
                                ${isEditMode ? "" : `<button class="button button-bright" type="reset">
                                    <span>Clear</span>
                                    <img src="../assets/icons/cancel.svg" alt="">
                                </button>`}

                                <button class="button button-dark" type="submit">
                                    <span>${isEditMode ? "Ok" : "Create Task"}</span>
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
 * @param {ContactId} contactId - The unique ID of the contact.
 * @param {Contact} contact - The contact displayed in the card.
 * @returns {string} The contact card HTML.
 */
function getContactCardTemplate(contactId, contact) {
    return `
        <article class="contact-card" data-contact-id="${contactId}"
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
 * @returns {string} The contact details HTML.
 */
function getContactDetailsTemplate(contact) {
    return `
        <div>
            <div class="badge-user ${contact.colorClass}"><span>${contact.initials}</span></div>
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
                <img src="../assets/icons/cancel.svg" alt="">
                <span>Delete</span>
            </button>
        </div>
    `;
}