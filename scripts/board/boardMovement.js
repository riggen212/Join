/**
 * ID and original status of the task selected for mouse or keyboard movement.
 *
 * @type {{id: TaskId, status: Task["status"]}|null}
 */
let draggingTask = null;

/**
 * Whether a task move is being saved and the affected columns are being rendered.
 * Blocks new task drags and opening task dialogs until the move finishes.
 *
 * @type {boolean}
 */
let isTaskMovePending = false;

/**
 * Allows task cards to be dropped into a column by preventing the default drag-over behavior.
 *
 * @param {DragEvent} event - The column drag-over event.
 * @returns {void}
 */
function allowDrop(event) {
    event.preventDefault();
}

/**
 * Selects a task for movement by storing its ID and original status
 * and rotating its card.
 * Prevents the triggering event's default action if another movement
 * or task-move save operation is already active.
 *
 * @param {TaskId} taskId - ID of the task to select.
 * @param {Task["status"]} taskStatus - Current status of the task.
 * @param {DragEvent|KeyboardEvent} event - The event starting the movement.
 * @returns {void}
 */
function startDraggingTask(taskId, taskStatus, event) {
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
 *
 * @param {Task["status"]} destinationStatus - Status of the destination column.
 * @returns {Promise<void>} Resolves when the move is skipped or the save
 * attempt and rendering have finished.
 */
async function moveTask(destinationStatus) {
    if (!draggingTask || isTaskMovePending) return;

    const draggingTaskData = getDataToMoveTask(destinationStatus);
    if (!hasTaskStatusChanged(draggingTaskData)) return;

    await moveAndSaveTask(draggingTaskData);
}

/**
 * Moves the task locally, saves its status, and renders the affected columns.
 * Reverts the local move through saveTaskMove if saving fails.
 * Sets isTaskMovePending during the operation and resets it in finally.
 *
 * @param {{id: TaskId, task: Task, oldStatus: Task["status"], newStatus: Task["status"]}} draggingTaskData - Data needed to move the task.
 * @returns {Promise<void>} Resolves after the save attempt and rendering finish.
 */
async function moveAndSaveTask(draggingTaskData) {
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
 * Saves the new task status. Reverts the local move and shows an error notification if saving fails.
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
        showNotification("Task could not be moved. Please try again.", "error");
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
 * @returns {void}
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
 * Adds the CSS class that rotates the task card.
 *
 * @param {TaskId} taskId - ID of the task whose card should be rotated.
 * @returns {void}
 */
function addFlipCard(taskId) {
    const card = document.getElementById(taskId);
    card.classList.add("card-task-flip");
}

/**
 * Removes the CSS class that rotates the task card.
 *
 * @param {TaskId} taskId - ID of the task whose card rotation should be removed.
 * @returns {void}
 */
function removeFlipCard(taskId) {
    const card = document.getElementById(taskId);
    card.classList.remove("card-task-flip");
}
