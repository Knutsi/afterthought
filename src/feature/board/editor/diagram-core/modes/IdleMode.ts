import { IDiagramMode, IDiagram, DiagramPointerInfo } from "./types";
import type { DiagramElement } from "../types";
import { PanMode } from "./PanMode";
import { DragSelectMode } from "./DragSelectMode";
import { MoveMode } from "./MoveMode";
import { MOUSE_BUTTON_PRIMARY } from "../managers/InputManager";

const DRAG_THRESHOLD = 3;
const ZOOM_IN_FACTOR = 1.1;
const ZOOM_OUT_FACTOR = 0.9;
const ZOOM_MIN = 0.1;
const ZOOM_MAX = 5.0;

export class IdleMode implements IDiagramMode {
  readonly name: string = "idle";
  protected diagram: IDiagram;
  private pendingDrag: {
    elements: DiagramElement[];
    startInfo: DiagramPointerInfo;
  } | null = null;

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
    if (event.button !== MOUSE_BUTTON_PRIMARY) return;

    const element = info.elementUnderPointer;

    if (element && element.isSelectable) {
      const selectionManager = this.diagram.getSelectionManager();
      const isSelected = selectionManager.isSelected(element.id);
      const hasSelection = selectionManager.getSelection().length > 0;

      if (event.ctrlKey && hasSelection) {
        if (isSelected) {
          this.diagram.requestSelectionRemove([element]);
        } else {
          this.diagram.requestSelectionAdd([element]);
        }
      } else if (!isSelected) {
        this.diagram.requestSelectionSet([element]);
      }
      // if already selected without ctrl, keep selection for potential group move

      // set up pending drag with current selection
      const selectedIds = selectionManager.getSelection();
      const stageManager = this.diagram.getStageManager();
      const elements = stageManager.getAllElements()
        .filter(e => selectedIds.includes(e.id));
      this.pendingDrag = { elements, startInfo: info };
      return;
    }

    this.diagram.pushMode(new DragSelectMode(this.diagram, info, event.ctrlKey));
  }

  onPointerMove(info: DiagramPointerInfo, _event: PointerEvent): void {
    if (!this.pendingDrag) return;

    const dx = info.worldX - this.pendingDrag.startInfo.worldX;
    const dy = info.worldY - this.pendingDrag.startInfo.worldY;

    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
      this.diagram.pushMode(new MoveMode(
        this.diagram,
        this.pendingDrag.elements,
        this.pendingDrag.startInfo
      ));
      this.pendingDrag = null;
    }
  }

  onPointerUp(_info: DiagramPointerInfo, _event: PointerEvent): void {
    this.pendingDrag = null;
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

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    if (event.ctrlKey) {
      const currentZoom = this.diagram.getZoom();
      const factor = event.deltaY > 0 ? ZOOM_OUT_FACTOR : ZOOM_IN_FACTOR;
      const newZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, currentZoom * factor));
      this.diagram.setZoomAtPoint(newZoom, event.clientX, event.clientY);
    } else {
      this.diagram.panByCanvas(-event.deltaX, -event.deltaY);
    }
  }

  onDoubleClick(info: DiagramPointerInfo, _event: MouseEvent): void {
    if (info.elementUnderPointer) {
      this.diagram.fireElementDoubleClick(info.elementUnderPointer);
    } else {
      this.diagram.fireBackgroundDoubleClick(info.worldX, info.worldY);
    }
  }
}
