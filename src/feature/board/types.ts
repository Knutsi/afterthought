import { Uri } from "../../core-model/uri.ts"

export const BOARD_ACTIVITY_TAG = "board-activity";
export const BOARD_SERVICE_NAME = "board-service";

// actions:
export const CREATE_BOARD_ACTION_ID = "create-board";
export const OPEN_BOARD_ACTION_ID = "open-board";
export const CREATE_TASK_ON_BOARD_ACTION_ID = "create-task-on-board";

export interface IBoardActivityParams {
  name: string,
  openBoardId: string | null /* new if null */
}

export class BoardTaskInstance {
  taskUri: Uri
  x: number
  y: number

  constructor(uri: Uri, x: number, y: number) {
    this.taskUri = uri;
    this.x = x;
    this.y = y;
  }
}
