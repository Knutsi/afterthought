import type { DiagramElement } from "./editor/diagram-core/types";
import type { SelectionManager } from "./editor/diagram-core/managers/SelectionManager";
import type { StageManager } from "./editor/diagram-core/managers/StageManager";
import type { Uri } from "../../core-model/uri";

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

// selection request actions (hidden from menu)
export const SELECTION_SET_ACTION_ID = "board.selection-set";
export const SELECTION_ADD_ACTION_ID = "board.selection-add";
export const SELECTION_REMOVE_ACTION_ID = "board.selection-remove";
export const MOVE_ELEMENTS_ACTION_ID = "board.move-elements";

// feature identifier for selection context entries
export const BOARD_SELECTION_FEATURE = "board-selection";

export interface IBoardActivityParams {
  name: string,
  openBoardId: string | null /* new if null */
}

export interface BoardTaskPlacement {
  uri: string;          // task-on-board://GUID (the placement's own URI)
  taskUri: string;      // task://GUID (reference to the task)
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
  taskUri: string;           // task://GUID
  taskOnBoardUri: string;    // task-on-board://GUID
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

export interface SelectionRequestArgs extends Record<string, unknown> {
  elements: DiagramElement[];
  selectionManager: SelectionManager;
  stageManager: StageManager;
  boardUri: Uri;
}

export interface MoveElementsArgs extends Record<string, unknown> {
  elements: DiagramElement[];
  deltaX: number;
  deltaY: number;
  selectionManager: SelectionManager;
  boardUri: Uri;
}
