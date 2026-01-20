import { ServiceLayer } from "../../service/ServiceLayer";
import { BoardService } from "./BoardService";
import { BOARD_SERVICE_NAME } from "./types";

export async function setupBoardFeature(serviceLayer: ServiceLayer): Promise<void> {
  const boardService = new BoardService(serviceLayer);
  await boardService.initialize();
  serviceLayer.registerFeatureService(BOARD_SERVICE_NAME, boardService);
  boardService.registerActions();
}
