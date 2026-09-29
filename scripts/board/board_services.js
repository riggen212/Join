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

/**
 * Allows drop cards into the column preventing the default behavior.
 *
 * @param {Event} event - Event that fires if drag over the column.
 */
function allowDrop(event) {
    event.preventDefault();
}

/**
 * Sets the dragging task's id and status into the global variable for the current dragging task.
 *
 * @param {TaskId} taskId - ID of the dragging task.
 * @param {taskStatus} taskStatus - Status of the dragging task.
 */
function getDraggingTask(taskId, taskStatus) {
    draggingTask = {
        id: taskId,
        status: taskStatus,
    };
}

/**
 * Moves task between columns and renders the appropriate columns.
 * Checks whether the new status is equal to the old status and returns early if it is.
 *
 * @param {BoardColumn["id"]} destinationColumnId - ID of the column where the task should be moved.
 * @returns {void}
 */
function moveTask(destinationColumnId) {
    const draggingTaskData = getDataToMoveTask(destinationColumnId);

    if (draggingTaskData.oldStatus === draggingTaskData.newStatus) {
        return;
    }

    moveTaskBetweenColumns(draggingTaskData);
    renderBoardColumn(board[draggingTaskData.oldStatus]);
    renderBoardColumn(board[draggingTaskData.newStatus]);
}

/**
 * Updates the task's new status, add the task to the new columns and removes it from the old column.
 *
 * @param {{id: TaskId, task: Task, oldStatus: BoardColumn["id"], newStatus: BoardColumn["id"]}} draggingTaskData - Data needed to move the task..
 */
function moveTaskBetweenColumns(draggingTaskData) {
    draggingTaskData.task.status = draggingTaskData.newStatus;
    board[draggingTaskData.newStatus].tasks[draggingTaskData.id] = draggingTaskData.task;
    delete board[draggingTaskData.oldStatus].tasks[draggingTaskData.id];
}

/**
 * Builds and returns an object containing the data to move a task.
 *
 * @param {BoardColumn["id"]} destinationId - ID of the column where the task should be moved.
 * @returns {{id: TaskId, task: Task, oldStatus: BoardColumn["id"], newStatus: BoardColumn["id"]}} Data needed to move the task.
 */
function getDataToMoveTask(destinationId) {
    return {
        id: draggingTask.id,
        task: board[draggingTask.status].tasks[draggingTask.id],
        oldStatus: draggingTask.status,
        newStatus: destinationId,
    };
}

/**
 * Adds the CSS class to highlight the column.
 * 
 * @param {BoardColumn["id"]} columnId - ID of the column that should be highlighted.
 */
function addHighlightDroppableColumn(columnId) {
    const column = document.getElementById(`${columnId}-content`);
    column.classList.add("board-column-highlight");
}

/**
 * Removes the CSS class to stop highlighting the column.
 * 
 * @param {BoardColumn["id"]} columnId - ID of the column that should no longer be highlighted.
 */
function removeHighlightDroppableColumn(columnId) {
    const column = document.getElementById(`${columnId}-content`);
    column.classList.remove("board-column-highlight");
}

/**
 * Adds the CSS class to flip the task's card.
 * 
 * @param {TaskId} taskId - ID of the task whose card should be flipped.
 */
function addFlipCard(taskId) {
    const card = document.getElementById(taskId);
    card.classList.add("card-task-flip");
}

/**
 * Removes the CSS class to stop flipping the task's card.
 * 
 * @param {TaskId} taskId - ID of the task whose card should no longer be flipped.
 */
function removeFlipCard(taskId) {
    const card = document.getElementById(taskId);
    card.classList.remove("card-task-flip");
}
