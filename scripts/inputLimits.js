/**
 * Limits a text to the requested maximum number of characters.
 *
 * @param {string} text - The text to limit.
 * @param {number} maxLength - The allowed maximum number of characters.
 * @returns {string} The original or shortened text.
 */
function limitTextLength(text, maxLength) {
  return text.slice(0, maxLength);
}

/**
 * Limits the value entered in an input field.
 *
 * @param {HTMLInputElement} input - The input to limit.
 * @param {number} maxLength - The allowed maximum number of characters.
 * @returns {void}
 */
function limitInputTextLength(input, maxLength) {
  input.value = limitTextLength(input.value, maxLength);
}
