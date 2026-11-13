/**
 * Initializes the task form and loads its contact options.
 * Makes the form inert until all initialization steps succeed.
 * Populates an existing task only after its contact options have loaded.
 * On failure, leaves the form inert and propagates the error to the caller.
 *
 * @param {HTMLFormElement} form - The rendered task form.
 * @param {Task["status"]} [status="toDo"] - Status used when saving the task.
 * @param {Task|null} [task=null] - Existing task to populate, or null for creation.
 * @returns {Promise<void>} Resolves when the form is initialized and interactive; rejects on initialization failure.
 */
async function initAddTaskForm(form, status = "toDo", task = null) {
  form.inert = true;
  form.dataset.taskStatus = status;
  setMinDueDate(form);

  await loadAssignedContacts(form, task);

  if (task) {
    fillTaskForm(form, task);
  }

  finishTaskFormInitialization(form);
}

/**
 * Activates the initialized form and updates its responsive action bar.
 *
 * @param {HTMLFormElement} form - The initialized task form.
 * @returns {void}
 */
function finishTaskFormInitialization(form) {
  updateCreateTaskButton(form);
  form.inert = false;
  observeTaskFormOverflow(form);
  updateTaskActionBar(form);
}

/**
 * Stores the task ID and original due date, then initializes the edit form.
 * Propagates initialization errors to the caller.
 *
 * @param {HTMLFormElement} form - The form rendered by renderAddTask(true).
 * @param {TaskId} taskId - ID of the task being edited.
 * @param {Task} task - Existing task whose values populate the form.
 * @returns {Promise<void>} Resolves after initialization; rejects if initialization fails.
 */
async function initEditTaskForm(form, taskId, task) {
  form.dataset.taskId = taskId;
  form.dataset.originalDueDate = task.dueDate || "";
  await initAddTaskForm(form, task.status, task);
}

/**
 * Fills the form with the data of an existing task.
 *
 * @param {HTMLFormElement} form - The task form.
 * @param {Task} task - The task.
 * @returns {void}
 */
function fillTaskForm(form, task) {
  form.querySelector("#task-title").value = task.title;
  form.querySelector("#task-description").value = task.description || "";
  form.querySelector("#task-due-date").value = task.dueDate;
  fillPriority(form, task.priority);
  fillCategory(form, task.category);
  fillSubtasks(form, task.subtasks);
}

/**
 * Is called on every input or change in the form and updates the form.
 *
 * @param {HTMLFormElement} form - The task form.
 * @returns {void}
 */
function updateTaskForm(form) {
  renderAssignedBadges(form);
  filterAssignedOptions(form);
  updateCreateTaskButton(form);
  revalidateInvalidFields(form);
  updateTaskActionBar(form);
}

/**
 * Observes the Add Task content height to update its action bar layout.
 *
 * @param {HTMLFormElement} form - The task form inside the Add Task page.
 * @returns {void}
 */
function observeTaskFormOverflow(form) {
  const page = form.closest(".add-task-page");
  const content = page?.querySelector(".add-task-inner");
  if (!page || !content) return;
  const observer = new ResizeObserver(() => updateTaskActionBar(form));
  observer.observe(page);
  observer.observe(content);
}

/**
 * Pins the action bar only when the form exceeds its available content height.
 *
 * @param {HTMLFormElement} form - The task form inside the Add Task page.
 * @returns {void}
 */
function updateTaskActionBar(form) {
  const page = form.closest(".add-task-page");
  const content = page?.querySelector(".add-task-inner");
  const actions = form.querySelector(".submit-task");
  if (!page || !content || !actions || innerWidth < 1280) return;
  const overflows = getTaskFormOverflowState(page, content, actions);
  page.classList.toggle("has-task-form-overflow", overflows);
}

/**
 * Measures the Add Task form in its normal flow to determine whether it overflows.
 * Restores an existing fixed state after measuring.
 *
 * @param {HTMLElement} page - The Add Task page container.
 * @param {HTMLElement} content - The visible Add Task content area.
 * @param {HTMLElement} actions - The action bar below the form.
 * @returns {boolean} Whether the static form exceeds its available height.
 */
function getTaskFormOverflowState(page, content, actions) {
  const wasFixed = page.classList.contains("has-task-form-overflow");
  page.classList.remove("has-task-form-overflow");
  const overflows = content.scrollHeight > content.clientHeight;
  if (overflows) setTaskActionMetrics(page, actions);
  page.classList.toggle("has-task-form-overflow", wasFixed);
  return overflows;
}

/**
 * Stores the current action bar position for its fixed overflow state.
 *
 * @param {HTMLElement} page - The Add Task page container.
 * @param {HTMLElement} actions - The action bar below the task form.
 * @returns {void}
 */
function setTaskActionMetrics(page, actions) {
  const { left, width } = actions.getBoundingClientRect();
  page.style.setProperty("--task-action-left", `${left}px`);
  page.style.setProperty("--task-action-width", `${width}px`);
}

/**
 * Resets priority, category text, subtasks, and field errors.
 * Schedules a form update after the browser finishes its native reset.
 *
 * @param {HTMLFormElement} form - The task form.
 * @returns {void}
 */
function resetTaskForm(form) {
  selectTaskPriority(form.querySelector("#priority-medium"), "medium");
  form.querySelector("#task-category button span").textContent = "Select task category";
  form.querySelector("#subtask-list").innerHTML = "";
  clearFieldErrors(form);

  // The browser resets the inputs after this function, so the form is updated afterwards
  setTimeout(() => updateTaskForm(form), 0);
}

/**
 * Prevents native submission and ignores submissions while isTaskSaving is true.
 * Shows field errors for invalid input; otherwise starts creation or editing without awaiting it.
 *
 * @param {SubmitEvent} event - The task form submit event.
 * @returns {void}
 */
function submitTaskForm(event) {
  const form = event.target;
  event.preventDefault();

  if (isTaskSaving) return;

  if (!isTaskFormValid(form)) {
    showAllFieldErrors(form);
  } else if (form.dataset.taskId) {
    updateTask(form);
  } else {
    createTask(form);
  }
}

/**
 * Creates the task object for the database from the form.
 *
 * @param {HTMLFormElement} form - The task form.
 * @returns {Task} The task.
 */
function getTaskFromForm(form) {
  return {
    title: form.querySelector("#task-title").value.trim(),
    description: form.querySelector("#task-description").value.trim(),
    dueDate: form.querySelector("#task-due-date").value,
    priority: getSelectedPriority(form),
    category: form.querySelector('input[name="category"]:checked').value,
    status: form.dataset.taskStatus,
    assignedTo: getAssignedContacts(form),
    subtasks: getTaskSubtasks(form),
  };
}

/**
 * Stops the form from being sent when Enter is pressed in an input.
 *
 * @param {KeyboardEvent} event - The keydown event.
 * @returns {void}
 */
function preventEnterSubmit(event) {
  if (event.key === "Enter" && event.target.tagName === "INPUT") {
    event.preventDefault();
  }
}

/**
 * Updates the saving flag, accessible busy state and submit button.
 * Preserves submit-button focus when disabling it removes focus.
 *
 * @param {HTMLFormElement} form - The task form being saved.
 * @param {boolean} saving - Whether saving is in progress.
 * @returns {void}
 */
function setTaskSavingState(form, saving) {
  const button = form.querySelector('button[type="submit"]');
  if (saving) {
    form.dataset.restoreSubmitFocus = String(document.activeElement === button);
  }
  isTaskSaving = saving;
  form.setAttribute("aria-busy", String(saving));
  updateCreateTaskButton(form);
  if (!saving) restoreTaskSubmitFocus(form);
}

/**
 * Restores lost submit-button focus while preserving other focus changes.
 * Skips removed forms and dialogs that are already closing.
 *
 * @param {HTMLFormElement} form - The task form after saving.
 * @returns {void}
 */
function restoreTaskSubmitFocus(form) {
  const button = form.querySelector('button[type="submit"]');
  if (form.dataset.restoreSubmitFocus !== "true") return;
  if (!form.isConnected || button.disabled) return;
  if (form.closest(".dialog-task-closing")) return;
  if (document.activeElement !== document.body) return;
  button.focus();
}

/**
 * Enables the submit button only when the fields are valid and isTaskSaving is false.
 *
 * @param {HTMLFormElement} form - The task form.
 * @returns {void}
 */
function updateCreateTaskButton(form) {
  form.querySelector('button[type="submit"]').disabled = !isTaskFormValid(form) || isTaskSaving;
}
