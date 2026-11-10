/**
 * Whether task creation or editing is being saved on the current page.
 * Blocks repeated submissions and keeps submit buttons disabled when updated.
 * Reset by the save handlers in finally.
 * @type {boolean}
 */
let isTaskSaving = false;

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

initAddTaskPage();
