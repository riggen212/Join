/**
 * Contacts loaded from the database, indexed by contact ID.
 *
 * @type {ContactDirectory}
 */
const localContacts = {};

/**
 * Local board data with tasks grouped by status.
 *
 * @type {Board}
 */
const board = {
    toDo: {
        id: "toDo-content",
        name: "To Do",
        tasks: {},
    },
    inProgress: {
        id: "inProgress-content",
        name: "In progress",
        tasks: {},
    },
    awaitFeedback: {
        id: "awaitFeedback-content",
        name: "Await feedback",
        tasks: {},
    },
    done: {
        id: "done-content",
        name: "Done",
        tasks: {},
    },
};

/**
 * ID and original status of the task selected for mouse or keyboard movement.
 *
 * @type {{id: TaskId, status: Task["status"]}|null}
 */
let draggingTask = null;

/**
 * Index of the selected destination in Object.keys(board).
 * Retained while the confirmed move is pending and reset to null
 * by finishMovingTaskWithKeyboard().
 *
 * @type {number|null}
 */
let highlightedColumnIndex = null;

/**
 * Whether a task move is being saved and the affected columns are being rendered.
 * Blocks new task drags and opening task dialogs until the move finishes.
 *
 * @type {boolean}
 */
let isTaskMovePending = false;

/**
 * Whether a task is being moved using the keyboard.
 * Ends when the movement is confirmed or canceled.
 *
 * @type {boolean}
 */
let isKeyboardMoveActive = false;

/**
 * Current search term, converted to lowercase with surrounding whitespace removed.
 *
 * @type {SearchTerm}
 *
 */
let activeSearchTerm = "";

/**
 * Loads the current user, tasks, and contacts, then renders the board.
 * Caches the user ID globally and replaces the board content with a persistent
 * error message if loading or rendering fails.
 *
 * @returns {Promise<void>} Resolves after rendering the board or handling an initialization error.
 */
async function initBoard() {
    try {
        loggedUserId = await loadCurrentUser();
        await loadBoardData();
        renderBoard(Object.values(board));
    } catch (error) {
        const boardContainer = document.querySelector(".board");
        boardContainer.innerHTML = getBoardLoadingFailureTemplate();
    }
}

initBoard();

/**
 * Renders the supplied columns, applying activeSearchTerm when it is not empty.
 *
 * @param {BoardColumn[]} columns - Array of columns that should be rendered.
 * @returns {void}
 */
function renderBoard(columns) {
    if (activeSearchTerm.length > 0) {
        const filteredColumns = getFilteredColumns(columns);

        filteredColumns.forEach((column) => renderBoardColumn(column));
    } else {
        columns.forEach((column) => renderBoardColumn(column));
    }
}

/**
 * Replaces the column container's contents with task cards
 * or an empty-column message.
 *
 * @param {BoardColumn} column - A single board column including the tasks.
 * @returns {void}
 */
function renderBoardColumn(column) {
    const columnContent = document.getElementById(column.id);
    const getEmptyTaskBadgeTemplate = activeSearchTerm.length > 0 ? getTaskCardMatchingBadge : getTaskCardEmptyBadge;

    if (Object.keys(column.tasks).length === 0) {
        columnContent.innerHTML = getEmptyTaskBadgeTemplate(column.name);
    } else {
        const columnContentHtml = getColumnContentHtml(column.tasks);
        columnContent.innerHTML = columnContentHtml;
    }
}

/**
 * Iterates all tasks of a single column and creates the HTML string.
 *
 * @param {TaskDirectory} columnTasksObject - The tasks assigned to the column.
 * @returns {string} HTML string containing the task cards.
 */
function getColumnContentHtml(columnTasksObject) {
    const tasksArray = Object.entries(columnTasksObject);
    let columnContentHtml = "";

    tasksArray.forEach(([taskId, task]) => {
        const taskData = getTaskCardData(taskId, task);

        columnContentHtml += getTaskCardTemplate(taskData);
    });

    return columnContentHtml;
}

/**
 * Builds assignee HTML for contacts present in localContacts.
 * For task card badges, shows at most three contacts and adds
 * a badge for the remaining count.
 *
 * @param {Task} task - A single task.
 * @param {(contact: Contact) => string} getUserBadgeTemplateFunction - Function that generates the HTML for one assignee.
 * @returns {string} HTML string containing the assignees of the task.
 */
function getAssigneesHtml(task, getUserBadgeTemplateFunction) {
    const assignees = Object.keys(task.assignedTo ?? {}).filter((id) => localContacts[id]);
    const isTaskCard = getUserBadgeTemplateFunction === getTaskCardUserBadgeTemplate;
    const visibleAssignees = isTaskCard ? assignees.slice(0, 3) : assignees;
    const remainingCount = assignees.length - visibleAssignees.length;
    let assigneesHtml = "";

    visibleAssignees.forEach((id) => {
        assigneesHtml += getUserBadgeTemplateFunction(localContacts[id]);
    });

    if (remainingCount > 0) {
        assigneesHtml += getMoreBadgeTemplate(remainingCount);
    }

    return assigneesHtml;
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
 * Toggles a subtask's completion status, refreshes the task card,
 * and saves the change. Reverts the change if saving fails.
 *
 * @param {HTMLInputElement} checkbox - The changed checkbox.
 * @param {TaskId} taskId - ID of the task containing the subtask.
 * @param {Task["status"]} taskStatus - Current board column of the task.
 * @param {SubtaskId} subtaskId - ID of the subtask being toggled.
 * @returns {Promise<void>} Resolves after saving or reverting the change.
 */
async function handleSubtaskCheckboxChange(checkbox, taskId, taskStatus, subtaskId) {
    const task = getTaskById(taskId, taskStatus);
    const subtask = task.subtasks[subtaskId];

    toggleSubtaskCompletion(taskId, task, subtask);

    await saveSubtaskCompletion(checkbox, taskId, task, subtaskId, subtask);
}

/**
 * Saves the subtask's completion status to the database.
 * Reverts the local state and checkbox and shows an error notification if saving fails.
 *
 * @param {HTMLInputElement} checkbox - The changed checkbox.
 * @param {TaskId} taskId - ID of the task containing the subtask.
 * @param {Task} task - The task containing the subtask.
 * @param {SubtaskId} subtaskId - ID of the subtask to update.
 * @param {Subtask} subtask - The subtask with the updated completion status.
 * @returns {Promise<void>} Resolves after saving or reverting the change.
 */
async function saveSubtaskCompletion(checkbox, taskId, task, subtaskId, subtask) {
    try {
        await updateSubtaskInDatabase(taskId, subtaskId, {
            completed: subtask.completed,
        });
    } catch (error) {
        revertSubtaskCompletion(checkbox, taskId, task, subtask);
        showNotification("Subtask could not be updated. Your change was reverted.", "error");
    }
}

/**
 * Inverts the subtask's completion status and refreshes the task card.
 *
 * @param {TaskId} taskId - ID of the task containing the subtask.
 * @param {Task} task - The task whose card is refreshed.
 * @param {Subtask} subtask - The subtask to toggle.
 * @returns {void}
 */
function toggleSubtaskCompletion(taskId, task, subtask) {
    subtask.completed = !subtask.completed;
    updateTaskCardSubtasksState(taskId, task);
}

/**
 * Reverts a subtask completion toggle, refreshes the task card,
 * and restores the checkbox state.
 *
 * @param {HTMLInputElement} checkbox - The checkbox to restore.
 * @param {TaskId} taskId - ID of the task containing the subtask.
 * @param {Task} task - The task whose card is refreshed.
 * @param {Subtask} subtask - The subtask whose toggle is reverted.
 * @returns {void}
 */
function revertSubtaskCompletion(checkbox, taskId, task, subtask) {
    toggleSubtaskCompletion(taskId, task, subtask);
    checkbox.checked = subtask.completed;
}

/**
 * Updates the subtask summary and progress bar of the specified task card.
 *
 * @param {TaskId} taskId - ID of the task whose card is updated.
 * @param {Task} task - The task whose subtask state is updated.
 * @returns {void}
 */
function updateTaskCardSubtasksState(taskId, task) {
    const subtaskData = getSubtasksCardData(task);
    const subtasksRef = getTaskCardSubtasksHtmlElement(taskId, task.status);
    const subtasksSummaryRef = subtasksRef.querySelector(".task-card-subtasks-summary");
    const subtasksProgressBarRef = subtasksRef.querySelector(".task-card-subtasks-progress-bar");

    subtasksSummaryRef.textContent = `${subtaskData.completedAmount}/${subtaskData.amount} Subtasks`;
    subtasksProgressBarRef.style.width = `${subtaskData.progressInPercent}%`;
}

/**
 * Finds the subtask container within the specified task card.
 * Requires the column and task card to exist in the DOM.
 *
 * @param {TaskId} taskId - ID of the task whose card is queried.
 * @param {Task["status"]} taskStatus - Current status identifying the task's board column.
 * @returns {HTMLElement|null} The subtask container,
 * or null if the card has no matching subtask element.
 */
function getTaskCardSubtasksHtmlElement(taskId, taskStatus) {
    const columnRef = document.querySelector(`[data-column-id="${taskStatus}"]`);
    const taskCardRef = columnRef.querySelector(`[data-task-id="${taskId}"]`);
    const subtaskRef = taskCardRef.querySelector(".task-card-subtasks");

    return subtaskRef;
}

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
        const task = getTaskById(taskId, taskStatus);
        const taskData = getTaskOverlayData(taskId, task);

        updateTaskDialog(dialog, taskData);
        openDialog("dialog-task");
    } catch (error) {
        showNotification("Task could not be opened. Please reload the board.", "error");
    }
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

        dialog.innerHTML = `
        ${getAddTaskDialogCloseButtonTemplate()}
        ${renderAddTask(true)}
        `;

        await initEditTaskForm(dialog.querySelector(".task-form-wrapper"), taskId, task);
    } catch (error) {
        openTaskDialog(taskId, dialog.dataset.taskStatus);
        showNotification("Task could not be opened for editing. Please reload the board.", "error");
    }
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
 * On desktop, renders and initializes the creation form before opening its dialog.
 * Shows an error notification if rendering, initialization, or opening fails.
 * Below 1280px, navigates to the standalone Add Task page instead.
 *
 * @returns {Promise<void>} Resolves after requesting navigation, opening the initialized dialog, or handling an error.
 */
async function openAddTaskDialog() {
    const isDesktop = window.matchMedia("(min-width: 1280px)").matches;

    if (!isDesktop) {
        window.location.href = "./add_task.html?user=" + loggedUserId;
        return;
    }

    const dialog = document.getElementById("dialog-add-task");

    try {
        dialog.innerHTML = getAddTaskDialogCloseButtonTemplate() + renderAddTask();
        await initAddTaskForm(dialog.querySelector(".task-form-wrapper"));
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
