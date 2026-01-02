import { ServiceLayer } from "../../service/ServiceLayer";
import { BoardRepository } from "./BoardRepository";

export class BoardService {
  private boardRepository: BoardRepository;
  private serviceLayer: ServiceLayer;

  constructor(serviceLayer: ServiceLayer) {
    this.serviceLayer = serviceLayer;
    this.boardRepository = new BoardRepository();
  }

  public getNextBoardName(): string {
    const name = "Board " + (this.boardRepository.getBoardCount() + 1);
    this.boardRepository.incrementBoardCount();
    return name;
  }

  public registerActions(): void {
    const actionService = this.serviceLayer.actionService;

    actionService.addAction({
      id: "create-board",
      name: "New Board",
      shortcut: "Ctrl+N B",
      menuGroup: "File",
      menuSubGroup: "create",
      do: async () => {
        this.serviceLayer.activityService.startActivity("board-activity", {
          name: this.getNextBoardName(),
        });
      },
      canDo: async () => true,
    });
  }
}
