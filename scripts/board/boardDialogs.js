/**
 * Opens the task dialog and renders the selected task's data.
 * Does nothing while a task move is pending. Shows an error notification if opening fails.
 *
 * @param {TaskId} taskId - ID of the task to display.
 * @param {Task["status"]} taskStatus - Current status identifying the task's column.
 * @returns {void}
 */
function openTaskDialog(taskId, taskStatus) {
    if (isTaskMovePending) return;

    const dialog = document.getElementById("dialog-task");

    try {
        renderAndOpenTaskDialog(dialog, taskId, taskStatus);
    } catch (error) {
        showNotification("Task could not be opened. Please reload the board.", "error");
    }
}

/**
 * Builds the selected task's overlay data, updates the dialog, and opens it.
 * Errors propagate to the caller.
 *
 * @param {HTMLDialogElement} dialog - The task dialog to populate.
 * @param {TaskId} taskId - ID of the task to display.
 * @param {Task["status"]} taskStatus - Current status identifying the task's column.
 * @returns {void}
 */
function renderAndOpenTaskDialog(dialog, taskId, taskStatus) {
    const task = getTaskById(taskId, taskStatus);
    const taskData = getTaskOverlayData(taskId, task);

    updateTaskDialog(dialog, taskData);
    openDialog("dialog-task");
}

/**
 * Builds the data needed to render a task overlay.
 *
 * @param {TaskId} taskId - ID of the task.
 * @param {Task} task - The task to prepare for rendering.
 * @returns {TaskOverlayData} Task data with assignee and subtask HTML.
 */
function getTaskOverlayData(taskId, task) {
    return {
        id: taskId,
        task: task,
        assigneesHtml: getAssigneesHtml(task, getTaskOverlayUserBadgeTemplate),
        subtasksHtml: getTaskOverlaySubtasksHtml(task.subtasks),
    };
}

/**
 * Iterates through the subtasks and creates the html.
 *
 * @param {SubtaskDirectory|null} [subtasks] - Subtasks to render; null or omitted values produce empty HTML.
 * @returns {string} HTML for the subtasks.
 */
function getTaskOverlaySubtasksHtml(subtasks) {
    let subtasksHtml = "";

    Object.entries(subtasks ?? {}).forEach(([subtaskId, subtask]) => {
        const isCompleted = subtask.completed ? "checked" : "";
        subtasksHtml += getTaskOverlaySubtasksTemplate(subtaskId, subtask, isCompleted);
    });

    return subtasksHtml;
}

/**
 * Updates the task dialog's task ID, status, and HTML content.
 *
 * @param {HTMLDialogElement} dialog - The task dialog to update.
 * @param {TaskOverlayData} taskData - The prepared task overlay data.
 * @returns {void}
 */
function updateTaskDialog(dialog, taskData) {
    dialog.dataset.taskId = taskData.id;
    dialog.dataset.taskStatus = taskData.task.status;
    dialog.innerHTML = getTaskOverlayTemplate(taskData);
}

/**
 * Replaces the open task dialog with an edit form and waits for initialization.
 * On failure, attempts to restore the task details and shows an error notification.
 *
 * @param {TaskId} taskId - ID of the task to edit; its status is read from the dialog.
 * @returns {Promise<void>} Resolves after initialization or error handling.
 */
async function editTask(taskId) {
    const dialog = document.getElementById("dialog-task");

    try {
        const task = getTaskById(taskId, dialog.dataset.taskStatus);
        await renderAndInitTaskForm(dialog, taskId, task);
    } catch (error) {
        openTaskDialog(taskId, dialog.dataset.taskStatus);
        showNotification("Task could not be opened for editing. Please reload the board.", "error");
    }
}

/**
 * Replaces the task dialog's content with an edit form and initializes it.
 * Errors propagate to the caller.
 *
 * @param {HTMLDialogElement} dialog - The task dialog containing the edit form.
 * @param {TaskId} taskId - ID of the task to edit.
 * @param {Task} task - Task data used to initialize the form.
 * @returns {Promise<void>} Resolves after the edit form is initialized.
 */
async function renderAndInitTaskForm(dialog, taskId, task) {
    dialog.innerHTML = `
        ${getAddTaskDialogCloseButtonTemplate()}
        ${renderAddTask(true)}
        `;

    await initEditTaskForm(dialog.querySelector(".task-form-wrapper"), taskId, task);
}

/**
 * Updates the local task, renders all columns with the active search filter,
 * and restores task details after a successful database save.
 * Shows a saved-but-not-refreshed error if a local update or rendering fails.
 * Any local changes already made are not rolled back.
 *
 * @param {TaskId} taskId - ID of the task already saved in the database.
 * @param {Task} task - Saved task data.
 * @returns {boolean} True if all update steps succeed; false after handling an update error.
 */
function updateBoardAfterTaskEdit(taskId, task) {
    const dialog = document.getElementById("dialog-task");

    try {
        board[task.status].tasks[taskId] = task;
        renderBoard(Object.values(board));
        updateTaskDialog(dialog, getTaskOverlayData(taskId, task));
        return true;
    } catch (error) {
        showNotification("Task saved, but the board could not be refreshed. Please reload the page.", "error");
        return false;
    }
}

/**
 * On desktop, renders and initializes the creation form with the supplied status,
 * then opens the dialog. Defaults to "toDo" through initAddTaskForm when omitted.
 * Below 1280px, navigates to the standalone Add Task page without passing the status.
 * Shows an error notification if rendering, initialization, or opening fails.
 *
 * @param {Task["status"]} [status] - Initial status of the task created in the desktop dialog.
 * @returns {Promise<void>} Resolves after requesting navigation, opening the initialized dialog, or handling an error.
 */
async function openAddTaskDialog(status) {
    const isDesktop = window.matchMedia("(min-width: 1280px)").matches;

    if (!isDesktop) {
        window.location.href = "./addTask.html?user=" + loggedUserId;
        return;
    }

    await renderAndOpenAddTaskDialog(status);
}

/**
 * Renders and initializes the creation form, then opens the Add Task dialog.
 * Defaults to "toDo" through initAddTaskForm when status is omitted.
 * Shows an error notification if rendering, initialization, or opening fails.
 *
 * @param {Task["status"]} [status] - Initial status of the new task.
 * @returns {Promise<void>} Resolves after opening the initialized dialog or handling an error.
 */
async function renderAndOpenAddTaskDialog(status) {
    const dialog = document.getElementById("dialog-add-task");

    try {
        dialog.innerHTML = getAddTaskDialogCloseButtonTemplate() + renderAddTask();
        await initAddTaskForm(dialog.querySelector(".task-form-wrapper"), status);
        openDialog("dialog-add-task");
    } catch (error) {
        showNotification("Task form could not be loaded. Please try again.", "error");
    }
}

/**
 * Adds a task created in the Add Task dialog to the board.
 *
 * @param {TaskId} taskId - ID of the new task.
 * @param {Task} task - The new task.
 * @returns {void}
 */
function updateBoardAfterTaskCreation(taskId, task) {
    board[task.status].tasks[taskId] = task;
    renderBoard(Object.values(board));
}

/**
 * Coordinates task deletion and prevents repeated clicks.
 * Re-enables the button if database deletion fails.
 * On success, updates the board and schedules dialog closing through a notification.
 *
 * @param {TaskId} taskId - ID of the task to delete.
 * @param {Task["status"]} taskStatus - Column containing the task.
 * @param {HTMLButtonElement} button - The clicked delete button.
 * @returns {Promise<void>} Resolves after deletion handling, without waiting for notification or dialog animations.
 */
async function deleteTask(taskId, taskStatus, button) {
    const dialog = button.closest("dialog");
    if (button.disabled) return;

    button.disabled = true;

    try {
        await deleteTaskFromDatabase(taskId);
    } catch (error) {
        handleTaskDeletionError(button);
        return;
    }

    updateBoardAfterTaskDeletion(taskId, taskStatus, dialog);
}

/**
 * Deletes a task from Firebase.
 * Propagates errors to the caller for handling.
 *
 * @param {TaskId} taskId - ID of the task to delete.
 * @returns {Promise<void>} Resolves after the task has been deleted.
 * @throws {Error} If the database deletion fails.
 */
async function deleteTaskFromDatabase(taskId) {
    await deleteData(DB_TASKS + taskId);
}

/**
 * Re-enables the delete button and shows a deletion error notification.
 *
 * @param {HTMLButtonElement} button - The delete button to re-enable.
 * @returns {void}
 */
function handleTaskDeletionError(button) {
    button.disabled = false;
    showNotification("Deleting Task failed!", "error");
}

/**
 * Removes a deleted task from the local board and renders the affected column.
 * Shows a success notification that triggers animated dialog closing after its display duration.
 * Shows an error notification if the board update fails.
 *
 * @param {TaskId} taskId - ID of the task already deleted from Firebase.
 * @param {Task["status"]} taskStatus - Column containing the task.
 * @param {HTMLDialogElement} dialog - The task dialog to close after the success notification.
 * @returns {void}
 */
function updateBoardAfterTaskDeletion(taskId, taskStatus, dialog) {
    try {
        delete board[taskStatus].tasks[taskId];
        renderBoard([board[taskStatus]]);
        showNotification("Task successfully deleted!", undefined, "success", () => dialog.requestClose());
    } catch (error) {
        showNotification("Task successfully deleted!\nReload required!", "error");
    }
}

/**
 * Handles the dialog's closing animation end.
 * Clears its taskId and taskStatus data attributes and calls
 * closeAnimatedDialog() to finish closing it.
 * Ignores child animation events and dialogs without the closing class.
 *
 * @param {AnimationEvent} event - The dialog animation event.
 * @returns {void}
 */
function closeTaskDialog(event) {
    const dialog = event.currentTarget;

    if (event.target !== dialog || !dialog.classList.contains("dialog-task-closing")) {
        return;
    }

    dialog.dataset.taskId = "";
    dialog.dataset.taskStatus = "";
    closeAnimatedDialog(event, "dialog-task-closing");
}
