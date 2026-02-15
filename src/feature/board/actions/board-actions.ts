import type { IAction, UndoFunction, RedoFunction } from "../../../service/ActionService";
import type { ServiceLayer } from "../../../service/ServiceLayer";
import type { IContext } from "../../../service/context/types";
import { URI_SCHEMES, parseUri } from "../../../core-model/uri";
import { showTextPrompt } from "../../../gui/prompt/showTextPrompt";
import { CREATE_BOARD_ACTION_ID, OPEN_BOARD_ACTION_ID, RENAME_BOARD_ACTION_ID, BOARD_SERVICE_NAME } from "../types";
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

export function createRenameBoardAction(serviceLayer: ServiceLayer): IAction {
  return {
    id: RENAME_BOARD_ACTION_ID,
    name: "Rename Board...",
    shortcuts: ["F2"],
    menuGroup: "Board",
    menuSubGroup: "edit",
    do: async (context: IContext, _args?: Record<string, unknown>): Promise<UndoFunction | void> => {
      const boardEntries = context.getEntriesByScheme(URI_SCHEMES.BOARD);
      if (boardEntries.length === 0) return;

      const boardUri = boardEntries[0].uri;
      const parsed = parseUri(boardUri);
      if (!parsed) return;
      const boardId = parsed.id;

      const boardService = serviceLayer.getFeatureService<BoardService>(BOARD_SERVICE_NAME);
      const boardData = await boardService.getBoardData(boardId);
      if (!boardData) return;

      const currentName = boardData.name;
      const newName = await showTextPrompt(serviceLayer, {
        title: "Rename Board",
        defaultValue: currentName,
      });

      if (newName == null || newName === currentName) return;

      const oldName = await boardService.renameBoard(boardId, newName);

      return async (): Promise<RedoFunction | void> => {
        await boardService.renameBoard(boardId, oldName);
        return async (): Promise<UndoFunction | void> => {
          await boardService.renameBoard(boardId, newName);
        };
      };
    },
    canDo: async (context: IContext): Promise<boolean> => {
      return context.hasScheme(URI_SCHEMES.BOARD);
    },
  };
}
