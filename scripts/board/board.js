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
 * Builds the data needed to render a task card.
 *
 * @param {TaskId} taskId - ID of the task.
 * @param {Task} task - The task to prepare for rendering.
 * @returns {TaskCardData} Task data with subtask summary and assignee HTML.
 */
function getTaskCardData(taskId, task) {
    return {
        id: taskId,
        task: task,
        subtasksData: getSubtasksCardData(task),
        assigneesHtml: getAssigneesHtml(task, getTaskCardUserBadgeTemplate),
    };
}

/**
 * Selects assigned contacts present in localContacts and builds their HTML.
 * For task card badges, shows at most three contacts and adds
 * a badge for the remaining count.
 *
 * @param {Task} task - A single task.
 * @param {(contact: Contact) => string} getUserBadgeTemplateFunction - Function that generates the HTML for one assignee.
 * @returns {string} HTML string containing the assignees of the task.
 */
function getAssigneesHtml(task, getUserBadgeTemplateFunction) {
    const maxVisible = 3;
    const assignees = Object.keys(task.assignedTo ?? {}).filter((id) => localContacts[id]);
    const isTaskCard = getUserBadgeTemplateFunction === getTaskCardUserBadgeTemplate;
    const visibleAssignees = isTaskCard ? assignees.slice(0, maxVisible) : assignees;
    const remainingCount = assignees.length - visibleAssignees.length;

    return getVisibleAssigneesHtml(visibleAssignees, remainingCount, getUserBadgeTemplateFunction);
}

/**
 * Builds badges for the supplied contact IDs and appends a remaining-count badge when needed.
 * Requires each contact ID to exist in localContacts.
 *
 * @param {ContactId[]} visibleAssignees - IDs of the contacts whose badges should be rendered.
 * @param {number} remainingCount - Number of additional assignees omitted from the visible badges.
 * @param {(contact: Contact) => string} getUserBadgeTemplateFunction - Function that generates the HTML for one assignee.
 * @returns {string} HTML containing the visible assignee badges and optional remaining-count badge.
 */
function getVisibleAssigneesHtml(visibleAssignees, remainingCount, getUserBadgeTemplateFunction) {
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
 * Converts the search term to lowercase, trims surrounding whitespace,
 * stores it in activeSearchTerm, and renders all board columns.
 *
 * @param {SearchTerm} searchTerm - The search term getting from the HTML input element.
 * @returns {void}
 */
function searchTasks(searchTerm) {
    activeSearchTerm = searchTerm.toLowerCase().trim();
    renderBoard(Object.values(board));
}

/**
 * Creates column objects containing tasks matching the active search term.
 * Preserves column IDs and names without modifying the original task directories.
 *
 * @param {BoardColumn[]} columns - Columns to filter.
 * @returns {BoardColumn[]} New column objects referencing matching tasks.
 */
function getFilteredColumns(columns) {
    /** @type {BoardColumn[]} */
    const filteredColumns = [];

    columns.forEach((column) => {
        filteredColumns.push({
            id: column.id,
            name: column.name,
            tasks: getFilteredTasks(column.tasks),
        });
    });
    return filteredColumns;
}

/**
 * Returns tasks whose title or description contains the active search term.
 *
 * @param {TaskDirectory} tasks - Tasks to filter.
 * @returns {TaskDirectory} A new directory referencing the matching tasks.
 */
function getFilteredTasks(tasks) {
    /** @type {TaskDirectory} */
    const filteredTasks = {};

    Object.entries(tasks).forEach(([taskId, task]) => {
        if (
            task.title.toLowerCase().includes(activeSearchTerm) ||
            task.description.toLowerCase().includes(activeSearchTerm)
        ) {
            filteredTasks[taskId] = task;
        }
    });
    return filteredTasks;
}
