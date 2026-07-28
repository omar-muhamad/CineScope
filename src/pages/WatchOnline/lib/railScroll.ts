/**
 * Scrolling helpers for the sidebar episode rail. The rail's scroll box is the
 * page's own wrapper around the list, not an element the rail component owns,
 * so it is looked up from the DOM rather than held in a ref.
 */

/** Nearest ancestor that actually scrolls vertically. */
export const findScrollParent = (
  el: HTMLElement | null,
): HTMLElement | null => {
  let node = el?.parentElement ?? null;
  while (node) {
    const { overflowY } = getComputedStyle(node);
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      node.scrollHeight > node.clientHeight
    ) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
};

/**
 * Where the rail should scroll to reveal the playing row: centred when the row
 * is off-screen, and `null` (no-op) when it's already fully visible — clicking
 * a visible row must never yank the list out from under the pointer. All
 * measurements are relative to the scroller's content box; the browser clamps
 * the returned value to the scrollable range.
 */
export const scrollTopForRow = ({
  scrollTop,
  viewport,
  rowTop,
  rowHeight,
}: {
  scrollTop: number;
  viewport: number;
  rowTop: number;
  rowHeight: number;
}): number | null => {
  if (viewport <= 0 || rowHeight <= 0) return null;
  const fullyVisible =
    rowTop >= scrollTop && rowTop + rowHeight <= scrollTop + viewport;
  if (fullyVisible) return null;
  return Math.max(0, rowTop - (viewport - rowHeight) / 2);
};
