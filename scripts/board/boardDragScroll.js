/** @type {number|null} Pending animation frame for intermediate board drag scrolling. */
let dragScrollFrame = null;

/** @type {number} Signed vertical drag-scroll speed in pixels per second. */
let dragScrollSpeed = 0;

/** @type {number} Timestamp of the previous drag-scroll animation frame. */
let dragScrollLastTime = 0;

/**
 * Updates vertical auto-scroll speed near the visible intermediate board edges.
 * Leaves drop eligibility to the existing column handlers.
 *
 * @param {DragEvent} event - The drag-over event bubbling through the board.
 * @returns {void}
 */
function updateBoardDragScroll(event) {
  const board = document.querySelector(".board-page");
  if (!canScrollBoardDuringDrag(board)) return stopBoardDragScroll();
  const bounds = getVisibleBoardBounds(board);
  if (!isDragPointerInsideBoard(event, bounds)) return stopBoardDragScroll();
  dragScrollSpeed = getBoardDragScrollSpeed(event.clientY, bounds);
  if (dragScrollSpeed === 0) return stopBoardDragScroll();
  startBoardDragScroll();
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

/**
 * Calculates signed scroll speed in the top or bottom 50-pixel edge zone.
 *
 * @param {number} pointerY - The drag pointer's vertical viewport position.
 * @param {{top: number, bottom: number}} bounds - Visible board bounds.
 * @returns {number} Scroll speed in pixels per second, or zero outside the edge zones.
 */
function getBoardDragScrollSpeed(pointerY, bounds) {
  const edge = Math.min(200, (bounds.bottom - bounds.top) / 3);
  if (pointerY < bounds.top + edge) return -1200 * (1 - (pointerY - bounds.top) / edge);
  if (pointerY > bounds.bottom - edge) return 1200 * (1 - (bounds.bottom - pointerY) / edge);
  return 0;
}

/**
 * Starts the drag-scroll animation unless a frame is already pending.
 *
 * @returns {void}
 */
function startBoardDragScroll() {
  if (dragScrollFrame !== null) return;
  dragScrollLastTime = performance.now();
  dragScrollFrame = requestAnimationFrame(scrollBoardDuringDrag);
}

/**
 * Scrolls the intermediate board independently of the drag-over event frequency.
 * Stops at scroll boundaries or when the drag or intermediate layout ends.
 *
 * @param {DOMHighResTimeStamp} timestamp - The animation frame timestamp.
 * @returns {void}
 */
function scrollBoardDuringDrag(timestamp) {
  const board = document.querySelector(".board-page");
  if (!canScrollBoardDuringDrag(board)) return stopBoardDragScroll();
  applyBoardDragScrollStep(board, timestamp);
  if (hasReachedBoardScrollBoundary(board)) return stopBoardDragScroll();
  dragScrollFrame = requestAnimationFrame(scrollBoardDuringDrag);
}

/**
 * Applies one time-based scroll step, capped after long frame delays.
 *
 * @param {HTMLElement} board - The board scroll container.
 * @param {DOMHighResTimeStamp} timestamp - The current animation frame timestamp.
 * @returns {void}
 */
function applyBoardDragScrollStep(board, timestamp) {
  const seconds = Math.min((timestamp - dragScrollLastTime) / 1000, 0.05);
  dragScrollLastTime = timestamp;
  board.scrollTop += dragScrollSpeed * seconds;
}

/**
 * Checks the scroll boundary in the current movement direction.
 *
 * @param {HTMLElement} board - The board scroll container.
 * @returns {boolean}
 */
function hasReachedBoardScrollBoundary(board) {
  const reachedTop = dragScrollSpeed < 0 && board.scrollTop <= 0;
  const reachedBottom = dragScrollSpeed > 0 && board.scrollTop >= board.scrollHeight - board.clientHeight - 1;
  return reachedTop || reachedBottom;
}

/**
 * Keeps scrolling between board descendants, but stops when the board is left.
 *
 * @param {DragEvent} event - The drag-leave event bubbling through the board.
 * @returns {void}
 */
function handleBoardDragScrollLeave(event) {
  if (event.currentTarget.contains(event.relatedTarget)) return;
  stopBoardDragScroll();
}

/**
 * Cancels intermediate board drag scrolling and clears its animation state.
 *
 * @returns {void}
 */
function stopBoardDragScroll() {
  if (dragScrollFrame !== null) cancelAnimationFrame(dragScrollFrame);
  dragScrollFrame = null;
  dragScrollSpeed = 0;
  dragScrollLastTime = 0;
}
