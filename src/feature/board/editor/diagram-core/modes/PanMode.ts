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
    this.diagram.setCursor("grab");
  }

  onExit(): void {
    this.isPanning = false;
    this.diagram.setCursor("default");
  }

  onPointerDown(_info: DiagramPointerInfo, _event: PointerEvent): void {
    this.isPanning = true;
    this.diagram.setCursor("grabbing");
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
    this.diagram.setCursor("grab");
  }

  onKeyDown(event: KeyboardEvent): void {
    const arrowKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
    if (!arrowKeys.includes(event.code)) {
      return;
    }

    event.preventDefault();

    const { width, height } = this.diagram.getViewportSize();
    const stepX = width * 0.2;
    const stepY = height * 0.2;

    switch (event.code) {
      case "ArrowUp":
        this.diagram.panByCanvas(0, stepY);
        break;
      case "ArrowDown":
        this.diagram.panByCanvas(0, -stepY);
        break;
      case "ArrowLeft":
        this.diagram.panByCanvas(stepX, 0);
        break;
      case "ArrowRight":
        this.diagram.panByCanvas(-stepX, 0);
        break;
    }
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

  onBlur(): void {
    // Window lost focus - exit pan mode as if Space was released
    this.diagram.popMode();
  }
}
