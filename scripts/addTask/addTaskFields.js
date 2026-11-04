/**
 * Maximum selected contact badges displayed before the overflow badge.
 * @type {number}
 */
const MAX_VISIBLE_BADGES = 4;

// ---------- Assigned contacts ----------

/**
 * Loads contacts and the current user's email concurrently, then renders assignment options.
 * Propagates errors from either request or rendering without handling them locally.
 *
 * @param {HTMLFormElement} form - The task form receiving the options.
 * @param {Task|null} [task] - Existing task whose assignees are checked, if supplied.
 * @returns {Promise<void>} Resolves after options and badges render; rejects if loading or rendering fails.
 */
async function loadAssignedContacts(form, task) {
        const [contacts, loggedUserEmail] = await Promise.all([
            getData(DB_CONTACTS),
            getLoggedInUserEmail(),
        ]);

        renderAssignedOptions(form, contacts ?? {}, task, loggedUserEmail);
}
// async function loadAssignedContacts(form, task) {
//     try {
//         const [contacts, loggedUserEmail] = await Promise.all([
//             getData(DB_CONTACTS),
//             getLoggedInUserEmail(),
//         ]);

//         renderAssignedOptions(form, contacts ?? {}, task, loggedUserEmail);
//     }
//     catch (error) {
//         showNotification("Saving the assignees failed.", "error");
//     }
// }


/**
 * Renders the contacts in the "Assigned to" list.
 *
 * @param {HTMLFormElement} form - The task form.
 * @param {ContactDirectory} contacts - Contacts indexed by ID.
 * @param {Task|null|undefined} task - Existing task whose assignees are checked, if supplied.
 * @param {string|null} loggedUserEmail - Email of the logged-in user.
 * @returns {void}
 */
function renderAssignedOptions(form, contacts, task, loggedUserEmail) {
    const assignedTo = task && task.assignedTo ? task.assignedTo : {};
    const contactIds = getSortedContactIds(contacts);
    let html = "";

    for (let i = 0; i < contactIds.length; i++) {
        const contact = contacts[contactIds[i]];
        const initials = contact.initials || getInitialsFromName(contact.name);
        html += getAssignedOptionTemplate(contactIds[i], contact, initials, assignedTo[contactIds[i]] === true, loggedUserEmail);
    }

    form.querySelector("#assigned-options").innerHTML = html;
    renderAssignedBadges(form);
}

/**
 * Returns the IDs of all contacts with a name, sorted by name.
 *
 * @param {ContactDirectory} contacts - Contacts indexed by ID.
 * @returns {ContactId[]} IDs of named contacts in alphabetical order.
 */
function getSortedContactIds(contacts) {
    const contactIds = Object.keys(contacts).filter((id) => contacts[id].name);
    return contactIds.sort((a, b) => contacts[a].name.localeCompare(contacts[b].name));
}

/**
 * Shows at most MAX_VISIBLE_BADGES selected contact badges and an overflow badge for the rest.
 *
 * @param {HTMLFormElement} form - The task form.
 * @returns {void}
 */
function renderAssignedBadges(form) {
    const checkedBoxes = form.querySelectorAll('input[name="assignedTo"]:checked');
    let html = "";

    for (let i = 0; i < checkedBoxes.length && i < MAX_VISIBLE_BADGES; i++) {
        html += getBadgeHtmlFromCheckbox(checkedBoxes[i]);
    }

    if (checkedBoxes.length > MAX_VISIBLE_BADGES) {
        html += getMoreBadgeTemplate(checkedBoxes.length - MAX_VISIBLE_BADGES);
    }

    form.querySelector("#assigned-badges").innerHTML = html;
}

/**
 * Creates the badge HTML for the contact of a checked checkbox.
 *
 * @param {HTMLInputElement} checkbox - The checked checkbox.
 * @returns {string} The HTML of the badge.
 */
function getBadgeHtmlFromCheckbox(checkbox) {
    const option = checkbox.closest(".assigned-option");
    const badge = option.querySelector(".badge-user");
    const name = option.querySelectorAll("span")[1].textContent;

    return getAssignedBadgeTemplate(badge.className, badge.textContent, name);
}

/**
 * Filters contact options by their full displayed text, including the current-user suffix.
 *
 * @param {HTMLFormElement} form - The task form.
 * @returns {void}
 */
function filterAssignedOptions(form) {
    const searchText = form.querySelector("#task-assigned").value.trim().toLowerCase();
    const options = form.querySelectorAll("#assigned-options > li");

    for (let i = 0; i < options.length; i++) {
        const name = options[i].textContent.toLowerCase();
        options[i].hidden = !name.includes(searchText);
    }
}

/**
 * Creates initials from the first two parts of a name.
 *
 * @param {string} name - The full name.
 * @returns {string} The initials, e.g. "AM" for "Anton Mayer".
 */
function getInitialsFromName(name) {
    const parts = name.trim().split(" ");
    let initials = parts[0].charAt(0);

    if (parts.length > 1) {
        initials += parts[1].charAt(0);
    }

    return initials.toUpperCase();
}

// ---------- Dropdowns ----------

/**
 * Opens or closes the "Assigned to" list when the field or arrow is clicked.
 * A click into the search field only closes the list if nothing is typed.
 * Uses is-collapsed to close the list while keeping focus on its search input.
 *
 * @param {MouseEvent} event - The mousedown event.
 * @returns {void}
 */
function toggleAssignedDropdown(event) {
    const searchInput = event.currentTarget.querySelector("#task-assigned");
    const field = searchInput.closest("fieldset");
    const wasOpen = field.matches(":focus-within") && !field.classList.contains("is-collapsed");

    if (event.target === searchInput && searchInput.value !== "" && wasOpen) return;

    event.preventDefault();
    searchInput.focus();
    field.classList.toggle("is-collapsed", wasOpen);
}

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
 * Opens the contact list or toggles a contact with Enter.
 * Delegates Escape handling to closeAssignedOnEscape().
 *
 * @param {KeyboardEvent} event - The contact field's keydown event.
 * @returns {void}
 */
function handleAssignedKeydown(event) {
    if (event.key === "Escape") return closeAssignedOnEscape(event);
    if (event.key !== "Enter") return;

    const input = event.target;
    if (input.id !== "task-assigned" && !input.matches('input[name="assignedTo"]')) return;

    event.preventDefault();
    event.stopPropagation();
    if (input.id === "task-assigned") event.currentTarget.classList.remove("is-collapsed");
    else input.click();
}

/**
 * Closes the "Assigned to" list with Escape when the search field is empty.
 * Handles Escape from both the search input and the contact options.
 * Preserves the search text and selection, then restores search input focus.
 *
 * @param {KeyboardEvent} event - The keydown event.
 * @returns {void}
 */
function closeAssignedOnEscape(event) {
    if (event.key !== "Escape") return;

    const field = event.currentTarget;
    if (field.classList.contains("is-collapsed")) return;

    event.preventDefault();
    event.stopPropagation();
    field.querySelector("#task-assigned").focus();
    field.classList.add("is-collapsed");
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

// ---------- Category and priority ----------

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
 * Moves focus between category options without selecting them.
 *
 * @param {KeyboardEvent} event - The category field's arrow-key event.
 * @returns {void}
 */
function moveCategoryFocus(event) {
    const options = Array.from(event.currentTarget.querySelectorAll('input[name="category"]'));
    const index = options.indexOf(event.target);
    const direction = ["ArrowDown", "ArrowRight"].includes(event.key) ? 1 : -1;
    const nextIndex = index < 0
        ? (direction === 1 ? 0 : options.length - 1)
        : (index + direction + options.length) % options.length;

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
