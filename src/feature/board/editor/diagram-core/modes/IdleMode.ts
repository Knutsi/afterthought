import { IDiagramMode, IDiagramModeContext } from "./types";
import { PanMode } from "./PanMode";

/**
 * Default mode at the bottom of the mode stack.
 * Handles space key to enter pan mode.
 */
export class IdleMode implements IDiagramMode {
  readonly name = "idle";
  private context: IDiagramModeContext;

  constructor(context: IDiagramModeContext) {
    this.context = context;
  }

  onEnter(): void {
    // Nothing to initialize
  }

  onExit(): void {
    // Nothing to clean up
  }

  onPointerDown(_worldX: number, _worldY: number, _event: PointerEvent): void {
    // No action in idle mode for now
  }

  onPointerMove(_worldX: number, _worldY: number, _deltaX: number, _deltaY: number, _event: PointerEvent): void {
    // No action in idle mode for now
  }

  onPointerUp(_worldX: number, _worldY: number, _event: PointerEvent): void {
    // No action in idle mode for now
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.code === "Space") {
      event.preventDefault();
      this.context.pushMode(new PanMode(this.context));
    }
  }

  onKeyUp(_event: KeyboardEvent): void {
    // No action in idle mode for now
  }
}
