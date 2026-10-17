let notificationTimeout;


/**
 * Shows a temporary notification.
 *
 * @param {string} message - The text displayed in the notification.
 * @param {string} [containerIdOrType] - A desktop container ID or "error".
 * @param {"success" | "error"} [type="success"] - The notification type.
 * @returns {void}
 */
function showNotification(message, containerIdOrType, type = "success") {
    const options = getNotificationOptions(containerIdOrType, type);
    const notification = getNotificationElement(options.containerId);

    prepareNotification(notification, message, options.type);
    displayNotification(notification);
}


/**
 * Normalizes the optional container and type arguments.
 *
 * @param {string} [containerIdOrType] - A desktop container ID or "error".
 * @param {"success" | "error"} [type="success"] - The notification type.
 * @returns {{containerId: string | undefined, type: "success" | "error"}}
 */
function getNotificationOptions(containerIdOrType, type) {
    if (containerIdOrType === "error") {
        return { containerId: undefined, type: "error" };
    }

    return {
        containerId: containerIdOrType,
        type: type === "error" ? "error" : "success",
    };
}


/**
 * Returns the shared notification element and creates it when needed.
 *
 * @param {string} [containerId] - The optional ID of the desktop container.
 * @returns {HTMLElement} The notification element.
 */
function getNotificationElement(containerId) {
    let notification = document.getElementById("notification");
    const container = getNotificationContainer(containerId);

    if (notification) {
        container.append(notification);
        return notification;
    }

    notification = document.createElement("div");
    notification.id = "notification";
    container.append(notification);
    return notification;
}


/**
 * Returns the notification container for the current screen size.
 *
 * Uses an open dialog first so notifications stay visible above its content.
 *
 * @param {string} [containerId] - The optional ID of the desktop container.
 * @returns {HTMLElement} The element that contains the notification.
 */
function getNotificationContainer(containerId) {
    const container = document.getElementById(containerId);
    const openDialog = document.querySelector("dialog[open]");
    const isDesktop = window.matchMedia("(min-width: 1280px)").matches;

    if (openDialog) return openDialog;
    if (!containerId || !isDesktop) return document.body;
    return container ?? document.body;
}


/**
 * Sets the text, style, and accessibility attributes of a notification.
 *
 * @param {HTMLElement} notification - The notification element.
 * @param {string} message - The text displayed in the notification.
 * @param {"success" | "error"} type - The notification type.
 * @returns {void}
 */
function prepareNotification(notification, message, type) {
    const isError = type === "error";

    notification.textContent = message;
    notification.classList.toggle("is-error", isError);
    notification.setAttribute("role", isError ? "alert" : "status");
    notification.setAttribute("aria-live", isError ? "assertive" : "polite");
}


/**
 * Displays a notification and starts its automatic closing timer.
 *
 * @param {HTMLElement} notification - The notification element.
 * @returns {void}
 */
function displayNotification(notification) {
    window.clearTimeout(notificationTimeout);
    notification.onanimationend = null;
    notification.classList.remove("is-visible", "is-closing");
    void notification.offsetWidth;
    notification.classList.add("is-visible");
    notificationTimeout = window.setTimeout(() => closeNotification(notification), 1200);
}


/**
 * Starts the closing animation of the current notification.
 *
 * @param {HTMLElement} [notification] - The notification that should close.
 * @returns {void}
 */
function closeNotification(notification = document.getElementById("notification")) {
    if (!notification?.classList.contains("is-visible")) return;

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
    const containerId = dialog.dataset.notificationContainer;
    const type = dialog.dataset.notificationType;

    if (!message) return;
    delete dialog.dataset.notification;
    delete dialog.dataset.notificationContainer;
    delete dialog.dataset.notificationType;
    showNotification(message, containerId, type);
}