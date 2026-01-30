export const BOARD_ACTIVITY_TAG = "board-activity";
export const BOARD_SERVICE_NAME = "board-service";

// Default task placement values
export const DEFAULT_TASK_PLACEMENT_WIDTH = 200;
export const DEFAULT_TASK_PLACEMENT_HEIGHT = 80;
export const DEFAULT_TASK_PLACEMENT_X = 100;
export const DEFAULT_TASK_PLACEMENT_Y = 100;

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

/** Result from adding a task to a board */
export interface AddTaskResult {
  taskUri: string;
  placement: BoardTaskPlacement;
}
