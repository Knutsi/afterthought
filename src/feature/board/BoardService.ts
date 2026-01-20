import { ActivityService } from "../../service/ActivityService";
import { ServiceLayer } from "../../service/ServiceLayer";
import type { IBoardActivityData } from "./BoardActivity";
import { BoardRepository } from "./BoardRepository";
import {
  BOARD_ACTIVITY_TAG,
  CREATE_BOARD_ACTION_ID,
  IBoardActivityParams,
  OPEN_BOARD_ACTION_ID
} from "./types";

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
    debugger
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
        const args: IBoardActivityParams = {
          openBoardId: null,
          name: this.getNextBoardName()
        }
        const activity = this.activityService.startActivity<IBoardActivityParams>(BOARD_ACTIVITY_TAG, args);
        this.activityService.switchToActivity(activity.id);
      },
      canDo: async () => true,
    });

    actionService.addAction({
      id: OPEN_BOARD_ACTION_ID,
      name: "Open Board",
      shortcut: "Ctrl+O B",
      menuGroup: "File",
      menuSubGroup: "open",
      do: async () => {
        const args: IBoardActivityParams = {
          openBoardId: null,
          name: this.getNextBoardName()
        }
        const activity = this.activityService.startActivity<IBoardActivityParams>(BOARD_ACTIVITY_TAG, args);
        this.activityService.switchToActivity(activity.id);
      },
      canDo: async () => true,
    });
  }

  /* TODO: This method should return an object that we attach to adapter method that translates straoge (persisted) to and from the diagram model.
   * We may want to create some context for each diagram that contains the data it needs, and that it can dynamically work on. */
  public subscribeBoardData() {

  }
}

