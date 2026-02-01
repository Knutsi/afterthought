import type { IAction, UndoFunction } from "../../../service/ActionService";
import type { ServiceLayer } from "../../../service/ServiceLayer";
import type { IContext } from "../../../service/context/types";
import {
  BOARD_ACTIVITY_TAG,
  CREATE_BOARD_ACTION_ID,
  OPEN_BOARD_ACTION_ID,
  IBoardActivityParams,
  BOARD_SERVICE_NAME,
} from "../types";
import type { BoardService } from "../BoardService";

export function createNewBoardAction(serviceLayer: ServiceLayer): IAction {
  return {
    id: CREATE_BOARD_ACTION_ID,
    name: "New Board",
    shortcut: "Ctrl+N B",
    menuGroup: "File",
    menuSubGroup: "create",
    do: async (_context: IContext, _args?: Record<string, unknown>): Promise<UndoFunction | void> => {
      const boardService = serviceLayer.getFeatureService<BoardService>(BOARD_SERVICE_NAME);
      const activityService = serviceLayer.getActivityService();

      const board = await boardService.newBoard();
      const activityArgs: IBoardActivityParams = { openBoardId: board.id, name: board.data.name };
      const activity = activityService.startActivity<IBoardActivityParams>(BOARD_ACTIVITY_TAG, activityArgs);
      activityService.switchToActivity(activity.id);
    },
    canDo: async () => true,
  };
}

export function createOpenBoardAction(serviceLayer: ServiceLayer): IAction {
  return {
    id: OPEN_BOARD_ACTION_ID,
    name: "Open Board",
    shortcut: "Ctrl+O B",
    menuGroup: "File",
    menuSubGroup: "open",
    do: async (_context: IContext, _args?: Record<string, unknown>): Promise<UndoFunction | void> => {
      const boardService = serviceLayer.getFeatureService<BoardService>(BOARD_SERVICE_NAME);
      const activityService = serviceLayer.getActivityService();

      const board = await boardService.newBoard();
      const activityArgs: IBoardActivityParams = { openBoardId: board.id, name: board.data.name };
      const activity = activityService.startActivity<IBoardActivityParams>(BOARD_ACTIVITY_TAG, activityArgs);
      activityService.switchToActivity(activity.id);
    },
    canDo: async () => true,
  };
}
