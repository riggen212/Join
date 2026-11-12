/**
 * Scrolls the intermediate board by a fixed step near its visible edges.
 * Leaves drop eligibility to the existing column handlers.
 *
 * @param {DragEvent} event - The drag-over event bubbling through the board.
 * @returns {void}
 */
function updateBoardDragScroll(event) {
  const board = document.querySelector(".board-page");
  if (!canScrollBoardDuringDrag(board)) return;
  const bounds = getVisibleBoardBounds(board);
  if (!isDragPointerInsideBoard(event, bounds)) return;

  const edge = Math.min(50, (bounds.bottom - bounds.top) / 3);
  if (event.clientY < bounds.top + edge) {
    board.scrollTop -= 20;
  } else if (event.clientY > bounds.bottom - edge) {
    board.scrollTop += 20;
  }
}

/**
 * Checks whether a task drag and an intermediate board are available.
 *
 * @param {HTMLElement|null} board - The board scroll container.
 * @returns {boolean}
 */
function canScrollBoardDuringDrag(board) {
  return !!board && !!draggingTask && window.matchMedia("(min-width: 768px) and (max-width: 1279px)").matches;
}

/**
 * Returns board bounds clipped to the visible viewport vertically.
 *
 * @param {HTMLElement} board - The board scroll container.
 * @returns {{left: number, right: number, top: number, bottom: number}}
 */
function getVisibleBoardBounds(board) {
  const { left, right, top, bottom } = board.getBoundingClientRect();
  return { left, right, top: Math.max(top, 0), bottom: Math.min(bottom, window.innerHeight) };
}

/**
 * Checks whether the drag pointer is inside the visible board area.
 *
 * @param {DragEvent} event - The board drag-over event.
 * @param {{left: number, right: number, top: number, bottom: number}} bounds - Visible board bounds.
 * @returns {boolean}
 */
function isDragPointerInsideBoard(event, bounds) {
  return (
    bounds.bottom > bounds.top &&
    event.clientX >= bounds.left &&
    event.clientX <= bounds.right &&
    event.clientY >= bounds.top &&
    event.clientY <= bounds.bottom
  );
}
