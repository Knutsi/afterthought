import type { IAction, UndoFunction } from "../../../service/ActionService";
import type { ServiceLayer } from "../../../service/ServiceLayer";
import type { IContext } from "../../../service/context/types";
import type { Uri } from "../../../core-model/uri";
import type { DiagramElement } from "../editor/diagram-core/types";
import type { SelectionManager } from "../editor/diagram-core/managers/SelectionManager";
import type { StageManager } from "../editor/diagram-core/managers/StageManager";
import { TaskElement } from "../editor/diagram-board/elements/TaskElement";
import { BoardService } from "../BoardService";
import {
  SELECTION_SET_ACTION_ID,
  SELECTION_ADD_ACTION_ID,
  SELECTION_REMOVE_ACTION_ID,
  BOARD_SERVICE_NAME,
} from "../types";

function getTaskUrisFromElements(elements: DiagramElement[]): Uri[] {
  return elements
    .filter((e): e is TaskElement => e instanceof TaskElement && e.taskUri !== null)
    .map(e => e.taskUri!);
}

function getElementsFromIds(stageManager: StageManager, ids: string[]): DiagramElement[] {
  const allElements = stageManager.getAllElements();
  const idSet = new Set(ids);
  return allElements.filter(e => idSet.has(e.id));
}

export function createSelectionSetAction(serviceLayer: ServiceLayer): IAction {
  return {
    id: SELECTION_SET_ACTION_ID,
    name: "Set Selection",
    shortcuts: [],
    menuGroup: "Edit",
    hideFromMenu: true,
    do: async (_context: IContext, args?: Record<string, unknown>): Promise<UndoFunction | void> => {
      const elements = args?.elements as DiagramElement[] | undefined;
      const selectionManager = args?.selectionManager as SelectionManager | undefined;
      const stageManager = args?.stageManager as StageManager | undefined;
      const boardUri = args?.boardUri as Uri | undefined;

      if (!elements || !selectionManager || !stageManager || !boardUri) return;

      const boardService = serviceLayer.getFeatureService<BoardService>(BOARD_SERVICE_NAME);

      const previousSelection = selectionManager.getSelection();
      const previousElements = getElementsFromIds(stageManager, previousSelection);
      const previousTaskUris = getTaskUrisFromElements(previousElements);

      const newSelection = elements.map(e => e.id);
      const newTaskUris = getTaskUrisFromElements(elements);

      selectionManager.setSelection(newSelection);
      boardService.updateSelectionContext(boardUri, newTaskUris);

      return async () => {
        selectionManager.setSelection(previousSelection);
        boardService.updateSelectionContext(boardUri, previousTaskUris);
      };
    },
    canDo: async () => true,
  };
}

export function createSelectionAddAction(serviceLayer: ServiceLayer): IAction {
  return {
    id: SELECTION_ADD_ACTION_ID,
    name: "Add to Selection",
    shortcuts: [],
    menuGroup: "Edit",
    hideFromMenu: true,
    do: async (_context: IContext, args?: Record<string, unknown>): Promise<UndoFunction | void> => {
      const elements = args?.elements as DiagramElement[] | undefined;
      const selectionManager = args?.selectionManager as SelectionManager | undefined;
      const stageManager = args?.stageManager as StageManager | undefined;
      const boardUri = args?.boardUri as Uri | undefined;

      if (!elements || !selectionManager || !stageManager || !boardUri) return;

      const boardService = serviceLayer.getFeatureService<BoardService>(BOARD_SERVICE_NAME);

      const previousSelection = selectionManager.getSelection();
      const previousElements = getElementsFromIds(stageManager, previousSelection);
      const previousTaskUris = getTaskUrisFromElements(previousElements);

      const newIds = elements.map(e => e.id);
      const combined = new Set([...previousSelection, ...newIds]);
      const combinedSelection = [...combined];

      const combinedElements = getElementsFromIds(stageManager, combinedSelection);
      const combinedTaskUris = getTaskUrisFromElements(combinedElements);

      selectionManager.setSelection(combinedSelection);
      boardService.updateSelectionContext(boardUri, combinedTaskUris);

      return async () => {
        selectionManager.setSelection(previousSelection);
        boardService.updateSelectionContext(boardUri, previousTaskUris);
      };
    },
    canDo: async () => true,
  };
}

export function createSelectionRemoveAction(serviceLayer: ServiceLayer): IAction {
  return {
    id: SELECTION_REMOVE_ACTION_ID,
    name: "Remove from Selection",
    shortcuts: [],
    menuGroup: "Edit",
    hideFromMenu: true,
    do: async (_context: IContext, args?: Record<string, unknown>): Promise<UndoFunction | void> => {
      const elements = args?.elements as DiagramElement[] | undefined;
      const selectionManager = args?.selectionManager as SelectionManager | undefined;
      const stageManager = args?.stageManager as StageManager | undefined;
      const boardUri = args?.boardUri as Uri | undefined;

      if (!elements || !selectionManager || !stageManager || !boardUri) return;

      const boardService = serviceLayer.getFeatureService<BoardService>(BOARD_SERVICE_NAME);

      const previousSelection = selectionManager.getSelection();
      const previousElements = getElementsFromIds(stageManager, previousSelection);
      const previousTaskUris = getTaskUrisFromElements(previousElements);

      const toRemove = new Set(elements.map(e => e.id));
      const remainingSelection = previousSelection.filter(id => !toRemove.has(id));

      const remainingElements = getElementsFromIds(stageManager, remainingSelection);
      const remainingTaskUris = getTaskUrisFromElements(remainingElements);

      selectionManager.setSelection(remainingSelection);
      boardService.updateSelectionContext(boardUri, remainingTaskUris);

      return async () => {
        selectionManager.setSelection(previousSelection);
        boardService.updateSelectionContext(boardUri, previousTaskUris);
      };
    },
    canDo: async () => true,
  };
}
