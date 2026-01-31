import { IDiagramMode, IDiagram, DiagramPointerInfo } from "./types";
import { PanMode } from "./PanMode";
import { DragSelectMode } from "./DragSelectMode";
import { MOUSE_BUTTON_PRIMARY } from "../managers/InputManager";

export class IdleMode implements IDiagramMode {
  readonly name: string = "idle";
  protected diagram: IDiagram;

  constructor(diagram: IDiagram) {
    this.diagram = diagram;
  }

  onEnter(): void {
    // Nothing to initialize
  }

  onExit(): void {
    // Nothing to clean up
  }

  onPointerDown(info: DiagramPointerInfo, event: PointerEvent): void {
    // Only respond to left-click
    if (event.button !== MOUSE_BUTTON_PRIMARY) return;

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
