/**
 * @typedef {Object} Contact
 * @property {string} name - The name of the contact.
 * @property {string} initials - The initials of the contact.
 * @property {string} email - The E-Mail address of the contact.
 * @property {string} phone - The phone number of the contact.
 * @property {string} colorClass - The CSS class for the color of the contact's initials badge.
 */

/**
 * @typedef {Object.<string, Contact>} ContactDirectory - Contains contacts as key-value pairs.
 */

/**
 * @typedef {string} TaskId - ID of a single task.
 */

/**
 * @typedef {Object.<string, Task>} TaskDirectory - Contains tasks as key-value pairs.
 */

/**
 * @typedef {Object} Task
 * @property {string} title - The title of the task.
 * @property {string} description - The description of the task.
 * @property {string} dueDate - The due date of the task in YYYY-MM-DD format.
 * @property {"Low"|"Medium"|"High"} priority - The priority of the task.
 * @property {"User Story"|"Technical Task"} category - The category of the task.
 * @property {"toDo"|"inProgress"|"awaitFeedback"|"done"} status - The current status of the task.
 * @property {Object.<string, true>} assignedTo - Maps contact IDs to their assignment state.
 * @property {SubtaskDirectory} subtasks - The subtasks of the task.
 */

/**
 * @typedef {string} SubtaskId - ID of a single subtask.
 */

/**
 * @typedef {Object.<string, Subtask>} SubtaskDirectory - Contains subtasks as key-value pairs.
 */

/**
 * @typedef {Object} Subtask
 * @property {string} title - The title of the subtask.
 * @property {boolean} completed - Indicates whether the subtask is completed.
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
