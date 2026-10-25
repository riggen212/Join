/**
 * Loads tasks and contacts from the database.
 * Assigns the tasks to the corresponding columns of the global board
 * and adds the contacts to the global contact directory.
 *
 * @returns {Promise<void>} Resolves after the user data has been processed.
 */
async function loadBoardData() {
    const tasks = await getData(DB_TASKS);
    const contacts = await getData(DB_CONTACTS);

    assignTasks(board, tasks ?? {});
    Object.assign(localContacts, contacts ?? {});
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
 * Builds the data needed to render a task overlay.
 *
 * @param {TaskId} taskId - ID of the task.
 * @param {Task} task - The task to prepare for rendering.
 * @returns {TaskOverlayData} Task data with assignee and subtask HTML.
 */
function getTaskOverlayData(taskId, task) {
    return {
        id: taskId,
        task: task,
        assigneesHtml: getAssigneesHtml(task, getTaskOverlayUserBadgeTemplate),
        subtasksHtml: getTaskOverlaySubtasksHtml(task.subtasks),
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

/**
 * Allows drop cards into the column preventing the default behavior.
 *
 * @param {Event} event - Event that fires if drag over the column.
 */
function allowDrop(event) {
    event.preventDefault();
}

/**
 * Starts a task drag by storing its ID and status and rotating its card.
 * Cancels the drag if another drag or task move is already active.
 *
 * @param {DragEvent} event - The task card's dragstart event.
 * @param {TaskId} taskId - ID of the task being dragged.
 * @param {Task["status"]} taskStatus - Current status of the task.
 * @returns {void}
 */
function getDraggingTask(event, taskId, taskStatus) {
    if (draggingTask || isTaskMovePending) {
        event.preventDefault();
        return;
    }

    addFlipCard(taskId);

    draggingTask = {
        id: taskId,
        status: taskStatus,
    };
}

/**
 * Removes the task card's rotation and clears the current drag state.
 *
 * @param {TaskId} taskId - ID of the task whose drag ended.
 * @returns {void}
 */
function endDraggingTask(taskId) {
    removeFlipCard(taskId);
    draggingTask = null;
}

/**
 * Moves the dragged task to another column, saves its status,
 * and renders the affected columns. Reverts the move if saving fails.
 * Skips the move if no drag is active, another move is pending,
 * or the destination matches the current status.
 * Always releases the move lock when processing ends.
 *
 * @param {Task["status"]} destinationStatus - Status of the destination column.
 * @returns {Promise<void>} Resolves after the move is skipped, saved, or reverted,
 * and any affected columns have been rendered.
 */
async function moveTask(destinationStatus) {
    if (!draggingTask || isTaskMovePending) return;

    const draggingTaskData = getDataToMoveTask(destinationStatus);
    if (!hasTaskStatusChanged(draggingTaskData)) return;

    isTaskMovePending = true;

    try {
        moveTaskBetweenColumns(draggingTaskData, draggingTaskData.newStatus, draggingTaskData.oldStatus);
        await saveTaskMove(draggingTaskData);
        renderBoard([board[draggingTaskData.oldStatus], board[draggingTaskData.newStatus]]);
    } finally {
        isTaskMovePending = false;
    }
}

/**
 * Saves the new task status and reverts the local move if the database update fails.
 *
 * @param {{id: TaskId, task: Task, oldStatus: Task["status"], newStatus: Task["status"]}} draggingTaskData - Data needed to move the task.
 * @returns {Promise<void>} Resolves after saving or reverting the task move.
 */
async function saveTaskMove(draggingTaskData) {
    try {
        await updateTaskInDatabase(draggingTaskData.id, {
            status: draggingTaskData.newStatus,
        });
    } catch (error) {
        moveTaskBetweenColumns(draggingTaskData, draggingTaskData.oldStatus, draggingTaskData.newStatus);
        console.error(`Updating the database has failed:\n${error}`);
    }
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

function hasTaskStatusChanged(draggingTaskData) {
    if (draggingTaskData.oldStatus === draggingTaskData.newStatus) {
        return false;
    } else return true;
}

/**
 * Adds the CSS class that highlights a column as a drop target.
 *
 * @param {Task["status"]} columnStatus - Status identifying the column to highlight.
 * @returns {void}
 */
function addHighlightDroppableColumn(columnStatus, event) {
    const column = document.getElementById(`${columnStatus}-content`);
    column.classList.add("board-column-highlight");
}

/**
 * Removes the column highlight after a drop or when the drag leaves the column.
 * Keeps the highlight when dragging between elements within the same column.
 * Ignores other event types.
 *
 * @param {Task["status"]} columnStatus - Status identifying the column to update.
 * @param {DragEvent} event - The column's drop or dragleave event.
 * @returns {void}
 */
function removeHighlightDroppableColumn(columnStatus, event) {
    if (event.type === "drop" || (event.type === "dragleave" && !event.currentTarget.contains(event.relatedTarget))) {
        const column = document.getElementById(`${columnStatus}-content`);
        column.classList.remove("board-column-highlight");
    }
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
    return patchData(DB_TASKS + taskId, taskData);
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
    return patchData(DB_TASKS + taskId + DB_SUBTASKS + "/" + subtaskId, subtaskData);
}

/**
 * Coordinates task deletion and prevents repeated clicks.
 * Re-enables the button if database deletion fails.
 * On success, updates the board and schedules dialog closing through a notification.
 *
 * @param {TaskId} taskId - ID of the task to delete.
 * @param {Task["status"]} taskStatus - Column containing the task.
 * @param {HTMLButtonElement} button - The clicked delete button.
 * @returns {Promise<void>} Resolves after deletion handling, without waiting for notification or dialog animations.
 */
async function deleteTask(taskId, taskStatus, button) {
    const dialog = button.closest("dialog");

    if (button.disabled) return;

    button.disabled = true;

    if (!(await deleteTaskFromDatabase(taskId))) {
        button.disabled = false;
        return;
    }

    updateBoardAfterTaskDeletion(taskId, taskStatus, dialog);
}

/**
 * Attempts to delete a task from Firebase.
 * Shows an error notification if deletion fails.
 *
 * @param {TaskId} taskId - ID of the task to delete.
 * @returns {Promise<boolean>} Whether database deletion succeeded.
 */
async function deleteTaskFromDatabase(taskId) {
    try {
        await deleteData(DB_TASKS + taskId);
        return true;
    } catch (error) {
        showNotification("Deleting Task failed!", "error");
        return false;
    }
}

/**
 * Removes a deleted task from the local board and renders the affected column.
 * Shows a success notification that triggers animated dialog closing after its display duration.
 * Shows an error notification if the board update fails.
 *
 * @param {TaskId} taskId - ID of the task already deleted from Firebase.
 * @param {Task["status"]} taskStatus - Column containing the task.
 * @param {HTMLDialogElement} dialog - The task dialog to close after the success notification.
 * @returns {void}
 */
function updateBoardAfterTaskDeletion(taskId, taskStatus, dialog) {
    try {
        delete board[taskStatus].tasks[taskId];
        renderBoard([board[taskStatus]]);
        showNotification("Task successfully deleted!", undefined, "success", () => dialog.requestClose());
    } catch (error) {
        showNotification("Task successfully deleted!\nReload required!", "error");
    }
}
