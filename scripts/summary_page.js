/**
 * Loads the current user and tasks, then updates the summary page.
 * Logs initialization errors to the console.
 *
 * @returns {Promise<void>}
 */
async function initSummary() {
    try {
        loggedUserId = await loadCurrentUser();
        const user = await getData(DB_USERS, loggedUserId);
        const tasks = await loadTasks();

        updateSummary(user, tasks);
    } catch (error) {
        console.error(error);
    }
}

initSummary();

/**
 * Loads all tasks, returning an empty object if no tasks exist.
 *
 * @returns {Promise<TaskDirectory>} The loaded tasks.
 * @throws {Error} If loading or parsing the task data fails.
 */
async function loadTasks() {
    return (await getData(DB_TASKS)) ?? {};
}

/**
 * Calculates task counts and the upcoming urgent deadline,
 * then updates the summary page.
 *
 * @param {User} user - The current user.
 * @param {TaskDirectory} tasks - The tasks to summarize.
 */
function updateSummary(user, tasks) {
    const taskSummaryData = getTaskSummaryData(tasks);

    updateSummaryHtml(user, taskSummaryData);
}

/**
 * Calculates task counts and the upcoming urgent deadline
 * using today's local date.
 *
 * @param {TaskDirectory} tasks - The tasks to summarize.
 * @returns {TaskSummaryData} The task counts and upcoming deadline.
 */
function getTaskSummaryData(tasks) {
    const currentDate = getLocalDate();

    return calculateTaskSummary(tasks, currentDate);
}

/**
 * Counts tasks by status and urgent priority and determines
 * the earliest urgent deadline on or after the given date.
 *
 * @param {TaskDirectory} tasks - The tasks to summarize.
 * @param {string} currentDate - The reference date in YYYY-MM-DD format.
 * @returns {TaskSummaryData} The task counts and upcoming deadline.
 */
function calculateTaskSummary(tasks, currentDate) {
    const taskSummaryData = {};

    Object.values(tasks).forEach((task) => {
        taskSummaryData[task.status] = (taskSummaryData[task.status] ?? 0) + 1;
        taskSummaryData.board = (taskSummaryData.board ?? 0) + 1;

        if (task.priority === "high") {
            taskSummaryData.urgent = (taskSummaryData.urgent ?? 0) + 1;
            taskSummaryData.upcomingDeadline = selectUpcomingDeadline(taskSummaryData.upcomingDeadline, task.dueDate, currentDate);
        }
    });

    return taskSummaryData;
}

/**
 * Selects the earlier deadline, ignoring new dates before the reference date.
 * All dates must use YYYY-MM-DD format.
 *
 * @param {string|undefined} savedDeadline - The previously selected deadline.
 * @param {string} newDueDate - The deadline to compare.
 * @param {string} currentDate - The reference date.
 * @returns {string|undefined} The selected deadline, or undefined if none qualifies.
 */
function selectUpcomingDeadline(savedDeadline, newDueDate, currentDate) {
    if (newDueDate < currentDate) {
        return savedDeadline;
    }

    if (!savedDeadline || newDueDate < savedDeadline) {
        return newDueDate;
    }

    return savedDeadline;
}

/**
 * Returns today's date in the browser's local time zone.
 *
 * @returns {string} The local date in YYYY-MM-DD format.
 */
function getLocalDate() {
    const today = new Date();

    return [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");
}

/**
 * Displays task counts, the upcoming deadline and the current user's name.
 * Displays zero for missing summary values.
 *
 * @param {User} user - The current user.
 * @param {TaskSummaryData} taskSummaryData - The task counts and upcoming deadline.
 */
function updateSummaryHtml(user, taskSummaryData) {
    const summaryHtmlElementList = document.querySelectorAll("[data-summary]");

    summaryHtmlElementList.forEach((element) => {
        element.textContent = taskSummaryData[element.dataset.summary] ?? 0;
        if (element.dataset.summary === "upcomingDeadline") {
            element.dateTime = taskSummaryData.upcomingDeadline ?? "";
        }
    });

    document.getElementById("userNames").textContent = user.name;
}
