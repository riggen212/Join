async function loadUserProfile(userId) {
    const data = await getData(DB_USERS + userId);

    assignTasks(board, data.tasks);
    Object.assign(contacts, data.contacts);
}

/**
 * Loads the tasks from the database and assigns each task in the appropriate board column based on its status.
 * Modifies the board.
 *
 * @param {Board} board - The board including the tasks
 */
function assignTasks(board, tasks) {
    tasks = Object.entries(tasks);
    tasks.forEach(([taskKey, taskEntry]) => {
        board[taskEntry.status].tasks[taskKey] = taskEntry;
    });
}

/**
 * Searchs a task in the boards column by using its ID and status and returns it.
 *
 * @param {TaskId} taskId - ID of a single task.
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
 * Returns data for task card HTML template.
 *
 * @param {TaskId} taskId - ID of the given task.
 * @param {Task} task - A single task.
 * @returns {Object} Object including data for the task card htHTMLml template.
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
 * Creates and returns an Object for the task overlay.
 *
 * @param {TaskId} taskId - ID of a single task.
 * @param {Task} task - A single task.
 * @returns {Object} Object containing task, taskid, assignees and subtasks HTML.
 */
function getTaskOverlayData(taskId, task) {
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
 * Calculates summary for the subtasks of a single task.
 *
 * @param {Task} task - A single task.
 * @returns {SubtasksData} Summary data of the task's subtasks.
 */
function getSubtasksCardData(task) {
    const subtasks = Object.values(task.subtasks ?? {});

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
