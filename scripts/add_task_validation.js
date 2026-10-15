/**
 * Sets the earliest selectable due date to today.
 * When editing, an old due date of the task can still be kept.
 *
 * @param {HTMLFormElement} form - The task form.
 */
function setMinDueDate(form) {
    const today = getTodayAsIsoDate();
    const originalDate = form.dataset.originalDueDate;
    let minDate = today;

    if (originalDate && originalDate < today) {
        minDate = originalDate;
    }

    form.querySelector("#task-due-date").min = minDate;
}

/**
 * Returns an error message if the due date is in the past.
 *
 * @param {HTMLFormElement} form - The task form.
 * @returns {string} The error message or an empty string.
 */
function getPastDateError(form) {
    const dueDate = form.querySelector("#task-due-date").value;
    const isPast = dueDate !== "" && dueDate < getTodayAsIsoDate();
    const isOriginalDate = dueDate === form.dataset.originalDueDate;

    if (isPast && !isOriginalDate) {
        return "The due date cannot be in the past.";
    }

    return "";
}

/**
 * Checks if all required fields are filled correctly.
 *
 * @param {HTMLFormElement} form - The task form.
 * @returns {boolean} True if the task can be saved.
 */
function isTaskFormValid(form) {
    const title = form.querySelector("#task-title").value.trim();
    const dueDate = form.querySelector("#task-due-date").value;
    const category = form.querySelector('input[name="category"]:checked');

    return title !== "" && dueDate !== "" && category !== null && getPastDateError(form) === "";
}

/**
 * Enables the submit button only if the form is valid.
 *
 * @param {HTMLFormElement} form - The task form.
 */
function updateCreateTaskButton(form) {
    form.querySelector('button[type="submit"]').disabled = !isTaskFormValid(form);
}

/**
 * Shows an error if the title is empty.
 *
 * @param {HTMLFormElement} form - The task form.
 */
function validateTitle(form) {
    const input = form.querySelector("#task-title");
    let message = "";

    if (input.value.trim() === "") {
        message = "This field is required";
    }

    showFieldError(input, form.querySelector("#task-title-error"), message);
}

/**
 * Shows an error if the due date is empty or in the past.
 *
 * @param {HTMLFormElement} form - The task form.
 */
function validateDueDate(form) {
    const input = form.querySelector("#task-due-date");
    let message = getPastDateError(form);

    if (input.value === "") {
        message = "This field is required";
    }

    showFieldError(input, form.querySelector("#task-due-date-error"), message);
}

/**
 * Shows an error if no category is selected.
 *
 * @param {HTMLFormElement} form - The task form.
 */
function validateCategory(form) {
    const category = form.querySelector('input[name="category"]:checked');
    let message = "";

    if (category === null) {
        message = "This field is required";
    }

    showFieldError(form.querySelector("#task-category > button"), form.querySelector("#task-category-error"), message);
}

/**
 * Checks the category when the user leaves the category field.
 *
 * @param {FocusEvent} event - The focusout event.
 */
function checkCategoryOnLeave(event) {
    const field = event.currentTarget;

    if (!field.contains(event.relatedTarget)) {
        validateCategory(field.form);
    }
}

/**
 * Checks fields that already show an error again,
 * so the error disappears as soon as the field is correct.
 *
 * @param {HTMLFormElement} form - The task form.
 */
function revalidateInvalidFields(form) {
    if (form.querySelector("#task-title.is-invalid")) validateTitle(form);
    if (form.querySelector("#task-due-date.is-invalid")) validateDueDate(form);
    if (form.querySelector("#task-category > button.is-invalid")) validateCategory(form);
}

/**
 * Shows all error messages at once.
 *
 * @param {HTMLFormElement} form - The task form.
 */
function showAllFieldErrors(form) {
    validateTitle(form);
    validateDueDate(form);
    validateCategory(form);
}

/**
 * Shows or hides the error message of a field.
 *
 * @param {HTMLElement} field - The field with the red border.
 * @param {HTMLElement} errorElement - The element for the message.
 * @param {string} message - The error message, empty if there is no error.
 */
function showFieldError(field, errorElement, message) {
    if (message === "") {
        field.classList.remove("is-invalid");
    } else {
        field.classList.add("is-invalid");
    }

    errorElement.textContent = message;
}

/**
 * Removes all error messages from the form.
 *
 * @param {HTMLFormElement} form - The task form.
 */
function clearFieldErrors(form) {
    const invalidFields = form.querySelectorAll(".is-invalid");
    const errorMessages = form.querySelectorAll(".field-error");

    for (let i = 0; i < invalidFields.length; i++) {
        invalidFields[i].classList.remove("is-invalid");
    }

    for (let i = 0; i < errorMessages.length; i++) {
        errorMessages[i].textContent = "";
    }
}

/**
 * Returns today's date as YYYY-MM-DD.
 *
 * @returns {string} The date of today.
 */
function getTodayAsIsoDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return year + "-" + month + "-" + day;
}
