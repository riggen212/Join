/**
 * Loads the current user and tasks, then updates the summary page.
 * Catches and logs initialization errors.
 * Stops initialization if no valid user is available.
 *
 * @returns {Promise<void>}
 */
async function initSummary() {
    try {
        showAnimationLogin();
        loggedUserId = await loadCurrentUser(false);
        if (!loggedUserId) return;
        const user = await getData(DB_USERS, loggedUserId);
        const tasks = await loadTasks();
        const today = getLocalDate();

        updateSummary(user, tasks, today);
    } catch (error) {
        console.error(error);
    }
}

initSummary();

/**
 * Checks the URL parameter and starts the mobile login animation.
 * The animation only runs on screens smaller than 1280px.
 *
 * @returns {void}
 */
function showAnimationLogin() {
    const url = new URL(window.location.href);
    if (url.searchParams.get('animation') !== 'true') return;

    removeAnimationParameter(url);

    if (window.innerWidth < 1280) {
        startMobileAnimation();
    } else {
        finishMobileAnimation();
    }
}

/**
 * Removes the animation parameter from the current URL.
 *
 * @param {URL} url - The current page URL.
 * @returns {void}
 */
function removeAnimationParameter(url) {
    url.searchParams.delete('animation');
    window.history.replaceState(window.history.state, '', url.toString());
}

/**
 * Starts the mobile login animation.
 * Finishes the animation after four seconds.
 *
 * @returns {void}
 */
function startMobileAnimation() {
    const animationIn = document.getElementById('login-animation-on');
    const animationOut = document.getElementById('login-animation-out');

    animationIn.classList.add('animation-in');
    animationOut.classList.add('animation-out');

    setTimeout(finishMobileAnimation, 4000);
}

/**
 * Removes the animation classes and marks the animation as finished.
 *
 * @returns {void}
 */
function finishMobileAnimation() {
    const animationIn = document.getElementById('login-animation-on');
    const animationOut = document.getElementById('login-animation-out');

    animationIn.classList.remove('animation-in');
    animationOut.classList.remove('animation-out');

    document.body.classList.add('mobile-animation-finished');
}

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
 * Builds the task summary and updates the summary page.
 *
 * @param {User} user - The current user.
 * @param {TaskDirectory} tasks - The tasks to summarize.
 * @param {string} today - Today's local date in YYYY-MM-DD format.
 * @returns {void}
 */
function updateSummary(user, tasks, today) {
    const taskSummaryData = getTaskSummaryData(tasks, today);
    const greeting = getGreetingByTime();

    updateSummaryHtml(user, taskSummaryData, greeting);
}

/**
 * Displays task counts, the upcoming deadline, the user's name and a greeting based on time.
 * Displays zero for missing task counts.
 *
 * @param {User} user - The current user.
 * @param {TaskSummaryData} taskSummaryData - The summary values to display.
 * @param {string} greeting - The greeting to display.
 * @returns {void}
 */
function updateSummaryHtml(user, taskSummaryData, greeting) {
    const summaryHtmlElementList = document.querySelectorAll("[data-summary]");

    summaryHtmlElementList.forEach((element) => {
        element.textContent = taskSummaryData[element.dataset.summary] ?? 0;
        if (element.dataset.summary === "upcomingDeadline") {
            element.dateTime = taskSummaryData.upcomingDeadline ?? "";
            element.textContent = taskSummaryData.upcomingDeadlineWritten ?? "";
        }
    });

    document.getElementById("greeting").textContent =
        user.type === "guest" ? `${greeting}!` : `${greeting},`;

    document.getElementById("userNames").textContent =
        user.type === "guest" ? "" : user.name;
}

/**
 * Builds task counts and adds the upcoming deadline and its display text.
 *
 * @param {TaskDirectory} tasks - The tasks to summarize.
 * @param {string} today - Today's local date in YYYY-MM-DD format.
 * @returns {TaskSummaryData} The complete task summary.
 */
function getTaskSummaryData(tasks, today) {
    const upcomingDeadline = getUpcomingDeadline(tasks, today);
    const taskSummaryData = calculateTaskSummaryData(tasks, upcomingDeadline, today);

    taskSummaryData.upcomingDeadline = upcomingDeadline;
    taskSummaryData.upcomingDeadlineWritten = getDateWritten(upcomingDeadline);

    return taskSummaryData;
}

/**
 * Counts all tasks by status and in total.
 * Counts unfinished tasks that are overdue or due on or before
 * the upcoming deadline, regardless of priority.
 *
 * @param {TaskDirectory} tasks - The tasks to count.
 * @param {string} upcomingDeadline - The deadline in YYYY-MM-DD format, or an empty string if no upcoming deadline exists.
 * @param {string} today - Today's local date in YYYY-MM-DD format.
 * @returns {TaskSummaryCounts} The calculated task counts.
 */
function calculateTaskSummaryData(tasks, upcomingDeadline, today) {
    const taskSummaryData = {};

    Object.values(tasks).forEach((task) => {
        taskSummaryData[task.status] = (taskSummaryData[task.status] ?? 0) + 1;
        taskSummaryData.board = (taskSummaryData.board ?? 0) + 1;

        if (task.status !== "done" && (task.dueDate <= upcomingDeadline || task.dueDate < today)) {
            taskSummaryData.urgent = (taskSummaryData.urgent ?? 0) + 1;
        }
    });

    return taskSummaryData;
}

/**
 * Returns a greeting based on the browser's local hour.
 *
 * @returns {string} The greeting including a trailing comma.
 */
function getGreetingByTime() {
    const date = new Date();

    if (date.getHours() >= 5 && date.getHours() < 12) {
        return "Good morning";
    } else if (date.getHours() >= 12 && date.getHours() < 18) {
        return "Good afternoon";
    }

    return "Good evening";
}

/**
 * Formats a date using the browser's local time zone.
 * Uses the current date and time if no date is provided.
 *
 * @param {Date} [date] - The date to format.
 * @returns {string} The local calendar date in YYYY-MM-DD format.
 */
function getLocalDate(date) {
    if (!date) {
        date = new Date();
    }

    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
    ].join("-");
}

/**
 * Formats a calendar date as English month name, day and year.
 * Constructs the date in the browser's local time zone.
 *
 * @param {string} date - A date in YYYY-MM-DD format, or an empty string if no date exists.
 * @returns {string} The formatted date, or "-" for an empty input.
 */
function getDateWritten(date) {
    if (date.length === 0) {
        return "-";
    }

    const [year, month, day] = date.split("-").map(Number);
    const localDate = new Date(year, month - 1, day);
    const monthName = localDate.toLocaleDateString("en-EN", { month: "long" });

    return `${monthName} ${localDate.getDate()}, ${localDate.getFullYear()}`;
}

/**
 * Finds the earliest due date on or after today.
 * Ignores completed tasks and past due dates.
 *
 * @param {TaskDirectory} tasks - The tasks to inspect.
 * @param {string} today - Today's local date in YYYY-MM-DD format.
 * @returns {string} The earliest qualifying date, or an empty string if no task qualifies.
 */
function getUpcomingDeadline(tasks, today) {
    let upcomingDeadline = "";

    Object.values(tasks).forEach((task) => {
        if (task.status !== "done") {
            upcomingDeadline = selectUpcomingDeadline(upcomingDeadline, task.dueDate, today);
        }
    });

    return upcomingDeadline;
}

/**
 * Selects the earlier deadline, ignoring candidate dates before the reference date.
 * All non-empty dates must use YYYY-MM-DD format.
 *
 * @param {string} savedDeadline - The previously selected deadline,
 * or an empty string if none has been selected.
 * @param {string} newDueDate - The candidate due date.
 * @param {string} currentDate - The reference date in YYYY-MM-DD format.
 * @returns {string} The selected deadline, or an empty string if no deadline qualifies.
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
