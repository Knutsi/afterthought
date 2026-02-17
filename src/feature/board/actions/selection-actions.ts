import type { IAction, UndoFunction, RedoFunction } from "../../../service/ActionService";
import type { ServiceLayer } from "../../../service/ServiceLayer";
import type { IContext } from "../../../service/context/types";
import type { Uri } from "../../../core-model/uri";
import { URI_SCHEMES } from "../../../core-model/uri";
import type { Diagram } from "../editor/diagram-core/Diagram";
import type { BoardService } from "../BoardService";
import { SELECT_ALL_ACTION_ID, SELECT_NONE_ACTION_ID, BOARD_SERVICE_NAME, BOARD_SELECTION_SERVICE_NAME } from "../types";
import type { BoardSelectionService, SelectionSnapshot } from "../service/BoardSelectionService";

function makeSelectionUndoFn(
  selectionService: BoardSelectionService,
  boardUri: Uri,
  diagram: Diagram,
  prev: SelectionSnapshot,
  cur: SelectionSnapshot,
): UndoFunction {
  return async (): Promise<RedoFunction | void> => {
    selectionService.restoreSelection(boardUri, diagram, prev);
    return async (): Promise<UndoFunction | void> => {
      selectionService.restoreSelection(boardUri, diagram, cur);
      return makeSelectionUndoFn(selectionService, boardUri, diagram, prev, cur);
    };
  };
}

export function createSelectAllAction(serviceLayer: ServiceLayer): IAction {
  return {
    id: SELECT_ALL_ACTION_ID,
    name: "Select All",
    shortcuts: ["Mod+A"],
    menuGroup: "Edit",
    menuSubGroup: "selection",
    do: async (context: IContext, _args?: Record<string, unknown>): Promise<UndoFunction | void> => {
      const boardEntries = context.getEntriesByScheme(URI_SCHEMES.BOARD);
      if (boardEntries.length === 0) return;
      const boardUri = boardEntries[0].uri;

      const boardService = serviceLayer.getFeatureService<BoardService>(BOARD_SERVICE_NAME);
      const diagram = boardService.getDiagram(boardUri);
      if (!diagram) return;

      const selectionService = serviceLayer.getFeatureService<BoardSelectionService>(BOARD_SELECTION_SERVICE_NAME);
      const { previous, current } = selectionService.selectAll(boardUri, diagram);

      return makeSelectionUndoFn(selectionService, boardUri, diagram, previous, current);
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
    shortcuts: ["Escape", "Mod+Shift+A"],
    menuGroup: "Edit",
    menuSubGroup: "selection",
    do: async (context: IContext, _args?: Record<string, unknown>): Promise<UndoFunction | void> => {
      const boardEntries = context.getEntriesByScheme(URI_SCHEMES.BOARD);
      if (boardEntries.length === 0) return;
      const boardUri = boardEntries[0].uri;

      const boardService = serviceLayer.getFeatureService<BoardService>(BOARD_SERVICE_NAME);
      const diagram = boardService.getDiagram(boardUri);
      if (!diagram) return;

      const selectionService = serviceLayer.getFeatureService<BoardSelectionService>(BOARD_SELECTION_SERVICE_NAME);
      const { previous } = selectionService.selectNone(boardUri, diagram);
      const empty: SelectionSnapshot = { ids: [], taskUris: [] };

      return makeSelectionUndoFn(selectionService, boardUri, diagram, previous, empty);
    },
    canDo: async (context: IContext): Promise<boolean> => {
      return context.getEntriesByScheme(URI_SCHEMES.SELECTED).length > 0;
    },
  };
}
