import { DiagramElement } from "../../diagram-core/types";

const DEFAULT_WIDTH = 150;
const DEFAULT_HEIGHT = 50;
const CORNER_RADIUS = 8;
const FONT_SIZE = 14;

export class TaskElement extends DiagramElement {
  title: string;
  taskUri: string | null = null;

  constructor(title?: string, taskUri?: string) {
    super();
    this.type = "task";
    this.width = DEFAULT_WIDTH;
    this.height = DEFAULT_HEIGHT;
    this.title = title ?? "Task";
    this.taskUri = taskUri ?? null;
  }

  override render(ctx: CanvasRenderingContext2D): void {
    const { posX, posY, width, height } = this;

    // Shadow
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 4;

    // Rounded rectangle fill (light cyan/blue tint)
    ctx.fillStyle = "#e8f4f8";
    ctx.beginPath();
    ctx.roundRect(posX, posY, width, height, CORNER_RADIUS);
    ctx.fill();

    ctx.restore();

    // Border (no shadow)
    ctx.strokeStyle = "#7fb3c2";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(posX, posY, width, height, CORNER_RADIUS);
    ctx.stroke();

    // Title text
    ctx.fillStyle = "#2c5f6e";
    ctx.font = `${FONT_SIZE}px sans-serif`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    const textX = posX + 12;
    const textY = posY + height / 2;
    ctx.fillText(this.title, textX, textY, width - 24);
  }
}
