import type { IAction, UndoFunction, RedoFunction } from "../../../service/ActionService";
import type { ServiceLayer } from "../../../service/ServiceLayer";
import type { IContext } from "../../../service/context/types";
import { createUri, parseUri, URI_SCHEMES } from "../../../core-model/uri";
import { CREATE_TASK_ON_BOARD_ACTION_ID, EDIT_TASK_ACTION_ID, BOARD_SERVICE_NAME } from "../types";
import type { BoardService } from "../BoardService";
import type { TaskService } from "../../task/TaskService";
import { TASK_SERVICE_NAME } from "../../task/types";

export function createNewTaskAction(serviceLayer: ServiceLayer): IAction {
  return {
    id: CREATE_TASK_ON_BOARD_ACTION_ID,
    name: "New task on board",
    shortcuts: ["Mod+N T"],
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

      const makeUndoFn = (taskUri: string): UndoFunction => {
        return async (): Promise<RedoFunction | void> => {
          await boardService.removeTaskFromBoard(boardUri, taskUri);
          console.log("Undone: removed task", taskUri, "from board", boardUri);

          return async (): Promise<UndoFunction | void> => {
            const newResult = await boardService.createNewTaskOnBoard(boardUri);
            console.log("Redone: created task", newResult.taskUri);
            return makeUndoFn(newResult.taskUri);
          };
        };
      };

      return makeUndoFn(result.taskUri);
    },
    canDo: async (context: IContext): Promise<boolean> => {
      return context.hasScheme(URI_SCHEMES.BOARD);
    },
  };
}

export function createEditTaskAction(serviceLayer: ServiceLayer): IAction {
  return {
    id: EDIT_TASK_ACTION_ID,
    name: "Edit task...",
    shortcuts: ["Enter"],
    menuGroup: "Board",
    menuSubGroup: "edit",
    do: async (context: IContext): Promise<void> => {
      const boardEntries = context.getEntriesByScheme(URI_SCHEMES.BOARD);
      if (boardEntries.length === 0) return;
      const boardUri = boardEntries[0].uri;

      const selectedEntries = context.getEntriesByScheme(URI_SCHEMES.SELECTED);
      if (selectedEntries.length !== 1) return;

      const parsed = parseUri(selectedEntries[0].uri);
      if (!parsed) return;
      const taskUri = createUri(URI_SCHEMES.TASK, parsed.id);

      const taskService = serviceLayer.getFeatureService<TaskService>(TASK_SERVICE_NAME);
      const saved = await taskService.openEditor(taskUri);

      if (saved) {
        const boardService = serviceLayer.getFeatureService<BoardService>(BOARD_SERVICE_NAME);
        await boardService.refreshTaskElement(boardUri, taskUri);
      }
    },
    canDo: async (context: IContext): Promise<boolean> => {
      return context.hasScheme(URI_SCHEMES.BOARD) &&
        context.getEntriesByScheme(URI_SCHEMES.SELECTED).length === 1;
    },
  };
}
