/**
 * Creates the HTML for a task card.
 *
 * @param {TaskCardData} taskData - The prepared task card data.
 * @returns {string} HTML for the task card.
 */
function getTaskCardTemplate(taskData) {
    return `<article
                id="${taskData.id}"
                data-task-id="${taskData.id}"
                class="task-card"
                draggable="true"
                role="button"
                tabindex="0"
                onclick="openTaskDialog('${taskData.id}', '${taskData.task.status}')"
                onkeydown="handleTaskCardKeydown(event, '${taskData.id}', '${taskData.task.status}')"
                ondragstart="startDraggingTask('${taskData.id}', '${taskData.task.status}', event)"
                ondragend="endDraggingTask('${taskData.id}')"
                aria-label="Open task: ${taskData.task.title}">
                    <span class="badge-type badge-type-${taskData.task.category.toLowerCase()}">${taskData.task.category}</span>
                    <div class="task-card-body">
                        <h3 class="task-card-title">${taskData.task.title}</h3>
                        <div class="task-card-description">${taskData.task.description}</div>
                    </div>
                    <div class="task-card-subtasks">
                        <div class="task-card-subtasks-progress">
                            <div class="task-card-subtasks-progress-bar" style="width: ${taskData.subtasksData.progressInPercent}%;"></div>
                        </div>
                        <span class="task-card-subtasks-summary">${taskData.subtasksData.completedAmount}/${taskData.subtasksData.amount} Subtasks</span>
                    </div>
                    <div class="task-card-assignees">
                        <ul class="task-card-users" aria-label="Assigned contacts">
                            ${taskData.assigneesHtml}
                        </ul>
                        <span>
                            <img src="../assets/icons/prio${taskData.task.priority.charAt(0).toUpperCase() + taskData.task.priority.slice(1).toLowerCase()}.svg" alt="${taskData.task.priority} priority"/>
                        </span>
                    </div>
            </article>`;
}

/**
 * Creates the HTML for a task card user badge.
 *
 * @param {Contact} contact - Contact represented by the badge.
 * @returns {string} The generated HTML markup.
 */
function getTaskCardUserBadgeTemplate(contact) {
    return `<li class="badge-user ${contact.colorClass}" aria-label="${contact.name}">${contact.initials}</li>`;
}

/**
 * Creates the HTML message shown when a column contains no tasks.
 *
 * @param {BoardColumn["name"]} columnName - Display name of the empty column.
 * @returns {string} The generated HTML markup.
 */
function getTaskCardEmptyBadge(columnName) {
    return `<span class="board-column-feedback">No tasks ${columnName}</span>`;
}

/**
 * Creates the HTML message shown when a column has no matching search results.
 *
 * @returns {string} The generated HTML markup.
 */
function getTaskCardMatchingBadge() {
    return `<span class="board-column-feedback">No matching tasks</span>`;
}

/**
 * Creates the HTML for a task overlay.
 *
 * @param {TaskOverlayData} taskData - The prepared task overlay data.
 * @returns {string} HTML for the task overlay.
 */
function getTaskOverlayTemplate(taskData) {
    return `<article class="task-overlay">
                <header class="task-overlay-header">
                    <div class="task-overlay-type-wrapper">
                        <span class="badge-type badge-type-${taskData.task.category.toLowerCase()}">${taskData.task.category}</span>
                        <button class="button button-close" onclick="event.target.closest('dialog').requestClose()" aria-label="Close Task">
                            <img src="../assets/icons/cancel.svg" alt="" />
                        </button>
                    </div>
                    <h2 id="task-dialog-title" class="scrollbar">${taskData.task.title}</h2>
                </header>

                <div class="task-overlay-body">
                    <p class="task-overlay-description scrollbar">${taskData.task.description}</p>

                    <dl class="task-overlay-details">
                        <div class="task-overlay-property">
                            <dt>Due Date:</dt>
                            <dd>${taskData.task.dueDate}</dd>
                        </div>

                        <div class="task-overlay-property">
                            <dt>Priority:</dt>
                            <dd>
                                <div class="d-flex-align-center gap-xs">
                                    <span>${taskData.task.priority}</span>
                                    <img src="../assets/icons/prio${taskData.task.priority.charAt(0).toUpperCase() + taskData.task.priority.slice(1).toLowerCase()}.svg" alt="">
                                </div>
                            </dd>
                        </div>

                        <div class="task-overlay-section">
                            <dt>Assigned To:</dt>
                            <dd>
                                <ul class="task-overlay-assignees-list scrollbar" aria-label="Assigned contacts">${taskData.assigneesHtml}</ul>
                            </dd>
                        </div>

                        <div class="task-overlay-section">
                            <dt>Subtasks</dt>
                            <dd>
                                <ul class="task-overlay-subtasks-list scrollbar" aria-label="Subtasks">${taskData.subtasksHtml}</ul>
                            </dd>
                        </div>
                    </dl>
                </div>

                <footer class="task-overlay-footer">
                    <button class="button button-task-overlay" onclick="deleteTask('${taskData.id}', '${taskData.task.status}', this)">
                        <img src="../assets/icons/delete.svg" alt="" />
                        <span>Delete</span>
                    </button>
                    <button class="button button-task-overlay" onclick="editTask('${taskData.id}')">
                        <img src="../assets/icons/edit.svg" alt="" />
                        <span>Edit</span>
                    </button>
                </footer>
            </article>`;
}

/**
 * Creates the HTML for a task overlay user badge list item.
 *
 * @param {Contact} contact - Contact represented by the badge.
 * @returns {string} The generated HTML markup.
 */
function getTaskOverlayUserBadgeTemplate(contact) {
    return `<li>
            <span class="badge-user ${contact.colorClass}">${contact.initials}</span>
            <span>${contact.name}</span>
        </li>`;
}

/**
 * Creates the HTML for a task overlay subtask list item.
 *
 * @param {SubtaskId} subtaskId - ID used when saving checkbox changes.
 * @param {Subtask} subtask - Subtask represented by the checkbox and title.
 * @param {"checked"|""} isCompleted - Checked attribute or an empty string.
 * @returns {string} The generated HTML markup.
 */
function getTaskOverlaySubtasksTemplate(subtaskId, subtask, isCompleted) {
    return `<li>
            <input type="checkbox" ${isCompleted}
            onchange="handleSubtaskCheckboxChange(this, this.closest('dialog').dataset.taskId, this.closest('dialog').dataset.taskStatus, '${subtaskId}')"
            aria-label="Mark ${subtask.title} as completed" />
            ${subtask.title}
        </li>`;
}

/**
 * Returns the close button for the Add Task dialog.
 *
 * @returns {string} HTML for the close button.
 */
function getAddTaskDialogCloseButtonTemplate() {
    return `<button class="button button-close add-task-dialog-close" type="button"
                onclick="this.closest('dialog').requestClose()" aria-label="Close dialog">
                <img src="../assets/icons/cancel.svg" alt="">
            </button>`;
}

/**
 * Returns the persistent alert markup displayed when board initialization fails.
 *
 * @returns {string} HTML paragraph with error styling and role="alert".
 */
function getBoardLoadingFailureTemplate() {
    return `<p class="board-loading-error" role="alert">Board could not be loaded. Please reload the page.</p>`;
}
