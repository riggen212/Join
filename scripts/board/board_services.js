/**
 * Loads a user's tasks and contacts from the database.
 * Assigns the tasks to the corresponding columns of the global board
 * and adds the contacts to the global contact directory.
 *
 * @param {string} userId - The database ID of the user.
 * @returns {Promise<void>} Resolves after the user data has been processed.
 */
async function loadUserBoardData(userId) {
    const data = await getData(DB_USERS + userId);

    if (!data) {
        throw new Error(`User "${userId}" was not found.`);
    }

    assignTasks(board, data.tasks ?? {});
    Object.assign(contacts, data.contacts ?? {});
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
 * @throws {Error} If the task does not exist.
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
