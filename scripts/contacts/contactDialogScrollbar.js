/**
 * Updates the custom scrollbar for a contact dialog scroll area.
 *
 * @param {HTMLElement} scrollArea - The scrollable dialog content.
 * @returns {void}
 */
function updateContactDialogScrollbar(scrollArea) {
  const scrollbar = scrollArea.closest("dialog")?.querySelector(".contact-dialog-custom-scrollbar");
  const thumb = scrollbar?.firstElementChild;
  if (!(thumb instanceof HTMLElement)) return;
  const scrollableHeight = scrollArea.scrollHeight - scrollArea.clientHeight;
  scrollbar.hidden = scrollableHeight <= 0;
  if (scrollbar.hidden) return;
  const controlsHeight = getContactScrollbarControlsHeight(scrollbar);
  const thumbHeight = getContactScrollbarThumbHeight(scrollArea, scrollbar, controlsHeight);
  const thumbOffset = getContactScrollbarThumbOffset(scrollArea, scrollbar, thumbHeight, controlsHeight);
  thumb.style.height = `${thumbHeight}px`;
  thumb.style.transform = `translateY(${thumbOffset}px)`;
}

/**
 * Initializes the custom scrollbar after the contact dialog has opened.
 *
 * @param {HTMLDialogElement} dialog - The opened contact dialog.
 * @returns {void}
 */
function initializeContactDialogScrollbar(dialog) {
  requestAnimationFrame(() => {
    const scrollArea = dialog.querySelector(".contact-dialog-scroll");
    if (scrollArea instanceof HTMLElement) updateContactDialogScrollbar(scrollArea);
  });
}

/**
 * Calculates the height of the custom scrollbar thumb.
 *
 * @param {HTMLElement} scrollArea - The scrollable dialog content.
 * @param {HTMLElement} scrollbar - The custom scrollbar track.
 * @param {number} controlsHeight - The combined height of both arrow areas.
 * @returns {number} The calculated thumb height in pixels.
 */
function getContactScrollbarThumbHeight(scrollArea, scrollbar, controlsHeight) {
  const trackHeight = scrollbar.clientHeight - controlsHeight;
  return Math.max(24, trackHeight * scrollArea.clientHeight / scrollArea.scrollHeight);
}

/**
 * Calculates the vertical offset of the custom scrollbar thumb.
 *
 * @param {HTMLElement} scrollArea - The scrollable dialog content.
 * @param {HTMLElement} scrollbar - The custom scrollbar track.
 * @param {number} thumbHeight - The current thumb height.
 * @returns {number} The calculated thumb offset in pixels.
 */
function getContactScrollbarThumbOffset(scrollArea, scrollbar, thumbHeight, controlsHeight) {
  const maxScroll = scrollArea.scrollHeight - scrollArea.clientHeight;
  const trackHeight = scrollbar.clientHeight - controlsHeight;
  return controlsHeight / 2 + (trackHeight - thumbHeight) * scrollArea.scrollTop / maxScroll;
}

/**
 * Gets the combined height of both scrollbar arrow areas.
 *
 * @param {HTMLElement} scrollbar - The visual dialog scrollbar.
 * @returns {number} The combined arrow height in pixels.
 */
function getContactScrollbarControlsHeight(scrollbar) {
  const styles = getComputedStyle(scrollbar);
  const arrowSize = styles.getPropertyValue("--contact-dialog-scrollbar-arrow-size");
  return Number.parseFloat(arrowSize) * 2;
}
