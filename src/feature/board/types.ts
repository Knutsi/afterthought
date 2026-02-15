import type { DiagramElement } from "./editor/diagram-core/types";
import type { Diagram } from "./editor/diagram-core/Diagram";
import type { Uri } from "../../core-model/uri";
import type { BoardService } from "./BoardService";
import type { BoardSelectionService } from "./service/BoardSelectionService";
import type { BoardMovementService } from "./service/BoardMovementService";

export const BOARD_ACTIVITY_TAG = "board-activity";
export const BOARD_SERVICE_NAME = "board-service";
export const BOARD_SELECTION_SERVICE_NAME = "board-selection-service";
export const BOARD_MOVEMENT_SERVICE_NAME = "board-movement-service";

declare module "../../service/featureTypes" {
  interface IFeatureServiceMap {
    [BOARD_SERVICE_NAME]: BoardService;
    [BOARD_SELECTION_SERVICE_NAME]: BoardSelectionService;
    [BOARD_MOVEMENT_SERVICE_NAME]: BoardMovementService;
  }
}

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

// feature identifiers for context entries
export const BOARD_SELECTION_FEATURE = "board-selection";
export const BOARD_CONTENT_FEATURE = "board-content";

export interface IBoardActivityParams {
  name: string,
  openBoardId: string | null /* new if null */
  initialOffsetX?: number;
  initialOffsetY?: number;
  initialZoom?: number;
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
  diagram: Diagram;
  boardUri: Uri;
}

export interface MoveElementsArgs extends Record<string, unknown> {
  elements: DiagramElement[];
  deltaX: number;
  deltaY: number;
  diagram: Diagram;
  boardUri: Uri;
}
