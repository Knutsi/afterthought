import type { IAction, UndoFunction } from "../../../service/ActionService";
import type { ServiceLayer } from "../../../service/ServiceLayer";
import type { IContext } from "../../../service/context/types";
import type { DiagramElement } from "../editor/diagram-core/types";
import { BoardActivity } from "../BoardActivity";
import {
  SELECTION_SET_ACTION_ID,
  SELECTION_ADD_ACTION_ID,
  SELECTION_REMOVE_ACTION_ID,
  BOARD_SELECTION_FEATURE,
} from "../types";

export interface PendingSelectionRequest {
  elements: DiagramElement[];
}

function updateSelectionContext(activity: BoardActivity, serviceLayer: ServiceLayer): void {
  const contextService = serviceLayer.getContextService();
  const boardUri = activity.getBoardUri();
  const syncAdapter = activity.getSyncAdapter();

  contextService.removeEntriesByFeature(BOARD_SELECTION_FEATURE);

  if (!syncAdapter || !boardUri) return;

  const selectedIds = activity.getDiagram()?.getSelectionManager().getSelection() ?? [];
  for (const elementId of selectedIds) {
    const taskUri = syncAdapter.getTaskUri(elementId);
    if (taskUri) {
      contextService.addEntry(taskUri, BOARD_SELECTION_FEATURE, boardUri);
    }
  }
}

export function createSelectionSetAction(serviceLayer: ServiceLayer): IAction {
  return {
    id: SELECTION_SET_ACTION_ID,
    name: "Set Selection",
    shortcut: "",
    menuGroup: "Edit",
    hideFromMenu: true,
    do: async (_context: IContext): Promise<UndoFunction | void> => {
      const activityService = serviceLayer.getActivityService();
      const activeActivity = activityService.getActiveActivity();
      if (!(activeActivity instanceof BoardActivity)) return;

      const pending = activeActivity.consumePendingSelectionRequest();
      if (!pending) return;

      const diagram = activeActivity.getDiagram();
      if (!diagram) return;

      const selectionManager = diagram.getSelectionManager();
      const previousSelection = selectionManager.getSelection();
      const newSelection = pending.elements.map(e => e.id);

      selectionManager.setSelection(newSelection);
      updateSelectionContext(activeActivity, serviceLayer);

      return async () => {
        selectionManager.setSelection(previousSelection);
        updateSelectionContext(activeActivity, serviceLayer);
      };
    },
    canDo: async (_context: IContext): Promise<boolean> => {
      const activeActivity = serviceLayer.getActivityService().getActiveActivity();
      return activeActivity instanceof BoardActivity;
    },
  };
}

export function createSelectionAddAction(serviceLayer: ServiceLayer): IAction {
  return {
    id: SELECTION_ADD_ACTION_ID,
    name: "Add to Selection",
    shortcut: "",
    menuGroup: "Edit",
    hideFromMenu: true,
    do: async (_context: IContext): Promise<UndoFunction | void> => {
      const activityService = serviceLayer.getActivityService();
      const activeActivity = activityService.getActiveActivity();
      if (!(activeActivity instanceof BoardActivity)) return;

      const pending = activeActivity.consumePendingSelectionRequest();
      if (!pending) return;

      const diagram = activeActivity.getDiagram();
      if (!diagram) return;

      const selectionManager = diagram.getSelectionManager();
      const previousSelection = selectionManager.getSelection();

      const newIds = pending.elements.map(e => e.id);
      const combined = new Set([...previousSelection, ...newIds]);
      selectionManager.setSelection([...combined]);
      updateSelectionContext(activeActivity, serviceLayer);

      return async () => {
        selectionManager.setSelection(previousSelection);
        updateSelectionContext(activeActivity, serviceLayer);
      };
    },
    canDo: async (_context: IContext): Promise<boolean> => {
      const activeActivity = serviceLayer.getActivityService().getActiveActivity();
      return activeActivity instanceof BoardActivity;
    },
  };
}

export function createSelectionRemoveAction(serviceLayer: ServiceLayer): IAction {
  return {
    id: SELECTION_REMOVE_ACTION_ID,
    name: "Remove from Selection",
    shortcut: "",
    menuGroup: "Edit",
    hideFromMenu: true,
    do: async (_context: IContext): Promise<UndoFunction | void> => {
      const activityService = serviceLayer.getActivityService();
      const activeActivity = activityService.getActiveActivity();
      if (!(activeActivity instanceof BoardActivity)) return;

      const pending = activeActivity.consumePendingSelectionRequest();
      if (!pending) return;

      const diagram = activeActivity.getDiagram();
      if (!diagram) return;

      const selectionManager = diagram.getSelectionManager();
      const previousSelection = selectionManager.getSelection();

      const toRemove = new Set(pending.elements.map(e => e.id));
      const remaining = previousSelection.filter(id => !toRemove.has(id));
      selectionManager.setSelection(remaining);
      updateSelectionContext(activeActivity, serviceLayer);

      return async () => {
        selectionManager.setSelection(previousSelection);
        updateSelectionContext(activeActivity, serviceLayer);
      };
    },
    canDo: async (_context: IContext): Promise<boolean> => {
      const activeActivity = serviceLayer.getActivityService().getActiveActivity();
      return activeActivity instanceof BoardActivity;
    },
  };
}
