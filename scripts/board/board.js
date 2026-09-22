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
        id: "todo-content",
        name: "To Do",
        tasks: {},
    },
    inProgress: {
        id: "progress-content",
        name: "In progress",
        tasks: {},
    },
    awaitFeedback: {
        id: "feedback-content",
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
 * Starts the board page, loads the tasks and contacts based on the users ID and renders the board.
 */
async function initBoard() {
    const userId = DB_GUEST_USER_ID;

    try {
        await loadUserBoardData(userId);
        renderBoardColumns(board);
    } catch (error) {
        console.error(error);
    }
}

/**
 * Iterates the board through its columns and renders it.
 *
 * @param {Board} board - The board including the tasks
 */
function renderBoardColumns(board) {
    const boardEntries = Object.values(board);

    boardEntries.forEach((column) => {
        const columnContent = document.getElementById(column.id);

        if (Object.keys(column.tasks).length === 0) {
            columnContent.innerHTML = getTaskCardEmptyBadge(column.name);
        } else {
            const columnContentHtml = getColumnContentHtml(column.tasks);
            columnContent.innerHTML = columnContentHtml;
        }
    });
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
    try {
        const task = getTaskById(taskId, taskStatus);
        const subtask = task.subtasks[subtaskId];
    
        subtask.completed = !subtask.completed;
    
        updateTaskCardSubtasksState(taskId, task);
    } catch (error) {
        console.error(error);
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

/**
 * Closes the task dialog after its closing animation has finished.
 *
 * @param {AnimationEvent} event - The dialogs animation-end event.
 */
function closeTaskDialog(event) {
    const dialog = event.currentTarget;

    if (event.target !== dialog || !dialog.classList.contains("dialog-task-closing")) {
        return;
    }

    dialog.classList.remove("dialog-task-closing");
    document.body.classList.remove("overflow-hidden");
    dialog.close();
}
