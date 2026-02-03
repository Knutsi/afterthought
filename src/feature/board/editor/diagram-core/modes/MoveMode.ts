import type { IDiagramMode } from "./types";
import type { IDiagram, DiagramPointerInfo, DiagramElement } from "../types";

export class MoveMode implements IDiagramMode {
  readonly name = "move";
  private diagram: IDiagram;
  private elementsToMove: DiagramElement[];
  private originalPositions: Map<string, { x: number; y: number }>;
  private startWorldX: number;
  private startWorldY: number;

  constructor(
    diagram: IDiagram,
    elements: DiagramElement[],
    startInfo: DiagramPointerInfo
  ) {
    this.diagram = diagram;
    this.elementsToMove = elements;
    this.originalPositions = new Map();
    this.startWorldX = startInfo.worldX;
    this.startWorldY = startInfo.worldY;
  }

  onEnter(): void {
    for (const el of this.elementsToMove) {
      this.originalPositions.set(el.id, { x: el.posX, y: el.posY });
    }
    this.diagram.setCursor("move");
  }

  onExit(): void {
    this.diagram.setCursor("default");
  }

  onPointerDown(_info: DiagramPointerInfo, _event: PointerEvent): void {
    // ignore
  }

  onPointerMove(info: DiagramPointerInfo, _event: PointerEvent): void {
    const deltaX = info.worldX - this.startWorldX;
    const deltaY = info.worldY - this.startWorldY;

    for (const el of this.elementsToMove) {
      const original = this.originalPositions.get(el.id)!;
      el.posX = original.x + deltaX;
      el.posY = original.y + deltaY;
    }
    this.diagram.requestRender();
  }

  onPointerUp(info: DiagramPointerInfo, _event: PointerEvent): void {
    const deltaX = info.worldX - this.startWorldX;
    const deltaY = info.worldY - this.startWorldY;

    this.diagram.fireMoveComplete(this.elementsToMove, deltaX, deltaY);
    this.diagram.popMode();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.code === "Escape") {
      event.preventDefault();
      this.restoreOriginalPositions();
      this.diagram.popMode();
    }
  }

  onKeyUp(_event: KeyboardEvent): void {}

  onBlur(): void {
    this.restoreOriginalPositions();
    this.diagram.popMode();
  }

  private restoreOriginalPositions(): void {
    for (const el of this.elementsToMove) {
      const original = this.originalPositions.get(el.id);
      if (original) {
        el.posX = original.x;
        el.posY = original.y;
      }
    }
    this.diagram.requestRender();
  }
}
