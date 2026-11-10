/**
 * Appends existing subtasks to the form sorted by position, preserving their IDs.
 * Treats missing positions as zero.
 *
 * @param {HTMLFormElement} form - The task form.
 * @param {SubtaskDirectory|null} [subtasks] - Existing subtasks; null or omitted values leave the list unchanged.
 * @returns {void}
 */
function fillSubtasks(form, subtasks) {
    if (!subtasks) return;

    const list = form.querySelector("#subtask-list");
    const keys = Object.keys(subtasks).sort((a, b) => (subtasks[a].position ?? 0) - (subtasks[b].position ?? 0));

    for (let i = 0; i < keys.length; i++) {
        const subtask = subtasks[keys[i]];
        list.insertAdjacentHTML("beforeend", getSubtaskTemplate(keys[i], subtask.title, subtask.completed));
    }
}

/**
 * Adds a subtask when Enter is pressed in the subtask field.
 *
 * @param {KeyboardEvent} event - The keydown event.
 * @returns {void}
 */
function addSubtaskOnEnter(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        addSubtask(event.target.form);
    }
}

/**
 * Appends a new subtask with a generated UUID to the form.
 * Does not save the subtask to the database.
 *
 * @param {HTMLFormElement} form - The task form.
 * @returns {void}
 */
function addSubtask(form) {
    const input = form.querySelector("#subtask");
    const title = input.value.trim();
    const subtaskId = crypto.randomUUID();

    if (title === "") return;

    form.querySelector("#subtask-list").insertAdjacentHTML("beforeend", getSubtaskTemplate(subtaskId, title, false));
    input.value = "";
    input.focus();
}

/**
 * Clears the subtask field.
 *
 * @param {HTMLFormElement} form - The task form.
 * @returns {void}
 */
function clearSubtaskInput(form) {
    const input = form.querySelector("#subtask");
    input.value = "";
    input.focus();
}

/**
 * Shows an input to edit the title of a subtask.
 *
 * @param {HTMLElement} element - The clicked edit button or subtask title.
 * @returns {void}
 */
function editSubtask(element) {
    const item = element.closest(".subtask-item");
    const title = item.querySelector(".subtask-title");

    if (item.classList.contains("is-editing")) return;

    title.insertAdjacentHTML("afterend", getSubtaskEditTemplate());
    const input = item.querySelector(".subtask-edit-input");
    input.value = title.textContent;

    title.hidden = true;
    item.classList.add("is-editing");
    input.focus();
}

/**
 * Enter saves the edited subtask, Escape discards the change.
 * Restores focus after either action through finishSubtaskEdit().
 *
 * @param {KeyboardEvent} event - The keydown event.
 * @returns {void}
 */
function handleSubtaskEditKeydown(event) {
    const input = event.target;

    if (event.key === "Escape") {
        event.preventDefault();
        input.value = input.previousElementSibling.textContent;
        finishSubtaskEdit(input);
    }

    if (event.key === "Enter") {
        event.preventDefault();
        finishSubtaskEdit(input);
    }
}

/**
 * Finishes editing a subtask. Leaving the input saves the new title.
 * Restores focus to the edit button or the subtask input if the item was removed.
 *
 * @param {HTMLButtonElement|HTMLInputElement} button - The clicked save button or active edit input.
 * @returns {void}
 */
function finishSubtaskEdit(button) {
    const item = button.closest(".subtask-item");
    const form = item.closest("form");
    const input = item.querySelector(".subtask-edit-input");
    if (input) input.blur();

    const target = item.isConnected ? item.querySelector(".subtask-edit-button") : form.querySelector("#subtask");

    target?.focus();
}

/**
 * Applies the edited title to the form only. An empty title removes the subtask from the form.
 *
 * @param {HTMLInputElement} input - The edit input.
 * @returns {void}
 */
function saveSubtaskEdit(input) {
    const item = input.closest(".subtask-item");
    if (!item) return;

    const newTitle = input.value.trim();
    input.remove();
    item.classList.remove("is-editing");

    if (newTitle === "") {
        item.remove();
    } else {
        showSubtaskTitle(item, newTitle);
    }
}

/**
 * Shows the subtask title again with the new text.
 *
 * @param {HTMLLIElement} item - The subtask list item.
 * @param {string} newTitle - The new title.
 * @returns {void}
 */
function showSubtaskTitle(item, newTitle) {
    const title = item.querySelector(".subtask-title");

    title.textContent = newTitle;
    title.hidden = false;
}

/**
 * Removes a subtask from the form only; the database changes when the task is saved.
 * Restores focus to the subtask input after removing the item.
 *
 * @param {HTMLButtonElement} button - The clicked delete button.
 * @returns {void}
 */
function deleteSubtask(button) {
    const form = button.form;
    button.closest(".subtask-item").remove();
    form.querySelector("#subtask").focus();
}

/**
 * Collects all subtasks of the form for the database.
 *
 * @param {HTMLFormElement} form - The task form.
 * @returns {SubtaskDirectory} Subtasks with preserved IDs, completion states and positions based on DOM order.
 */
function getTaskSubtasks(form) {
    const items = form.querySelectorAll("#subtask-list .subtask-item");
    const subtasks = {};

    for (let i = 0; i < items.length; i++) {
        subtasks[items[i].dataset.subtaskId] = {
            title: items[i].querySelector(".subtask-title").textContent,
            completed: items[i].dataset.completed === "true",
            position: i,
        };
    }

    return subtasks;
}
