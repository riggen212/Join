/**
 * Identifies subtasks whose completion state is currently being saved.
 *
 * @type {Set<string>}
 */
const pendingSubtaskUpdates = new Set();

/**
 * Saves a subtask completion change unless another save is pending for it.
 * Restores the displayed state when a repeated change is ignored.
 *
 * @param {HTMLInputElement} checkbox - The changed checkbox.
 * @param {TaskId} taskId - ID of the task containing the subtask.
 * @param {Task["status"]} taskStatus - Current board column of the task.
 * @param {SubtaskId} subtaskId - ID of the changed subtask.
 * @returns {Promise<void>} Resolves after saving, reverting, or ignoring a repeated change.
 */
async function handleSubtaskCheckboxChange(checkbox, taskId, taskStatus, subtaskId) {
  const task = getTaskById(taskId, taskStatus);
  const subtask = task.subtasks[subtaskId];
  const key = `${taskId}/${subtaskId}`;

  if (pendingSubtaskUpdates.has(key)) {
    checkbox.checked = Boolean(subtask.completed);
    return;
  }

  const previousCompleted = Boolean(subtask.completed);
  pendingSubtaskUpdates.add(key);
  await saveSubtaskCompletion(checkbox, taskId, task, subtaskId, subtask, previousCompleted);
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
 * Toggles and saves a subtask while blocking further changes to it.
 * Restores the previous state on failure and always releases the saving lock.
 *
 * @param {HTMLInputElement} checkbox - The changed checkbox.
 * @param {TaskId} taskId - ID of the task containing the subtask.
 * @param {Task} task - The task containing the subtask.
 * @param {SubtaskId} subtaskId - ID of the subtask to update.
 * @param {Subtask} subtask - The subtask being updated.
 * @param {boolean} previousCompleted - Completion state before the change.
 * @returns {Promise<void>} Resolves after saving or reverting the change.
 */
async function saveSubtaskCompletion(checkbox, taskId, task, subtaskId, subtask, previousCompleted) {
  try {
    toggleSubtaskCompletion(taskId, task, subtask);
    syncSubtaskCheckboxes(checkbox, taskId, subtaskId, subtask.completed, true);
    await updateSubtaskInDatabase(taskId, subtaskId, { completed: subtask.completed });
  } catch (error) {
    revertSubtaskCompletion(checkbox, taskId, task, subtask, previousCompleted);
    showNotification("Subtask could not be updated. Your change was reverted.", "error");
  } finally {
    pendingSubtaskUpdates.delete(`${taskId}/${subtaskId}`);
    syncSubtaskCheckboxes(checkbox, taskId, subtaskId, subtask.completed, false);
  }
}

/**
 * Restores the subtask's previous completion state and refreshes its task card.
 *
 * @param {HTMLInputElement} checkbox - The checkbox to restore.
 * @param {TaskId} taskId - ID of the task containing the subtask.
 * @param {Task} task - The task whose card is refreshed.
 * @param {Subtask} subtask - The subtask to restore.
 * @param {boolean} previousCompleted - Completion state before the change.
 * @returns {void}
 */
function revertSubtaskCompletion(checkbox, taskId, task, subtask, previousCompleted) {
  subtask.completed = previousCompleted;
  checkbox.checked = previousCompleted;
  updateTaskCardSubtasksState(taskId, task);
}

/**
 * Synchronizes the original checkbox and its currently rendered replacement.
 *
 * @param {HTMLInputElement} checkbox - The checkbox that started the change.
 * @param {TaskId} taskId - ID of the task containing the subtask.
 * @param {SubtaskId} subtaskId - ID of the subtask.
 * @param {boolean} completed - Completion state to display.
 * @param {boolean} disabled - Whether checkbox interaction is blocked.
 * @returns {void}
 */
function syncSubtaskCheckboxes(checkbox, taskId, subtaskId, completed, disabled) {
  const dialog = document.getElementById("dialog-task");
  const currentCheckbox =
    dialog?.dataset.taskId === taskId
      ? dialog.querySelector(`input[data-subtask-id="${CSS.escape(subtaskId)}"]`)
      : null;

  for (const input of new Set([checkbox, currentCheckbox])) {
    if (!input) continue;
    input.checked = completed;
    input.disabled = disabled;
  }
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
