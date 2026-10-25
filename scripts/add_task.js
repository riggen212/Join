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
    } else if (form.dataset.taskId) {
        updateTask(form);
    } else {
        createTask(form);
    }
}

/**
 * Saves a new task and shows a message afterwards.
 *
 * @param {HTMLFormElement} form - The task form.
 */
async function createTask(form) {
    const task = getTaskFromForm(form);
    form.querySelector('button[type="submit"]').disabled = true;

    try {
        const taskId = await saveNewTask(task);
        finishTaskCreation(form, taskId, task);
    } catch (error) {
        showNotification("Task could not be created. Please try again.", "error");
        updateCreateTaskButton(form);
    }
}

/**
 * Saves a new task in the database under the next free task ID.
 *
 * @param {Task} task - The new task.
 * @returns {Promise<string>} The ID of the new task.
 */
async function saveNewTask(task) {
    const tasks = await getData(DB_TASKS);
    const taskId = getNextTaskId(tasks || {});

    await putData(DB_TASKS + taskId, task);
    return taskId;
}

/**
 * Shows a message after a new task was saved.
 * In the board dialog the dialog closes and the task is added to the board.
 * On the Add Task page the user is sent to the board.
 *
 * @param {HTMLFormElement} form - The task form.
 * @param {string} taskId - The ID of the new task.
 * @param {Task} task - The new task.
 */
function finishTaskCreation(form, taskId, task) {
    const dialog = form.closest("dialog");

    if (dialog) {
        updateBoardAfterTaskCreation(taskId, task);
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
 * Saves the edited task in the database and updates the board.
 *
 * @param {HTMLFormElement} form - The task form.
 */
async function updateTask(form) {
    const taskId = form.dataset.taskId;
    const task = getTaskFromForm(form);
    form.querySelector('button[type="submit"]').disabled = true;

    try {
        await putData(DB_TASKS + taskId, task);
        updateBoardAfterTaskEdit(taskId, task);
    } catch (error) {
        showNotification("Updating task has failed.", "error");
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