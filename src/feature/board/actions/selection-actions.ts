import type { IAction, UndoFunction, RedoFunction } from "../../../service/ActionService";
import type { ServiceLayer } from "../../../service/ServiceLayer";
import type { IContext } from "../../../service/context/types";
import { URI_SCHEMES } from "../../../core-model/uri";
import { SELECT_ALL_ACTION_ID, SELECT_NONE_ACTION_ID, BOARD_SERVICE_NAME } from "../types";
import { BoardActivity } from "../BoardActivity";
import { BoardService } from "../BoardService";
import { getTaskUrisFromElements, getElementsFromIds } from "./selection-request-actions";

export function createSelectAllAction(serviceLayer: ServiceLayer): IAction {
  return {
    id: SELECT_ALL_ACTION_ID,
    name: "Select All",
    shortcuts: ["Ctrl+A"],
    menuGroup: "Edit",
    menuSubGroup: "selection",
    do: async (_context: IContext, _args?: Record<string, unknown>): Promise<UndoFunction | void> => {
      const activityService = serviceLayer.getActivityService();
      const activeActivity = activityService.getActiveActivity();

      if (!(activeActivity instanceof BoardActivity)) {
        return;
      }

      const diagram = activeActivity.getDiagram();
      const boardUri = activeActivity.getBoardUri();
      if (!diagram || !boardUri) return;

      const boardService = serviceLayer.getFeatureService<BoardService>(BOARD_SERVICE_NAME);
      const selectionManager = diagram.getSelectionManager();
      const stageManager = diagram.getStageManager();

      const previousSelection = selectionManager.getSelection();
      const previousElements = getElementsFromIds(stageManager, previousSelection);
      const previousTaskUris = getTaskUrisFromElements(previousElements);

      selectionManager.selectAll();

      const currentSelection = selectionManager.getSelection();
      const currentElements = getElementsFromIds(stageManager, currentSelection);
      const currentTaskUris = getTaskUrisFromElements(currentElements);
      boardService.updateSelectionContext(boardUri, currentTaskUris);

      const makeUndoFn = (prevSelection: string[], prevUris: typeof previousTaskUris, curSelection: string[], curUris: typeof currentTaskUris): UndoFunction => {
        return async (): Promise<RedoFunction | void> => {
          selectionManager.setSelection(prevSelection);
          boardService.updateSelectionContext(boardUri, prevUris);

          return async (): Promise<UndoFunction | void> => {
            selectionManager.setSelection(curSelection);
            boardService.updateSelectionContext(boardUri, curUris);
            return makeUndoFn(prevSelection, prevUris, curSelection, curUris);
          };
        };
      };

      return makeUndoFn(previousSelection, previousTaskUris, currentSelection, currentTaskUris);
    },
    canDo: async (context: IContext): Promise<boolean> => {
      const taskCount = context.getEntriesByScheme(URI_SCHEMES.TASK).length;
      const selectedCount = context.getEntriesByScheme(URI_SCHEMES.SELECTED).length;
      return taskCount > selectedCount;
    },
  };
}

export function createSelectNoneAction(serviceLayer: ServiceLayer): IAction {
  return {
    id: SELECT_NONE_ACTION_ID,
    name: "Select None",
    shortcuts: ["Escape", "Ctrl+Shift+A"],
    menuGroup: "Edit",
    menuSubGroup: "selection",
    do: async (_context: IContext, _args?: Record<string, unknown>): Promise<UndoFunction | void> => {
      const activityService = serviceLayer.getActivityService();
      const activeActivity = activityService.getActiveActivity();

      if (!(activeActivity instanceof BoardActivity)) {
        return;
      }

      const diagram = activeActivity.getDiagram();
      const boardUri = activeActivity.getBoardUri();
      if (!diagram || !boardUri) return;

      const boardService = serviceLayer.getFeatureService<BoardService>(BOARD_SERVICE_NAME);
      const selectionManager = diagram.getSelectionManager();
      const stageManager = diagram.getStageManager();

      const previousSelection = selectionManager.getSelection();
      const previousElements = getElementsFromIds(stageManager, previousSelection);
      const previousTaskUris = getTaskUrisFromElements(previousElements);

      selectionManager.selectNone();
      boardService.updateSelectionContext(boardUri, []);

      const makeUndoFn = (prevSelection: string[], prevUris: typeof previousTaskUris): UndoFunction => {
        return async (): Promise<RedoFunction | void> => {
          selectionManager.setSelection(prevSelection);
          boardService.updateSelectionContext(boardUri, prevUris);

          return async (): Promise<UndoFunction | void> => {
            const undoSelection = selectionManager.getSelection();
            const undoElements = getElementsFromIds(stageManager, undoSelection);
            const undoUris = getTaskUrisFromElements(undoElements);
            selectionManager.selectNone();
            boardService.updateSelectionContext(boardUri, []);
            return makeUndoFn(undoSelection, undoUris);
          };
        };
      };

      return makeUndoFn(previousSelection, previousTaskUris);
    },
    canDo: async (context: IContext): Promise<boolean> => {
      return context.getEntriesByScheme(URI_SCHEMES.SELECTED).length > 0;
    },
  };
}
