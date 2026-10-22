/**
 * Includes all contacts of the user
 *
 * @type {ContactDirectory}
 */
const localContacts = {};

/**
 * The board including the users tasks in separate columns based on each task's status.
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
 * ID and Status of the currently dragged task.
 *
 * @type {{id: TaskId, status: Task["status"]}|null}
 */
let draggingTask = null;

/**
 * Current normalized search term.
 *
 * @type {SearchTerm}
 *
 */
let activeSearchTerm = "";

/**
 * Starts the board page, loads the tasks, contacts and the user,
 * caches the users ID globally and starts rendering the board.
 */
async function initBoard() {
    try {
        loggedUserId = await loadCurrentUser();
        await loadBoardData();
        renderBoard(Object.values(board));
    } catch (error) {
        console.error(error);
    }
}

initBoard();

/**
 * Renders columns with filterd or unfilterd tasks, based on the search terms value.
 *
 * @param {BoardColumn[]} columns - Array of columns that should be rendered.
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
 * Renders a single board column.
 *
 * @param {BoardColumn} column - A single board column including the tasks.
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
 * Iterates all assignees of a single task and creates the HTML string.
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
 * @param {SubtaskDirectory} subtasks - Subtasks of a single task.
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
 * Reverts the local state and checkbox if saving fails.
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
        console.error(`Updating the database has failed:\n${error}`);
    }
}

/**
 * Inverts the subtask's completion status and refreshes the task card.
 *
 * @param {TaskId} taskId - ID of the task containing the subtask.
 * @param {Task} task - The task whose card is refreshed.
 * @param {Subtask} subtask - The subtask to toggle.
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
 */
function updateTaskCardSubtasksState(taskId, task) {
    const subtaskData = getSubtasksCardData(task);
    const subtasksRef = getTaskCardSubtasksHtmlElement(taskId, task.status);
    const subtasksSummaryRef = subtasksRef.querySelector(".task-card-subtasks-summary");
    const subtasksProgressBarRef = subtasksRef.querySelector(".task-card-subtasks-progress-bar");

    subtasksSummaryRef.innerHTML = `${subtaskData.completedAmount}/${subtaskData.amount} Subtasks`;
    subtasksProgressBarRef.style.width = `${subtaskData.progressInPercent}%`;
}

/**
 * Returns the subtask container of the specified task card.
 *
 * @param {TaskId} taskId - ID of the task whose card is queried.
 * @param {Task["status"]} taskStatus - Current status identifying the task's board column.
 * @returns {HTMLElement|null} The subtask container, or `null` if it does not exist.
 */
function getTaskCardSubtasksHtmlElement(taskId, taskStatus) {
    const columnRef = document.querySelector(`[data-column-id="${taskStatus}"]`);
    const taskCardRef = columnRef.querySelector(`[data-task-id="${taskId}"]`);
    const subtaskRef = taskCardRef.querySelector(".task-card-subtasks");

    return subtaskRef;
}

/**
 * Opens the dialog and renders the selected task's data.
 *
 * @param {TaskId} taskId - ID of the task to render.
 * @param {Task["status"]} taskStatus - Current status identifying the task's board column.
 */
function openTaskDialog(taskId, taskStatus) {
    const dialog = document.getElementById("dialog-task");

    try {
        const task = getTaskById(taskId, taskStatus);
        const taskData = getTaskOverlayData(taskId, task);

        updateTaskDialog(dialog, taskData);
        openDialog("dialog-task");
    } catch (error) {
        console.error(error);
    }
}

/**
 * Updates the task dialog's task ID, status, and HTML content.
 *
 * @param {HTMLDialogElement} dialog - The task dialog to update.
 * @param {TaskOverlayData} taskData - The prepared task overlay data.
 */
function updateTaskDialog(dialog, taskData) {
    dialog.dataset.taskId = taskData.id;
    dialog.dataset.taskStatus = taskData.task.status;
    dialog.innerHTML = getTaskOverlayTemplate(taskData);
}

/**
 * Switches the task dialog to the edit form of the given task.
 *
 * @param {TaskId} taskId - ID of the task to edit.
 */
function editTask(taskId) {
    const dialog = document.getElementById("dialog-task");

    try {
        const task = getTaskById(taskId, dialog.dataset.taskStatus);

        dialog.innerHTML = renderAddTask(true);
        initEditTaskForm(dialog.querySelector(".task-form-wrapper"), taskId, task);
    } catch (error) {
        console.error(error);
    }
}

/**
 * Updates the board and the task dialog after a task was edited.
 */
document.addEventListener("taskupdated", (event) => {
    const { taskId, task } = event.detail;
    const dialog = document.getElementById("dialog-task");

    board[task.status].tasks[taskId] = task;
    renderBoard(Object.values(board));
    updateTaskDialog(dialog, getTaskOverlayData(taskId, task));
});


/**
 * Opens the Add Task dialog on desktop screens.
 * On smaller screens, it opens the standalone Add Task page instead.
 *
 * @returns {void}
 */
function openAddTaskDialog() {
    const isDesktop = window.matchMedia("(min-width: 1280px)").matches;

    if (!isDesktop) {
        window.location.href = "./add_task.html?user=" + loggedUserId;
        return;
    }

    const dialog = document.getElementById("dialog-add-task");

    dialog.innerHTML = getAddTaskDialogCloseButtonTemplate() + renderAddTask();
    initAddTaskForm(dialog.querySelector(".task-form-wrapper"));
    openDialog("dialog-add-task");
}


/**
 * Adds a task created in the Add Task dialog to the board.
 */
document.addEventListener("taskcreated", (event) => {
    const { taskId, task } = event.detail;

    board[task.status].tasks[taskId] = task;
    renderBoard(Object.values(board));
});

/**
 * Clears the task dialog's state and finishes its animated closing.
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