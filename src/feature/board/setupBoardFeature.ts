import { ServiceLayer } from "../../service/ServiceLayer";
import { BoardService } from "./BoardService";

export function setupBoardFeature(serviceLayer: ServiceLayer) {
  const boardService = new BoardService(serviceLayer);
  serviceLayer.registerFeatureService("board", boardService);
  boardService.registerActions();
}
