export const BOARD_ACTIVITY_TAG = "board-activity";
export const BOARD_SERVICE_NAME = "board-service";

// Board events emitted by BoardService
export const BoardEvents = {
  TASK_ADDED: 'board:taskAdded',
  TASK_UPDATED: 'board:taskUpdated',
  TASK_REMOVED: 'board:taskRemoved',
} as const;

// Default task placement values
export const DEFAULT_TASK_PLACEMENT_WIDTH = 200;
export const DEFAULT_TASK_PLACEMENT_HEIGHT = 80;
export const DEFAULT_TASK_PLACEMENT_X = 100;
export const DEFAULT_TASK_PLACEMENT_Y = 100;

// actions:
export const CREATE_BOARD_ACTION_ID = "create-board";
export const OPEN_BOARD_ACTION_ID = "open-board";
export const CREATE_TASK_ON_BOARD_ACTION_ID = "create-task-on-board";
export const SELECT_ALL_ACTION_ID = "select-all";
export const SELECT_NONE_ACTION_ID = "select-none";

export interface IBoardActivityParams {
  name: string,
  openBoardId: string | null /* new if null */
}

export interface BoardTaskPlacement {
  taskUri: string;      // Reference to task (URI string form)
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BoardData {
  id: string;
  name: string;
  tasks: BoardTaskPlacement[];
}

export interface AddTaskResult {
  taskUri: string;
  placement: BoardTaskPlacement;
}

export interface TaskAddedEventDetail {
  boardUri: string;
  taskUri: string;
  placement: BoardTaskPlacement;
}

export interface TaskUpdatedEventDetail {
  boardUri: string;
  taskUri: string;
  placement: BoardTaskPlacement;
}

export interface TaskRemovedEventDetail {
  boardUri: string;
  taskUri: string;
}
