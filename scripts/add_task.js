/**
 * Bootstraps the Add Task page: renders the template into the page's
 * container and wires the auxiliary form behaviors (custom validation
 * override and subtask Enter-key guard).
 */
function initAddTaskPage() {
    const container = document.querySelector(".board-inner.add-task-inner");
    if (!container) return;
    container.innerHTML = renderAddTask();
    const form = container.querySelector(".task-form-wrapper");
    disableHtml5Validation(form);
    preventEnterOnSubtask(form);
}

initAddTaskPage();


/**
 * Disables the browser's built-in HTML5 form validation so the
 * application can surface its own error feedback.
 *
 * @param {HTMLFormElement} form - The Add Task form element.
 */
function disableHtml5Validation(form) {
    if (!form) return;
    form.setAttribute("novalidate", "novalidate");
    form.noValidate = true;
}


/**
 * Prevents the Enter key from submitting the form while the user is
 * typing inside the subtask input.
 *
 * @param {HTMLFormElement} form - The Add Task form element.
 */
function preventEnterOnSubtask(form) {
    const subtaskInput = form.querySelector("#subtask");
    if (!subtaskInput) return;
    subtaskInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") event.preventDefault();
    });
}


/**
 * Reflects the selected category in the field's display text and
 * closes the dropdown by removing focus from the controls.
 *
 * @param {Event} event - The change event fired by the category fieldset.
 */
function selectTaskCategory(event) {
    const field = event.currentTarget;
    field.querySelector("button span").textContent = event.target.value;
    event.target.blur();
    field.querySelector("button").blur();
}


/**
 * Activates the clicked priority button and deactivates the others,
 * keeping aria-pressed state in sync with the visual selection.
 *
 * @param {HTMLButtonElement} selectedButton - The button the user clicked.
 * @param {string} priority - The priority class: urgent, medium, or low.
 */
function selectTaskPriority(selectedButton, priority) {
    const buttons = selectedButton.closest(".task-priority").querySelectorAll("button");
    buttons.forEach((button) => {
        button.classList.remove("urgent", "medium", "low");
        button.setAttribute("aria-pressed", button === selectedButton);
    });
    selectedButton.classList.add(priority);
}


/**
 * Restores the form's custom UI state (priority button highlight and
 * category placeholder text) whenever the user clears the form.
 *
 * @param {HTMLFormElement} form - The form that was just reset.
 */
function resetTaskForm(form) {
    selectTaskPriority(form.querySelector("#priority-medium"), "medium");
    form.querySelector("#task-category button span").textContent = "Select task category";
}