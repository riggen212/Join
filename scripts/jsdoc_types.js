/**
 * @typedef {Object} User
 * @property {string} name - The name of the User.
 * @property {string} initials - The initials of the User.
 * @property {string} type - The type of the User.
 */

/**
 * @typedef {string} UserId - The unique ID of a user.
 */

/**
 * @typedef {Object} UserDirectory
 * @property {UserId} - The ID of a User.
 * @property {User} - The user data.
 */

/**
 * @typedef {string} ContactColorClass - CSS class selecting a contact badge color.
 */

/**
 * @typedef {Object} Contact
 * @property {string} name - The name of the contact.
 * @property {string} initials - The initials of the contact.
 * @property {string} email - The E-Mail address of the contact.
 * @property {string} phone - The phone number of the contact.
 * @property {ContactColorClass} colorClass - The CSS class for the color of the contact's initials badge.
 */

/**
 * @typedef {Object} ContactFormValues
 * @property {string} name - The entered contact name.
 * @property {string} email - The entered email address.
 * @property {string} phone - The entered phone number.
 * @property {string} initials - The initials created from the name.
 */

/**
 * @typedef {Object} ContactValidationErrors
 * @property {string} [name] - The error message for the name field.
 * @property {string} [email] - The error message for the email field.
 * @property {string} [phone] - The error message for the phone field.
 */

/**
 * @typedef {string} ContactId - The unique ID of a contact.
 */

/**
 * @typedef {Object} ContactEntry
 * @property {ContactId} id - The unique ID of the contact.
 * @property {Contact} contact - The contact data.
 */

/**
 * @typedef {Object.<ContactId, Contact>} ContactDirectory - Contains contacts as key-value pairs.
 */

/**
 * @typedef {[ContactId, Contact]} ContactListEntry - A contact ID and its contact data as one list entry.
 */

/**
 * @typedef {Object.<string, ContactListEntry[]>} ContactGroups - Contacts grouped by their initial letter.
 */

/**
 * @typedef {string} TaskId - ID of a single task.
 */

/**
 * @typedef {Object.<TaskId, Task>} TaskDirectory - Contains tasks as key-value pairs.
 */

/**
 * @typedef {Object} Task
 * @property {string} title - The title of the task.
 * @property {string} description - The description of the task.
 * @property {string} dueDate - The due date of the task in YYYY-MM-DD format.
 * @property {"low"|"medium"|"high"|"Low"|"Medium"|"High"} priority - Lowercase priority written by forms; capitalized values may occur in existing tasks.
 * @property {"User Story"|"Technical Task"} category - The category of the task.
 * @property {"toDo"|"inProgress"|"awaitFeedback"|"done"} status - The current status of the task.
 * @property {Object.<ContactId, true>} [assignedTo] - Selected contact IDs mapped to true; omitted when no assignments are stored.
 * @property {SubtaskDirectory} [subtasks] - The subtasks of the task.
 */

/**
 * @typedef {string} SubtaskId - ID of a single subtask.
 */

/**
 * @typedef {Object.<SubtaskId, Subtask>} SubtaskDirectory - Contains subtasks as key-value pairs.
 */

/**
 * @typedef {Object} Subtask
 * @property {string} title - The title of the subtask.
 * @property {boolean} completed - Indicates whether the subtask is completed.
 */

/**
 * Data needed to render a task card.
 *
 * @typedef {Object} TaskCardData
 * @property {TaskId} id - ID of the task.
 * @property {Task} task - The task data.
 * @property {SubtasksData} subtasksData - Subtask summary and progress.
 * @property {string} assigneesHtml - HTML for the assigned contacts.
 */

/**
 * Data needed to render a task overlay.
 *
 * @typedef {Object} TaskOverlayData
 * @property {TaskId} id - ID of the task.
 * @property {Task} task - The task data.
 * @property {string} assigneesHtml - HTML for the assigned contacts.
 * @property {string} subtasksHtml - HTML for the subtask checkboxes and titles.
 */

/**
 * Task counts and deadline information displayed on the summary page.
 *
 * @typedef {TaskSummaryCounts & {
 *   upcomingDeadline: string,
 *   upcomingDeadlineWritten: string
 * }} TaskSummaryData
 *
 * @property {string} upcomingDeadline - Earliest due date of an unfinished task on or after the reference date, in YYYY-MM-DD format. Empty if no task qualifies.
 * @property {string} upcomingDeadlineWritten - The deadline formatted with an English month name, day and year, or "-" if no deadline exists.
 */

/**
 * Task counts used by the summary page.
 * Missing count properties represent zero tasks.
 *
 * @typedef {Object} TaskSummaryCounts
 * @property {number} [toDo] - Number of tasks with status "toDo".
 * @property {number} [inProgress] - Number of tasks with status "inProgress".
 * @property {number} [awaitFeedback] - Number of tasks with status "awaitFeedback".
 * @property {number} [done] - Number of tasks with status "done".
 * @property {number} [board] - Total number of tasks, including completed tasks.
 * @property {number} [urgent] - Number of unfinished tasks that are overdue or due on or before the upcoming deadline, regardless of priority.
 */

/**
 * @typedef {Object} SubtasksData
 * @property {number} amount - Amount of all subtasks of a single task.
 * @property {number} completedAmount - Amount of all completed subtasks of a single task.
 * @property {number} progressInPercent - The Value of the completion progress as a percentage from 0 to 100.
 */

/**
 * @typedef {Object} Board
 * @property {BoardColumn} toDo - Tasks with `status` `toDo` will be assigned in this column.
 * @property {BoardColumn} inProgress - Tasks with `status` `inProgress` will be assigned in this column.
 * @property {BoardColumn} awaitFeedback - Tasks with `status` `awaitFeedback` will be assigned in this column.
 * @property {BoardColumn} done - Tasks with `status` `done` will be assigned in this column.
 */

/**
 * @typedef {Object} BoardColumn
 * @property {string} id - The ID of the DOM element representing the column.
 * @property {string} name - The name of the column.
 * @property {TaskDirectory} tasks - An Object with the tasks assigned to the column.
 */

/**
 * @typedef {string} SearchTerm - Text matched against task titles and descriptions; normalized by the board search.
 */
