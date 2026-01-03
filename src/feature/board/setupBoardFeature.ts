import { ServiceLayer } from "../../service/ServiceLayer";
import { BoardService } from "./BoardService";
import { BOARD_SERVICE_NAME } from "./types";

export function setupBoardFeature(serviceLayer: ServiceLayer) {
  const boardService = new BoardService(serviceLayer);
  serviceLayer.registerFeatureService(BOARD_SERVICE_NAME, boardService);
  boardService.registerActions();
}
