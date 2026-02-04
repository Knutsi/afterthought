import type { IAction, UndoFunction } from "../../../service/ActionService";
import type { ServiceLayer } from "../../../service/ServiceLayer";
import type { IContext } from "../../../service/context/types";
import { URI_SCHEMES } from "../../../core-model/uri";
import { CREATE_TASK_ON_BOARD_ACTION_ID, BOARD_SERVICE_NAME } from "../types";
import type { BoardService } from "../BoardService";

export function createNewTaskAction(serviceLayer: ServiceLayer): IAction {
  return {
    id: CREATE_TASK_ON_BOARD_ACTION_ID,
    name: "New task on board",
    shortcuts: ["Ctrl+N T"],
    menuGroup: "Board",
    menuSubGroup: "create",
    do: async (context: IContext, _args?: Record<string, unknown>): Promise<UndoFunction | void> => {
      const boardEntries = context.getEntriesByScheme(URI_SCHEMES.BOARD);
      if (boardEntries.length === 0) {
        console.error("No board in context");
        return;
      }
      const boardUri = boardEntries[0].uri;

      const boardService = serviceLayer.getFeatureService<BoardService>(BOARD_SERVICE_NAME);
      const result = await boardService.createNewTaskOnBoard(boardUri);

      console.log("Created task:", result.taskUri, "at position:", result.placement.x, result.placement.y);

      return async (): Promise<void> => {
        await boardService.removeTaskFromBoard(boardUri, result.taskUri);
        console.log("Undone: removed task", result.taskUri, "from board", boardUri);
      };
    },
    canDo: async (context: IContext): Promise<boolean> => {
      return context.hasScheme(URI_SCHEMES.BOARD);
    },
  };
}
