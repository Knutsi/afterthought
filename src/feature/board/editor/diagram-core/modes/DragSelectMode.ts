import { IDiagramMode, IDiagram, DiagramPointerInfo } from "./types";
import { DragRectElement } from "../elements/DragRectElement";

// TODO: implement actual element selection based on intersection
export class DragSelectMode implements IDiagramMode {
  readonly name = "drag-select";
  private diagram: IDiagram;
  private dragRect: DragRectElement | null = null;
  private layerId: string | null = null;
  private startX: number = 0;
  private startY: number = 0;

  constructor(diagram: IDiagram, startInfo: DiagramPointerInfo) {
    this.diagram = diagram;
    this.startX = startInfo.worldX;
    this.startY = startInfo.worldY;
  }

  onEnter(): void {
    this.diagram.setCursor("crosshair");

    // Create selection layer at bottom (index 0)
    const stageManager = this.diagram.getStageManager();
    const layer = stageManager.insertLayerAt(0, "__drag-select__");
    this.layerId = layer.id;

    // Create and add the drag rect element
    this.dragRect = new DragRectElement();
    this.dragRect.posX = this.startX;
    this.dragRect.posY = this.startY;
    stageManager.addElement(this.layerId, this.dragRect);
  }

  onExit(): void {
    this.diagram.setCursor("default");
    this.cleanup();
  }

  private cleanup(): void {
    if (this.layerId) {
      const stageManager = this.diagram.getStageManager();
      stageManager.removeLayer(this.layerId);
      this.layerId = null;
      this.dragRect = null;
    }
  }

  onPointerDown(_info: DiagramPointerInfo, _event: PointerEvent): void {
    // Already started, ignore additional pointer downs
  }

  onPointerMove(info: DiagramPointerInfo, _event: PointerEvent): void {
    if (!this.dragRect) return;

    // Calculate rect bounds from start to current position
    const minX = Math.min(this.startX, info.worldX);
    const minY = Math.min(this.startY, info.worldY);
    const maxX = Math.max(this.startX, info.worldX);
    const maxY = Math.max(this.startY, info.worldY);

    this.dragRect.posX = minX;
    this.dragRect.posY = minY;
    this.dragRect.width = maxX - minX;
    this.dragRect.height = maxY - minY;

    this.diagram.requestRender();
  }

  onPointerUp(_info: DiagramPointerInfo, _event: PointerEvent): void {
    // TODO: Select elements that intersect with the drag rect
    this.diagram.popMode();
  }

  onKeyDown(event: KeyboardEvent): void {
    // Escape cancels selection
    if (event.code === "Escape") {
      event.preventDefault();
      this.diagram.popMode();
    }
  }

  onKeyUp(_event: KeyboardEvent): void {
    // No action
  }

  onBlur(): void {
    // Window lost focus - cancel selection
    this.diagram.popMode();
  }
}
