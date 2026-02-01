import { IdleMode } from "../../diagram-core/modes/IdleMode";
import { DiagramPointerInfo, IDiagram } from "../../diagram-core/types";

export type OnTaskCreateCallback = (worldX: number, worldY: number) => void;

export class BoardIdleMode extends IdleMode {
  override readonly name = "board-idle";
  private onTaskCreate: OnTaskCreateCallback | null;

  constructor(diagram: IDiagram, onTaskCreate?: OnTaskCreateCallback) {
    super(diagram);
    this.onTaskCreate = onTaskCreate ?? null;
  }

  onDoubleClick(info: DiagramPointerInfo, _event: MouseEvent): void {
    if (this.onTaskCreate) {
      this.onTaskCreate(info.worldX, info.worldY);
    }
  }
}
