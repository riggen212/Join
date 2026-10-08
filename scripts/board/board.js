/**
 * Includes all contacts of the user
 *
 * @type {ContactDirectory}
 */
const contacts = {};

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
 * Starts the board page, loads the tasks and contacts based on the users ID and starts rendering the board.
 */
async function initBoard() {
    const userId = DB_GUEST_USER_ID;

    try {
        await loadUserBoardData(userId);
        renderBoard(Object.values(board));
    } catch (error) {
        console.error(error);
    }
}

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
        const taskData = {
            id: taskId,
            task: task,
            subtasksData: getSubtasksCardData(task),
            assigneesHtml: getAssigneesHtml(task, getTaskCardUserBadgeTemplate),
        };

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
    const assignees = Object.keys(task.assignedTo ?? {});
    let assigneesHtml = "";

    assignees.forEach((contact) => {
        if (!contacts[contact]) {
            return;
        }

        assigneesHtml += getUserBadgeTemplateFunction(contacts[contact]);
    });

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
 * Updates the subtask's completion status and refreshes the task card.
 *
 * @param {TaskId} taskId - ID of the task containing the subtask.
 * @param {Task["status"]} taskStatus - Current status identifying the task's board column.
 * @param {SubtaskId} subtaskId - ID of the subtask being toggled.
 */
function handleSubtaskCheckboxChange(taskId, taskStatus, subtaskId) {
    const task = getTaskById(taskId, taskStatus);
    const subtask = task.subtasks[subtaskId];

    subtask.completed = !subtask.completed;
    updateTaskCardSubtasksState(taskId, task);

    try {
        updateSubtaskInDatabase(taskId, subtaskId, {
            completed: subtask.completed,
        });
    } catch (error) {
        subtask.completed = !subtask.completed;
        updateTaskCardSubtasksState(taskId, task);
        console.error(`Updating the database has failed:\n${error}`);
    }
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

        const taskData = {
            id: taskId,
            task: task,
            assigneesHtml: getAssigneesHtml(task, getTaskOverlayUserBadgeTemplate),
            subtasksHtml: getTaskOverlaySubtasksHtml(task.subtasks),
        };

        dialog.dataset.taskId = taskId;
        dialog.dataset.taskStatus = taskStatus;
        dialog.innerHTML = getTaskOverlayTemplate(taskData);
        openDialog("dialog-task");
    } catch (error) {
        console.error(error);
    }
}

function openAddTaskDialog() {
    const dialog = document.getElementById("dialog-add-task");

    dialog.innerHTML = renderAddTask();
    openDialog("dialog-add-task");
}

/**
 * Finishes the closing animation of the task dialog.
 *
 * @param {AnimationEvent} event - The dialog animation event.
 * @returns {void}
 */
function closeTaskDialog(event) {
    const dialog = event.currentTarget;

    if (event.target !== dialog || !dialog.classList.contains("dialog-task-closing")) {
        return;
    }

    dialog.classList.remove("dialog-task-closing");
    dialog.dataset.taskId = "";
    dialog.dataset.taskStatus = "";
    document.body.classList.remove("overflow-hidden");
    dialog.close();
    closeAnimatedDialog(event, "dialog-task-closing");
}
