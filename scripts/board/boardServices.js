/**
 * Loads tasks and contacts from the database.
 * Assigns tasks to board columns by status and copies contacts
 * into localContacts.
 *
 * @returns {Promise<void>} Resolves after tasks and contacts are stored locally; rejects if loading or assignment fails.
 */
async function loadBoardData() {
    const tasks = await getData(DB_TASKS);
    const contacts = await getData(DB_CONTACTS);

    assignTasks(board, tasks ?? {});
    Object.assign(localContacts, contacts ?? {});
}

/**
 * Assigns loaded tasks to board columns according to their status.
 * Modifies the supplied board.
 *
 * @param {Board} board - Board receiving the tasks.
 * @param {TaskDirectory} tasks - Tasks to assign.
 * @returns {void}
 * @throws {Error} If a task has an unknown status.
 */
function assignTasks(board, tasks) {
    Object.entries(tasks).forEach(([taskKey, taskEntry]) => {
        if (!board[taskEntry.status]) {
            throw new Error(`Invalid status: ${taskEntry.status}`);
        }

        board[taskEntry.status].tasks[taskKey] = taskEntry;
    });
}

/**
 * Searches a task in the boards column by using its ID and status and returns it.
 *
 * @param {TaskId} taskId - ID of a single task.
 * @param {Task["status"]} taskStatus - Current status of the task.
 * @returns {Task} The matching task.
 * @throws {Error} If the task is missing or its column cannot be accessed.
 */
function getTaskById(taskId, taskStatus) {
    const task = board[taskStatus].tasks[taskId];

    if (!task) {
        throw new Error(`No task found.`);
    } else {
        return task;
    }
}

/**
 * Partially updates a specific task in the Firebase Realtime Database.
 * Preserves properties that are not included in the update.
 *
 * @param {TaskId} taskId - ID of the task to update.
 * @param {Partial<Task>} taskData - Task properties to update.
 * @returns {Promise<Object|null>} Resolves with the PATCH response body;
 * rejects if the request or response processing fails.
 */
function updateTaskInDatabase(taskId, taskData) {
    return patchData(DB_TASKS + taskId, taskData);
}

/**
 * Partially updates a specific subtask in the Firebase Realtime Database.
 * Preserves properties that are not included in the update.
 *
 * @param {TaskId} taskId - ID of the task whose subtask should be updated.
 * @param {SubtaskId} subtaskId - ID of the subtask to update.
 * @param {Partial<Subtask>} subtaskData - Subtask properties to update.
 * @returns {Promise<Object|null>} Resolves with the PATCH response body;
 * rejects if the request or response processing fails.
 */
function updateSubtaskInDatabase(taskId, subtaskId, subtaskData) {
    return patchData(DB_TASKS + taskId + DB_SUBTASKS + "/" + subtaskId, subtaskData);
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
 * Returns all completed subtasks from the given subtasks.
 *
 * @param {Subtask[]} subtasks - The subtasks of a single task.
 * @returns {Subtask[]} Subtasks whose `completed` property is `true`.
 */
function getCompletedSubtasks(subtasks) {
    return subtasks.filter((subtask) => subtask.completed === true);
}
