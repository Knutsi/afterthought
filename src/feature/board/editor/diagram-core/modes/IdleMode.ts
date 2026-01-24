import { IDiagramMode, IDiagram, DiagramPointerInfo } from "./types";
import { PanMode } from "./PanMode";
import { DragSelectMode } from "./DragSelectMode";

/**
 * Default mode at the bottom of the mode stack.
 * Handles space key to enter pan mode.
 */
export class IdleMode implements IDiagramMode {
  readonly name = "idle";
  private diagram: IDiagram;

  constructor(diagram: IDiagram) {
    this.diagram = diagram;
  }

  onEnter(): void {
    // Nothing to initialize
  }

  onExit(): void {
    // Nothing to clean up
  }

  onPointerDown(info: DiagramPointerInfo, _event: PointerEvent): void {
    // TODO: Check if an element is under cursor - if so, initiate DragMode instead
    // For now, always start drag-select
    this.diagram.pushMode(new DragSelectMode(this.diagram, info));
  }

  onPointerMove(_info: DiagramPointerInfo, _event: PointerEvent): void {
    // No action in idle mode for now
  }

  onPointerUp(_info: DiagramPointerInfo, _event: PointerEvent): void {
    // No action in idle mode for now
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.code === "Space") {
      event.preventDefault();
      this.diagram.pushMode(new PanMode(this.diagram));
    }
  }

  onKeyUp(_event: KeyboardEvent): void {
    // No action in idle mode for now
  }
}
