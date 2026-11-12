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
 * Moves a task through drag-and-drop, keyboard or popup controls.
 * Skips missing task IDs or current statuses, pending moves and unchanged statuses.
 *
 * @param {TaskId|undefined} taskId - ID of the task to move.
 * @param {Task["status"]} destinationStatus - Destination column.
 * @param {Task["status"]|undefined} currentStatus - Current task column.
 * @returns {Promise<boolean|undefined>} Save result, or undefined if skipped.
 */
async function moveTask(taskId, destinationStatus, currentStatus) {
  if (!taskId || !currentStatus || isTaskMovePending) return;
  if (currentStatus === destinationStatus) return;

  const moveData = getDataToMoveTask(taskId, destinationStatus, currentStatus);

  return await moveAndSaveTask(moveData);
}

/**
 * Builds movement data from the task ID and source and destination statuses.
 * Requires the task to exist in the source column.
 *
 * @param {TaskId} taskId - ID of the task to move.
 * @param {Task["status"]} destinationStatus - Destination column.
 * @param {Task["status"]} currentStatus - Current task column.
 * @returns {{id: TaskId, task: Task, oldStatus: Task["status"], newStatus: Task["status"]}} Data needed to move the task.
 */
function getDataToMoveTask(taskId, destinationStatus, currentStatus) {
  return {
    id: taskId,
    task: board[currentStatus].tasks[taskId],
    oldStatus: currentStatus,
    newStatus: destinationStatus,
  };
}

/**
 * Moves the task locally, saves its status, and renders the affected columns.
 * Reverts the local move through saveTaskMove if saving fails.
 * Sets isTaskMovePending during the operation and resets it in finally.
 *
 * @param {{id: TaskId, task: Task, oldStatus: Task["status"], newStatus: Task["status"]}} moveData - Data needed to move the task.
 * @returns {Promise<boolean>} Whether the task move was saved successfully.
 */
async function moveAndSaveTask(moveData) {
  isTaskMovePending = true;

  try {
    moveTaskBetweenColumns(moveData, moveData.newStatus, moveData.oldStatus);
    const wasSaved = await saveTaskMove(moveData);
    renderBoard([board[moveData.oldStatus], board[moveData.newStatus]]);
    return wasSaved;
  } finally {
    isTaskMovePending = false;
  }
}

/**
 * Updates the task's local status, adds it to the destination
 * column's task directory, and removes it from the source column.
 * Does not save or render the change.
 *
 * @param {{id: TaskId, task: Task, oldStatus: Task["status"], newStatus: Task["status"]}} moveData - Data needed to move the task.
 * @param {Task["status"]} destinationColumn - Status of the destination column.
 * @param {Task["status"]} sourceColumn - Status of the source column.
 * @returns {void}
 */
function moveTaskBetweenColumns(moveData, destinationColumn, sourceColumn) {
  moveData.task.status = destinationColumn;
  board[destinationColumn].tasks[moveData.id] = moveData.task;
  delete board[sourceColumn].tasks[moveData.id];
}

/**
 * Saves the new task status. Reverts the local move and shows an error notification if saving fails.
 *
 * @param {{id: TaskId, task: Task, oldStatus: Task["status"], newStatus: Task["status"]}} moveData - Data needed to move the task.
 * @returns {Promise<boolean>} Whether the task move was saved successfully.
 */
async function saveTaskMove(moveData) {
  try {
    await updateTaskInDatabase(moveData.id, {
      status: moveData.newStatus,
    });
    return true;
  } catch (error) {
    moveTaskBetweenColumns(moveData, moveData.oldStatus, moveData.newStatus);
    showNotification("Task could not be moved. Please try again.", "error");
    return false;
  }
}

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
  stopBoardDragScroll();
  removeFlipCard(taskId);
  draggingTask = null;
}

/**
 * Moves a dropped task and announces a successful move.
 *
 * @param {Task["status"]} destinationStatus - Destination column.
 * @returns {Promise<void>}
 */
async function moveTaskFromDrop(destinationStatus) {
  stopBoardDragScroll();
  const wasSaved = await moveTask(draggingTask?.id, destinationStatus, draggingTask?.status);

  if (wasSaved) {
    announceBoardMoveStatus(`Task moved to ${board[destinationStatus].name}.`);
  }
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
 * Builds the move popup excluding the task's current column.
 *
 * @param {TaskId} taskId - ID of the task.
 * @param {Task["status"]} currentStatus - Current task status.
 * @returns {string} HTML for the move popup.
 */
function getTaskMovePopupHtml(taskId, currentStatus) {
  let optionHtml = "";

  Object.entries(board).forEach(([status, column]) => {
    if (status !== currentStatus) {
      optionHtml += getTaskCardMoveOptionsTemplate(taskId, status, currentStatus, column.name);
    }
  });

  return getTaskCardMovePopupTemplate(taskId, optionHtml);
}

/**
 * Positions the mobile move menu at its task card's move button before opening.
 * Uses viewport coordinates to position the fixed popover consistently across browsers.
 *
 * @param {ToggleEvent} event - The popover's beforetoggle event.
 * @returns {void}
 */
function positionTaskMoveMenu(event) {
  if (event.newState !== "open") return;
  const menu = event.currentTarget;
  const button = menu.closest(".task-card").querySelector(".button-move-task");
  const bounds = button.getBoundingClientRect();

  menu.style.top = `${bounds.top}px`;
  menu.style.right = `${document.documentElement.clientWidth - bounds.right}px`;
}

/**
 * Moves a task from its popup, restores focus and announces a successful move.
 *
 * @param {TaskId} taskId - ID of the task to move.
 * @param {Task["status"]} destinationStatus - Destination column.
 * @param {Task["status"]} currentStatus - Current task column.
 * @returns {Promise<void>}
 */
async function moveTaskFromPopup(taskId, destinationStatus, currentStatus) {
  let wasSaved;

  try {
    wasSaved = await moveTask(taskId, destinationStatus, currentStatus);
  } finally {
    document.getElementById(taskId)?.querySelector(".button-move-task")?.focus();
  }

  if (wasSaved) {
    announceBoardMoveStatus(`Task moved to ${board[destinationStatus].name}.`);
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

/**
 * Announces board movement updates to screen readers.
 *
 * @param {string} message - The movement information to announce.
 * @returns {void}
 */
function announceBoardMoveStatus(message) {
  document.getElementById("board-move-status").textContent = message;
}
