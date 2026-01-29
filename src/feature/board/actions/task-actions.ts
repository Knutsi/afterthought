import type { IAction, UndoFunction } from "../../../service/ActionService";
import type { ServiceLayer } from "../../../service/ServiceLayer";
import type { IContext } from "../../../service/context/types";
import { URI_SCHEMES } from "../../../core-model/uri";
import { CREATE_TASK_ON_BOARD_ACTION_ID, BOARD_SERVICE_NAME } from "../types";
import type { BoardService } from "../BoardService";

export function createNewTaskAction(serviceLayer: ServiceLayer): IAction {
  return {
    id: CREATE_TASK_ON_BOARD_ACTION_ID,
    name: "New Task",
    shortcut: "Ctrl+N T",
    menuGroup: "Board",
    menuSubGroup: "create",
    do: async (_context: IContext): Promise<UndoFunction | void> => {
      const boardService = serviceLayer.getFeatureService<BoardService>(BOARD_SERVICE_NAME);
      const taskUri = await boardService.addTask();

      console.log("Created task:", taskUri);

      return async (): Promise<void> => {
        console.log("Undone: removed task", taskUri);
        // Future: boardService.removeTask(taskUri)
      };
    },
    canDo: async (context: IContext): Promise<boolean> => {
      return context.hasScheme(URI_SCHEMES.BOARD);
    },
  };
}
