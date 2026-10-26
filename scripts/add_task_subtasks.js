/**
 * Adds a subtask when Enter is pressed in the subtask field.
 *
 * @param {KeyboardEvent} event - The keydown event.
 */
function addSubtaskOnEnter(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        addSubtask(event.target.form);
    }
}

/**
 * Adds the text of the subtask field as a new subtask.
 *
 * @param {HTMLFormElement} form - The task form.
 */
function addSubtask(form) {
    const input = form.querySelector("#subtask");
    const title = input.value.trim();

    if (title === "") return;

    form.querySelector("#subtask-list").insertAdjacentHTML("beforeend", getSubtaskTemplate(title, false));
    input.value = "";
    input.focus();
}

/**
 * Clears the subtask field.
 *
 * @param {HTMLFormElement} form - The task form.
 */
function clearSubtaskInput(form) {
    const input = form.querySelector("#subtask");
    input.value = "";
    input.focus();
}

/**
 * Shows the subtasks of an existing task in the subtask list.
 *
 * @param {HTMLFormElement} form - The task form.
 * @param {Object} subtasks - The subtasks of the task.
 */
function fillSubtasks(form, subtasks) {
    if (!subtasks) return;

    const list = form.querySelector("#subtask-list");
    const keys = Object.keys(subtasks).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    for (let i = 0; i < keys.length; i++) {
        const subtask = subtasks[keys[i]];
        list.insertAdjacentHTML("beforeend", getSubtaskTemplate(subtask.title, subtask.completed));
    }
}

/**
 * Deletes a subtask.
 *
 * @param {HTMLButtonElement} button - The clicked delete button.
 */
function deleteSubtask(button) {
    button.closest(".subtask-item").remove();
}

/**
 * Shows an input to edit the title of a subtask.
 *
 * @param {HTMLElement} element - The clicked edit button or subtask title.
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
 *
 * @param {KeyboardEvent} event - The keydown event.
 */
function handleSubtaskEditKeydown(event) {
    const input = event.target;

    if (event.key === "Escape") {
        event.preventDefault();
        input.value = input.previousElementSibling.textContent;
        input.blur();
    }

    if (event.key === "Enter") {
        event.preventDefault();
        input.blur();
    }
}

/**
 * Finishes editing a subtask. Leaving the input saves the new title.
 *
 * @param {HTMLButtonElement} button - The clicked save button.
 */
function finishSubtaskEdit(button) {
    const input = button.closest(".subtask-item").querySelector(".subtask-edit-input");
    if (input) input.blur();
}

/**
 * Saves the edited title. An empty title deletes the subtask.
 *
 * @param {HTMLInputElement} input - The edit input.
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
 */
function showSubtaskTitle(item, newTitle) {
    const title = item.querySelector(".subtask-title");

    title.textContent = newTitle;
    title.hidden = false;
}

/**
 * Collects all subtasks of the form for the database.
 *
 * @param {HTMLFormElement} form - The task form.
 * @returns {Object} The subtasks, e.g. { subtask1: { title, completed } }.
 */
function getTaskSubtasks(form) {
    const items = form.querySelectorAll("#subtask-list .subtask-item");
    const subtasks = {};

    for (let i = 0; i < items.length; i++) {
        subtasks["subtask" + (i + 1)] = {
            title: items[i].querySelector(".subtask-title").textContent,
            completed: items[i].dataset.completed === "true",
        };
    }

    return subtasks;
}
