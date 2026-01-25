import { DiagramElement } from "../types";

export class BaseElement extends DiagramElement {
  constructor() {
    super();
    this.type = "base";
  }

  override render(ctx: CanvasRenderingContext2D): void {
    const radius = 8;
    const { posX, posY, width, height } = this;

    // Shadow (world space units)
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 4;

    // Rounded rectangle fill
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(posX, posY, width, height, radius);
    ctx.fill();

    ctx.restore();

    // Border (no shadow)
    ctx.strokeStyle = "#d0d0d0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(posX, posY, width, height, radius);
    ctx.stroke();
  }
}
