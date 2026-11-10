/**
 * Toggles a subtask's completion status, refreshes the task card,
 * and saves the change. Reverts the change if saving fails.
 *
 * @param {HTMLInputElement} checkbox - The changed checkbox.
 * @param {TaskId} taskId - ID of the task containing the subtask.
 * @param {Task["status"]} taskStatus - Current board column of the task.
 * @param {SubtaskId} subtaskId - ID of the subtask being toggled.
 * @returns {Promise<void>} Resolves after saving or reverting the change.
 */
async function handleSubtaskCheckboxChange(checkbox, taskId, taskStatus, subtaskId) {
    const task = getTaskById(taskId, taskStatus);
    const subtask = task.subtasks[subtaskId];

    toggleSubtaskCompletion(taskId, task, subtask);

    await saveSubtaskCompletion(checkbox, taskId, task, subtaskId, subtask);
}

/**
 * Inverts the subtask's completion status and refreshes the task card.
 *
 * @param {TaskId} taskId - ID of the task containing the subtask.
 * @param {Task} task - The task whose card is refreshed.
 * @param {Subtask} subtask - The subtask to toggle.
 * @returns {void}
 */
function toggleSubtaskCompletion(taskId, task, subtask) {
    subtask.completed = !subtask.completed;
    updateTaskCardSubtasksState(taskId, task);
}

/**
 * Saves the subtask's completion status to the database.
 * Reverts the local state and checkbox and shows an error notification if saving fails.
 *
 * @param {HTMLInputElement} checkbox - The changed checkbox.
 * @param {TaskId} taskId - ID of the task containing the subtask.
 * @param {Task} task - The task containing the subtask.
 * @param {SubtaskId} subtaskId - ID of the subtask to update.
 * @param {Subtask} subtask - The subtask with the updated completion status.
 * @returns {Promise<void>} Resolves after saving or reverting the change.
 */
async function saveSubtaskCompletion(checkbox, taskId, task, subtaskId, subtask) {
    try {
        await updateSubtaskInDatabase(taskId, subtaskId, {
            completed: subtask.completed,
        });
    } catch (error) {
        revertSubtaskCompletion(checkbox, taskId, task, subtask);
        showNotification("Subtask could not be updated. Your change was reverted.", "error");
    }
}

/**
 * Reverts a subtask completion toggle, refreshes the task card,
 * and restores the checkbox state.
 *
 * @param {HTMLInputElement} checkbox - The checkbox to restore.
 * @param {TaskId} taskId - ID of the task containing the subtask.
 * @param {Task} task - The task whose card is refreshed.
 * @param {Subtask} subtask - The subtask whose toggle is reverted.
 * @returns {void}
 */
function revertSubtaskCompletion(checkbox, taskId, task, subtask) {
    toggleSubtaskCompletion(taskId, task, subtask);
    checkbox.checked = subtask.completed;
}

/**
 * Updates the subtask summary and progress bar of the specified task card.
 *
 * @param {TaskId} taskId - ID of the task whose card is updated.
 * @param {Task} task - The task whose subtask state is updated.
 * @returns {void}
 */
function updateTaskCardSubtasksState(taskId, task) {
    const subtaskData = getSubtasksCardData(task);
    const subtasksRef = getTaskCardSubtasksHtmlElement(taskId, task.status);
    const subtasksSummaryRef = subtasksRef.querySelector(".task-card-subtasks-summary");
    const subtasksProgressBarRef = subtasksRef.querySelector(".task-card-subtasks-progress-bar");

    subtasksSummaryRef.textContent = `${subtaskData.completedAmount}/${subtaskData.amount} Subtasks`;
    subtasksProgressBarRef.style.width = `${subtaskData.progressInPercent}%`;
}

/**
 * Finds the subtask container within the specified task card.
 * Requires the column and task card to exist in the DOM.
 *
 * @param {TaskId} taskId - ID of the task whose card is queried.
 * @param {Task["status"]} taskStatus - Current status identifying the task's board column.
 * @returns {HTMLElement|null} The subtask container,
 * or null if the card has no matching subtask element.
 */
function getTaskCardSubtasksHtmlElement(taskId, taskStatus) {
    const columnRef = document.querySelector(`[data-column-id="${taskStatus}"]`);
    const taskCardRef = columnRef.querySelector(`[data-task-id="${taskId}"]`);
    const subtaskRef = taskCardRef.querySelector(".task-card-subtasks");

    return subtaskRef;
}
