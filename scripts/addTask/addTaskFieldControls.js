/**
 * Opens or closes the category list when the field is clicked.
 * Toggles aria-expanded while keeping focus on the category button.
 *
 * @param {MouseEvent} event - The mousedown event.
 * @returns {void}
 */
function toggleCategoryDropdown(event) {
    const button = event.currentTarget;
    const field = button.closest("fieldset");
    const wasExpanded = button.getAttribute("aria-expanded") === "true";

    event.preventDefault();
    button.focus();
    setCategoryExpanded(field, !wasExpanded);
}

/**
 * Updates the category button's expanded state.
 *
 * @param {HTMLFieldSetElement} field - The category fieldset.
 * @param {boolean} expanded - Whether the category options are visible.
 * @returns {void}
 */
function setCategoryExpanded(field, expanded) {
    field.querySelector("button").setAttribute("aria-expanded", String(expanded));
}

/**
 * Shows the selected category in the field and closes the list.
 * Moves focus to the subtask input after selecting a category.
 * Keeps focus within the list when selection changes through arrow keys.
 * Closes the list after an option is activated through a click event.
 *
 * @param {Event} event - The change or click event of the category field.
 * @returns {void}
 */
function selectTaskCategory(event) {
    const field = event.currentTarget;
    const selectedCategory = event.target;

    if (!selectedCategory.matches('input[name="category"]')) return;

    field.querySelector("button span").textContent = selectedCategory.value;
    if (event.type === "click") {
        field.form.querySelector("#subtask").focus();
    }
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

/**
 * Confirms the focused category option with Enter.
 * Moves focus with arrow keys without changing the selected category.
 * Closes the open category options with Escape and restores button focus.
 * Opens the category options when Enter is pressed on their button.
 * Also opens the category options when Space is pressed on their button.
 *
 * @param {KeyboardEvent} event - The category field's keydown event.
 * @returns {void}
 */
function handleCategoryKeydown(event) {
    if (event.key === "Escape") return closeCategoryOnEscape(event);
    const arrowKeys = ["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"];
    if (arrowKeys.includes(event.key)) return moveCategoryFocus(event);
    const buttonSpace = event.key === " " && event.target.matches("button");
    if (event.key !== "Enter" && !buttonSpace) return;

    event.preventDefault();
    event.stopPropagation();
    if (event.target.matches('input[name="category"]')) event.target.click();
    else setCategoryExpanded(event.currentTarget, true);
}

/**
 * Moves focus between category options without selecting them.
 *
 * @param {KeyboardEvent} event - The category field's arrow-key event.
 * @returns {void}
 */
function moveCategoryFocus(event) {
    const options = Array.from(event.currentTarget.querySelectorAll('input[name="category"]'));
    const index = options.indexOf(event.target);
    const direction = ["ArrowDown", "ArrowRight"].includes(event.key) ? 1 : -1;
    const nextIndex =
        index < 0 ? (direction === 1 ? 0 : options.length - 1) : (index + direction + options.length) % options.length;

    event.preventDefault();
    event.stopPropagation();
    options[nextIndex]?.focus();
}

/**
 * Closes the category options with Escape without closing the task dialog.
 *
 * @param {KeyboardEvent} event - The category field's Escape event.
 * @returns {void}
 */
function closeCategoryOnEscape(event) {
    const field = event.currentTarget;
    const button = field.querySelector("button");
    if (button.getAttribute("aria-expanded") !== "true") return;

    event.preventDefault();
    event.stopPropagation();
    button.focus();
    setCategoryExpanded(field, false);
}

/**
 * Activates the clicked priority button.
 *
 * @param {HTMLButtonElement} selectedButton - The clicked button.
 * @param {"urgent"|"medium"|"low"} priority - CSS state to apply to the selected priority button.
 * @returns {void}
 */
function selectTaskPriority(selectedButton, priority) {
    const buttons = selectedButton.closest(".task-priority").querySelectorAll("button");

    for (let i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove("urgent", "medium", "low");
        buttons[i].setAttribute("aria-pressed", buttons[i] === selectedButton);
    }

    selectedButton.classList.add(priority);
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
 * A dropdown is open while something inside it has the focus.
 * So it is opened by setting the focus and closed by removing it.
 *
 * @param {MouseEvent} event - The mousedown event.
 * @param {HTMLElement} focusElement - The element that gets the focus to open the dropdown.
 * @returns {void}
 */
function toggleDropdown(event, focusElement) {
    const dropdown = focusElement.closest("fieldset");

    event.preventDefault();

    if (dropdown.contains(document.activeElement)) {
        document.activeElement.blur();
    } else {
        focusElement.focus();
    }
}

/**
 * Closes an open dropdown when the user clicks somewhere outside of it.
 *
 * @param {MouseEvent} event - The mousedown event.
 * @returns {void}
 */
function closeDropdownsOnOutsideClick(event) {
    const dropdowns = document.querySelectorAll(".assigned-dropdown, .category-field");

    for (let i = 0; i < dropdowns.length; i++) {
        if (dropdowns[i].contains(document.activeElement) && !dropdowns[i].contains(event.target)) {
            document.activeElement.blur();
        }
    }
}
