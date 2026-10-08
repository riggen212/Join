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
 * @param {TaskDirectory} tasks - The tasks whose should be assigned.
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
 * @param {Task["status"]} taskStatus - Status of the dragging task.
 */
function getDraggingTask(taskId, taskStatus) {
    draggingTask = {
        id: taskId,
        status: taskStatus,
    };
}

/**
 * Moves a task between columns, saves the updated task to Firebase,
 * and renders the affected columns.
 * Returns early if the task status has not changed.
 *
 * @param {Task["status"]} destinationStatus - Status of the column where the task should be moved.
 * @returns {Promise<void>} Resolves after the database update attempt and rendering.
 */
async function moveTask(destinationStatus) {
    const draggingTaskData = getDataToMoveTask(destinationStatus);

    if (draggingTaskData.oldStatus === draggingTaskData.newStatus) {
        return;
    }

    moveTaskBetweenColumns(draggingTaskData, draggingTaskData.newStatus, draggingTaskData.oldStatus);

    try {
        await updateTaskInDatabase(draggingTaskData.id, {
            status: draggingTaskData.newStatus,
        });
    } catch (error) {
        moveTaskBetweenColumns(draggingTaskData, draggingTaskData.oldStatus, draggingTaskData.newStatus);
        console.error(`Updating the database has failed:\n${error}`);
    }

    renderBoard([board[draggingTaskData.oldStatus], board[draggingTaskData.newStatus]]);
}

/**
 * Moves a task from a source column to a destination column and updates its status.
 *
 * @param {{id: TaskId, task: Task, oldStatus: Task["status"], newStatus: Task["status"]}} draggingTaskData - Data needed to move the task.
 * @param {Task["status"]} destinationColumn - Status of the destination column.
 * @param {Task["status"]} sourceColumn - Status of the source column.
 */
function moveTaskBetweenColumns(draggingTaskData, destinationColumn, sourceColumn) {
    draggingTaskData.task.status = destinationColumn;
    board[destinationColumn].tasks[draggingTaskData.id] = draggingTaskData.task;
    delete board[sourceColumn].tasks[draggingTaskData.id];
}

/**
 * Builds and returns an object containing the data to move a task.
 *
 * @param {Task["status"]} destinationStatus - Status of the destination column.
 * @returns {{id: TaskId, task: Task, oldStatus: Task["status"], newStatus: Task["status"]}} Data needed to move the task.
 */
function getDataToMoveTask(destinationStatus) {
    return {
        id: draggingTask.id,
        task: board[draggingTask.status].tasks[draggingTask.id],
        oldStatus: draggingTask.status,
        newStatus: destinationStatus,
    };
}

/**
 * Adds the CSS class to highlight the column.
 *
 * @param {Task["status"]} columnStatus - Status of the column that should be highlighted.
 */
function addHighlightDroppableColumn(columnStatus) {
    const column = document.getElementById(`${columnStatus}-content`);
    column.classList.add("board-column-highlight");
}

/**
 * Removes the CSS class to stop highlighting the column.
 *
 * @param {Task["status"]} columnStatus - Status of the column that should no longer be highlighted.
 */
function removeHighlightDroppableColumn(columnStatus) {
    const column = document.getElementById(`${columnStatus}-content`);
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

/**
 * Formats the search term and caches into the global variable `activeSearchTerm` and starts rendering the board.
 *
 * @param {SearchTerm} searchTerm - The search term getting from the HTML input element.
 */
function searchTasks(searchTerm) {
    activeSearchTerm = searchTerm.toLowerCase().trim();
    renderBoard(Object.values(board));
}

/**
 * Filters the columns containing tasks and returns it as a new array,
 * the columns contains the column's id, name and a tasks object,
 * id and name are references of the original column, tasks is a new object containing the filtered tasks.
 *
 * @param {BoardColumn[]} columns - Array of columns whose tasks should be filtered.
 * @returns {BoardColumn[]} The columns including its filtered tasks.
 */
function getFilteredColumns(columns) {
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
 * Filters the tasks using the global search term `activeSearchTerm` and the task's title and description,
 * puts it in a new array an returns it.
 *
 * @param {TaskDirectory} tasks - Tasks that should be filterd.
 * @returns {TaskDirectory} The filtered tasks.
 */
function getFilteredTasks(tasks) {
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

/**
 * Partially updates a specific task in the Firebase Realtime Database.
 * Preserves properties that are not included in the update.
 *
 * @param {TaskId} taskId - ID of the task to update.
 * @param {Partial<Task>} taskData - Task properties to update.
 * @returns {Promise<Object|null>} The updated task data returned by Firebase.
 * @throws {Error} If the HTTP response is not successful.
 */
function updateTaskInDatabase(taskId, taskData) {
    return patchData(DB_USERS + loggedUserId + DB_TASKS + "/" + taskId, taskData);
}

/**
 * Partially updates a specific subtask in the Firebase Realtime Database.
 * Preserves properties that are not included in the update.
 *
 * @param {TaskId} taskId - ID of the task whose subtask should be updated.
 * @param {SubtaskId} subtaskId - ID of the subtask to update.
 * @param {Partial<Subtask>} subtaskData - Subtask properties to update.
 * @returns {Promise<Object|null>} The updated subtask data returned by Firebase.
 * @throws {Error} If the HTTP response is not successful.
 */
function updateSubtaskInDatabase(taskId, subtaskId, subtaskData) {
    return patchData(DB_USERS + loggedUserId + DB_TASKS + "/" + taskId + DB_SUBTASKS + "/" + subtaskId, subtaskData);
}

/**
 * Deletes a task from Firebase and, on success, removes it from the local board,
 * closes the dialog, and renders the affected column.
 *
 * @param {TaskId} taskId - ID of the task that should be deleted.
 * @param {Task["status"]} taskStatus - Column of the Task that should be deleted.
 * @param {HTMLButtonElement} button - The clicked delete button.
 * @returns {Promise<void>} Resolves after the deletion attempt and any subsequent UI updates.
 */
async function deleteTask(taskId, taskStatus, button) {
    if (button.disabled) return;

    button.disabled = true;

    try {
        await deleteData(DB_USERS + loggedUserId + DB_TASKS + "/" + taskId);
    } catch (error) {
        button.disabled = false;
        console.error("Deleting Task has failed:", error);
        return;
    }

    updateBoardAfterTaskDeletion(taskId, taskStatus, button.closest("dialog"));
}

/**
 * Removes a task from the local board,
 * closes the dialog, and renders the affected column.
 *
 * @param {TaskId} taskId - ID of the task that should be deleted.
 * @param {Task["status"]} taskStatus - Column of the Task that should be deleted.
 * @param {HTMLDialogElement} dialog - The dialog displaying the task.
 */
function updateBoardAfterTaskDeletion(taskId, taskStatus, dialog) {
    try {
        delete board[taskStatus].tasks[taskId];
        closeTaskDialogImmediately(dialog);
        renderBoard([board[taskStatus]]);
    } catch (error) {
        console.error("Updating the board after deletion failed:", error);
    }
}
