const MAX_VISIBLE_BADGES = 5;

/**
 * Starts the Add Task page and renders the form.
 */
async function initAddTaskPage() {
    const container = document.querySelector(".board-inner.add-task-inner");
    if (!container) return;

    loggedUserId = await loadCurrentUser();
    container.innerHTML = renderAddTask();
    initAddTaskForm(container.querySelector(".task-form-wrapper"));
}

initAddTaskPage();
document.addEventListener("mousedown", closeDropdownsOnOutsideClick);

/**
 * Prepares a rendered task form. If a task is given, the form is filled with its data.
 *
 * @param {HTMLFormElement} form - The task form.
 * @param {string} status - The status the new task gets.
 * @param {Task} task - Optional task whose data is shown in the form.
 */
function initAddTaskForm(form, status = "toDo", task = null) {
    form.dataset.taskStatus = status;
    setMinDueDate(form);
    loadAssignedContacts(form, task);

    if (task) {
        fillTaskForm(form, task);
    }

    updateCreateTaskButton(form);
}

/**
 * Prepares the task form for editing an existing task.
 *
 * @param {HTMLFormElement} form - The task form rendered with renderAddTask(true).
 * @param {string} taskId - The ID of the task.
 * @param {Task} task - The task to edit.
 */
function initEditTaskForm(form, taskId, task) {
    form.dataset.taskId = taskId;
    form.dataset.originalDueDate = task.dueDate || "";
    initAddTaskForm(form, task.status, task);
}

/**
 * Is called on every input or change in the form and updates the form.
 *
 * @param {HTMLFormElement} form - The task form.
 */
function updateTaskForm(form) {
    renderAssignedBadges(form);
    filterAssignedOptions(form);
    updateCreateTaskButton(form);
    revalidateInvalidFields(form);
}

/**
 * Stops the form from being sent when Enter is pressed in an input.
 *
 * @param {KeyboardEvent} event - The keydown event.
 */
function preventEnterSubmit(event) {
    if (event.key === "Enter" && event.target.tagName === "INPUT") {
        event.preventDefault();
    }
}

// ---------- Fill form (edit mode) ----------

/**
 * Fills the form with the data of an existing task.
 *
 * @param {HTMLFormElement} form - The task form.
 * @param {Task} task - The task.
 */
function fillTaskForm(form, task) {
    form.querySelector("#task-title").value = task.title;
    form.querySelector("#task-description").value = task.description || "";
    form.querySelector("#task-due-date").value = task.dueDate;
    fillPriority(form, task.priority);
    fillCategory(form, task.category);
    fillSubtasks(form, task.subtasks);
}

/**
 * Selects the priority button of the task.
 *
 * @param {HTMLFormElement} form - The task form.
 * @param {string} priority - "high", "medium" or "low".
 */
function fillPriority(form, priority) {
    let buttonName = "medium";

    if (priority === "high") buttonName = "urgent";
    if (priority === "low") buttonName = "low";

    selectTaskPriority(form.querySelector("#priority-" + buttonName), buttonName);
}

/**
 * Selects the category of the task.
 *
 * @param {HTMLFormElement} form - The task form.
 * @param {string} category - The category of the task.
 */
function fillCategory(form, category) {
    const radios = form.querySelectorAll('input[name="category"]');

    for (let i = 0; i < radios.length; i++) {
        if (radios[i].value === category) {
            radios[i].checked = true;
            form.querySelector("#task-category button span").textContent = category;
        }
    }
}

/**
 * Shows the subtasks of the task in the subtask list.
 *
 * @param {HTMLFormElement} form - The task form.
 * @param {Object} subtasks - The subtasks of the task.
 */
function fillSubtasks(form, subtasks) {
    if (!subtasks) return;

    const list = form.querySelector("#subtask-list");
    const keys = Object.keys(subtasks).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    for (let i = 0; i < keys.length; i++) {
        const subtask = subtasks[keys[i]];
        list.insertAdjacentHTML("beforeend", getSubtaskTemplate(subtask.title, subtask.completed));
    }
}

// ---------- Assigned contacts ----------

/**
 * Loads the contacts from the database and shows them in the "Assigned to" list.
 *
 * @param {HTMLFormElement} form - The task form.
 * @param {Task} task - Optional task whose contacts are checked.
 */
async function loadAssignedContacts(form, task) {
    try {
        const contacts = await getData(DB_CONTACTS);
        renderAssignedOptions(form, contacts || {}, task);
    } catch (error) {
        console.error("Contacts could not be loaded:", error);
    }
}

/**
 * Renders the contacts sorted by name.
 *
 * @param {HTMLFormElement} form - The task form.
 * @param {Object} contacts - All contacts.
 * @param {Task} task - Optional task whose contacts are checked.
 */
function renderAssignedOptions(form, contacts, task) {
    const assignedTo = task && task.assignedTo ? task.assignedTo : {};
    const contactIds = Object.keys(contacts).filter((id) => contacts[id].name);
    let html = "";

    contactIds.sort((a, b) => contacts[a].name.localeCompare(contacts[b].name));

    for (let i = 0; i < contactIds.length; i++) {
        const contact = contacts[contactIds[i]];
        const initials = contact.initials || getInitialsFromName(contact.name);
        html += getAssignedOptionTemplate(contactIds[i], contact, initials, assignedTo[contactIds[i]] === true);
    }

    form.querySelector("#assigned-options").innerHTML = html;
    renderAssignedBadges(form);
}

/**
 * Shows a badge for every checked contact. If there are too many, "+N" is shown.
 *
 * @param {HTMLFormElement} form - The task form.
 */
function renderAssignedBadges(form) {
    const checkedBoxes = form.querySelectorAll('input[name="assignedTo"]:checked');
    let html = "";

    for (let i = 0; i < checkedBoxes.length && i < MAX_VISIBLE_BADGES; i++) {
        const option = checkedBoxes[i].closest(".assigned-option");
        const badge = option.querySelector(".badge-user");
        const name = option.querySelectorAll("span")[1].textContent;
        html += getAssignedBadgeTemplate(badge.className, badge.textContent, name);
    }

    if (checkedBoxes.length > MAX_VISIBLE_BADGES) {
        html += getMoreBadgeTemplate(checkedBoxes.length - MAX_VISIBLE_BADGES);
    }

    form.querySelector("#assigned-badges").innerHTML = html;
}

/**
 * Shows only the contacts whose name contains the search text.
 *
 * @param {HTMLFormElement} form - The task form.
 */
function filterAssignedOptions(form) {
    const searchText = form.querySelector("#task-assigned").value.trim().toLowerCase();
    const options = form.querySelectorAll("#assigned-options > li");

    for (let i = 0; i < options.length; i++) {
        const name = options[i].textContent.toLowerCase();
        options[i].hidden = !name.includes(searchText);
    }
}

/**
 * Creates initials from the first two parts of a name.
 *
 * @param {string} name - The full name.
 * @returns {string} The initials, e.g. "AM" for "Anton Mayer".
 */
function getInitialsFromName(name) {
    const parts = name.trim().split(" ");
    let initials = parts[0].charAt(0);

    if (parts.length > 1) {
        initials += parts[1].charAt(0);
    }

    return initials.toUpperCase();
}

// ---------- Dropdowns ----------

/**
 * Opens or closes the "Assigned to" list when the field or arrow is clicked.
 * A click into the search field only closes the list if nothing is typed.
 *
 * @param {MouseEvent} event - The mousedown event.
 */
function toggleAssignedDropdown(event) {
    const searchInput = event.currentTarget.querySelector("#task-assigned");

    if (event.target === searchInput && searchInput.value !== "") return;

    toggleDropdown(event, searchInput);
}

/**
 * Opens or closes the category list when the field is clicked.
 *
 * @param {MouseEvent} event - The mousedown event.
 */
function toggleCategoryDropdown(event) {
    toggleDropdown(event, event.currentTarget);
}

/**
 * A dropdown is open while something inside it has the focus.
 * So it is opened by setting the focus and closed by removing it.
 *
 * @param {MouseEvent} event - The mousedown event.
 * @param {HTMLElement} focusElement - The element that gets the focus to open the dropdown.
 */
function toggleDropdown(event, focusElement) {
    const dropdown = focusElement.closest("fieldset");

    event.preventDefault();

    if (dropdown.contains(document.activeElement)) {
        document.activeElement.blur();
    } else {
        focusElement.focus();
    }
}

/**
 * Closes the "Assigned to" list with Escape when the search field is empty.
 *
 * @param {KeyboardEvent} event - The keydown event.
 */
function closeAssignedOnEscape(event) {
    if (event.key === "Escape" && event.target.value === "") {
        event.preventDefault();
        event.target.blur();
    }
}

/**
 * Closes an open dropdown when the user clicks somewhere outside of it.
 *
 * @param {MouseEvent} event - The mousedown event.
 */
function closeDropdownsOnOutsideClick(event) {
    const dropdowns = document.querySelectorAll(".assigned-dropdown, .category-field");

    for (let i = 0; i < dropdowns.length; i++) {
        if (dropdowns[i].contains(document.activeElement) && !dropdowns[i].contains(event.target)) {
            document.activeElement.blur();
        }
    }
}

/**
 * Shows the selected category in the field and closes the list.
 *
 * @param {Event} event - The change event of the category field.
 */
function selectTaskCategory(event) {
    const field = event.currentTarget;
    const selectedCategory = event.target;

    if (!selectedCategory.matches('input[name="category"]')) return;

    field.querySelector("button span").textContent = selectedCategory.value;
    selectedCategory.blur();
    field.querySelector("button").blur();
}

/**
 * Activates the clicked priority button.
 *
 * @param {HTMLButtonElement} selectedButton - The clicked button.
 * @param {string} priority - "urgent", "medium" or "low".
 */
function selectTaskPriority(selectedButton, priority) {
    const buttons = selectedButton.closest(".task-priority").querySelectorAll("button");

    for (let i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove("urgent", "medium", "low");
        buttons[i].setAttribute("aria-pressed", buttons[i] === selectedButton);
    }

    selectedButton.classList.add(priority);
}

// ---------- Subtasks ----------

/**
 * Adds a subtask when Enter is pressed in the subtask field.
 *
 * @param {KeyboardEvent} event - The keydown event.
 */
function addSubtaskOnEnter(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        addSubtask(event.target.form);
    }
}

/**
 * Adds the text of the subtask field as a new subtask.
 *
 * @param {HTMLFormElement} form - The task form.
 */
function addSubtask(form) {
    const input = form.querySelector("#subtask");
    const title = input.value.trim();

    if (title === "") return;

    form.querySelector("#subtask-list").insertAdjacentHTML("beforeend", getSubtaskTemplate(title, false));
    input.value = "";
    input.focus();
}

/**
 * Deletes a subtask.
 *
 * @param {HTMLButtonElement} button - The clicked delete button.
 */
function deleteSubtask(button) {
    button.closest(".subtask-item").remove();
}

/**
 * Shows an input to edit the title of a subtask.
 *
 * @param {HTMLElement} element - The clicked edit button or subtask title.
 */
function editSubtask(element) {
    const item = element.closest(".subtask-item");
    const title = item.querySelector(".subtask-title");

    if (item.classList.contains("is-editing")) return;

    title.insertAdjacentHTML("afterend", getSubtaskEditTemplate());
    const input = item.querySelector(".subtask-edit-input");
    input.value = title.textContent;

    title.hidden = true;
    item.classList.add("is-editing");
    input.focus();
}

/**
 * Enter saves the edited subtask, Escape discards the change.
 *
 * @param {KeyboardEvent} event - The keydown event.
 */
function handleSubtaskEditKeydown(event) {
    const input = event.target;

    if (event.key === "Escape") {
        event.preventDefault();
        input.value = input.previousElementSibling.textContent;
        input.blur();
    }

    if (event.key === "Enter") {
        event.preventDefault();
        input.blur();
    }
}

/**
 * Saves the edited title. An empty title deletes the subtask.
 *
 * @param {HTMLInputElement} input - The edit input.
 */
function saveSubtaskEdit(input) {
    const item = input.closest(".subtask-item");
    if (!item) return;

    const title = item.querySelector(".subtask-title");
    const newTitle = input.value.trim();

    input.remove();
    item.classList.remove("is-editing");

    if (newTitle === "") {
        item.remove();
        return;
    }

    title.textContent = newTitle;
    title.hidden = false;
}

/**
 * Collects all subtasks of the form for the database.
 *
 * @param {HTMLFormElement} form - The task form.
 * @returns {Object} The subtasks, e.g. { subtask1: { title, completed } }.
 */
function getTaskSubtasks(form) {
    const items = form.querySelectorAll("#subtask-list .subtask-item");
    const subtasks = {};

    for (let i = 0; i < items.length; i++) {
        subtasks["subtask" + (i + 1)] = {
            title: items[i].querySelector(".subtask-title").textContent,
            completed: items[i].dataset.completed === "true",
        };
    }

    return subtasks;
}

// ---------- Validation ----------

/**
 * Sets the earliest selectable due date to today.
 * When editing, an old due date of the task can still be kept.
 *
 * @param {HTMLFormElement} form - The task form.
 */
function setMinDueDate(form) {
    const today = getTodayAsIsoDate();
    const originalDate = form.dataset.originalDueDate;
    let minDate = today;

    if (originalDate && originalDate < today) {
        minDate = originalDate;
    }

    form.querySelector("#task-due-date").min = minDate;
}

/**
 * Returns an error message if the due date is in the past.
 *
 * @param {HTMLFormElement} form - The task form.
 * @returns {string} The error message or an empty string.
 */
function getPastDateError(form) {
    const dueDate = form.querySelector("#task-due-date").value;
    const isPast = dueDate !== "" && dueDate < getTodayAsIsoDate();
    const isOriginalDate = dueDate === form.dataset.originalDueDate;

    if (isPast && !isOriginalDate) {
        return "The due date cannot be in the past.";
    }

    return "";
}

/**
 * Checks if all required fields are filled correctly.
 *
 * @param {HTMLFormElement} form - The task form.
 * @returns {boolean} True if the task can be saved.
 */
function isTaskFormValid(form) {
    const title = form.querySelector("#task-title").value.trim();
    const dueDate = form.querySelector("#task-due-date").value;
    const category = form.querySelector('input[name="category"]:checked');

    return title !== "" && dueDate !== "" && category !== null && getPastDateError(form) === "";
}

/**
 * Enables the submit button only if the form is valid.
 *
 * @param {HTMLFormElement} form - The task form.
 */
function updateCreateTaskButton(form) {
    form.querySelector('button[type="submit"]').disabled = !isTaskFormValid(form);
}

/**
 * Shows an error if the title is empty.
 *
 * @param {HTMLFormElement} form - The task form.
 */
function validateTitle(form) {
    const input = form.querySelector("#task-title");
    let message = "";

    if (input.value.trim() === "") {
        message = "This field is required";
    }

    showFieldError(input, form.querySelector("#task-title-error"), message);
}

/**
 * Shows an error if the due date is empty or in the past.
 *
 * @param {HTMLFormElement} form - The task form.
 */
function validateDueDate(form) {
    const input = form.querySelector("#task-due-date");
    let message = getPastDateError(form);

    if (input.value === "") {
        message = "This field is required";
    }

    showFieldError(input, form.querySelector("#task-due-date-error"), message);
}

/**
 * Shows an error if no category is selected.
 *
 * @param {HTMLFormElement} form - The task form.
 */
function validateCategory(form) {
    const category = form.querySelector('input[name="category"]:checked');
    let message = "";

    if (category === null) {
        message = "This field is required";
    }

    showFieldError(form.querySelector("#task-category > button"), form.querySelector("#task-category-error"), message);
}

/**
 * Checks the category when the user leaves the category field.
 *
 * @param {FocusEvent} event - The focusout event.
 */
function checkCategoryOnLeave(event) {
    const field = event.currentTarget;

    if (!field.contains(event.relatedTarget)) {
        validateCategory(field.form);
    }
}

/**
 * Checks fields that already show an error again,
 * so the error disappears as soon as the field is correct.
 *
 * @param {HTMLFormElement} form - The task form.
 */
function revalidateInvalidFields(form) {
    if (form.querySelector("#task-title.is-invalid")) validateTitle(form);
    if (form.querySelector("#task-due-date.is-invalid")) validateDueDate(form);
    if (form.querySelector("#task-category > button.is-invalid")) validateCategory(form);
}

/**
 * Shows all error messages at once.
 *
 * @param {HTMLFormElement} form - The task form.
 */
function showAllFieldErrors(form) {
    validateTitle(form);
    validateDueDate(form);
    validateCategory(form);
}

/**
 * Shows or hides the error message of a field.
 *
 * @param {HTMLElement} field - The field with the red border.
 * @param {HTMLElement} errorElement - The element for the message.
 * @param {string} message - The error message, empty if there is no error.
 */
function showFieldError(field, errorElement, message) {
    if (message === "") {
        field.classList.remove("is-invalid");
    } else {
        field.classList.add("is-invalid");
    }

    errorElement.textContent = message;
}

/**
 * Removes all error messages from the form.
 *
 * @param {HTMLFormElement} form - The task form.
 */
function clearFieldErrors(form) {
    const invalidFields = form.querySelectorAll(".is-invalid");
    const errorMessages = form.querySelectorAll(".field-error");

    for (let i = 0; i < invalidFields.length; i++) {
        invalidFields[i].classList.remove("is-invalid");
    }

    for (let i = 0; i < errorMessages.length; i++) {
        errorMessages[i].textContent = "";
    }
}

/**
 * Returns today's date as YYYY-MM-DD.
 *
 * @returns {string} The date of today.
 */
function getTodayAsIsoDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return year + "-" + month + "-" + day;
}

// ---------- Reset ----------

/**
 * Resets the parts of the form that are not reset by the browser.
 *
 * @param {HTMLFormElement} form - The task form.
 */
function resetTaskForm(form) {
    selectTaskPriority(form.querySelector("#priority-medium"), "medium");
    form.querySelector("#task-category button span").textContent = "Select task category";
    form.querySelector("#subtask-list").innerHTML = "";
    clearFieldErrors(form);

    // The browser resets the inputs after this function, so the form is updated afterwards
    setTimeout(() => updateTaskForm(form), 0);
}

// ---------- Save ----------

/**
 * Is called when the form is sent. Creates a new task or saves the edited task.
 *
 * @param {SubmitEvent} event - The submit event.
 */
function submitTaskForm(event) {
    const form = event.target;
    event.preventDefault();

    if (!isTaskFormValid(form)) {
        showAllFieldErrors(form);
        return;
    }

    if (form.dataset.taskId) {
        updateTask(form);
    } else {
        createTask(form);
    }
}

/**
 * Saves a new task in the database.
 *
 * @param {HTMLFormElement} form - The task form.
 */
async function createTask(form) {
    const task = getTaskFromForm(form);
    form.querySelector('button[type="submit"]').disabled = true;

    try {
        const tasks = await getData(DB_TASKS);
        const taskId = getNextTaskId(tasks || {});

        await putData(DB_TASKS + taskId, task);
        finishTaskCreation(form, taskId, task);
    } catch (error) {
        console.error("Creating task has failed:", error);
        showNotification("Task could not be created. Please try again.");
        updateCreateTaskButton(form);
    }
}

/**
 * Shows a message after a new task was saved.
 * In the board dialog the dialog closes and the board is informed with the event "taskcreated".
 * On the Add Task page the user is sent to the board.
 *
 * @param {HTMLFormElement} form - The task form.
 * @param {string} taskId - The ID of the new task.
 * @param {Task} task - The new task.
 */
function finishTaskCreation(form, taskId, task) {
    const dialog = form.closest("dialog");

    if (dialog) {
        document.dispatchEvent(new CustomEvent("taskcreated", { detail: { taskId: taskId, task: task } }));
        dialog.dataset.notification = "Task added to board";
        dialog.classList.add("dialog-task-closing");
    } else {
        showNotification("Task added to board");
        setTimeout(goToBoard, 1200);
    }
}

/**
 * Opens the board page.
 */
function goToBoard() {
    window.location.href = "./board.html?user=" + loggedUserId;
}

/**
 * Saves the edited task in the database and informs the board with the event "taskupdated".
 *
 * @param {HTMLFormElement} form - The task form.
 */
async function updateTask(form) {
    const taskId = form.dataset.taskId;
    const task = getTaskFromForm(form);
    form.querySelector('button[type="submit"]').disabled = true;

    try {
        await putData(DB_TASKS + taskId, task);
        document.dispatchEvent(new CustomEvent("taskupdated", { detail: { taskId: taskId, task: task } }));
    } catch (error) {
        console.error("Updating task has failed:", error);
        showNotification("Task could not be saved. Please try again.");
    }

    updateCreateTaskButton(form);
}

/**
 * Creates the task object for the database from the form.
 *
 * @param {HTMLFormElement} form - The task form.
 * @returns {Task} The task.
 */
function getTaskFromForm(form) {
    return {
        title: form.querySelector("#task-title").value.trim(),
        description: form.querySelector("#task-description").value.trim(),
        dueDate: form.querySelector("#task-due-date").value,
        priority: getSelectedPriority(form),
        category: form.querySelector('input[name="category"]:checked').value,
        status: form.dataset.taskStatus,
        assignedTo: getAssignedContacts(form),
        subtasks: getTaskSubtasks(form),
    };
}

/**
 * Returns the selected priority in the format of the database.
 *
 * @param {HTMLFormElement} form - The task form.
 * @returns {string} "high", "medium" or "low".
 */
function getSelectedPriority(form) {
    if (form.querySelector("#priority-urgent").classList.contains("urgent")) return "high";
    if (form.querySelector("#priority-low").classList.contains("low")) return "low";
    return "medium";
}

/**
 * Returns the checked contacts, e.g. { contact1: true, contact3: true }.
 *
 * @param {HTMLFormElement} form - The task form.
 * @returns {Object} The assigned contacts.
 */
function getAssignedContacts(form) {
    const checkedBoxes = form.querySelectorAll('input[name="assignedTo"]:checked');
    const assignedTo = {};

    for (let i = 0; i < checkedBoxes.length; i++) {
        assignedTo[checkedBoxes[i].value] = true;
    }

    return assignedTo;
}

/**
 * Finds the highest task number and returns the next free task ID.
 *
 * @param {Object} tasks - All existing tasks.
 * @returns {string} The new task ID, e.g. "task11".
 */
function getNextTaskId(tasks) {
    const taskIds = Object.keys(tasks);
    let highestNumber = 0;

    for (let i = 0; i < taskIds.length; i++) {
        const number = Number(taskIds[i].replace("task", ""));

        if (number > highestNumber) {
            highestNumber = number;
        }
    }

    return "task" + (highestNumber + 1);
}
