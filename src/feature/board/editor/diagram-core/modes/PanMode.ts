import { IDiagramMode, IDiagram, DiagramPointerInfo } from "./types";

const MODE_NAME = "pan";
const CURSOR_GRAB = "grab";
const CURSOR_GRABBING = "grabbing";
const CURSOR_DEFAULT = "default";
const KEY_SPACE = "Space";
const KEY_ARROW_UP = "ArrowUp";
const KEY_ARROW_DOWN = "ArrowDown";
const KEY_ARROW_LEFT = "ArrowLeft";
const KEY_ARROW_RIGHT = "ArrowRight";
const PAN_STEP_FACTOR = 0.2;
const ZOOM_IN_FACTOR = 1.1;
const ZOOM_OUT_FACTOR = 0.9;
const ZOOM_MIN = 0.1;
const ZOOM_MAX = 5.0;

/**
 * Panning mode activated by holding space.
 * Click and drag to pan the diagram.
 */
export class PanMode implements IDiagramMode {
  readonly name = MODE_NAME;
  private diagram: IDiagram;
  private isPanning = false;

  constructor(diagram: IDiagram) {
    this.diagram = diagram;
  }

  onEnter(): void {
    this.isPanning = false;
    this.diagram.setCursor(CURSOR_GRAB);
  }

  onExit(): void {
    this.isPanning = false;
    this.diagram.setCursor(CURSOR_DEFAULT);
  }

  onPointerDown(_info: DiagramPointerInfo, _event: PointerEvent): void {
    this.isPanning = true;
    this.diagram.setCursor(CURSOR_GRABBING);
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
    this.diagram.setCursor(CURSOR_GRAB);
  }

  onKeyDown(event: KeyboardEvent): void {
    const arrowKeys = [KEY_ARROW_UP, KEY_ARROW_DOWN, KEY_ARROW_LEFT, KEY_ARROW_RIGHT];
    if (!arrowKeys.includes(event.code)) {
      return;
    }

    event.preventDefault();

    const { width, height } = this.diagram.getViewportSize();
    const stepX = width * PAN_STEP_FACTOR;
    const stepY = height * PAN_STEP_FACTOR;

    switch (event.code) {
      case KEY_ARROW_UP:
        this.diagram.panByCanvas(0, stepY);
        break;
      case KEY_ARROW_DOWN:
        this.diagram.panByCanvas(0, -stepY);
        break;
      case KEY_ARROW_LEFT:
        this.diagram.panByCanvas(stepX, 0);
        break;
      case KEY_ARROW_RIGHT:
        this.diagram.panByCanvas(-stepX, 0);
        break;
    }
  }

  onKeyUp(event: KeyboardEvent): void {
    if (event.code === KEY_SPACE) {
      event.preventDefault();
      this.diagram.popMode();
    }
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();

    const currentZoom = this.diagram.getZoom();
    const zoomFactor = event.deltaY > 0 ? ZOOM_OUT_FACTOR : ZOOM_IN_FACTOR;
    const newZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, currentZoom * zoomFactor));

    this.diagram.setZoomAtPoint(newZoom, event.clientX, event.clientY);
  }

  onBlur(): void {
    // Window lost focus - exit pan mode as if Space was released
    this.diagram.popMode();
  }
}
