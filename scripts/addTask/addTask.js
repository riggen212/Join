/**
 * Initializes the standalone Add Task page; does nothing on other pages.
 * Delegates user loading, form rendering and error handling to handleInitAddTaskPage.
 *
 * @returns {Promise<void>} Resolves after initialization, error handling, or an early return.
 */
async function initAddTaskPage() {
    const container = document.querySelector(".board-inner.add-task-inner");
    if (!container) return;

    await handleInitAddTaskPage(container);
}

initAddTaskPage();

/**
 * Loads the current user and initializes the Add Task form in the given container.
 * Stops if no valid user is available and a redirect to login has been initiated.
 * Uses the status from the URL, defaulting to "toDo" when absent.
 * Replaces the container with a persistent error message if initialization fails.
 *
 * @param {HTMLElement} container - The container for the Add Task form.
 * @returns {Promise<void>} Resolves after initialization, error handling, or an early return.
 */
async function handleInitAddTaskPage(container) {
    try {
        if (!(await initializeCurrentUser())) return;
        container.innerHTML = renderAddTask();

        await initAddTaskForm(
            container.querySelector(".task-form-wrapper"),
            new URLSearchParams(window.location.search).get("status") ?? "toDo",
        );
    } catch (error) {
        container.innerHTML = `<p class="board-loading-error" role="alert">
        Task form could not be loaded. Please reload the page.</p>`;
    }
}

/**
 * Initializes the task form and loads its contact options.
 * Makes the form inert until all initialization steps succeed.
 * Populates an existing task only after its contact options have loaded.
 * On failure, leaves the form inert and propagates the error to the caller.
 *
 * @param {HTMLFormElement} form - The rendered task form.
 * @param {Task["status"]} [status="toDo"] - Status used when saving the task.
 * @param {Task|null} [task=null] - Existing task to populate, or null for creation.
 * @returns {Promise<void>} Resolves when the form is initialized and interactive; rejects on initialization failure.
 */
async function initAddTaskForm(form, status = "toDo", task = null) {
    form.inert = true;
    form.dataset.taskStatus = status;
    setMinDueDate(form);

    await loadAssignedContacts(form, task);

    if (task) {
        fillTaskForm(form, task);
    }

    updateCreateTaskButton(form);
    form.inert = false;
}

/**
 * Stores the task ID and original due date, then initializes the edit form.
 * Propagates initialization errors to the caller.
 *
 * @param {HTMLFormElement} form - The form rendered by renderAddTask(true).
 * @param {TaskId} taskId - ID of the task being edited.
 * @param {Task} task - Existing task whose values populate the form.
 * @returns {Promise<void>} Resolves after initialization; rejects if initialization fails.
 */
async function initEditTaskForm(form, taskId, task) {
    form.dataset.taskId = taskId;
    form.dataset.originalDueDate = task.dueDate || "";
    await initAddTaskForm(form, task.status, task);
}

/**
 * Is called on every input or change in the form and updates the form.
 *
 * @param {HTMLFormElement} form - The task form.
 * @returns {void}
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
 * @returns {void}
 */
function preventEnterSubmit(event) {
    if (event.key === "Enter" && event.target.tagName === "INPUT") {
        event.preventDefault();
    }
}

/**
 * Fills the form with the data of an existing task.
 *
 * @param {HTMLFormElement} form - The task form.
 * @param {Task} task - The task.
 * @returns {void}
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
 * @param {Task["priority"]} priority - Selects urgent for "high", low for "low", and medium for all other values.
 * @returns {void}
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
 * @param {Task["category"]} category - The category of the task.
 * @returns {void}
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
 * Resets priority, category text, subtasks, and field errors.
 * Schedules a form update after the browser finishes its native reset.
 *
 * @param {HTMLFormElement} form - The task form.
 * @returns {void}
 */
function resetTaskForm(form) {
    selectTaskPriority(form.querySelector("#priority-medium"), "medium");
    form.querySelector("#task-category button span").textContent = "Select task category";
    form.querySelector("#subtask-list").innerHTML = "";
    clearFieldErrors(form);

    // The browser resets the inputs after this function, so the form is updated afterwards
    setTimeout(() => updateTaskForm(form), 0);
}

/**
 * Prevents native submission and ignores submissions while isTaskSaving is true.
 * Shows field errors for invalid input; otherwise starts creation or editing without awaiting it.
 *
 * @param {SubmitEvent} event - The task form submit event.
 * @returns {void}
 */
function submitTaskForm(event) {
    const form = event.target;
    event.preventDefault();

    if (isTaskSaving) return;

    if (!isTaskFormValid(form)) {
        showAllFieldErrors(form);
    } else if (form.dataset.taskId) {
        updateTask(form);
    } else {
        createTask(form);
    }
}

/**
 * Updates the saving flag, accessible busy state and submit button.
 * Preserves submit-button focus when disabling it removes focus.
 *
 * @param {HTMLFormElement} form - The task form being saved.
 * @param {boolean} saving - Whether saving is in progress.
 * @returns {void}
 */
function setTaskSavingState(form, saving) {
    const button = form.querySelector('button[type="submit"]');
    if (saving) {
        form.dataset.restoreSubmitFocus = String(document.activeElement === button);
    }
    isTaskSaving = saving;
    form.setAttribute("aria-busy", String(saving));
    updateCreateTaskButton(form);
    if (!saving) restoreTaskSubmitFocus(form);
}

/**
 * Restores lost submit-button focus while preserving other focus changes.
 * Skips removed forms and dialogs that are already closing.
 *
 * @param {HTMLFormElement} form - The task form after saving.
 * @returns {void}
 */
function restoreTaskSubmitFocus(form) {
    const button = form.querySelector('button[type="submit"]');
    if (form.dataset.restoreSubmitFocus !== "true") return;
    if (!form.isConnected || button.disabled) return;
    if (form.closest(".dialog-task-closing")) return;
    if (document.activeElement !== document.body) return;
    button.focus();
}

/**
 * Saves a new task and blocks repeated submissions through isTaskSaving.
 * Keeps the form locked after creation until navigation or dialog closing.
 * Unlocks the form if saving fails and reports post-save rendering errors.
 *
 * @param {HTMLFormElement} form - The valid task form to read and save.
 * @returns {Promise<void>} Resolves after saving and post-save handling.
 */
async function createTask(form) {
    const task = getTaskFromForm(form);
    setTaskSavingState(form, true);

    await handleCreateTask(form, task);
}

/**
 * Saves the task and handles completion or error feedback.
 * Unlocks the form only if the task was not saved successfully.
 *
 * @param {HTMLFormElement} form - The form currently locked for saving.
 * @param {Task} task - The task data to save.
 * @returns {Promise<void>} Resolves after saving and completion handling.
 */
async function handleCreateTask(form, task) {
    let taskWasCreated = false;

    try {
        const taskId = await saveNewTask(task);
        if (taskId == false) return;
        taskWasCreated = true;
        completeTaskCreation(form, taskId, task);
    } catch (error) {
        showNotification("Task is created but couldn't be rendered. Please refresh the page.", "error");
    } finally {
        if (!taskWasCreated) setTaskSavingState(form, false);
    }
}

/**
 * Marks the form as completed and handles the saved task.
 *
 * @param {HTMLFormElement} form - The form used to create the task.
 * @param {TaskId} taskId - The ID of the saved task.
 * @param {Task} task - The saved task data.
 * @returns {void}
 * @throws {Error} If synchronous post-save processing fails.
 */
function completeTaskCreation(form, taskId, task) {
    form.dataset.taskCreated = "true";
    finishTaskCreation(form, taskId, task);
}

/**
 * Generates a UUID, saves the new task via PUT and returns its ID.
 * Shows an error notification and returns false if ID generation or saving fails.
 *
 * @param {Task} task - The new task to save.
 * @returns {Promise<TaskId|false>} The generated task ID, or false if creation fails.
 */
async function saveNewTask(task) {
    try {
        const taskId = crypto.randomUUID();
        await putData(DB_TASKS + taskId, task);

        return taskId;
    } catch (error) {
        showNotification("Saving task to the database has failed.", "error");
        return false;
    }
}

/**
 * Handles a task that has already been saved.
 * In a dialog, updates the board and starts closing; success is displayed after closing.
 * On the standalone page, shows success and schedules navigation after 1200 ms.
 *
 * @param {HTMLFormElement} form - The form used to create the task.
 * @param {TaskId} taskId - ID of the saved task.
 * @param {Task} task - Saved task data.
 * @returns {void}
 * @throws {Error} If synchronous post-save processing fails.
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
 * Navigates to the board page.
 * Marks successful task creation for announcement on the board page.
 *
 * @returns {void}
 */
function goToBoard() {
    window.location.href = "./board.html?taskCreated=true";
}

/**
 * Reads the edited task and locks the form while updating it.
 * Delegates saving, board updates and unlocking to handleUpdateTask.
 *
 * @param {HTMLFormElement} form - The edit form containing the task ID and values.
 * @returns {Promise<void>} Resolves after saving and board-update handling.
 */
async function updateTask(form) {
    const taskId = form.dataset.taskId;
    const task = getTaskFromForm(form);

    setTaskSavingState(form, true);
    await handleUpdateTask(form, taskId, task);
}

/**
 * Saves the edited task and updates the board after a successful save.
 * Shows success only if the board update succeeds.
 * Always resets the form's saving state.
 *
 * @param {HTMLFormElement} form - The form currently locked for saving.
 * @param {TaskId} taskId - The ID of the task to update.
 * @param {Task} task - The updated task data.
 * @returns {Promise<void>} Resolves after saving and board-update handling.
 */
async function handleUpdateTask(form, taskId, task) {
    try {
        let isTaskSaved = await saveUpdatedTask(taskId, task);
        if (isTaskSaved) {
            let isBoardUpdated = updateBoardAfterTaskEdit(taskId, task);
            if (isBoardUpdated) showNotification("Task successfully updated.");
        }
    } finally {
        setTaskSavingState(form, false);
    }
}

/**
 * Replaces an existing task in Firebase with the supplied task data.
 * Shows an error notification if writing to the database fails.
 *
 * @param {TaskId} taskId - ID of the task to replace.
 * @param {Task} task - Complete task data to write.
 * @returns {Promise<boolean>} True if saving succeeds; false if the write fails.
 */
async function saveUpdatedTask(taskId, task) {
    try {
        await putData(DB_TASKS + taskId, task);
        return true;
    } catch (error) {
        showNotification("Saving task to the database has failed.", "error");
        return false;
    }
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
 * @returns {"high"|"medium"|"low"} The normalized priority written by the task form.
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
 * @returns {Object.<ContactId, true>} Selected contact IDs mapped to true; empty if none are selected.
 */
function getAssignedContacts(form) {
    const checkedBoxes = form.querySelectorAll('input[name="assignedTo"]:checked');
    /** @type {Object.<ContactId, true>} */
    const assignedTo = {};

    for (let i = 0; i < checkedBoxes.length; i++) {
        assignedTo[checkedBoxes[i].value] = true;
    }

    return assignedTo;
}
