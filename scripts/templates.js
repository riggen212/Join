function renderAddContactTemplate() {
    return `<div>
                <button class="button button-close" type="button" onclick="event.target.closest('dialog').requestClose()" aria-label="Close dialog">
                    <img src="../assets/icons/cancel.svg" alt="">
                </button>
                <img class="contact-dialog-logo" src="../assets/icons/logo_bright.svg" alt="">
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

                <div class="contact-form-actions">
                    <button class="button button-bright button-cancel" type="button" onclick="requestCloseDialog('contact')">
                        <span>Cancel</span>
                        <img src="../assets/icons/cancel.svg" alt="">
                    </button>
                    <button class="button button-dark" type="submit">
                        <span>Create contact</span>
                        <img src="../assets/icons/check.svg" alt="">
                    </button>
                </div>
            </form>
        `;
}

function renderEditContactTemplate(contact) {
    return `<div>
                <button class="button button-close" type="button" onclick="requestCloseDialog('contact')" aria-label="Close dialog">
                    <img src="../assets/icons/cancel.svg" alt="">
                </button>
                <img class="contact-dialog-logo" src="../assets/icons/logo_bright.svg" alt="">
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
                    <button class="button button-bright button-delete" type="button" onclick="deleteContact()">
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
