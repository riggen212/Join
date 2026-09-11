function getTaskCardTemplate() {
    return `<button type="button" class="task-card" onclick="openTaskDialog('dialog-task')" aria-label="Open Task">
            <span class="badge-type badge-type-user">User Story</span>
            <div class="task-card-body">
                <h3 class="task-card-title">HTML Base Template Creation</h3>
                <div class="task-card-description">Lorem ipsum dolor sit amet, consectetur.</div>
            </div>
            <div class="task-card-subtasks">
                <div class="task-card-progress">
                    <div class="task-card-progress-bar"></div>
                </div>
                <span class="task-card-summary">1/4 Subtasks</span>
            </div>
            <div class="task-card-assignees">
                <ul class="task-card-users">
                    <li class="badge-user badge-user-orange">
                        <span>CL</span>
                    </li>
                    <li class="badge-user badge-user-blue-light">
                        <span>SS</span>
                    </li>
                    <li class="badge-user badge-user-mint">
                        <span>ND</span>
                    </li>
                </ul>
                <span>
                    <img src="../assets/icons/prio_low.svg" alt="Priority low" />
                </span>
            </div>
        </button>`;
}

function getTaskOverlayTemplate() {
    return `<div class="task-overlay">
                <header class="task-overlay-header">
                    <div class="task-overlay-type-wrapper">
                        <span class="badge-type badge-type-user">User Story</span>
                        <button class="button button-close" onclick="requestCloseTaskDialog()" aria-label="Close Task">
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
            </div>
            `;
}

function renderAddContactTemplate() {
    return `<div>
            <button class="button button-close" type="button" onclick="this.closest('dialog').close()" aria-label="Close dialog">
                <img src="../assets/icons/cancel.svg" alt="">
            </button>

            <h1>Add Contact</h1>
            <p>Tasks are better with a team!</p>
        </div>
        <div class="badge-user">
            <img src="../assets/icons/person.svg" alt="">
        </div>
        <form action="">
            <div class="input-wrapper">
                <input type="text" id="contact-name" name="name" autocomplete="name" placeholder="Name" required>
                <span type="button">
                    <img src="../assets/icons/person.svg" alt="show password">
                </span>
            </div>
            <div class="input-wrapper">
                <input type="email" id="contact-email" name="email" autocomplete="email" placeholder="Email" required>
                <span type="button">
                    <img src="../assets/icons/mail.svg" alt="show password">
                </span>
            </div>
            <div class="input-wrapper">
                <input type="tel" id="contact-phone" name="phone" autocomplete="tel" placeholder="Phone" required>
                <span type="button">
                    <img src="../assets/icons/phone.svg" alt="show password">
                </span>
            </div>
            <button class="button button-dark" type="submit">
                <span>Create contact</span>
                <img src="../assets/icons/check.svg" alt="">
            </button>
        </form>
        `;
}

function renderEditContactTemplate(contact) {
    return `<div>
            <button class="button button-close" type="button" onclick="this.closest('dialog').close()" aria-label="Close dialog">
                <img src="../assets/icons/cancel.svg" alt="">
            </button>

            <h1>Edit Contact</h1>
            </div>
            <div class="badge-user ${contact.colorClass}">
                <span>${contact.initials}</span>
            </div>
            <form action="">
                <div class="input-wrapper">
                    <input type="text" id="contact-name" name="name" autocomplete="name" placeholder="Name" value="${contact.name}" required>
                    <span type="button">
                        <img src="../assets/icons/person.svg" alt="show password">
                    </span>
                </div>
                <div class="input-wrapper">
                    <input type="email" id="contact-email" name="email" autocomplete="email" placeholder="Email" value="${contact.email}" required>
                    <span type="button">
                        <img src="../assets/icons/mail.svg" alt="show password">
                    </span>
                </div>
                <div class="input-wrapper">
                    <input type="tel" id="contact-phone" name="phone" autocomplete="tel" placeholder="Phone" value="${contact.phone}" required>
                    <span type="button">
                        <img src="../assets/icons/phone.svg" alt="show password">
                    </span>
                </div>
                <div class="contact-form-actions">
                    <button class="button button-delete" type="button" onclick="deleteContact()">
                        Delete
                    </button>

                    <button class="button button-dark" type="submit">
                        <span>Save</span>
                        <img src="../assets/icons/check.svg" alt="">
                    </button>
                </div>
            </form>
            `;
}