import type { IAction, UndoFunction, RedoFunction } from "../../../service/ActionService";
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
    shortcuts: ["Mod+N B"],
    menuGroup: "File",
    menuSubGroup: "create",
    do: async (_context: IContext, _args?: Record<string, unknown>): Promise<UndoFunction | void> => {
      const boardService = serviceLayer.getFeatureService<BoardService>(BOARD_SERVICE_NAME);
      const activityService = serviceLayer.getActivityService();

      const board = await boardService.newBoard();
      const activityArgs: IBoardActivityParams = { openBoardId: board.id, name: board.data.name };
      const activity = activityService.startActivity<IBoardActivityParams>(BOARD_ACTIVITY_TAG, activityArgs);
      activityService.switchToActivity(activity.id);

      const makeUndoFn = (boardId: string, activityId: string): UndoFunction => {
        return async (): Promise<RedoFunction | void> => {
          activityService.closeActivity(activityId);
          await boardService.deleteBoard(boardId);

          return async (): Promise<UndoFunction | void> => {
            const newBoard = await boardService.newBoard();
            const newArgs: IBoardActivityParams = { openBoardId: newBoard.id, name: newBoard.data.name };
            const newActivity = activityService.startActivity<IBoardActivityParams>(BOARD_ACTIVITY_TAG, newArgs);
            activityService.switchToActivity(newActivity.id);
            return makeUndoFn(newBoard.id, newActivity.id);
          };
        };
      };

      return makeUndoFn(board.id, activity.id);
    },
    canDo: async () => true,
  };
}

export function createOpenBoardAction(serviceLayer: ServiceLayer): IAction {
  return {
    id: OPEN_BOARD_ACTION_ID,
    name: "Open Board...",
    shortcuts: ["Mod+O B"],
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
