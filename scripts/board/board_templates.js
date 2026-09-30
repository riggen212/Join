/**
 * Creates the HTML for a task card.
 *
 * @param {{
 *  id: TaskId,
 *  task: Task,
 *  subtasksData: SubtasksData,
 *  assigneesHtml: string
 *  }} taskData
 * @returns {string}
 */
function getTaskCardTemplate(taskData) {
    return `<article
            id="${taskData.id}"
            data-task-id="${taskData.id}"
            class="task-card"
            draggable="true"
            onclick="openTaskDialog('${taskData.id}', '${taskData.task.status}')"
            ondragstart="getDraggingTask('${taskData.id}', '${taskData.task.status}'), addFlipCard('${taskData.id}')"
            ondragend="removeFlipCard('${taskData.id}')"
            aria-label="Open Task">
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
                    <ul class="task-card-users">
                        ${taskData.assigneesHtml}
                    </ul>
                    <span>
                        <img src="../assets/icons/prio_${taskData.task.priority.toLowerCase()}.svg" alt="Priority low" />
                    </span>
                </div>
            </article>`;
}

/**
 * Creates the HTML for a task card user badge.
 *
 * @param {Contact} contact
 * @returns {string}
 */
function getTaskCardUserBadgeTemplate(contact) {
    return `<li class="badge-user ${contact.colorClass}">
            <span>${contact.initials}</span>
        </li>`;
}

/**
 * Creates the HTML for a empty column badge.
 *
 * @param {BoardColumn["name"]} columnName
 * @returns {string}
 */
function getTaskCardEmptyBadge(columnName) {
    return `<span class="board-column-feedback">No tasks ${columnName}</span>`;
}

/**
 * Creates the HTML for a no matching task in column badge.
 *
 * @returns {string}
 */
function getTaskCardMatchingBadge() {
    return `<span class="board-column-feedback">No matching tasks</span>`;
}

/**
 * Creates the HTML for the overlay task.
 *
 * @param {{
 *  id: TaskId,
 *  task: Task,
 *  assigneesHtml: string,
 *  subtasksHtml: string
 *  }} taskData
 * @returns {string}
 */
function getTaskOverlayTemplate(taskData) {
    return `<article class="task-overlay">
                <header class="task-overlay-header">
                    <div class="task-overlay-type-wrapper">
                        <span class="badge-type badge-type-${taskData.task.category.toLowerCase()}">${taskData.task.category}</span>
                        <button class="button button-close" onclick="event.target.closest('dialog').requestClose()" aria-label="Close Task">
                            <img src="../assets/icons/cancel.svg" alt="Close" />
                        </button>
                    </div>
                    <h2>${taskData.task.title}</h2>
                </header>
                <div class="task-overlay-body">
                    <p class="task-overlay-description">${taskData.task.description}</p>
                    <dl class="task-overlay-details">
                        <dt>Due Date:</dt>
                        <dd>${taskData.task.dueDate}</dd>
                        <dt>Priority:</dt>
                        <dd>
                            <div class="d-flex-align-center gap-xs">
                                <span>${taskData.task.priority}</span>
                                <img src="../assets/icons/prio_${taskData.task.priority.toLowerCase()}.svg">
                            </div>
                        </dd>
                        <dt class="task-overlay-assignees">Assigned To:</dt>
                        <dd>
                            <ul>
                                ${taskData.assigneesHtml}
                            </ul>
                        </dd>
                        <dt class="task-overlay-subtasks">Subtasks</dt>
                        <dd>
                            <ul>
                                ${taskData.subtasksHtml}
                            </ul>
                        </dd>
                    </dl>
                </div>
                <footer class="task-overlay-footer">
                    <button class="button button-task-overlay" onclick="deleteTask('${taskData.id}')">
                        <img src="../assets/icons/delete.svg" alt="Delete" />
                        <span>Delete</span>
                    </button>
                    <button class="button button-task-overlay" onclick="editTask('${taskData.id}')">
                        <img src="../assets/icons/edit.svg" alt="Edit" />
                        <span>Edit</span>
                    </button>
                </footer>
            </article>`;
}

/**
 * Creates the HTML for a task overlay user badge list item.
 *
 * @param {Contact} contact
 * @returns {string}
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
 * @param {SubtaskId} subtaskId
 * @param {Subtask} subtask
 * @param {"checked"|""} isCompleted
 * @returns {string}
 */
function getTaskOverlaySubtasksTemplate(subtaskId, subtask, isCompleted) {
    return `<li>
            <input type="checkbox" ${isCompleted}
            onchange="handleSubtaskCheckboxChange(this.closest('dialog').dataset.taskId, this.closest('dialog').dataset.taskStatus, '${subtaskId}')"
            aria-label="Check Task" />
            ${subtask.title}
        </li>`;
}
