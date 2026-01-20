export const BOARD_ACTIVITY_TAG = "board-activity";
export const BOARD_SERVICE_NAME = "board-service";

// actions:
export const CREATE_BOARD_ACTION_ID = "create-board";
export const OPEN_BOARD_ACTION_ID = "open-board";

export interface IBoardActivityParams {
  name: string,
  openBoardId: string | null /* new if null */
} 
