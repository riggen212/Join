/**
 * Whether a task is being moved using the keyboard.
 * Ends when the movement is confirmed or canceled.
 *
 * @type {boolean}
 */
let isKeyboardMoveActive = false;

/**
 * Index of the selected destination in Object.keys(board).
 * Retained while the confirmed move is pending and reset to null
 * by finishMovingTaskWithKeyboard().
 *
 * @type {number|null}
 */
let highlightedColumnIndex = null;

/**
 * Handles task card keyboard input.
 * Delegates to movement controls when isKeyboardMoveActive is true;
 * otherwise handles opening the dialog or starting keyboard movement.
 *
 * @param {KeyboardEvent} event - The task card's keydown event.
 * @param {TaskId} taskId - ID of the focused task.
 * @param {Task["status"]} taskStatus - Current status of the focused task.
 * @returns {Promise<void>} Resolves after the keyboard input has been handled.
 */
async function handleTaskCardKeydown(event, taskId, taskStatus) {
    if (isKeyboardMoveActive) {
        await handleKeyboardMovement(taskId, event);
    } else {
        handleKeyboardTaskCardOperation(event, taskId, taskStatus);
    }
}

/**
 * Opens the task on Enter or starts keyboard movement on Space.
 * Prevents the default action for both keys and skips repeated input
 * or actions while a task move is pending.
 *
 * @param {KeyboardEvent} event - The task card's keydown event.
 * @param {TaskId} taskId - ID of the focused task.
 * @param {Task["status"]} taskStatus - Current status of the focused task.
 * @returns {void}
 */
function handleKeyboardTaskCardOperation(event, taskId, taskStatus) {
    if (event.key === " ") {
        event.preventDefault();
        if (!isTaskMovePending && !event.repeat) startMovingTaskWithKeyboard(taskId, taskStatus, event);
    } else if (event.key === "Enter") {
        event.preventDefault();
        if (!isTaskMovePending && !event.repeat) openTaskDialog(taskId, taskStatus);
    }
}

/**
 * Prevents default behavior and ignores repeated Space, Enter,
 * ArrowRight, and ArrowLeft events during keyboard movement.
 * Passes all other events to keyboardMovement().
 *
 * @param {TaskId} taskId - ID of the task being moved.
 * @param {KeyboardEvent} event - The task card's keydown event.
 * @returns {Promise<void>} Resolves after the input is ignored or handled.
 */
async function handleKeyboardMovement(taskId, event) {
    if (
        event.repeat &&
        (event.key === " " || event.key === "Enter" || event.key === "ArrowRight" || event.key === "ArrowLeft")
    ) {
        event.preventDefault();
        return;
    }

    await keyboardMovement(taskId, event);
}

/**
 * Executes the action mapped to the pressed key during keyboard movement.
 * Prevents default behavior for mapped keys and Space.
 * Ignores other keys and waits for asynchronous actions to finish.
 *
 * @param {TaskId} taskId - ID of the task being moved.
 * @param {KeyboardEvent} event - The task card's keydown event.
 * @returns {Promise<void>} Resolves after the input is ignored or handled.
 */
async function keyboardMovement(taskId, event) {
    /** @type {Record<string, () => void|Promise<void>>} */
    const actions = getKeyboardActions(event, taskId);

    /** @type {(() => void|Promise<void>)|undefined} */
    const action = actions[event.key];

    if (!Object.hasOwn(actions, event.key) && event.key !== " ") return;

    event.preventDefault();
    if (action) await action();
}

/**
 * Creates the keyboard action mapping for destination navigation,
 * confirmation, and cancellation. Tab and ArrowRight advance; ArrowLeft moves back.
 * Enter confirms, Escape cancels, and column navigation wraps around.
 *
 * @param {TaskId} taskId - ID passed to confirmation and cleanup actions.
 * @returns {Record<string, () => void|Promise<void>>} Actions indexed by key value.
 */
function getKeyboardActions(event, taskId) {
    return {
        ArrowRight: moveToNextColumn,
        ArrowLeft: moveToPreviousColumn,
        Tab: event.shiftKey ? moveToPreviousColumn : moveToNextColumn,
        Enter: () => confirmMovingTaskWithKeyboard(taskId),
        Escape: () => finishMovingTaskWithKeyboard(taskId),
    };
}

/**
 * Calls startDraggingTask() to select the task.
 * If draggingTask is set, enables keyboard movement, sets
 * highlightedColumnIndex from taskStatus, and highlights
 * the column identified by draggingTask.status.
 *
 * @param {TaskId} taskId - ID of the task to select.
 * @param {Task["status"]} taskStatus - Current status of the task.
 * @param {KeyboardEvent} event - The keydown event starting the movement.
 * @returns {void}
 */
function startMovingTaskWithKeyboard(taskId, taskStatus, event) {
    startDraggingTask(taskId, taskStatus, event);

    if (draggingTask) {
        isKeyboardMoveActive = true;
        highlightedColumnIndex = Object.keys(board).findIndex((column) => column === taskStatus);

        addHighlightDroppableColumn(draggingTask.status);
    }
}

/**
 * Sets isKeyboardMoveActive to false and calls moveTask()
 * with the highlighted column's status.
 * After moveTask() resolves, removes the movement indicators,
 * resets the selection, and focuses the task card.
 *
 * @param {TaskId} taskId - ID of the task being moved.
 * @returns {Promise<void>} Resolves after the move attempt and keyboard cleanup.
 */
async function confirmMovingTaskWithKeyboard(taskId) {
    isKeyboardMoveActive = false;
    await moveTask(Object.keys(board)[highlightedColumnIndex]);
    finishMovingTaskWithKeyboard(taskId);
}

/**
 * Sets isKeyboardMoveActive to false, removes the highlighted
 * column's mark, and resets highlightedColumnIndex to null.
 * Calls endDraggingTask() to remove the card's rotation and
 * reset draggingTask, then focuses the task card.
 *
 * Requires an active highlighted column and an existing task card.
 *
 * @param {TaskId} taskId - ID of the task card to restore focus to.
 * @returns {void}
 */
function finishMovingTaskWithKeyboard(taskId) {
    isKeyboardMoveActive = false;

    removeHighlightDroppableColumn(Object.keys(board)[highlightedColumnIndex]);
    highlightedColumnIndex = null;

    endDraggingTask(taskId);
    document.getElementById(taskId).focus();
}

/**
 * Increments highlightedColumnIndex and moves the highlight
 * to that column without moving the task.
 * Wraps from the last column to the first.
 * Requires a valid highlightedColumnIndex and existing column elements.
 *
 * @returns {void}
 */
function moveToNextColumn() {
    const columns = Object.keys(board);
    removeHighlightDroppableColumn(columns[highlightedColumnIndex]);

    highlightedColumnIndex = highlightedColumnIndex + 1;
    if (highlightedColumnIndex >= columns.length) highlightedColumnIndex = 0;

    addHighlightDroppableColumn(columns[highlightedColumnIndex]);
}

/**
 * Decrements highlightedColumnIndex and moves the highlight
 * to that column without moving the task.
 * Wraps from the first column to the last.
 * Requires a valid highlightedColumnIndex and existing column elements.
 *
 * @returns {void}
 */
function moveToPreviousColumn() {
    const columns = Object.keys(board);
    removeHighlightDroppableColumn(columns[highlightedColumnIndex]);

    highlightedColumnIndex = highlightedColumnIndex - 1;
    if (highlightedColumnIndex < 0) highlightedColumnIndex = columns.length - 1;

    addHighlightDroppableColumn(columns[highlightedColumnIndex]);
}
