/**
 * @typedef {Object} Contact
 * @property {string} name - The name of the contact.
 * @property {string} initials - The initials of the contact.
 * @property {string} email - The E-Mail address of the contact.
 * @property {string} phone - The phone number of the contact.
 * @property {string} colorClass - The CSS class for the color of the contact's initials badge.
 */

/**
 * @typedef {Object} Task
 * @property {string} title - The title of the task.
 * @property {string} description - The description of the task.
 * @property {string} dueDate - The due date of the task in YYYY-MM-DD format.
 * @property {"Low"|"Medium"|"High"} priority - The priority of the task.
 * @property {"User Story"|"Technical Task"} category - The category of the task.
 * @property {"toDo"|"inProgress"|"awaitFeedback"|"done"} status - The current status of the task.
 * @property {Object.<string, true>} assignedTo - Maps contact Ids to their assignment state.
 * @property {SubtaskDirectory} subtasks - The subtasks of the task.
 */

/**
 * @typedef {Object.<string, Task>} TaskDirectory - Contains tasks as key-value pairs.
 */

/**
 * @typedef {Object} Subtask
 * @property {string} title - The title of the subtask.
 * @property {boolean} completed - Indicates whether the subtask is completed.
 */

/**
 * @typedef {Object.<string, Subtask>} SubtaskDirectory - Contains subtasks as key-value pairs.
 */

/**
 * @typedef {Object} SubtasksData
 * @property {number} amount - Amount of all subtasks of a single task.
 * @property {number} completedAmount - Amount of all completed subtasks of a single task.
 * @property {number} progressInPercent - The Value of the completion progress as a percentage from 0 to 100.
 */

/**
 * @typedef {Object} Board
 * @property {BoardColumn} toDo - Tasks with `status` `toDo` will be assigned in this column.
 * @property {BoardColumn} inProgress - Tasks with `status` `inProgress` will be assigned in this column.
 * @property {BoardColumn} awaitFeedback - Tasks with `status` `awaitFeedback` will be assigned in this column.
 * @property {BoardColumn} done - Tasks with `status` `done` will be assigned in this column.
 */

/**
 * @typedef {Object} BoardColumn
 * @property {string} id - The id of the DOM element representing the column.
 * @property {string} name - The name of the column.
 * @property {TaskDirectory} tasks - An Object with the tasks assigned to the column.
 */

const contacts = data.users[0].contacts;

/**
 * The board including the tasks in separate columns based on each task's status.
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
 * Starts the board page, loads the tasks and renders the board.
 */
function initBoard() {
    loadTasks(board);
    renderBoardColumns(board);
}

/**
 * Loads the tasks from the database and assigns each task in the appropriate board column based on its status.
 * Modifies the board.
 *
 * @param {Board} board - The board including the tasks
 */
function loadTasks(board) {
    const tasks = Object.entries(data.users[0].tasks);
    tasks.forEach(([taskKey, taskEntry]) => {
        board[taskEntry.status].tasks[taskKey] = taskEntry;
    });
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
        const taskData = getTaskCardData(taskId, task);

        columnContentHtml += getTaskCardTemplate(taskData);
    });

    return columnContentHtml;
}

/**
 * Returns data for task card html template.
 *
 * @param {string} taskId - Id of the given task.
 * @param {Task} task - A single task.
 * @returns {Object} Object including data for the task card html template.
 */
function getTaskCardData(taskId, task) {
    return {
        taskObject: {
            id: taskId,
            task: task,
        },
        assigneesHtml: getAssigneesHtml(task, getTaskCardUserBadgeTemplate),
        subtasksData: getSubtasksCardData(task),
    };
}

/**
 * Iterates all assignees of a single task and creates the HTML string.
 *
 * @param {Task} task - A single task.
 * @param {(contact: Contact) => string} getUserBadgeTemplateFunction - Function that generates the HTML for one assignee.
 * @returns {string} HTML string containing the assignees of the task.
 */
function getAssigneesHtml(task, getUserBadgeTemplateFunction) {
    const assignees = Object.keys(task.assignedTo);
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
 * Calculates summary for the subtasks of a single task.
 *
 * @param {Task} task - A single task.
 * @returns {SubtasksData} Summary data of the task's subtasks.
 */
function getSubtasksCardData(task) {
    const subtasks = Object.values(task.subtasks);

    return {
        amount: subtasks.length,
        completedAmount: getCompletedSubtasks(subtasks).length,
        progressInPercent: getSubtaskProgressInPercent(subtasks),
    };
}

/**
 * Returns all completed subtasks from the given subtasks.
 *
 * @param {Subtask[]} subtasks - The subtasks of a single task.
 * @returns {Subtask[]} Subtasks whose `completed` property is `true`.
 */
function getCompletedSubtasks(subtasks) {
    return subtasks.filter((subtask) => subtask.completed === true);
}

/**
 * Calculates the completion progress of the given subtasks.
 *
 * @param {Subtask[]} subtasks - The subtasks of a single task.
 * @returns {number} The value of the completion progress as percentage from 0 to 100.
 */
function getSubtaskProgressInPercent(subtasks) {
    if (subtasks.length <= 0) {
        return 0;
    } else {
        return (getCompletedSubtasks(subtasks).length / subtasks.length) * 100;
    }
}

/**
 * Searchs a task in the boards column by using its id and status and returns it.
 *
 * @param {string} taskId - Id of a single task.
 * @param {Task["status"]} taskStatus - Current status of the task.
 * @returns {Task|undefined} - The matching task or `undefined` if it not exist.
 */
function getTaskById(taskId, taskStatus) {
    if (!board[taskStatus].tasks[taskId]) {
        return;
    } else {
        return board[taskStatus].tasks[taskId];
    }
}

/**
 * Creates and returns an Object for the task overlay.
 *
 * @param {Task} task - A single task.
 * @param {string} taskId - Id of a single task.
 * @returns {Object} Object containing task, taskid, assignees and subtasks html.
 */
function getTaskOverlayData(task, taskId) {
    return {
        task: task,
        id: taskId,
        assigneesHtml: getAssigneesHtml(task, getTaskOverlayUserBadgeTemplate),
        subtasks: {
            html: getTaskOverlaySubtasksHtml(task.subtasks),
        },
    };
}

/**
 * Iterates through the subtasks and creates the html.
 *
 * @param {SubtaskDirectory} subtasks - Subtasks of a single task.
 * @returns {string} HTML for the subtasks.
 */
function getTaskOverlaySubtasksHtml(subtasks) {
    let subtasksHtml = "";

    Object.values(subtasks).forEach((subtask) => {
        const isCompleted = subtask.completed ? "checked" : "";
        subtasksHtml += getTaskOverlaySubtasksTemplate(subtask, isCompleted);
    });

    return subtasksHtml;
}

/**
 * Opens the dialog with the tasks data.
 *
 * @param {string} taskId - Id of a single task.
 * @param {Task["status"]} taskStatus - Currents status of the task.
 */
function openTaskDialog(taskId, taskStatus) {
    const dialog = document.getElementById("dialog-task");
    const task = getTaskById(taskId, taskStatus);

    if (!task) {
        return
    }

    const taskData = getTaskOverlayData(task, taskId);

        dialog.innerHTML = getTaskOverlayTemplate(taskData);
        openDialog("dialog-task");
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
