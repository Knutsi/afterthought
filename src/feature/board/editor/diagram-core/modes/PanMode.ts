import { IDiagramMode, IDiagram, DiagramPointerInfo } from "./types";

/**
 * Panning mode activated by holding space.
 * Click and drag to pan the diagram.
 */
export class PanMode implements IDiagramMode {
  readonly name = "pan";
  private diagram: IDiagram;
  private isPanning = false;

  constructor(diagram: IDiagram) {
    this.diagram = diagram;
  }

  onEnter(): void {
    this.isPanning = false;
  }

  onExit(): void {
    this.isPanning = false;
  }

  onPointerDown(_info: DiagramPointerInfo, _event: PointerEvent): void {
    this.isPanning = true;
  }

  onPointerMove(info: DiagramPointerInfo, _event: PointerEvent): void {
    if (!this.isPanning) {
      return;
    }
    // Use canvas delta directly - no coordinate conversion needed
    this.diagram.panByCanvas(info.canvasDeltaX, info.canvasDeltaY);
  }

  onPointerUp(_info: DiagramPointerInfo, _event: PointerEvent): void {
    this.isPanning = false;
  }

  onKeyDown(_event: KeyboardEvent): void {
    // No action - space is already being held
  }

  onKeyUp(event: KeyboardEvent): void {
    if (event.code === "Space") {
      event.preventDefault();
      this.diagram.popMode();
    }
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();

    const currentZoom = this.diagram.getZoom();
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1; // scroll down = zoom out, scroll up = zoom in
    const newZoom = Math.max(0.1, Math.min(5.0, currentZoom * zoomFactor));

    this.diagram.setZoomAtPoint(newZoom, event.clientX, event.clientY);
  }
}
