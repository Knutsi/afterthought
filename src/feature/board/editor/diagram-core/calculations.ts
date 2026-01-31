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
