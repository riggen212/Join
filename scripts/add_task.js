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
 */
function initAddTaskForm(form, status = "toDo") {
    form.dataset.taskStatus = status;

    disableHtml5Validation(form);
    initializeSubtasks(form);
    initializeTaskDate(form);
    initializeAssignedContacts(form);
    initializeAssignedSearch(form);

    updateCreateTaskButton(form);

    form.addEventListener("input", () => updateCreateTaskButton(form));
    form.addEventListener("change", () => updateCreateTaskButton(form));

    form.addEventListener("reset", () => {
        requestAnimationFrame(() => {
            renderAssignedBadges(form);
            updateCreateTaskButton(form);
        });
    });

    form.addEventListener("submit", createTask);
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
 * Loads contacts and creates the assignment options.
 *
 * @param {HTMLFormElement} form - The Add Task form.
 * @returns {Promise<void>}
 */
async function initializeAssignedContacts(form) {
    const options = form.querySelector("#assigned-options");

    if (!options) return;

    try {
        const contactDirectory = await getData(DB_CONTACTS);

        options.replaceChildren();

        Object.entries(contactDirectory ?? {}).forEach(([contactId, contact]) => {
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
 * Renders a badge for every checked contact.
 *
 * @param {HTMLFormElement} form - The Add Task form.
 */
function renderAssignedBadges(form) {
    const badges = form.querySelector("#assigned-badges");
    if (!badges) return;

    badges.replaceChildren();

    form.querySelectorAll('input[name="assignedTo"]:checked').forEach((checkbox) => {
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
 * @returns {HTMLLIElement} The subtask list item.
 */
function createSubtaskItem(title) {
    const item = document.createElement("li");
    item.className = "subtask-item";
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
                completed: false,
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
}

/**
 * Sets today's date as the earliest selectable due date.
 *
 * @param {HTMLFormElement} form - The Add Task form.
 */
function initializeTaskDate(form) {
    const dueDateInput = form.querySelector("#task-due-date");
    if (!dueDateInput) return;

    dueDateInput.min = getTodayAsIsoDate();
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

    const dueDate = dueDateInput.value;
    const today = getTodayAsIsoDate();

    dueDateInput.setCustomValidity(
        dueDate && dueDate < today
            ? "The due date cannot be in the past."
            : ""
    );

    const requiredFieldsFilled =
        titleInput.value.trim() !== "" &&
        dueDate !== "" &&
        selectedCategory !== null;

    button.disabled = !requiredFieldsFilled || !form.checkValidity();
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
    const dueDateInput = form.querySelector("#task-due-date");
    const today = getTodayAsIsoDate();
    const dueDate = dueDateInput.value;

    dueDateInput.setCustomValidity(
        dueDate && dueDate < today
            ? "The due date cannot be in the past."
            : ""
    );

    if (!form.checkValidity()) {
        form.reportValidity();
        updateCreateTaskButton(form);
        return;
    }

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
        updateCreateTaskButton(form);
    }
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
