/**
 * Inserts the Add Task view when the page contains its target container.
 */
function initAddTaskPage() {
    const container = document.querySelector(".board-inner.add-task-inner");

    if (container) {
        container.innerHTML = renderAddTask();
    }
}

initAddTaskPage();

/**
 * Shows the selected category in the field and closes the dropdown.
 *
 * @param {Event} event - The change event from the selected category.
 */
function selectTaskCategory(event) {
    const field = event.currentTarget;

    field.querySelector("button span").textContent = event.target.value;
    event.target.blur();
    field.querySelector("button").blur();
}

/**
 * Activates the selected priority button and deactivates the others.
 *
 * @param {HTMLButtonElement} selectedButton - The button that was clicked.
 * @param {string} priority - The priority to activate: urgent, medium, or low.
 */
function selectTaskPriority(selectedButton, priority) {
    const buttons = selectedButton.closest(".task-priority").querySelectorAll("button");

    buttons.forEach(button => {
        button.classList.remove("urgent", "medium", "low");
        button.setAttribute("aria-pressed", button === selectedButton);
    });

    selectedButton.classList.add(priority);
}

/**
 * Restores the form's custom selections when it is cleared.
 *
 * @param {HTMLFormElement} form - The form being reset.
 */
function resetTaskForm(form) {
    selectTaskPriority(form.querySelector("#priority-medium"), "medium");
    form.querySelector("#task-category button span").textContent = "Select task category";
}