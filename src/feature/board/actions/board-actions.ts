import type { IAction, UndoFunction, RedoFunction } from "../../../service/ActionService";
import type { ServiceLayer } from "../../../service/ServiceLayer";
import type { IContext } from "../../../service/context/types";
import { CREATE_BOARD_ACTION_ID, OPEN_BOARD_ACTION_ID, BOARD_SERVICE_NAME } from "../types";
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
      const { boardId, activityId } = await boardService.createBoardWithActivity();

      const makeUndoFn = (bId: string, aId: string): UndoFunction => {
        return async (): Promise<RedoFunction | void> => {
          await boardService.deleteBoardAndCloseActivity(bId, aId);
          return async (): Promise<UndoFunction | void> => {
            const result = await boardService.createBoardWithActivity();
            return makeUndoFn(result.boardId, result.activityId);
          };
        };
      };

      return makeUndoFn(boardId, activityId);
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
      await boardService.openBoardPicker();
    },
    canDo: async () => true,
  };
}
