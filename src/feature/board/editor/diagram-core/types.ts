import { IDiagramMode } from "./modes/types";

/**
 * Comprehensive pointer event info with both canvas and world coordinates.
 * Canvas = CSS pixels relative to canvas element
 * World = diagram space (accounting for scroll offset and zoom)
 */
export interface DiagramPointerInfo {
  // Current position
  canvasX: number;
  canvasY: number;
  worldX: number;
  worldY: number;

  // Delta since last pointer event
  canvasDeltaX: number;
  canvasDeltaY: number;
  worldDeltaX: number;
  worldDeltaY: number;

  // Total delta since drag start (pointerdown)
  canvasTotalDeltaX: number;
  canvasTotalDeltaY: number;
  worldTotalDeltaX: number;
  worldTotalDeltaY: number;

  // Drag history (all positions during current drag)
  canvasDragHistory: Array<{ x: number; y: number }>;
  worldDragHistory: Array<{ x: number; y: number }>;

  // Previous click position (last pointerdown before current)
  canvasPreviousX: number;
  canvasPreviousY: number;
  worldPreviousX: number;
  worldPreviousY: number;
}

/**
 * Context interface providing diagram access to modes.
 * Modes use this to push/pop modes and modify diagram state.
 */
export interface IDiagram {
  pushMode(mode: IDiagramMode): void;
  popMode(): void;
  getCurrentMode(): IDiagramMode;
  setOffset(x: number, y: number): void;
  getOffset(): { x: number; y: number };
  panByWorldOffset(deltaX: number, deltaY: number): void;
  panByCanvas(canvasDeltaX: number, canvasDeltaY: number): void;
  getZoom(): number;
  setZoomAtPoint(newZoom: number, anchorClientX?: number, anchorClientY?: number): void;
  setCursor(cursorStyle: string): void;
}

export class DiagramElement {
  id: string;
  type: string;
  data: any;

  posX: number;
  posY: number;
  width: number;
  height: number;

  constructor() {
    this.id = crypto.randomUUID();
    this.type = "";
    this.data = {};
    this.posX = 100;
    this.posY = 100;
    this.width = 300;
    this.height = 100;
  }
}

export class DiagramConnection {
  id: string;
  source: string;
  target: string;

  constructor() {
    this.id = crypto.randomUUID();
    this.source = "";
    this.target = "";
  }
}

export class DiagramModel {
  elements: DiagramElement[];
  connections: DiagramConnection[];

  offsetX: number;      // Scroll offset X (diagram space pixels)
  offsetY: number;      // Scroll offset Y (diagram space pixels)

  extentWidth: number;  // Scrollable width (diagram space)
  extentHeight: number; // Scrollable height (diagram space)

  zoom: number;         // Zoom factor (1.0 = 100%, 0.5 = 50%, 2.0 = 200%)

  modeStack: IDiagramMode[];

  constructor() {
    this.elements = [];
    this.connections = [];
    this.offsetX = 0;
    this.offsetY = 0;
    this.extentWidth = 5000;  // Default extent: 5000x5000
    this.extentHeight = 5000;
    this.zoom = 1.0;          // Default zoom: 100%
    this.modeStack = [];      // Will be initialized by Diagram
  }
}
