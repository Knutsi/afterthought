import { IDiagramMode, IDiagramModeContext } from "./types";

/**
 * Panning mode activated by holding space.
 * Click and drag to pan the diagram.
 */
export class PanMode implements IDiagramMode {
  readonly name = "pan";
  private context: IDiagramModeContext;
  private isPanning = false;

  constructor(context: IDiagramModeContext) {
    this.context = context;
  }

  onEnter(): void {
    this.isPanning = false;
  }

  onExit(): void {
    this.isPanning = false;
  }

  onPointerDown(_worldX: number, _worldY: number, _event: PointerEvent): void {
    this.isPanning = true;
  }

  onPointerMove(_worldX: number, _worldY: number, deltaX: number, deltaY: number, _event: PointerEvent): void {
    if (!this.isPanning) {
      return;
    }

    // Move offset in opposite direction of drag (drag left = view moves right)
    const offset = this.context.getOffset();
    this.context.setOffset(offset.x - deltaX, offset.y - deltaY);
  }

  onPointerUp(_worldX: number, _worldY: number, _event: PointerEvent): void {
    this.isPanning = false;
  }

  onKeyDown(_event: KeyboardEvent): void {
    // No action - space is already being held
  }

  onKeyUp(event: KeyboardEvent): void {
    if (event.code === "Space") {
      event.preventDefault();
      this.context.popMode();
    }
  }
}
