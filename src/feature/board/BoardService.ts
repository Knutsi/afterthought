import { ActivityService } from "../../service/ActivityService";
import { ServiceLayer } from "../../service/ServiceLayer";
import type { IBoardActivityData } from "./BoardActivity";
import { BoardRepository } from "./BoardRepository";
import { BOARD_ACTIVITY_TAG, CREATE_BOARD_ACTION_ID } from "./types";

export class BoardService {
  private boardRepository: BoardRepository;
  private serviceLayer: ServiceLayer;
  private activityService: ActivityService;

  constructor(serviceLayer: ServiceLayer) {
    this.serviceLayer = serviceLayer;
    this.activityService = serviceLayer.activityService;
    this.boardRepository = new BoardRepository();
  }

  public getEmptyBoardData(): IBoardActivityData {
    return {
      name: this.getNextBoardName(),
    };
  }

  public getNextBoardName(): string {
    const name = "Board " + this.boardRepository.getBoardCount();
    this.boardRepository.incrementBoardCount();
    return name;
  }

  public registerActions(): void {
    const actionService = this.serviceLayer.actionService;

    actionService.addAction({
      id: CREATE_BOARD_ACTION_ID,
      name: "New Board",
      shortcut: "Ctrl+N B",
      menuGroup: "File",
      menuSubGroup: "create",
      do: async () => {
        const activity = this.activityService.startActivity(BOARD_ACTIVITY_TAG, {});
        this.activityService.switchToActivity(activity.id);
      },
      canDo: async () => true,
    });
  }
}
