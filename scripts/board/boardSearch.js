/**
 * Current search term, converted to lowercase with surrounding whitespace removed.
 *
 * @type {SearchTerm}
 *
 */
let activeSearchTerm = "";

/**
 * Timer for announcing search results after a short typing pause.
 * @type {number|undefined}
 */
let boardSearchAnnouncementTimeout;

/**
 * Converts the search term to lowercase, trims surrounding whitespace,
 * stores it in activeSearchTerm, and renders all board columns.
 * Announces the result count after a 400 ms typing pause.
 *
 * @param {SearchTerm} searchTerm - The search term getting from the HTML input element.
 * @returns {void}
 */
function searchTasks(searchTerm) {
    activeSearchTerm = searchTerm.toLowerCase().trim();
    renderBoard(Object.values(board));
    window.clearTimeout(boardSearchAnnouncementTimeout);
    boardSearchAnnouncementTimeout = window.setTimeout(announceBoardSearchResults, 400);
}

/**
 * Creates column objects containing tasks matching the active search term.
 * Preserves column IDs and names without modifying the original task directories.
 *
 * @param {BoardColumn[]} columns - Columns to filter.
 * @returns {BoardColumn[]} New column objects referencing matching tasks.
 */
function getFilteredColumns(columns) {
    /** @type {BoardColumn[]} */
    const filteredColumns = [];

    columns.forEach((column) => {
        filteredColumns.push({
            id: column.id,
            name: column.name,
            tasks: getFilteredTasks(column.tasks),
        });
    });
    return filteredColumns;
}

/**
 * Returns tasks whose title or description contains the active search term.
 *
 * @param {TaskDirectory} tasks - Tasks to filter.
 * @returns {TaskDirectory} A new directory referencing the matching tasks.
 */
function getFilteredTasks(tasks) {
    /** @type {TaskDirectory} */
    const filteredTasks = {};

    Object.entries(tasks).forEach(([taskId, task]) => {
        if (
            task.title.toLowerCase().includes(activeSearchTerm) ||
            task.description.toLowerCase().includes(activeSearchTerm)
        ) {
            filteredTasks[taskId] = task;
        }
    });
    return filteredTasks;
}

/**
 * Announces the number of task cards currently shown after a search.
 *
 * @returns {void}
 */
function announceBoardSearchResults() {
    const status = document.getElementById("board-search-status");
    const count = document.querySelectorAll("#board-content .task-card").length;
    const taskLabel = count === 1 ? "task" : "tasks";

    if (activeSearchTerm === "") {
        status.textContent = `Search cleared. ${count} ${taskLabel} shown.`;
        return;
    }

    status.textContent = count === 0 ? "No matching tasks found." : `${count} matching ${taskLabel} found.`;
}
