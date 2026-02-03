import { IDiagramMode } from "./modes/types";
import type { StageManager } from "./managers/StageManager";
import type { GeometryManager } from "./managers/GeometryManager";
import type { SelectionManager } from "./managers/SelectionManager";
import type { ITheme } from "../../../../service/ThemeService";

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

  // Element under the pointer (hit-tested)
  elementUnderPointer: DiagramElement | null;
}

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
  requestRender(): void;
  getViewportSize(): { width: number; height: number };
  getStageManager(): StageManager;
  getGeometryManager(): GeometryManager;
  getSelectionManager(): SelectionManager;
  requestSelectionSet(elements: DiagramElement[]): void;
  requestSelectionAdd(elements: DiagramElement[]): void;
  requestSelectionRemove(elements: DiagramElement[]): void;
  fireBackgroundDoubleClick(worldX: number, worldY: number): void;
}

// ==================== Change Detection ====================

export type ElementChangeType = 'added' | 'removed' | 'moved' | 'resized';

export interface ElementChangeEvent {
  type: ElementChangeType;
  element: DiagramElement;
  layerId: string;
}

export type ElementChangeCallback = (event: ElementChangeEvent) => void;

export type SelectionChangeCallback = (selectedIds: string[]) => void;

export type SelectionRequestCallback = (elements: DiagramElement[]) => void;

export interface IDiagramCallbacks {
  onElementChange?: ElementChangeCallback;
  onSelectionChange?: SelectionChangeCallback;
  onSelectionSetRequest?: SelectionRequestCallback;
  onSelectionAddRequest?: SelectionRequestCallback;
  onSelectionRemoveRequest?: SelectionRequestCallback;
  onBackgroundDoubleClick?: (worldX: number, worldY: number) => void;
}

export interface IDiagramOptions {
  getThemeFn: () => ITheme;
}

export interface IDiagramContext {
  isSelected: boolean;
  theme: ITheme;
}

export class DiagramElement {
  id: string;
  type: string;
  data: any;

  posX: number;
  posY: number;
  width: number;
  height: number;

  isSelectable: boolean;

  constructor() {
    this.id = crypto.randomUUID();
    this.type = "";
    this.data = {};
    this.posX = 100;
    this.posY = 100;
    this.width = 300;
    this.height = 100;
    this.isSelectable = true;
  }

  render(ctx: CanvasRenderingContext2D, _diagramCtx: IDiagramContext): void {
    // Default: simple filled rectangle (fallback)
    ctx.fillStyle = "#888";
    ctx.fillRect(this.posX, this.posY, this.width, this.height);
  }
}

export class DiagramLayer {
  id: string;
  name: string;
  elements: DiagramElement[];

  constructor(name: string) {
    this.id = crypto.randomUUID();
    this.name = name;
    this.elements = [];
  }
}

export class DiagramModel {
  layers: DiagramLayer[];

  offsetX: number;      // Scroll offset X (diagram space pixels)
  offsetY: number;      // Scroll offset Y (diagram space pixels)

  extentWidth: number;  // Scrollable width (diagram space)
  extentHeight: number; // Scrollable height (diagram space)

  zoom: number;         // Zoom factor (1.0 = 100%, 0.5 = 50%, 2.0 = 200%)

  modeStack: IDiagramMode[];

  constructor() {
    this.layers = [];
    this.offsetX = 0;
    this.offsetY = 0;
    this.extentWidth = 5000;  // Default extent: 5000x5000
    this.extentHeight = 5000;
    this.zoom = 1.0;          // Default zoom: 100%
    this.modeStack = [];      // Will be initialized by Diagram
  }
}
