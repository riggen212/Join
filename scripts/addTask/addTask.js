/**
 * Initializes the standalone Add Task page; does nothing on other pages.
 * Loads the current user and renders the form with the status from the URL.
 * Defaults to "toDo" when the status parameter is absent or invalid.
 * Replaces the form container with a persistent error message on failure.
 *
 * @returns {Promise<void>} Resolves after initialization, error handling, or an early return.
 */
async function initAddTaskPage() {
    const container = document.querySelector(".board-inner.add-task-inner");
    if (!container) return;

    try {
        loggedUserId = await loadCurrentUser(false);
        if (!loggedUserId) return;
        container.innerHTML = renderAddTask();

        await initAddTaskForm(
            container.querySelector(".task-form-wrapper"),
            getValidTaskStatus(new URLSearchParams(window.location.search).get("status")),
        );
    } catch (error) {
        container.innerHTML = `<p class="board-loading-error" role="alert">
        Task form could not be loaded. Please reload the page.</p>`;
    }
}

initAddTaskPage();

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
    isTaskSaving = false;
    form.dataset.taskStatus = getValidTaskStatus(status);
    setMinDueDate(form);

    await loadAssignedContacts(form, task);

    if (task) {
        fillTaskForm(form, task);
    }

    updateCreateTaskButton(form);
    form.dataset.initialState = getTaskFormState(form);
    form.inert = false;
}

/**
 * Returns all values of the task form as one string, so two states can be compared.
 *
 * @param {HTMLFormElement} form - The task form.
 * @returns {string} The current form values as JSON.
 */
function getTaskFormState(form) {
    return JSON.stringify({
        title: form.querySelector("#task-title").value,
        description: form.querySelector("#task-description").value,
        dueDate: form.querySelector("#task-due-date").value,
        priority: getSelectedPriority(form),
        category: form.querySelector('input[name="category"]:checked')?.value ?? "",
        assignedTo: getAssignedContacts(form),
        subtasks: getTaskSubtasks(form),
        newSubtask: form.querySelector("#subtask").value,
    });
}

/**
 * Checks whether the form was changed since it was opened.
 * A form that is still loading has no changes yet.
 *
 * @param {HTMLFormElement} form - The task form.
 * @returns {boolean} True if there are unsaved changes.
 */
function hasUnsavedTaskChanges(form) {
    if (form.dataset.initialState === undefined) return false;

    return getTaskFormState(form) !== form.dataset.initialState;
}

/**
 * Stores the task ID, its ETag and the original due date, then initializes the edit form.
 * The ETag is used to save the task only if nobody changed it in the meantime.
 * Propagates initialization errors to the caller.
 *
 * @param {HTMLFormElement} form - The form rendered by renderAddTask(true).
 * @param {TaskId} taskId - ID of the task being edited.
 * @param {Task} task - Existing task whose values populate the form.
 * @param {string} etag - ETag of the task when it was loaded.
 * @returns {Promise<void>} Resolves after initialization; rejects if initialization fails.
 */
async function initEditTaskForm(form, taskId, task, etag) {
    form.dataset.taskId = taskId;
    form.dataset.etag = etag;
    form.dataset.originalDueDate = task.dueDate || "";
    await initAddTaskForm(form, task.status, task);
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

// ---------- Fill form (edit mode) ----------

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
 * Selects the priority button of the task.
 *
 * @param {HTMLFormElement} form - The task form.
 * @param {Task["priority"]} priority - Selects urgent for "high", low for "low", and medium for all other values.
 * @returns {void}
 */
function fillPriority(form, priority) {
    let buttonName = "medium";

    if (priority === "high") buttonName = "urgent";
    if (priority === "low") buttonName = "low";

    selectTaskPriority(form.querySelector("#priority-" + buttonName), buttonName);
}

/**
 * Selects the category of the task.
 *
 * @param {HTMLFormElement} form - The task form.
 * @param {Task["category"]} category - The category of the task.
 * @returns {void}
 */
function fillCategory(form, category) {
    const radios = form.querySelectorAll('input[name="category"]');

    for (let i = 0; i < radios.length; i++) {
        if (radios[i].value === category) {
            radios[i].checked = true;
            form.querySelector("#task-category button span").textContent = category;
        }
    }
}

// ---------- Reset ----------

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

// ---------- Save ----------

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
 * Saves a new task while blocking repeated submissions through isTaskSaving.
 * Finishes creation only when saveNewTask returns an ID.
 * After a successful save the submit button stays disabled until the page changes or the dialog closes,
 * so the same task cannot be created twice. Only a failed save enables the button again.
 * Exposes the saving state through aria-busy.
 *
 * @param {HTMLFormElement} form - The valid task form to read and save.
 * @returns {Promise<void>} Resolves after saving and post-save handling, without waiting for navigation or animations.
 */
async function createTask(form) {
    const task = getTaskFromForm(form);
    let isTaskCreated = false;
    setTaskSavingState(form, true);

    try {
        const taskId = await saveNewTask(task);

        if (taskId !== false) {
            isTaskCreated = true;
            finishTaskCreation(form, taskId, task);
        }
    } catch (error) {
        showNotification("Task was saved, but the page could not be updated. Please reload the page.", "error");
    } finally {
        if (!isTaskCreated) setTaskSavingState(form, false);
    }
}

/**
 * Maximum number of attempts to find a free task ID.
 * Another attempt is needed when someone saved a task with the same ID at the same time.
 */
const MAX_TASK_ID_ATTEMPTS = 5;

/**
 * Loads existing tasks, derives the next numeric task ID, and saves the new task.
 * The task is only written if the ID is still free. Otherwise the next ID is tried.
 * Shows an error notification and returns false if loading or saving fails.
 *
 * @param {Task} task - The new task to save.
 * @returns {Promise<TaskId|false>} The saved task ID, or false if the operation fails.
 */
async function saveNewTask(task) {
    try {
        for (let attempt = 0; attempt < MAX_TASK_ID_ATTEMPTS; attempt++) {
            const tasks = await getData(DB_TASKS);
            const taskId = getNextTaskId(tasks || {});

            if (await putDataIfUnchanged(DB_TASKS + taskId, task, DB_EMPTY_ETAG)) return taskId;
        }

        throw new Error("No free task ID found.");
    } catch (error) {
        showNotification("Saving task to the database has failed.", "error");
        return false;
    }
}

/**
 * Handles a task that has already been saved.
 * In a dialog, updates the board and starts closing; success is displayed after closing.
 * On the standalone page, shows success and schedules navigation after 1200 ms.
 *
 * @param {HTMLFormElement} form - The form used to create the task.
 * @param {TaskId} taskId - ID of the saved task.
 * @param {Task} task - Saved task data.
 * @returns {void}
 * @throws {Error} If synchronous post-save processing fails.
 */
function finishTaskCreation(form, taskId, task) {
    const dialog = form.closest("dialog");

    if (dialog) {
        updateBoardAfterTaskCreation(taskId, task);
        dialog.dataset.notification = "Task added to board";
        dialog.classList.add("dialog-task-closing");
    } else {
        showNotification("Task added to board");
        setTimeout(goToBoard, 1200);
    }
}

/**
 * Navigates to the board page.
 * Marks successful task creation for announcement on the board page.
 * 
 * @returns {void}
 */
function goToBoard() {
    window.location.href = "./board.html?taskCreated=true";
}

/**
 * Saves an edited task while blocking repeated submissions through isTaskSaving.
 * Updates the board only after saving succeeds and shows success only if the board update succeeds.
 * Both helpers handle and report their own operation failures.
 * Resets the save flag and updates the submitted form's button in finally.
 * Exposes the saving state through aria-busy and clears it in finally.
 *
 * @param {HTMLFormElement} form - The valid edit form containing the task ID and values.
 * @returns {Promise<void>} Resolves after saving and board-update handling.
 */
async function updateTask(form) {
    const taskId = form.dataset.taskId;
    const task = getTaskFromForm(form);
    setTaskSavingState(form, true);

    try {
        let isTaskSaved = await saveUpdatedTask(taskId, task, form.dataset.etag);
        if (isTaskSaved) {
            let isBoardUpdated = updateBoardAfterTaskEdit(taskId, task);
            if (isBoardUpdated) showNotification("Task successfully updated.");
        }
    } finally {
        setTaskSavingState(form, false);
    }
}

/**
 * Replaces an existing task in Firebase with the supplied task data,
 * but only if nobody changed, moved or deleted the task since the edit form was opened.
 * Shows an error notification if the task was changed or writing to the database fails.
 *
 * @param {TaskId} taskId - ID of the task to replace.
 * @param {Task} task - Complete task data to write.
 * @param {string} etag - ETag of the task when the edit form was opened.
 * @returns {Promise<boolean>} True if saving succeeds; false if the task was changed or the write fails.
 */
async function saveUpdatedTask(taskId, task, etag) {
    try {
        const isSaved = await putDataIfUnchanged(DB_TASKS + taskId, task, etag);

        if (!isSaved) {
            showNotification("This task was changed by someone else. Please reload the board and try again.", "error");
        }

        return isSaved;
    } catch (error) {
        showNotification("Saving task to the database has failed.", "error");
        return false;
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
 * Returns the selected priority in the format of the database.
 *
 * @param {HTMLFormElement} form - The task form.
 * @returns {"high"|"medium"|"low"} The normalized priority written by the task form.
 */
function getSelectedPriority(form) {
    if (form.querySelector("#priority-urgent").classList.contains("urgent")) return "high";
    if (form.querySelector("#priority-low").classList.contains("low")) return "low";
    return "medium";
}

/**
 * Returns the checked contacts, e.g. { contact1: true, contact3: true }.
 *
 * @param {HTMLFormElement} form - The task form.
 * @returns {Object.<ContactId, true>} Selected contact IDs mapped to true; empty if none are selected.
 */
function getAssignedContacts(form) {
    const checkedBoxes = form.querySelectorAll('input[name="assignedTo"]:checked');
    /** @type {Object.<ContactId, true>} */
    const assignedTo = {};

    for (let i = 0; i < checkedBoxes.length; i++) {
        assignedTo[checkedBoxes[i].value] = true;
    }

    return assignedTo;
}

/**
 * Finds the highest task number and returns the next free task ID.
 *
 * @param {TaskDirectory} tasks - Existing tasks used to find the highest numeric ID suffix.
 * @returns {TaskId} The next numeric task ID, e.g. "task11"; does not reserve it in Firebase.
 */
function getNextTaskId(tasks) {
    const taskIds = Object.keys(tasks);
    let highestNumber = 0;

    for (let i = 0; i < taskIds.length; i++) {
        const number = Number(taskIds[i].replace("task", ""));

        if (number > highestNumber) {
            highestNumber = number;
        }
    }

    return "task" + (highestNumber + 1);
}
