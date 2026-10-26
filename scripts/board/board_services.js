/**
 * Loads tasks and contacts from the database.
 * Assigns tasks to board columns by status and copies contacts
 * into localContacts.
 *
 * @returns {Promise<void>} Resolves after tasks and contacts are stored locally.
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
 * Selects a task for movement by storing its ID and original status
 * and rotating its card.
 * Prevents the triggering event's default action if another movement
 * or save operation is already active.
 *
 * @param {TaskId} taskId - ID of the task to select.
 * @param {Task["status"]} taskStatus - Current status of the task.
 * @param {DragEvent|KeyboardEvent} event - The event starting the movement.
 * @returns {void}
 */
function getDraggingTask(taskId, taskStatus, event) {
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
 * Removes the task card's rotation and resets draggingTask to null.
 *
 * @param {TaskId} taskId - ID of the task whose movement is ending.
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
 * Sets isTaskMovePending while moving, saving, and rendering.
 * Resets isTaskMovePending in finally.
 *
 * @param {Task["status"]} destinationStatus - Status of the destination column.
 * @returns {Promise<boolean|undefined>} Whether saving succeeded, or undefined if no move was attempted.
 */
async function moveTask(destinationStatus) {
    if (!draggingTask || isTaskMovePending) return;

    const draggingTaskData = getDataToMoveTask(destinationStatus);
    if (!hasTaskStatusChanged(draggingTaskData)) return;

    isTaskMovePending = true;

    try {
        moveTaskBetweenColumns(draggingTaskData, draggingTaskData.newStatus, draggingTaskData.oldStatus);
        const wasSaved = await saveTaskMove(draggingTaskData);
        renderBoard([board[draggingTaskData.oldStatus], board[draggingTaskData.newStatus]]);
        return wasSaved;
    } finally {
        isTaskMovePending = false;
    }
}

/**
 * Saves the new task status and reverts the local move if the database update fails.
 *
 * @param {{id: TaskId, task: Task, oldStatus: Task["status"], newStatus: Task["status"]}} draggingTaskData - Data needed to move the task.
 * @returns {Promise<boolean>} Whether the task move was saved successfully.
 */
async function saveTaskMove(draggingTaskData) {
    try {
        await updateTaskInDatabase(draggingTaskData.id, {
            status: draggingTaskData.newStatus,
        });
        return true;
    } catch (error) {
        moveTaskBetweenColumns(draggingTaskData, draggingTaskData.oldStatus, draggingTaskData.newStatus);
        console.error(`Updating the database has failed:\n${error}`);
        return false;
    }
}

/**
 * Updates the task's local status, adds it to the destination
 * column's task directory, and removes it from the source column.
 * Does not save or render the change.
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
 * Reads the selected task from board using draggingTask.
 * Returns its ID, the task object, its original status,
 * and the requested destination status.
 * Requires draggingTask to be set.
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
 * Checks whether the destination differs from the task's original status.
 *
 * @param {{oldStatus: Task["status"], newStatus: Task["status"]}} draggingTaskData - Original and destination statuses.
 * @returns {boolean} Whether the task's status would change.
 */
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
function addHighlightDroppableColumn(columnStatus) {
    const column = document.getElementById(`${columnStatus}-content`);
    column.classList.add("board-column-highlight");
}

/**
 * Removes the drop target highlight from a column.
 *
 * @param {Task["status"]} columnStatus - Status identifying the column.
 * @returns {void}
 */
function removeHighlightDroppableColumn(columnStatus) {
        const column = document.getElementById(`${columnStatus}-content`);
        column.classList.remove("board-column-highlight");
}

/**
 * Removes the column highlight after a drop or when a drag leaves the column.
 * Keeps the highlight when dragging between elements within the same column.
 * Ignores other event types.
 *
 * @param {Task["status"]} columnStatus - Status identifying the column.
 * @param {DragEvent} event - The column's drop or dragleave event.
 * @returns {void}
 */
function handleColumnDragLeaveOrDrop(columnStatus, event) {
    if (event.type === "drop" || (event.type === "dragleave" && !event.currentTarget.contains(event.relatedTarget))) {
        removeHighlightDroppableColumn(columnStatus);
    }
}

/**
 * Adds the CSS class that rotates the task card.
 *
 * @param {TaskId} taskId - ID of the task whose card should be rotated.
 */
function addFlipCard(taskId) {
    const card = document.getElementById(taskId);
    card.classList.add("card-task-flip");
}

/**
 * Removes the CSS class that rotates the task card.
 *
 * @param {TaskId} taskId - ID of the task whose card rotation should be removed.
 */
function removeFlipCard(taskId) {
    const card = document.getElementById(taskId);
    card.classList.remove("card-task-flip");
}

/**
 * Converts the search term to lowercase, trims surrounding whitespace,
 * stores it in activeSearchTerm, and renders all board columns.
 *
 * @param {SearchTerm} searchTerm - The search term getting from the HTML input element.
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
