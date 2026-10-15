/**
 * Bootstraps the Add Task page: renders the template into the page's
 * container and wires the form behaviors.
 */
async function initAddTaskPage() {
    const container = document.querySelector(".board-inner.add-task-inner");
    if (!container) return;

    loggedUserId = await loadCurrentUser();
    container.innerHTML = renderAddTask();
    initAddTaskForm(container.querySelector(".task-form-wrapper"));
}

initAddTaskPage();

/**
 * Wires all behaviors of a rendered Add Task form.
 * Can be used by the Add Task page and by an Add Task dialog.
 *
 * @param {HTMLFormElement} form - The Add Task form.
 * @param {Task["status"]} [status="toDo"] - The status the new task receives.
 * @param {Task|null} [task=null] - A task whose values prefill the form (edit mode).
 */
function initAddTaskForm(form, status = "toDo", task = null) {
    form.dataset.taskStatus = status;

    disableHtml5Validation(form);
    initializeSubtasks(form);
    initializeTaskDate(form);
    initializeAssignedContacts(form, Object.keys(task?.assignedTo ?? {}));
    initializeAssignedSearch(form);
    initializeDropdownToggles(form);
    initializeFieldValidation(form);

    if (task) fillTaskForm(form, task);

    updateCreateTaskButton(form);

    form.addEventListener("keydown", preventEnterSubmit);
    form.addEventListener("input", () => updateCreateTaskButton(form));
    form.addEventListener("change", () => updateCreateTaskButton(form));

    form.addEventListener("reset", () => {
        requestAnimationFrame(() => {
            renderAssignedBadges(form);
            updateCreateTaskButton(form);
        });
    });

    form.addEventListener("submit", form.dataset.taskId ? updateTask : createTask);
}

/**
 * Wires a task form rendered with `renderAddTask(true)` for editing an existing task.
 * After saving, a "taskupdated" event is dispatched on `document`
 * with `detail: { taskId, task }`.
 *
 * @example
 * dialog.innerHTML = renderAddTask(true);
 * initEditTaskForm(dialog.querySelector(".task-form-wrapper"), taskId, task);
 *
 * @param {HTMLFormElement} form - The task form.
 * @param {string} taskId - The key of the task to edit.
 * @param {Task} task - The task to edit.
 */
function initEditTaskForm(form, taskId, task) {
    form.dataset.taskId = taskId;
    form.dataset.originalDueDate = task.dueDate ?? "";
    initAddTaskForm(form, task.status, task);
}

/**
 * Prefills the form with the values of an existing task.
 * Assigned contacts are checked when the contacts have been loaded.
 *
 * @param {HTMLFormElement} form - The task form.
 * @param {Task} task - The task whose values are shown.
 */
function fillTaskForm(form, task) {
    form.querySelector("#task-title").value = task.title ?? "";
    form.querySelector("#task-description").value = task.description ?? "";
    form.querySelector("#task-due-date").value = task.dueDate ?? "";

    fillTaskPriority(form, task.priority);
    fillTaskCategory(form, task.category);
    fillTaskSubtasks(form, task.subtasks);
}

/**
 * Activates the priority button that matches the task's priority.
 *
 * @param {HTMLFormElement} form - The task form.
 * @param {string} [priority] - The stored priority ("high", "medium" or "low").
 */
function fillTaskPriority(form, priority = "medium") {
    const priorityClass = { high: "urgent", medium: "medium", low: "low" }[priority.toLowerCase()] ?? "medium";

    selectTaskPriority(form.querySelector(`#priority-${priorityClass}`), priorityClass);
}

/**
 * Selects the task's category and shows it in the category field.
 *
 * @param {HTMLFormElement} form - The task form.
 * @param {string} [category] - The stored category.
 */
function fillTaskCategory(form, category) {
    const radio = [...form.querySelectorAll('input[name="category"]')].find((input) => input.value === category);
    if (!radio) return;

    radio.checked = true;
    form.querySelector("#task-category button span").textContent = category;
}

/**
 * Shows the task's subtasks in the subtask list, keeping their completion state.
 *
 * @param {HTMLFormElement} form - The task form.
 * @param {Object<string, Subtask>} [subtasks] - The stored subtasks.
 */
function fillTaskSubtasks(form, subtasks = {}) {
    const list = form.querySelector("#subtask-list");

    Object.entries(subtasks)
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB, undefined, { numeric: true }))
        .forEach(([, subtask]) => list.append(createSubtaskItem(subtask.title, subtask.completed)));
}

/**
 * Disables the browser's built-in HTML5 form validation.
 *
 * @param {HTMLFormElement} form - The Add Task form.
 */
function disableHtml5Validation(form) {
    if (!form) return;

    form.setAttribute("novalidate", "novalidate");
    form.noValidate = true;
}

/**
 * Prevents Enter inside an input from submitting the form.
 * The task is only created via the Create Task button.
 *
 * @param {KeyboardEvent} event - The keydown event.
 */
function preventEnterSubmit(event) {
    if (event.key === "Enter" && event.target.matches("input")) {
        event.preventDefault();
    }
}

/**
 * Lets the dropdown fields open and close by clicking anywhere on them,
 * including the arrow icon. A click outside or Escape closes them.
 * A click into the search field only closes the contact list while nothing is typed,
 * so the cursor can still be placed inside a search term.
 *
 * @param {HTMLFormElement} form - The Add Task form.
 */
function initializeDropdownToggles(form) {
    const assignedField = form.querySelector(".assigned-dropdown");
    const searchInput = form.querySelector("#task-assigned");
    const categoryField = form.querySelector("#task-category");
    const categoryButton = categoryField?.querySelector("button");

    assignedField?.querySelector(".input-wrapper").addEventListener("mousedown", (event) => {
        if (event.target === searchInput && searchInput.value !== "") return;
        toggleDropdown(event, assignedField, searchInput);
    });

    searchInput?.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && searchInput.value === "") {
            event.preventDefault();
            searchInput.blur();
        }
    });

    categoryButton?.addEventListener("mousedown", (event) => {
        toggleDropdown(event, categoryField, categoryButton);
    });

    closeDropdownsOnOutsideClick(form, [assignedField, categoryField]);
}

/**
 * Closes an open dropdown when the user clicks anywhere outside of it.
 * The listener removes itself once the form is no longer part of the page
 * (e.g. after the board dialog was re-rendered).
 *
 * @param {HTMLFormElement} form - The Add Task form.
 * @param {(HTMLElement|null)[]} fields - The dropdown fields.
 */
function closeDropdownsOnOutsideClick(form, fields) {
    function handleOutsideClick(event) {
        if (!form.isConnected) {
            document.removeEventListener("mousedown", handleOutsideClick);
            return;
        }

        fields.forEach((field) => {
            if (field && !field.contains(event.target) && field.contains(document.activeElement)) {
                document.activeElement.blur();
            }
        });
    }

    document.addEventListener("mousedown", handleOutsideClick);
}

/**
 * Opens a dropdown by focusing it or closes it by removing the focus.
 *
 * @param {MouseEvent} event - The mousedown event.
 * @param {HTMLElement} field - The dropdown field.
 * @param {HTMLElement} focusTarget - The element that opens the dropdown when focused.
 */
function toggleDropdown(event, field, focusTarget) {
    event.preventDefault();

    if (field.contains(document.activeElement)) {
        document.activeElement.blur();
    } else {
        focusTarget.focus();
    }
}

/**
 * Shows error messages for required fields once the user leaves them.
 *
 * @param {HTMLFormElement} form - The Add Task form.
 */
function initializeFieldValidation(form) {
    const titleInput = form.querySelector("#task-title");
    const dueDateInput = form.querySelector("#task-due-date");
    const categoryField = form.querySelector("#task-category");

    titleInput?.addEventListener("blur", () => validateTitle(form));
    dueDateInput?.addEventListener("blur", () => validateDueDate(form));
    categoryField?.addEventListener("focusout", (event) => {
        if (!categoryField.contains(event.relatedTarget)) validateCategory(form);
    });

    form.addEventListener("input", () => revalidateInvalidFields(form));
    form.addEventListener("change", () => revalidateInvalidFields(form));
}

/**
 * Updates the error messages of fields that are already marked as invalid,
 * so the error disappears as soon as the input is corrected.
 *
 * @param {HTMLFormElement} form - The Add Task form.
 */
function revalidateInvalidFields(form) {
    if (form.querySelector("#task-title.is-invalid")) validateTitle(form);
    if (form.querySelector("#task-due-date.is-invalid")) validateDueDate(form);
    if (form.querySelector("#task-category > button.is-invalid")) validateCategory(form);
}

/**
 * Shows an error if the title is empty.
 *
 * @param {HTMLFormElement} form - The Add Task form.
 */
function validateTitle(form) {
    const titleInput = form.querySelector("#task-title");
    const message = titleInput.value.trim() ? "" : "This field is required";

    setFieldError(titleInput, form.querySelector("#task-title-error"), message);
}

/**
 * Shows an error if the due date is empty or in the past.
 *
 * @param {HTMLFormElement} form - The Add Task form.
 */
function validateDueDate(form) {
    const dueDateInput = form.querySelector("#task-due-date");
    const message = dueDateInput.value
        ? getPastDueDateError(dueDateInput.value, form.dataset.originalDueDate)
        : "This field is required";

    setFieldError(dueDateInput, form.querySelector("#task-due-date-error"), message);
}

/**
 * Shows an error if no category is selected.
 *
 * @param {HTMLFormElement} form - The Add Task form.
 */
function validateCategory(form) {
    const selectedCategory = form.querySelector('input[name="category"]:checked');
    const message = selectedCategory ? "" : "This field is required";

    setFieldError(
        form.querySelector("#task-category > button"),
        form.querySelector("#task-category-error"),
        message
    );
}

/**
 * Marks a field as invalid and shows the message, or clears both.
 *
 * @param {HTMLElement} field - The field to mark.
 * @param {HTMLElement} errorElement - The element showing the message.
 * @param {string} message - The error message, empty if the field is valid.
 */
function setFieldError(field, errorElement, message) {
    if (!field || !errorElement) return;

    field.classList.toggle("is-invalid", message !== "");
    errorElement.textContent = message;
}

/**
 * Removes all error messages from the form.
 *
 * @param {HTMLFormElement} form - The Add Task form.
 */
function clearFieldErrors(form) {
    form.querySelectorAll(".is-invalid").forEach((field) => field.classList.remove("is-invalid"));
    form.querySelectorAll(".field-error").forEach((error) => (error.textContent = ""));
}

/**
 * Loads contacts and creates the assignment options.
 *
 * @param {HTMLFormElement} form - The Add Task form.
 * @param {string[]} [assignedContactIds=[]] - IDs of contacts that are checked initially.
 * @returns {Promise<void>}
 */
async function initializeAssignedContacts(form, assignedContactIds = []) {
    const options = form.querySelector("#assigned-options");

    if (!options) return;

    try {
        const contactDirectory = await getData(DB_CONTACTS);

        options.replaceChildren();

        Object.entries(contactDirectory ?? {})
            .sort(([, a], [, b]) => (a.name ?? "").localeCompare(b.name ?? ""))
            .forEach(([contactId, contact]) => {
            const name = contact.name?.trim();
            if (!name) return;

            const initials = contact.initials || getInitialsFromName(name);

            const item = document.createElement("li");
            const label = document.createElement("label");
            const badge = document.createElement("span");
            const nameLabel = document.createElement("span");
            const checkbox = document.createElement("input");

            label.className = "assigned-option";

            badge.className = `badge-user ${contact.colorClass || ""}`.trim();
            badge.textContent = initials;

            nameLabel.textContent = name;

            checkbox.type = "checkbox";
            checkbox.name = "assignedTo";
            checkbox.value = contactId;
            checkbox.checked = assignedContactIds.includes(contactId);

            checkbox.addEventListener("change", () => {
                renderAssignedBadges(form);
                updateCreateTaskButton(form);
            });

            label.append(badge, nameLabel, checkbox);
            item.append(label);
            options.append(item);
        });

        renderAssignedBadges(form);
    } catch (error) {
        console.error("Contacts for task assignment could not be loaded:", error);
    }
}

/**
 * Filters the contact options while typing into the assignment search field.
 *
 * @param {HTMLFormElement} form - The Add Task form.
 */
function initializeAssignedSearch(form) {
    const searchInput = form.querySelector("#task-assigned");
    if (!searchInput) return;

    searchInput.addEventListener("input", () => filterAssignedOptions(form, searchInput.value));
}

/**
 * Shows only the contact options whose name contains the search term.
 *
 * @param {HTMLFormElement} form - The Add Task form.
 * @param {string} searchTerm - The text entered into the search field.
 */
function filterAssignedOptions(form, searchTerm) {
    const term = searchTerm.trim().toLowerCase();

    form.querySelectorAll("#assigned-options > li").forEach((item) => {
        item.hidden = !item.textContent.toLowerCase().includes(term);
    });
}

/**
 * Maximum number of badges shown for assigned contacts before "+N" is shown.
 */
const MAX_VISIBLE_ASSIGNED_BADGES = 5;

/**
 * Renders a badge for every checked contact.
 * If more contacts are checked than fit, the rest is summarized as "+N".
 *
 * @param {HTMLFormElement} form - The Add Task form.
 */
function renderAssignedBadges(form) {
    const badges = form.querySelector("#assigned-badges");
    if (!badges) return;

    badges.replaceChildren();

    const checkedContacts = [...form.querySelectorAll('input[name="assignedTo"]:checked')];
    const hiddenCount = checkedContacts.length - MAX_VISIBLE_ASSIGNED_BADGES;

    checkedContacts.slice(0, MAX_VISIBLE_ASSIGNED_BADGES).forEach((checkbox) => {
        const option = checkbox.closest(".assigned-option");
        const sourceBadge = option?.querySelector(".badge-user");

        if (!sourceBadge) return;

        const badge = document.createElement("li");
        const name = option.querySelectorAll("span")[1]?.textContent || "Assigned contact";

        badge.className = sourceBadge.className;
        badge.textContent = sourceBadge.textContent;
        badge.setAttribute("aria-label", name);

        badges.append(badge);
    });

    if (hiddenCount > 0) {
        const moreBadge = document.createElement("li");

        moreBadge.className = "badge-user badge-user-more";
        moreBadge.textContent = `+${hiddenCount}`;
        moreBadge.setAttribute("aria-label", `${hiddenCount} more contacts`);

        badges.append(moreBadge);
    }
}

/**
 * Creates initials from the first two parts of a name.
 *
 * @param {string} name - The complete name.
 * @returns {string} The generated initials.
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

/**
 * Enables adding subtasks with Enter as well as the adjacent add button.
 *
 * @param {HTMLFormElement} form - The Add Task form.
 */
function initializeSubtasks(form) {
    const subtaskInput = form?.querySelector("#subtask");
    if (!subtaskInput) return;

    subtaskInput.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;

        event.preventDefault();
        addSubtask(form);
    });
}

/**
 * Adds a subtask to the current task form.
 *
 * @param {HTMLFormElement} form - The Add Task form.
 */
function addSubtask(form) {
    const input = form?.querySelector("#subtask");
    const list = form?.querySelector("#subtask-list");
    const title = input?.value.trim();

    if (!input || !list || !title) return;

    list.append(createSubtaskItem(title));
    input.value = "";
    input.focus();
}

/**
 * Creates a subtask list item with edit and delete actions.
 *
 * @param {string} title - The subtask title.
 * @param {boolean} [completed=false] - Whether the subtask is already done.
 * @returns {HTMLLIElement} The subtask list item.
 */
function createSubtaskItem(title, completed = false) {
    const item = document.createElement("li");
    item.className = "subtask-item";
    item.dataset.completed = String(Boolean(completed));
    item.innerHTML = `
        <span class="subtask-title"></span>
        <div class="subtask-actions">
            <button type="button" class="subtask-edit-button" aria-label="Edit subtask">
                <img src="../assets/icons/edit.svg" alt="">
            </button>
            <span class="subtask-actions-divider" aria-hidden="true"></span>
            <button type="button" class="subtask-remove-button" aria-label="Delete subtask">
                <img src="../assets/icons/delete.svg" alt="">
            </button>
        </div>
    `;

    const titleElement = item.querySelector(".subtask-title");
    titleElement.textContent = title;
    titleElement.addEventListener("dblclick", () => editSubtask(item));
    item.querySelector(".subtask-edit-button").addEventListener("click", () => editSubtask(item));
    item.querySelector(".subtask-remove-button").addEventListener("click", () => item.remove());

    return item;
}

/**
 * Replaces the subtask title with an input to edit it.
 * Enter or leaving the field saves, Escape discards the change.
 *
 * @param {HTMLLIElement} item - The subtask list item.
 */
function editSubtask(item) {
    if (item.querySelector(".subtask-edit-input")) return;

    const titleElement = item.querySelector(".subtask-title");
    const input = document.createElement("input");

    input.type = "text";
    input.className = "subtask-edit-input";
    input.value = titleElement.textContent;
    input.setAttribute("aria-label", "Edit subtask");

    input.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== "Escape") return;

        event.preventDefault();
        if (event.key === "Escape") input.value = titleElement.textContent;
        input.blur();
    });
    input.addEventListener("blur", () => saveSubtaskEdit(item, input));

    titleElement.hidden = true;
    titleElement.after(input);
    item.classList.add("is-editing");
    input.focus();
}

/**
 * Applies the edited title, removing the subtask if the title is empty.
 *
 * @param {HTMLLIElement} item - The subtask list item.
 * @param {HTMLInputElement} input - The edit input.
 */
function saveSubtaskEdit(item, input) {
    const titleElement = item.querySelector(".subtask-title");
    const newTitle = input.value.trim();

    input.remove();
    item.classList.remove("is-editing");
    if (!newTitle) return item.remove();

    titleElement.textContent = newTitle;
    titleElement.hidden = false;
}

/**
 * Creates an object containing the task's subtasks.
 *
 * @param {HTMLFormElement} form - The Add Task form.
 * @returns {Object} The task's subtasks.
 */
function getTaskSubtasks(form) {
    return Object.fromEntries(
        [...form.querySelectorAll("#subtask-list .subtask-item")].map((item, index) => [
            `subtask${index + 1}`,
            {
                title: item.querySelector(".subtask-title").textContent,
                completed: item.dataset.completed === "true",
            },
        ])
    );
}

/**
 * Updates the category field and closes its dropdown.
 *
 * @param {Event} event - The category change event.
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
 * @param {string} priority - The selected priority.
 */
function selectTaskPriority(selectedButton, priority) {
    const buttons = selectedButton
        .closest(".task-priority")
        .querySelectorAll("button");

    buttons.forEach((button) => {
        button.classList.remove("urgent", "medium", "low");
        button.setAttribute("aria-pressed", button === selectedButton);
    });

    selectedButton.classList.add(priority);
}

/**
 * Restores the form's custom UI state when it is cleared.
 *
 * @param {HTMLFormElement} form - The form being reset.
 */
function resetTaskForm(form) {
    selectTaskPriority(form.querySelector("#priority-medium"), "medium");
    form.querySelector("#task-category button span").textContent = "Select task category";
    form.querySelector("#subtask-list")?.replaceChildren();
    filterAssignedOptions(form, "");
    clearFieldErrors(form);
}

/**
 * Sets today's date as the earliest selectable due date.
 * When editing, an already past due date of the task stays selectable.
 *
 * @param {HTMLFormElement} form - The Add Task form.
 */
function initializeTaskDate(form) {
    const dueDateInput = form.querySelector("#task-due-date");
    if (!dueDateInput) return;

    const today = getTodayAsIsoDate();
    const originalDueDate = form.dataset.originalDueDate;

    dueDateInput.min = originalDueDate && originalDueDate < today ? originalDueDate : today;
}

/**
 * Enables Create Task only when required fields are filled and valid.
 *
 * @param {HTMLFormElement} form - The Add Task form.
 */
function updateCreateTaskButton(form) {
    const button = form.querySelector('button[type="submit"]');
    const titleInput = form.querySelector("#task-title");
    const dueDateInput = form.querySelector("#task-due-date");
    const selectedCategory = form.querySelector('input[name="category"]:checked');

    if (!button || !titleInput || !dueDateInput) return;

    applyDueDateValidity(dueDateInput);

    const requiredFieldsFilled =
        titleInput.value.trim() !== "" &&
        dueDateInput.value !== "" &&
        selectedCategory !== null;

    button.disabled = !requiredFieldsFilled || !form.checkValidity();
}

/**
 * Returns an error message if the due date lies in the past.
 *
 * @param {string} dueDate - The due date as YYYY-MM-DD.
 * @param {string} [allowedDate=""] - A past date that is still accepted (the original date when editing).
 * @returns {string} The error message, or an empty string if the date is valid.
 */
function getPastDueDateError(dueDate, allowedDate = "") {
    return dueDate && dueDate < getTodayAsIsoDate() && dueDate !== allowedDate
        ? "The due date cannot be in the past."
        : "";
}

/**
 * Marks the due date input as invalid if its date lies in the past.
 *
 * @param {HTMLInputElement} dueDateInput - The due date input.
 */
function applyDueDateValidity(dueDateInput) {
    const allowedDate = dueDateInput.form?.dataset.originalDueDate;

    dueDateInput.setCustomValidity(getPastDueDateError(dueDateInput.value, allowedDate));
}

/**
 * Returns today's local date as YYYY-MM-DD.
 *
 * @returns {string}
 */
function getTodayAsIsoDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

/**
 * Validates and stores a new task.
 *
 * @param {SubmitEvent} event - The form submit event.
 * @returns {Promise<void>}
 */
async function createTask(event) {
    event.preventDefault();

    const form = event.currentTarget;
    if (!validateTaskForm(form)) return;

    const task = getTaskFromForm(form);
    const submitButton = form.querySelector('button[type="submit"]');

    submitButton.disabled = true;

    try {
        const tasks = (await getData(DB_TASKS)) ?? {};
        const taskId = getNextTaskId(tasks);

        await putData(DB_TASKS + taskId, task);
        finishTaskCreation(form, taskId, task);
    } catch (error) {
        console.error("Creating Task has failed:", error);
        showNotification("Task could not be created. Please try again.");
        updateCreateTaskButton(form);
    }
}

/**
 * Validates and saves the changes of an edited task.
 * Dispatches "taskupdated" on `document` with `detail: { taskId, task }` afterwards.
 *
 * @param {SubmitEvent} event - The form submit event.
 * @returns {Promise<void>}
 */
async function updateTask(event) {
    event.preventDefault();

    const form = event.currentTarget;
    if (!validateTaskForm(form)) return;

    const taskId = form.dataset.taskId;
    const task = getTaskFromForm(form);
    const submitButton = form.querySelector('button[type="submit"]');

    submitButton.disabled = true;

    try {
        await putData(DB_TASKS + taskId, task);
        document.dispatchEvent(new CustomEvent("taskupdated", { detail: { taskId, task } }));
    } catch (error) {
        console.error("Updating Task has failed:", error);
        showNotification("Task could not be saved. Please try again.");
    }

    updateCreateTaskButton(form);
}

/**
 * Checks all required fields and shows their error messages if invalid.
 *
 * @param {HTMLFormElement} form - The task form.
 * @returns {boolean} True if the form is valid.
 */
function validateTaskForm(form) {
    applyDueDateValidity(form.querySelector("#task-due-date"));

    if (form.checkValidity()) return true;

    validateTitle(form);
    validateDueDate(form);
    validateCategory(form);
    updateCreateTaskButton(form);
    return false;
}

/**
 * Gives feedback after a task was saved.
 * In a dialog the dialog closes and a "taskcreated" event is dispatched
 * (detail: { taskId, task }) so the board can show the new task,
 * on the Add Task page the user is forwarded to the board.
 *
 * @param {HTMLFormElement} form - The Add Task form.
 * @param {string} taskId - The key of the saved task.
 * @param {Task} task - The saved task.
 */
function finishTaskCreation(form, taskId, task) {
    const message = "Task added to board";
    const dialog = form.closest("dialog");

    if (dialog) {
        document.dispatchEvent(new CustomEvent("taskcreated", { detail: { taskId, task } }));
        dialog.dataset.notification = message;
        dialog.classList.add("dialog-task-closing");
        return;
    }

    showNotification(message);
    window.setTimeout(() => {
        window.location.href = `./board.html?user=${encodeURIComponent(loggedUserId ?? DB_GUEST_USER_ID)}`;
    }, 1200);
}

/**
 * Creates the Firebase task object from the form values.
 *
 * @param {HTMLFormElement} form - The Add Task form.
 * @returns {Task} The task to store.
 */
function getTaskFromForm(form) {
    const selectedPriority = form.querySelector(
        ".task-priority button.medium, " +
        ".task-priority button.urgent, " +
        ".task-priority button.low"
    );

    const priority = selectedPriority?.classList.contains("urgent")
        ? "high"
        : selectedPriority?.classList.contains("low")
            ? "low"
            : "medium";

    const assignedTo = {};

    form.querySelectorAll('input[name="assignedTo"]:checked').forEach((input) => {
        assignedTo[input.value] = true;
    });

    return {
        title: form.querySelector("#task-title").value.trim(),
        description: form.querySelector("#task-description").value.trim(),
        dueDate: form.querySelector("#task-due-date").value,
        priority,
        category: form.querySelector('input[name="category"]:checked').value,
        status: form.dataset.taskStatus || "toDo",
        assignedTo,
        subtasks: getTaskSubtasks(form),
    };
}

/**
 * Generates the next task key without overwriting an existing task.
 *
 * @param {TaskDirectory} tasks - Existing tasks for the user.
 * @returns {string} A new task key.
 */
function getNextTaskId(tasks) {
    const highestTaskNumber = Object.keys(tasks).reduce((highest, taskId) => {
        const match = /^task(\d+)$/.exec(taskId);

        return match
            ? Math.max(highest, Number(match[1]))
            : highest;
    }, 0);

    return `task${highestTaskNumber + 1}`;
}
