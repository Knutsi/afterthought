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
      } else {
        this.diagram.requestSelectionSet([element]);
      }
      return;
    }

    this.diagram.pushMode(new DragSelectMode(this.diagram, info, event.ctrlKey));
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

  onDoubleClick(info: DiagramPointerInfo, _event: MouseEvent): void {
    if (!info.elementUnderPointer) {
      this.diagram.fireBackgroundDoubleClick(info.worldX, info.worldY);
    }
  }
}
