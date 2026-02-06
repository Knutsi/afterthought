import type { IAction, UndoFunction, RedoFunction } from "../../../service/ActionService";
import type { ServiceLayer } from "../../../service/ServiceLayer";
import type { IContext } from "../../../service/context/types";
import { SELECT_ALL_ACTION_ID, SELECT_NONE_ACTION_ID } from "../types";
import { BoardActivity } from "../BoardActivity";

function makeBoardCanDoFn(serviceLayer: ServiceLayer): (context: IContext) => Promise<boolean> {
  return async (_context: IContext): Promise<boolean> => {
    const activityService = serviceLayer.getActivityService();
    const activeActivity = activityService.getActiveActivity();
    return activeActivity instanceof BoardActivity;
  };
}

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
      if (!diagram) return;

      const selectionManager = diagram.getSelectionManager();
      const previousSelection = selectionManager.getSelection();

      selectionManager.selectAll();

      const makeUndoFn = (prevSelection: string[]): UndoFunction => {
        return async (): Promise<RedoFunction | void> => {
          selectionManager.setSelection(prevSelection);

          return async (): Promise<UndoFunction | void> => {
            const undoSelection = selectionManager.getSelection();
            selectionManager.selectAll();
            return makeUndoFn(undoSelection);
          };
        };
      };

      return makeUndoFn(previousSelection);
    },
    canDo: makeBoardCanDoFn(serviceLayer),
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
      if (!diagram) return;

      const selectionManager = diagram.getSelectionManager();
      const previousSelection = selectionManager.getSelection();

      selectionManager.selectNone();

      const makeUndoFn = (prevSelection: string[]): UndoFunction => {
        return async (): Promise<RedoFunction | void> => {
          selectionManager.setSelection(prevSelection);

          return async (): Promise<UndoFunction | void> => {
            const undoSelection = selectionManager.getSelection();
            selectionManager.selectNone();
            return makeUndoFn(undoSelection);
          };
        };
      };

      return makeUndoFn(previousSelection);
    },
    canDo: makeBoardCanDoFn(serviceLayer),
  };
}
