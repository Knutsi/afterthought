import type { IAction, UndoFunction, RedoFunction } from "../../../service/ActionService";
import type { ServiceLayer } from "../../../service/ServiceLayer";
import type { IContext } from "../../../service/context/types";
import type { Uri } from "../../../core-model/uri";
import type { Diagram } from "../editor/diagram-core/Diagram";
import type { BoardSelectionService, SelectionSnapshot } from "../service/BoardSelectionService";
import {
  SELECTION_SET_ACTION_ID,
  SELECTION_ADD_ACTION_ID,
  SELECTION_REMOVE_ACTION_ID,
  BOARD_SELECTION_SERVICE_NAME,
  type SelectionRequestArgs,
} from "../types";

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

export function createSelectionSetAction(serviceLayer: ServiceLayer): IAction {
  return {
    id: SELECTION_SET_ACTION_ID,
    name: "Set Selection",
    shortcuts: [],
    menuGroup: "Edit",
    hideFromMenu: true,
    repeatable: false,
    do: async (_context: IContext, args?: Record<string, unknown>): Promise<UndoFunction | void> => {
      const typedArgs = args as SelectionRequestArgs | undefined;
      if (!typedArgs) return;
      const { elements, boardUri, diagram } = typedArgs;

      const selectionService = serviceLayer.getFeatureService<BoardSelectionService>(BOARD_SELECTION_SERVICE_NAME);
      const { previous, current } = selectionService.setSelection(boardUri, diagram, elements);

      return makeSelectionUndoFn(selectionService, boardUri, diagram, previous, current);
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
    repeatable: false,
    do: async (_context: IContext, args?: Record<string, unknown>): Promise<UndoFunction | void> => {
      const typedArgs = args as SelectionRequestArgs | undefined;
      if (!typedArgs) return;
      const { elements, boardUri, diagram } = typedArgs;

      const selectionService = serviceLayer.getFeatureService<BoardSelectionService>(BOARD_SELECTION_SERVICE_NAME);
      const { previous, current } = selectionService.addToSelection(boardUri, diagram, elements);

      return makeSelectionUndoFn(selectionService, boardUri, diagram, previous, current);
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
    repeatable: false,
    do: async (_context: IContext, args?: Record<string, unknown>): Promise<UndoFunction | void> => {
      const typedArgs = args as SelectionRequestArgs | undefined;
      if (!typedArgs) return;
      const { elements, boardUri, diagram } = typedArgs;

      const selectionService = serviceLayer.getFeatureService<BoardSelectionService>(BOARD_SELECTION_SERVICE_NAME);
      const { previous, current } = selectionService.removeFromSelection(boardUri, diagram, elements);

      return makeSelectionUndoFn(selectionService, boardUri, diagram, previous, current);
    },
    canDo: async () => true,
  };
}
