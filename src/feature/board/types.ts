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

/** A task's placement on a board */
export interface BoardTaskPlacement {
  taskUri: string;      // Reference to task (URI string form)
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Complete board data for persistence */
export interface BoardData {
  id: string;
  name: string;
  tasks: BoardTaskPlacement[];
}
