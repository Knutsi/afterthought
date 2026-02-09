import type { ServiceLayer } from "../../service/ServiceLayer";
import type { Uri } from "../../core-model/uri";
import type { Diagram } from "./editor/diagram-core/Diagram";
import { BoardSyncAdapter } from "./BoardSyncAdapter";
import type { BoardService } from "./BoardService";
import { BOARD_SERVICE_NAME } from "./types";
import { parseUri } from "../../core-model/uri";
import type { IViewModel } from "../../gui/core/ViewModel";

export class BoardActivityViewModel implements IViewModel {
  private serviceLayer: ServiceLayer;
  private boardUri: Uri;
  private diagram: Diagram;
  private syncAdapter: BoardSyncAdapter | null = null;

  constructor(serviceLayer: ServiceLayer, boardUri: Uri, diagram: Diagram) {
    this.serviceLayer = serviceLayer;
    this.boardUri = boardUri;
    this.diagram = diagram;
  }

  public async initialize(): Promise<void> {
    const boardService = this.serviceLayer.getFeatureService<BoardService>(BOARD_SERVICE_NAME);

    this.syncAdapter = new BoardSyncAdapter(
      boardService,
      this.diagram.getStageManager(),
      this.boardUri
    );

    const parsed = parseUri(this.boardUri);
    if (parsed) {
      const boardData = await boardService.getBoardData(parsed.id);
      if (boardData) {
        this.syncAdapter.loadFromBoardData(boardData);
      }
    }
  }

  public destroy(): void {
    if (this.syncAdapter) {
      this.syncAdapter.destroy();
      this.syncAdapter = null;
    }
  }

  public getSyncAdapter(): BoardSyncAdapter | null {
    return this.syncAdapter;
  }
}
