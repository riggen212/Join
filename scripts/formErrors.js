/**
 * Displays a shared form error and optionally marks specified fields as invalid.
 * Requires a message element with data-form-error inside the form.
 *
 * @param {HTMLFormElement} form - The form containing the error elements.
 * @param {string} message - The error message to display.
 * @param {string[]} [fieldIds=[]] - IDs of fields to mark as invalid.
 * @returns {void}
 */
function showFormError(form, message, fieldIds = []) {
  const errorElement = form.querySelector("[data-form-error]");
  errorElement.textContent = message;

  for (const fieldId of fieldIds) {
    const input = form.querySelector(`#${fieldId}`);
    input.setAttribute("aria-invalid", "true");
    input.closest(".input-wrapper")?.classList.add("has-error");
  }
}

/**
 * Displays field errors and marks the corresponding inputs as invalid.
 * Requires a matching data-error-for element for each field ID.
 *
 * @param {HTMLFormElement} form - The form containing the inputs and error elements.
 * @param {Object.<string, string>} errors - Error messages indexed by input ID.
 * @returns {void}
 */
function showFormFieldErrors(form, errors) {
  for (const [fieldId, message] of Object.entries(errors)) {
    const input = form.querySelector(`#${fieldId}`);
    const error = form.querySelector(`[data-error-for="${fieldId}"]`);

    error.textContent = message;
    input.setAttribute("aria-invalid", "true");
    input.closest(".input-wrapper")?.classList.add("has-error");
  }
}

/**
 * Clears shared and field-specific error messages within a form.
 * Removes invalid states and input wrapper error classes.
 *
 * @param {HTMLFormElement} form - The form whose errors should be cleared.
 * @returns {void}
 */
function clearFormError(form) {
  for (const error of form.querySelectorAll("[data-form-error], [data-error-for]")) {
    error.textContent = "";
  }

  for (const input of form.querySelectorAll('[aria-invalid="true"]')) {
    input.removeAttribute("aria-invalid");
    input.closest(".input-wrapper")?.classList.remove("has-error");
  }
}

/**
 * Clears one field's message, invalid state and input wrapper error class.
 * Requires a matching data-error-for element.
 *
 * @param {HTMLFormElement} form - The form containing the field.
 * @param {string} fieldId - The ID of the input whose error should be cleared.
 * @returns {void}
 */
function clearFormFieldError(form, fieldId) {
  const input = form.querySelector(`#${fieldId}`);
  const error = form.querySelector(`[data-error-for="${fieldId}"]`);

  error.textContent = "";
  input.removeAttribute("aria-invalid");
  input.closest(".input-wrapper")?.classList.remove("has-error");
}
