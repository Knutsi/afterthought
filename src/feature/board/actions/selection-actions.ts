import type { IAction, UndoFunction } from "../../../service/ActionService";
import type { ServiceLayer } from "../../../service/ServiceLayer";
import type { IContext } from "../../../service/context/types";
import { SELECT_ALL_ACTION_ID, SELECT_NONE_ACTION_ID } from "../types";
import { BoardActivity } from "../BoardActivity";

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

      return async () => {
        selectionManager.setSelection(previousSelection);
      };
    },
    canDo: async (_context: IContext): Promise<boolean> => {
      const activityService = serviceLayer.getActivityService();
      const activeActivity = activityService.getActiveActivity();
      return activeActivity instanceof BoardActivity;
    },
  };
}

export function createSelectNoneAction(serviceLayer: ServiceLayer): IAction {
  return {
    id: SELECT_NONE_ACTION_ID,
    name: "Select None",
    shortcuts: ["Escape"],
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

      return async () => {
        selectionManager.setSelection(previousSelection);
      };
    },
    canDo: async (_context: IContext): Promise<boolean> => {
      const activityService = serviceLayer.getActivityService();
      const activeActivity = activityService.getActiveActivity();
      return activeActivity instanceof BoardActivity;
    },
  };
}
