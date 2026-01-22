/**
 * Browser → World coordinates.
 *
 * How it works:
 *   1. canvasX = browserX - canvasRect.left  (canvas-relative CSS px)
 *   2. worldX = canvasX / zoom + offsetX     (scale and shift)
 */
export function browserToWorld(
  browserX: number,
  browserY: number,
  canvasRect: DOMRect,
  zoom: number,
  offsetX: number,
  offsetY: number
): { x: number; y: number } {
  const canvasX = browserX - canvasRect.left;
  const canvasY = browserY - canvasRect.top;
  return {
    x: canvasX / zoom + offsetX,
    y: canvasY / zoom + offsetY,
  };
}

/**
 * Screen delta → World delta.
 *
 * How it works: Divide by zoom.
 * Example: 100px screen drag at 2x zoom = 50 world units.
 */
export function screenDeltaToWorldDelta(
  screenDeltaX: number,
  screenDeltaY: number,
  zoom: number
): { deltaX: number; deltaY: number } {
  return {
    deltaX: screenDeltaX / zoom,
    deltaY: screenDeltaY / zoom,
  };
}

/**
 * World offset → Scroll position (CSS pixels).
 *
 * How it works: Multiply by zoom.
 * Example: 100 world units at 2x zoom = 200px scroll.
 */
export function worldOffsetToScrollPosition(
  offsetX: number,
  offsetY: number,
  zoom: number
): { scrollLeft: number; scrollTop: number } {
  return {
    scrollLeft: offsetX * zoom,
    scrollTop: offsetY * zoom,
  };
}

/**
 * Scroll position → World offset.
 *
 * How it works: Divide by zoom.
 * Example: 200px scroll at 2x zoom = 100 world units.
 */
export function scrollPositionToWorldOffset(
  scrollLeft: number,
  scrollTop: number,
  zoom: number
): { offsetX: number; offsetY: number } {
  return {
    offsetX: scrollLeft / zoom,
    offsetY: scrollTop / zoom,
  };
}
