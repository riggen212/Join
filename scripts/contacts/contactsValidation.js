/**
 * Validates a contact form and returns its values only when they are valid.
 * Focuses the first invalid field when validation errors are found.
 *
 * @param {HTMLFormElement} form - The submitted contact form.
 * @returns {ContactFormValues|null} The valid form values, or null on errors.
 */
function getValidContactFormValues(form) {
  const values = getContactFormValues(form);
  const errors = getContactValidationErrors(values);

  renderContactValidationErrors(form, errors);
  if (Object.keys(errors).length !== 0) {
    const firstInvalidField = Object.keys(errors)[0];
    form.querySelector(`[name="${firstInvalidField}"]`)?.focus();
    return null;
  }

  return values;
}

/**
 * Reads and returns the values of a contact form.
 *
 * @param {HTMLFormElement} form - The submitted contact form.
 * @returns {ContactFormValues} The entered contact information.
 */
function getContactFormValues(form) {
  const formData = new FormData(form);
  const name = String(formData.get("name")).trim();

  return {
    name,
    email: String(formData.get("email")).trim(),
    phone: String(formData.get("phone")).trim(),
    initials: getInitialsFromName(name),
  };
}

/**
 * Validates the entered contact form values.
 *
 * @param {ContactFormValues} contact - The values to validate.
 * @returns {ContactValidationErrors} The validation errors by field name.
 */
function getContactValidationErrors(contact) {
  const errors = {};

  if (!contact.name) errors.name = "Please enter a name.";
  else if (contact.name.length > 25) errors.name = "Name must not exceed 25 characters.";
  if (!contact.email) errors.email = "Please enter an email address.";
  else if (!isValidEmail(contact.email)) errors.email = "Please enter a valid email address.";
  if (!contact.phone) errors.phone = "Please enter a phone number.";
  else if (!isValidPhone(contact.phone)) errors.phone = "Please enter a valid phone number.";
  return errors;
}

/**
 * Checks the latest shared contacts before creating a contact.
 * Marks and focuses the email field when its address is already in use.
 *
 * @param {HTMLFormElement} form - The Add Contact form.
 * @param {string} email - The email address to check.
 * @returns {Promise<boolean>} Whether the email is available.
 * @throws {Error} If loading the contacts fails.
 */
async function validateNewContactEmail(form, email) {
  const existingContacts = (await getData(DB_CONTACTS)) ?? {};
  const normalizedEmail = email.trim().toLowerCase();
  const exists = Object.values(existingContacts).some(
    (contact) => contact.email?.trim().toLowerCase() === normalizedEmail,
  );
  if (!exists) return true;

  const input = form.querySelector('[name="email"]');
  renderContactValidationError(input, "A contact with this email address already exists.");
  input.focus();
  return false;
}

/**
 * Validates a common ASCII email address after trimming outer whitespace.
 * Checks the total length, local part and dotted domain structure.
 * Does not verify whether the domain or mailbox exists.
 *
 * @param {string} email - The email address to validate.
 * @returns {boolean} Whether the address matches the supported format.
 */
function isValidEmail(email) {
  const value = email.trim();
  const parts = value.split("@");

  if (value.length > 254 || parts.length !== 2) return false;

  const [localPart, domain] = parts;

  return isValidEmailLocalPart(localPart) && isValidEmailDomain(domain);
}

/**
 * Validates an ASCII email local part of 1–64 characters.
 * Rejects leading, trailing and consecutive dots.
 *
 * @param {string} localPart - The part before the @ character.
 * @returns {boolean} Whether the local part matches the supported format.
 */
function isValidEmailLocalPart(localPart) {
  if (!localPart || localPart.length > 64) return false;

  const pattern = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;

  return pattern.test(localPart);
}

/**
 * Validates an ASCII domain with at least two dot-separated labels.
 * Each label must contain 1–63 letters, digits or hyphens
 * and must not begin or end with a hyphen.
 *
 * @param {string} domain - The part after the @ character.
 * @returns {boolean} Whether all domain labels match the supported format.
 */
function isValidEmailDomain(domain) {
  const parts = domain.split(".");
  const pattern = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;

  return parts.length >= 2 && parts.every((part) => pattern.test(part));
}

/**
 * Validates a phone number after trimming outer whitespace.
 * Allows digits, spaces, parentheses, slashes, hyphens and one leading plus.
 * Requires a national 0 or an international + / 00 prefix.
 * Limits national numbers to 20 digits, including the leading 0,
 * and international numbers to 20 digits, excluding the + / 00 prefix.
 * Does not check country-specific rules or whether the number exists.
 *
 * @param {string} phone - The phone number to validate.
 * @returns {boolean} Whether the number matches the supported format.
 */
function isValidPhone(phone) {
  const value = phone.trim();

  if (!/^\+?[\d ()/-]+$/.test(value)) return false;

  return isValidPhoneParentheses(value) && isValidPhoneSeparators(value) && isValidPhoneNumberStructure(value);
}

/**
 * Checks the prefix and digits after removing allowed formatting.
 * Requires at least one digit after a national prefix, or at least two
 * after an international prefix for a country code and subscriber number.
 *
 * @param {string} phone - The phone number with validated formatting.
 * @returns {boolean} Whether the prefix and digit count are plausible.
 */
function isValidPhoneNumberStructure(phone) {
  const number = phone.replace(/[ ()/-]/g, "");
  const isInternational = number.startsWith("+") || number.startsWith("00");
  const digits = isInternational ? number.replace(/^(\+|00)/, "") : number;
  const pattern = isInternational ? /^[1-9]\d+$/ : /^0\d+$/;

  return pattern.test(digits) && digits.length <= 20;
}

/**
 * Allows non-empty, non-nested pairs of parentheses containing digit groups.
 * Spaces may separate digits within a pair, as in (030 123).
 *
 * @param {string} phone - The trimmed phone number.
 * @returns {boolean} Whether every parenthesis belongs to a valid pair.
 */
function isValidPhoneParentheses(phone) {
  const withoutValidPairs = phone.replace(/\(\d+(?: +\d+)*\)/g, "");

  return !/[()]/.test(withoutValidPairs);
}

/**
 * Requires digits around separators, ignoring already validated parentheses.
 * Allows spaces and a single slash or hyphen between digit groups.
 *
 * @param {string} phone - The trimmed phone number with valid parentheses.
 * @returns {boolean} Whether separators occur only between digit groups.
 */
function isValidPhoneSeparators(phone) {
  const withoutParentheses = phone.replace(/[()]/g, "");
  const pattern = /^\+?\d+(?:(?: +| *[-/] *)\d+)*$/;

  return pattern.test(withoutParentheses);
}

/**
 * Displays or clears the validation feedback of a contact form.
 *
 * @param {HTMLFormElement} form - The contact form to update.
 * @param {ContactValidationErrors} errors - The validation errors by field name.
 * @returns {void}
 */
function renderContactValidationErrors(form, errors) {
  ["name", "email", "phone"].forEach((fieldName) => {
    const input = form.querySelector(`[name="${fieldName}"]`);
    renderContactValidationError(input, errors[fieldName] ?? "");
  });
}

/**
 * Displays or clears the validation feedback of one input.
 *
 * @param {HTMLInputElement} input - The input to update.
 * @param {string} message - The error message, if one exists.
 * @returns {void}
 */
function renderContactValidationError(input, message) {
  const wrapper = input.closest(".input-wrapper");
  const error = input.form.querySelector(`#contact-${input.name}-error`);

  wrapper.classList.toggle("has-error", !!message);
  input.setAttribute("aria-invalid", String(!!message));
  error.textContent = message;
  const scrollArea = input.closest(".contact-dialog-scroll");
  if (scrollArea instanceof HTMLElement) updateContactDialogScrollbar(scrollArea);
}

/**
 * Validates one contact input while the user is typing.
 *
 * @param {HTMLInputElement} input - The changed contact input.
 * @returns {void}
 */
function validateContactField(input) {
  if (input.name === "phone") input.value = input.value.replace(/[^\d+\s()/-]/g, "");
  const values = getContactFormValues(input.form);
  const errors = getContactValidationErrors(values);

  renderContactValidationError(input, errors[input.name] ?? "");
}
