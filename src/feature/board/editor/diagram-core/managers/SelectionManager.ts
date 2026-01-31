import type { IDiagram, SelectionChangeCallback } from "../types";

export class SelectionManager {
  private selectedIds: Set<string> = new Set();

  constructor(
    private diagram: IDiagram,
    private onSelectionChange?: SelectionChangeCallback
  ) {}

  isSelected(elementId: string): boolean {
    return this.selectedIds.has(elementId);
  }

  getSelection(): string[] {
    return [...this.selectedIds];
  }

  setSelection(elementIds: string[]): void {
    this.selectedIds = new Set(elementIds);
    this.diagram.requestRender();
    this.onSelectionChange?.(this.getSelection());
  }

  selectAll(): void {
    const stageManager = this.diagram.getStageManager();
    const allElements = stageManager.getAllElements();
    const selectableIds = allElements
      .filter(el => el.isSelectable)
      .map(el => el.id);
    this.setSelection(selectableIds);
  }

  selectNone(): void {
    this.setSelection([]);
  }
}
