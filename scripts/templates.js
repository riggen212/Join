

/**
 * Returns the HTML of the task form.
 *
 * @param {boolean} [isEditMode=false] - True renders the form for editing an existing task
 *   (no heading, no Clear button, "Ok" instead of "Create Task").
 * @returns {string} The task form HTML.
 */
function renderAddTask(isEditMode = false) {
    return `${isEditMode ? "" : '<h1 id="add-task-dialog-title">Add Task</h1>'}
                <section class="add-task${isEditMode ? " edit-task" : ""}">
                    <form class="task-form-wrapper" novalidate onsubmit="submitTaskForm(event)" onreset="resetTaskForm(this)"
                        oninput="updateTaskForm(this)" onchange="updateTaskForm(this)" onkeydown="preventEnterSubmit(event)">
                        <div class="add-task-form">
                            <!-- Left column -->
                            <div class="task-form">
                                <label for="task-title"> Title<span class="required">*</span> </label>
                                <input class="input-wrapper" id="task-title" name="title" type="text"
                                    placeholder="Enter a title" aria-describedby="task-title-error"
                                    onblur="validateTitle(this.form)" />
                                <p class="field-error" id="task-title-error" aria-live="polite"></p>

                                <label for="task-description"> Description </label>
                                <div class="textarea-wrapper">
                                    <textarea class="input-wrapper" id="task-description" name="description"
                                        placeholder="Enter a Description"></textarea>
                                    <img class="textarea-resize-icon" src="../assets/icons/recurso.svg" alt="">
                                </div>

                                <label for="task-due-date"> Due date<span class="required">*</span> </label>
                                    <input class="input-wrapper no-flex input-date" id="task-due-date" name="dueDate" type="date"
                                        aria-describedby="task-due-date-error" onblur="validateDueDate(this.form)">
                                <p class="field-error" id="task-due-date-error" aria-live="polite"></p>
                            </div>

                            <!-- Right column -->
                            <div class="task-form">
                                <span id="task-priority-label">Priority</span>

                                <div class="task-priority" role="group" aria-labelledby="task-priority-label">
                                    <div>
                                        <button class="button" type="button" id="priority-urgent" onclick="selectTaskPriority(this, 'urgent')" aria-pressed="false">
                                            Urgent
                                            <img src="../assets/icons/priorityArrowsUp.svg" alt="" />
                                        </button>
                                    </div>

                                    <div>
                                        <button class="button medium" type="button" id="priority-medium" onclick="selectTaskPriority(this, 'medium')" aria-pressed="true">
                                            Medium
                                            <img src="../assets/icons/priorityEqual.svg" alt="" />
                                        </button>
                                    </div>

                                    <div>
                                        <button class="button" type="button" id="priority-low" onclick="selectTaskPriority(this, 'low')" aria-pressed="false">
                                            Low
                                            <img src="../assets/icons/priorityArrowsDown.svg" alt="" />
                                        </button>
                                    </div>
                                </div>

                                <fieldset class="assigned-dropdown" onkeydown="handleAssignedKeydown(event)" onfocusin="this.classList.remove('is-collapsed')" oninput="this.classList.remove('is-collapsed')">
                                    <legend>Assigned to</legend>

                                    <div class="input-wrapper" onmousedown="toggleAssignedDropdown(event)">
                                        <input type="search" id="task-assigned" placeholder="Select contacts to assign" aria-label="Search contacts">
                                        <img src="../assets/icons/arrowDropDown.svg" alt="">
                                    </div>

                                    <ul class="assigned-options" id="assigned-options" onmousedown="event.preventDefault()"></ul>
                                    <ul class="assigned-badges" id="assigned-badges" aria-label="Selected contacts"></ul>
                                </fieldset>

                                <fieldset class="category-field" id="task-category" onchange="selectTaskCategory(event)" onclick="selectTaskCategory(event)"
                                    onfocusin="setCategoryExpanded(this, true)" onfocusout="checkCategoryOnLeave(event)"
                                    onkeydown="handleCategoryKeydown(event)">
                                    <legend>Category<span class="required">*</span></legend>

                                    <button class="input-wrapper" type="button" aria-describedby="task-category-error" aria-controls="category-options" aria-expanded="false" onmousedown="toggleCategoryDropdown(event)">
                                        <span>Select task category</span>
                                        <img src="../assets/icons/arrowDropDown.svg" alt="">
                                    </button>

                                    <ul class="category-options" id="category-options" onmousedown="event.preventDefault()">
                                        <li>
                                            <label>
                                                <input type="radio" name="category" value="Technical Task">
                                                Technical Task
                                            </label>
                                        </li>
                                        <li>
                                            <label>
                                                <input type="radio" name="category" value="User Story">
                                                User Story
                                            </label>
                                        </li>
                                    </ul>
                                    <p class="field-error" id="task-category-error" aria-live="polite"></p>
                                </fieldset>

                                <label for="subtask"> Subtasks </label>

                                <div class="subtask-input-wrapper">
                                    <input class="input-wrapper" id="subtask" name="subtask" type="text"
                                        placeholder="Add new subtask" autocomplete="off" onkeydown="addSubtaskOnEnter(event)" />
                                    <div class="subtask-input-actions">
                                        <button type="button" aria-label="Clear subtask" onclick="clearSubtaskInput(this.form)">
                                            <img src="../assets/icons/cancel.svg" alt="" />
                                        </button>
                                        <span class="subtask-actions-divider" aria-hidden="true"></span>
                                        <button type="button" aria-label="Add subtask" onclick="addSubtask(this.form)">
                                            <img src="../assets/icons/checkDark.svg" alt="" />
                                        </button>
                                    </div>
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
 * Creates one contact option for the "Assigned to" list.
 *
 * @param {ContactId} contactId - The unique ID of the contact.
 * @param {Contact} contact - The contact.
 * @param {string} initials - The initials shown in the badge.
 * @param {boolean} isChecked - True if the contact is already assigned.
 * @param {string|null} loggedUserEmail - Email of the logged-in user.
 * @returns {string} The HTML of the list entry.
 */
function getAssignedOptionTemplate( contactId, contact, initials, isChecked, loggedUserEmail) {
    const currentUserSuffix = getCurrentUserSuffix(
        contact.email,
        loggedUserEmail
    );

    return `
        <li>
            <label class="assigned-option">
                <span class="badge-user ${contact.colorClass || ""}">${initials}</span>
                <span>${contact.name}${currentUserSuffix}</span>
                <input type="checkbox" name="assignedTo" value="${contactId}"
                    ${isChecked ? "checked" : ""}>
            </label>
        </li>
    `;
}


/**
 * Returns the HTML for the badge of an assigned contact.
 *
 * @param {string} badgeClass - The CSS classes of the badge.
 * @param {string} initials - The initials of the contact.
 * @param {string} name - The name of the contact.
 * @returns {string} The HTML of the badge.
 */
function getAssignedBadgeTemplate(badgeClass, initials, name) {
    return `<li class="${badgeClass}" aria-label="${name}">${initials}</li>`;
}

/**
 * Returns the HTML for the "+N" badge.
 *
 * @param {number} count - The number of contacts that are not shown.
 * @returns {string} The HTML of the badge.
 */
function getMoreBadgeTemplate(count) {
    return `<li class="badge-user badge-user-more" aria-label="${count} more contacts">+${count}</li>`;
}

/**
 * Returns the HTML for one subtask in the subtask list.
 *
 * @param {string} title - The title of the subtask.
 * @param {boolean} completed - True if the subtask is already done.
 * @returns {string} The HTML of the subtask.
 */
function getSubtaskTemplate(title, completed) {
    return `
        <li class="subtask-item" data-completed="${completed}">
            <span class="subtask-title" onclick="editSubtask(this)">${title}</span>
            <div class="subtask-actions">
                <button type="button" class="subtask-edit-button" aria-label="Edit subtask" onclick="editSubtask(this)">
                    <img src="../assets/icons/edit.svg" alt="">
                </button>
                <span class="subtask-actions-divider subtask-view-divider" aria-hidden="true"></span>
                <button type="button" class="subtask-remove-button" aria-label="Delete subtask"
                    onmousedown="event.preventDefault()" onclick="deleteSubtask(this)">
                    <img src="../assets/icons/delete.svg" alt="">
                </button>
                <span class="subtask-actions-divider subtask-edit-divider" aria-hidden="true"></span>
                <button type="button" class="subtask-save-button" aria-label="Save subtask"
                    onmousedown="event.preventDefault()" onclick="finishSubtaskEdit(this)">
                    <img src="../assets/icons/checkDark.svg" alt="">
                </button>
            </div>
        </li>
    `;
}

/**
 * Returns the HTML for the input that is shown while a subtask is edited.
 *
 * @returns {string} The HTML of the input.
 */
function getSubtaskEditTemplate() {
    return `<input type="text" class="subtask-edit-input" aria-label="Edit subtask"
                onkeydown="handleSubtaskEditKeydown(event)" onblur="saveSubtaskEdit(this)">`;
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