import type { Uri } from "../../../core-model/uri";
import type { Diagram } from "../editor/diagram-core/Diagram";
import type { DiagramElement } from "../editor/diagram-core/types";
import { TaskElement } from "../editor/diagram-board/elements/TaskElement";
import type { BoardService } from "../BoardService";

export interface SelectionSnapshot {
  ids: string[];
  taskUris: Uri[];
}

export class BoardSelectionService {
  private boardService: BoardService;

  constructor(boardService: BoardService) {
    this.boardService = boardService;
  }

  selectAll(boardUri: Uri, diagram: Diagram): { previous: SelectionSnapshot; current: SelectionSnapshot } {
    const selectionManager = diagram.getSelectionManager();
    const stageManager = diagram.getStageManager();

    const previous = this.captureSnapshot(selectionManager.getSelection(), stageManager);
    selectionManager.selectAll();
    const current = this.captureSnapshot(selectionManager.getSelection(), stageManager);

    this.boardService.updateSelectionContext(boardUri, current.taskUris);
    return { previous, current };
  }

  selectNone(boardUri: Uri, diagram: Diagram): { previous: SelectionSnapshot } {
    const selectionManager = diagram.getSelectionManager();
    const stageManager = diagram.getStageManager();

    const previous = this.captureSnapshot(selectionManager.getSelection(), stageManager);
    selectionManager.selectNone();
    this.boardService.updateSelectionContext(boardUri, []);

    return { previous };
  }

  setSelection(boardUri: Uri, diagram: Diagram, elements: DiagramElement[]): { previous: SelectionSnapshot; current: SelectionSnapshot } {
    const selectionManager = diagram.getSelectionManager();
    const stageManager = diagram.getStageManager();

    const previous = this.captureSnapshot(selectionManager.getSelection(), stageManager);

    const newIds = elements.map(e => e.id);
    const newTaskUris = this.getTaskUrisFromElements(elements);

    selectionManager.setSelection(newIds);
    this.boardService.updateSelectionContext(boardUri, newTaskUris);

    return { previous, current: { ids: newIds, taskUris: newTaskUris } };
  }

  addToSelection(boardUri: Uri, diagram: Diagram, elements: DiagramElement[]): { previous: SelectionSnapshot; current: SelectionSnapshot } {
    const selectionManager = diagram.getSelectionManager();
    const stageManager = diagram.getStageManager();

    const previous = this.captureSnapshot(selectionManager.getSelection(), stageManager);

    const newIds = elements.map(e => e.id);
    const combined = new Set([...previous.ids, ...newIds]);
    const combinedIds = [...combined];

    const combinedElements = this.getElementsFromIds(stageManager, combinedIds);
    const combinedTaskUris = this.getTaskUrisFromElements(combinedElements);

    selectionManager.setSelection(combinedIds);
    this.boardService.updateSelectionContext(boardUri, combinedTaskUris);

    return { previous, current: { ids: combinedIds, taskUris: combinedTaskUris } };
  }

  removeFromSelection(boardUri: Uri, diagram: Diagram, elements: DiagramElement[]): { previous: SelectionSnapshot; current: SelectionSnapshot } {
    const selectionManager = diagram.getSelectionManager();
    const stageManager = diagram.getStageManager();

    const previous = this.captureSnapshot(selectionManager.getSelection(), stageManager);

    const toRemove = new Set(elements.map(e => e.id));
    const remainingIds = previous.ids.filter(id => !toRemove.has(id));

    const remainingElements = this.getElementsFromIds(stageManager, remainingIds);
    const remainingTaskUris = this.getTaskUrisFromElements(remainingElements);

    selectionManager.setSelection(remainingIds);
    this.boardService.updateSelectionContext(boardUri, remainingTaskUris);

    return { previous, current: { ids: remainingIds, taskUris: remainingTaskUris } };
  }

  restoreSelection(boardUri: Uri, diagram: Diagram, snapshot: SelectionSnapshot): void {
    const selectionManager = diagram.getSelectionManager();
    selectionManager.setSelection(snapshot.ids);
    this.boardService.updateSelectionContext(boardUri, snapshot.taskUris);
  }

  private captureSnapshot(ids: string[], stageManager: { getAllElements(): DiagramElement[] }): SelectionSnapshot {
    const elements = this.getElementsFromIds(stageManager, ids);
    return { ids, taskUris: this.getTaskUrisFromElements(elements) };
  }

  private getTaskUrisFromElements(elements: DiagramElement[]): Uri[] {
    return elements
      .filter((e): e is TaskElement => e instanceof TaskElement && e.taskUri !== null)
      .map(e => e.taskUri!);
  }

  private getElementsFromIds(stageManager: { getAllElements(): DiagramElement[] }, ids: string[]): DiagramElement[] {
    const allElements = stageManager.getAllElements();
    const idSet = new Set(ids);
    return allElements.filter(e => idSet.has(e.id));
  }
}
