/**
 * Contacts loaded from the database, indexed by contact ID.
 *
 * @type {ContactDirectory}
 */
const localContacts = {};

/**
 * Local board data with tasks grouped by status.
 *
 * @type {Board}
 */
const board = {
  toDo: {
    id: "toDo-content",
    name: "To Do",
    tasks: {},
  },
  inProgress: {
    id: "inProgress-content",
    name: "In progress",
    tasks: {},
  },
  awaitFeedback: {
    id: "awaitFeedback-content",
    name: "Await feedback",
    tasks: {},
  },
  done: {
    id: "done-content",
    name: "Done",
    tasks: {},
  },
};

/**
 * Loads the current user, tasks, and contacts, then renders the board.
 * Caches the user ID globally and replaces the board content with a persistent
 * error message if loading or rendering fails.
 * Announces successful task creation after navigation from Add Task.
 * Stops initialization if no valid user is available.
 *
 * @returns {Promise<void>} Resolves after rendering, error handling or an early return.
 */
async function initBoard() {
  try {
    if (!(await initializeCurrentUser())) return;

    await loadBoardData();
    renderBoard(Object.values(board));
    announceCreatedTask();
  } catch (error) {
    const boardContainer = document.querySelector(".board");
    boardContainer.innerHTML = getBoardLoadingFailureTemplate();
  }
}

/**
 * Announces successful task creation after navigation to the board.
 * Removes the URL flag to prevent repetition when reloading.
 * Focuses the Add Task button and associates the creation confirmation with it.
 *
 * @returns {void}
 */
function announceCreatedTask() {
  const url = new URL(window.location.href);
  if (url.searchParams.get("taskCreated") !== "true") return;
  const result = document.getElementById("board-creation-result");
  const button = document.querySelector("#board-header > button");
  if (!result || !button) return;
  url.searchParams.delete("taskCreated");
  window.history.replaceState(window.history.state, "", url.href);
  result.textContent = "Task added to board";
  button.setAttribute("aria-label", "Task added to board. Add Task");
  button.focus();
}

/**
 * Renders the supplied columns, applying activeSearchTerm when it is not empty.
 *
 * @param {BoardColumn[]} columns - Array of columns that should be rendered.
 * @returns {void}
 */
function renderBoard(columns) {
  if (activeSearchTerm.length > 0) {
    const filteredColumns = getFilteredColumns(columns);

    filteredColumns.forEach((column) => renderBoardColumn(column));
  } else {
    columns.forEach((column) => renderBoardColumn(column));
  }
}

/**
 * Replaces the column container's contents with task cards
 * or an empty-column message.
 *
 * @param {BoardColumn} column - A single board column including the tasks.
 * @returns {void}
 */
function renderBoardColumn(column) {
  const columnContent = document.getElementById(column.id);
  const getEmptyTaskBadgeTemplate = activeSearchTerm.length > 0 ? getTaskCardMatchingBadge : getTaskCardEmptyBadge;

  if (Object.keys(column.tasks).length === 0) {
    columnContent.innerHTML = getEmptyTaskBadgeTemplate(column.name);
  } else {
    const columnContentHtml = getColumnContentHtml(column.tasks);
    columnContent.innerHTML = columnContentHtml;
  }
}

/**
 * Iterates all tasks of a single column and creates the HTML string.
 *
 * @param {TaskDirectory} columnTasksObject - The tasks assigned to the column.
 * @returns {string} HTML string containing the task cards.
 */
function getColumnContentHtml(columnTasksObject) {
  const tasksArray = Object.entries(columnTasksObject);
  let columnContentHtml = "";

  tasksArray.forEach(([taskId, task]) => {
    const taskData = getTaskCardData(taskId, task);

    columnContentHtml += getTaskCardTemplate(taskData);
  });

  return columnContentHtml;
}

/**
 * Builds the data needed to render a task card.
 *
 * @param {TaskId} taskId - ID of the task.
 * @param {Task} task - The task to prepare for rendering.
 * @returns {TaskCardData} Task data with subtask summary, assignee HTML and move popup HTML.
 */
function getTaskCardData(taskId, task) {
  return {
    id: taskId,
    task: task,
    subtasksData: getSubtasksCardData(task),
    assigneesHtml: getAssigneesHtml(task, getTaskCardUserBadgeTemplate),
    popupHtml: getTaskMovePopupHtml(taskId, task.status),
  };
}

/**
 * Selects assigned contacts present in localContacts and builds their HTML.
 * For task card badges, shows at most three contacts and adds
 * a badge for the remaining count.
 *
 * @param {Task} task - A single task.
 * @param {(contact: Contact) => string} getUserBadgeTemplateFunction - Function that generates the HTML for one assignee.
 * @returns {string} HTML string containing the assignees of the task.
 */
function getAssigneesHtml(task, getUserBadgeTemplateFunction) {
  const maxVisible = 3;
  const assignees = Object.keys(task.assignedTo ?? {}).filter((id) => localContacts[id]);
  const isTaskCard = getUserBadgeTemplateFunction === getTaskCardUserBadgeTemplate;
  const visibleAssignees = isTaskCard ? assignees.slice(0, maxVisible) : assignees;
  const remainingCount = assignees.length - visibleAssignees.length;

  return getVisibleAssigneesHtml(visibleAssignees, remainingCount, getUserBadgeTemplateFunction);
}

/**
 * Builds badges for the supplied contact IDs and appends a remaining-count badge when needed.
 * Requires each contact ID to exist in localContacts.
 *
 * @param {ContactId[]} visibleAssignees - IDs of the contacts whose badges should be rendered.
 * @param {number} remainingCount - Number of additional assignees omitted from the visible badges.
 * @param {(contact: Contact) => string} getUserBadgeTemplateFunction - Function that generates the HTML for one assignee.
 * @returns {string} HTML containing the visible assignee badges and optional remaining-count badge.
 */
function getVisibleAssigneesHtml(visibleAssignees, remainingCount, getUserBadgeTemplateFunction) {
  let assigneesHtml = "";

  visibleAssignees.forEach((id) => {
    assigneesHtml += getUserBadgeTemplateFunction(localContacts[id]);
  });

  if (remainingCount > 0) {
    assigneesHtml += getMoreBadgeTemplate(remainingCount);
  }

  return assigneesHtml;
}
