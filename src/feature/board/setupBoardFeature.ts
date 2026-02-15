import { ServiceLayer } from "../../service/ServiceLayer";
import { BoardService } from "./BoardService";
import { BoardSelectionService } from "./service/BoardSelectionService";
import { BoardMovementService } from "./service/BoardMovementService";
import { BOARD_SERVICE_NAME, BOARD_SELECTION_SERVICE_NAME, BOARD_MOVEMENT_SERVICE_NAME } from "./types";

export async function setupBoardFeature(serviceLayer: ServiceLayer): Promise<void> {
  const boardService = new BoardService(serviceLayer);
  await boardService.initialize();
  serviceLayer.registerFeatureService(BOARD_SERVICE_NAME, boardService);

  const selectionService = new BoardSelectionService(boardService);
  serviceLayer.registerFeatureService(BOARD_SELECTION_SERVICE_NAME, selectionService);

  const movementService = new BoardMovementService(boardService);
  serviceLayer.registerFeatureService(BOARD_MOVEMENT_SERVICE_NAME, movementService);

  boardService.registerActions();
}
