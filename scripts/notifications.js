let notificationTimeout;


/**
 * Returns the notification container for the active screen size.
 *
 * @returns {HTMLElement} The element that contains the notification.
 */
function getNotificationContainer() {
    const contactDetails = document.getElementById("show-details");
    const isDesktop = window.matchMedia("(min-width: 1280px)").matches;

    return isDesktop && contactDetails ? contactDetails : document.body;
}


/**
 * Returns the shared notification element and creates it when needed.
 *
 * @returns {HTMLElement} The notification element.
 */
function getNotificationElement() {
    let notification = document.getElementById("notification");
    const container = getNotificationContainer();

    if (notification) {
        container.append(notification);
        return notification;
    }

    notification = document.createElement("div");
    notification.id = "notification";
    notification.setAttribute("role", "status");
    notification.setAttribute("aria-live", "polite");
    container.append(notification);
    return notification;
}


/**
 * Shows a temporary notification with the given message.
 *
 * @param {string} message - The text displayed in the notification.
 * @returns {void}
 */
function showNotification(message) {
    const notification = getNotificationElement();

    window.clearTimeout(notificationTimeout);
    notification.onanimationend = null;
    notification.textContent = message;
    notification.classList.remove("is-visible", "is-closing");
    void notification.offsetWidth;
    notification.classList.add("is-visible");
    notificationTimeout = window.setTimeout(closeNotification, 1200);
}


/**
 * Starts the closing animation of the current notification.
 *
 * @returns {void}
 */
function closeNotification() {
    const notification = getNotificationElement();
    if (!notification.classList.contains("is-visible")) return;

    notification.classList.add("is-closing");
    notification.onanimationend = () => {
        notification.classList.remove("is-visible", "is-closing");
        notification.onanimationend = null;
    };
}


/**
 * Shows the notification stored for a dialog after it has closed.
 *
 * @param {HTMLDialogElement} dialog - The dialog that has finished closing.
 * @returns {void}
 */
function showDialogNotification(dialog) {
    const message = dialog.dataset.notification;
    if (!message) return;

    delete dialog.dataset.notification;
    showNotification(message);
}