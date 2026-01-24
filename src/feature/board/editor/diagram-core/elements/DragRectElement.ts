import { DiagramElement } from "../types";

/**
 * Selection rectangle element rendered during drag-select.
 * Semi-transparent fill with dashed border.
 */
export class DragRectElement extends DiagramElement {
  constructor() {
    super();
    this.type = "drag-rect";
    // Start with zero size, will be updated during drag
    this.width = 0;
    this.height = 0;
  }

  override render(ctx: CanvasRenderingContext2D): void {
    const { posX, posY, width, height } = this;

    // Semi-transparent fill
    ctx.fillStyle = "rgba(59, 130, 246, 0.1)"; // Light blue
    ctx.fillRect(posX, posY, width, height);

    // Dashed border
    ctx.strokeStyle = "rgba(59, 130, 246, 0.8)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(posX, posY, width, height);
    ctx.setLineDash([]); // Reset dash pattern
  }
}
