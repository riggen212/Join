let notificationTimeout;

/**
 * Shows a temporary notification, optionally closing it together with a dialog.
 * Announces the message through a separate live region.
 *
 * @param {string} message - The text displayed in the notification.
 * @param {string} [containerIdOrType] - A desktop container ID or "error".
 * @param {"success" | "error"} [type="success"] - The notification type.
 * @param {() => void} [closeNotificationWithDialog] - Optional callback that starts closing the dialog while the notification remains visible.
 * @returns {void}
 */
function showNotification(message, containerIdOrType, type = "success", closeNotificationWithDialog) {
    const options = getNotificationOptions(containerIdOrType, type);
    const notification = getNotificationElement(options.containerId);

    prepareNotification(notification, message, options.type);
    displayNotification(notification, closeNotificationWithDialog);
    announceNotification(notification.parentElement, message, options.type);
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
 * Hides the visual notification from assistive technology to prevent duplicate announcements.
 *
 * @param {HTMLElement} notification - The notification element.
 * @param {string} message - The text displayed in the notification.
 * @param {"success" | "error"} type - The notification type.
 * @returns {void}
 */
function prepareNotification(notification, message, type) {
    notification.classList.toggle("is-error", type === "error");
    notification.setAttribute("aria-hidden", "true");
    notification.removeAttribute("role");
    notification.removeAttribute("aria-live");
    notification.removeAttribute("aria-atomic");
    notification.textContent = message;
}

/**
 * Displays a notification and starts its automatic dismissal timer.
 *
 * @param {HTMLElement} notification - The notification element.
 * @param {() => void} [closeNotificationWithDialog] - Optional callback that starts closing the dialog while the notification remains visible.
 * @returns {void}
 */
function displayNotification(notification, closeNotificationWithDialog) {
    window.clearTimeout(notificationTimeout);
    notification.onanimationend = null;
    notification.classList.remove("is-visible", "is-closing");
    void notification.offsetWidth;
    notification.classList.add("is-visible");
    notificationTimeout = window.setTimeout(() => closeNotification(notification, closeNotificationWithDialog), 1800);
}

/**
 * Starts the notification's closing animation or delegates closing to the dialog callback.
 * When a callback is provided, the notification stays visible until
 * the dialog closes and resets its notification.
 *
 * @param {HTMLElement} [notification] - The notification that should close.
 * @param {() => void} [closeNotificationWithDialog] - Optional callback that starts closing the dialog while the notification remains visible.
 * @returns {void}
 */
function closeNotification(notification = document.getElementById("notification"), closeNotificationWithDialog) {
    if (!notification?.classList.contains("is-visible")) return;

    if (closeNotificationWithDialog) {
        closeNotificationWithDialog();
        return;
    }

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

/**
 * Returns a persistent live region within the notification's container.
 *
 * @param {HTMLElement} container - The active notification container.
 * @param {"success"|"error"} type - The notification type.
 * @returns {HTMLElement} The live region used for announcements.
 */
function getNotificationAnnouncer(container, type) {
    let region = container.querySelector(`:scope > [data-notification-live="${type}"]`);
    if (region) return region;

    region = document.createElement("div");
    region.className = "visually-hidden";
    region.dataset.notificationLive = type;
    region.setAttribute("role", type === "error" ? "alert" : "status");
    region.setAttribute("aria-live", type === "error" ? "assertive" : "polite");
    region.setAttribute("aria-atomic", "true");
    container.append(region);
    return region;
}

/**
 * Announces a notification independently of its visible display duration.
 *
 * @param {HTMLElement} container - The active notification container.
 * @param {string} message - The text to announce.
 * @param {"success"|"error"} type - The notification type.
 * @returns {void}
 */
function announceNotification(container, message, type) {
    const region = getNotificationAnnouncer(container, type);
    region.textContent = "";
    region.dataset.message = message;

    requestAnimationFrame(() => requestAnimationFrame(() => {
        if (region.isConnected && region.dataset.message === message) {
            region.textContent = message;
        }
    }));
}