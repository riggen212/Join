function getTaskCardTemplate(task, assigneesHtml) {
    return `<button type="button" class="task-card" onclick="openTaskDialog('dialog-task')" aria-label="Open Task">
            <span class="badge-type badge-type-${task.category.toLowerCase()}">${task.category}</span>
            <div class="task-card-body">
                <h3 class="task-card-title">${task.title}</h3>
                <div class="task-card-description">${task.description}</div>
            </div>
            <div class="task-card-subtasks">
                <div class="task-card-progress">
                    <div class="task-card-progress-bar" style="width: 50%;"></div>
                </div>
                <span class="task-card-summary">2/4 Subtasks</span>
            </div>
            <div class="task-card-assignees">
                <ul class="task-card-users">
                ${assigneesHtml}
                </ul>
                <span>
                    <img src="../assets/icons/prio_${task.priority}.svg" alt="Priority low" />
                </span>
            </div>
        </button>`;
}

function getTaskCardUserBadgeTemplate(userIntials) {
    return `<li class="badge-user badge-user-orange">
            <span>${userIntials}</span>
        </li>`;
}

function getTaskCardEmptyBadge(columnName) {
    return `<span class="board-column-feedback">No tasks ${columnName}</span>`;
}

function getTaskOverlayTemplate() {
    return `<div class="task-overlay">
                <header class="task-overlay-header">
                    <div class="task-overlay-type-wrapper">
                        <span class="badge-type badge-type-user">User Story</span>
                        <button class="button button-close" onclick="event.target.closest('#dialog-task').requestClose()" aria-label="Close Task">
                            <img src="../assets/icons/cancel.svg" alt="Close" />
                        </button>
                    </div>
                    <h2>HTML Base Template Creation</h2>
                </header>
                <div class="task-overlay-body">
                    <p class="task-overlay-description">Build start page with recipe recommendation.</p>
                    <dl class="task-overlay-details">
                        <dt>Due Date:</dt>
                        <dd>10/05/2023</dd>
                        <dt>Priority:</dt>
                        <dd>
                            <div class="d-flex-align-center gap-xs">
                                <span>Medium</span>
                                <img src="../assets/icons/prio_medium.svg">
                            </div>
                        </dd>
                        <dt class="task-overlay-assignees">Assigned To:</dt>
                        <dd>
                            <ul>
                                <li>
                                    <span class="badge-user badge-user-orange">CL</span
                                    ><span>Calvin Lamel</span>
                                </li>
                                <li>
                                    <span class="badge-user badge-user-blue-light">SS</span
                                    ><span>Sebastian Stock</span>
                                </li>
                                <li>
                                    <span class="badge-user badge-user-mint">ND</span><span>Norman Domann</span>
                                </li>
                            </ul>
                        </dd>
                        <dt class="task-overlay-subtasks">Subtasks</dt>
                        <dd>
                            <ul>
                                <li><input type="checkbox" aria-label="Check Task"/>Implement Recipe Recommendation</li>
                                <li><input type="checkbox" aria-label="Check Task"/>Start Page Layout</li>
                            </ul>
                        </dd>
                    </dl>
                </div>
                <footer class="task-overlay-footer">
                    <button class="button button-task-overlay" onclick="deleteTask()">
                        <img src="../assets/icons/delete.svg" alt="Delete" />
                        <span>Delete</span>
                    </button>
                    <button class="button button-task-overlay" onclick="editTask()">
                        <img src="../assets/icons/edit.svg" alt="Edit" />
                        <span>Edit</span>
                    </button>
                </footer>
            </div>`;
}
