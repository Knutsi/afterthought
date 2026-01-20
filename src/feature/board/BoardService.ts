import { ActivityService } from "../../service/ActivityService";
import { ObjectService, IObject } from "../../service/ObjectService";
import { ServiceLayer } from "../../service/ServiceLayer";
import type { IBoardActivityData } from "./BoardActivity";
import {
  BOARD_ACTIVITY_TAG,
  CREATE_BOARD_ACTION_ID,
  IBoardActivityParams,
  OPEN_BOARD_ACTION_ID
} from "./types";

const BOARD_STORE_ID = 'board-store';

export class BoardService {
  private serviceLayer: ServiceLayer;
  private boardCount = 0;

  constructor(serviceLayer: ServiceLayer) {
    this.serviceLayer = serviceLayer;
  }

  async initialize(): Promise<void> {
    const objectService = this.serviceLayer.getObjectService();
    await objectService.getOrCreateStore(BOARD_STORE_ID, 'boards');
    const existingBoards = await objectService.getObjectsByStore(BOARD_STORE_ID);
    this.boardCount = existingBoards.length;
  }

  public async newBoard(): Promise<IObject> {
    const objectService = this.serviceLayer.getObjectService();
    const name = this.getNextBoardName();
    return objectService.createObject(BOARD_STORE_ID, 'board', { name });
  }

  public openBoard(_id: string): IBoardActivityData {
    // TODO: re-open a store based on the ID
    return {
      name: "Old board!",
    }
  }

  public saveBoard() {

  }

  public getNextBoardName(): string {
    const name = "Board " + this.boardCount;
    this.boardCount++;
    return name;
  }

  public registerActions(): void {
    const actionService = this.serviceLayer.actionService;
    const activityService = this.serviceLayer.getActivityService()

    actionService.addAction({
      id: CREATE_BOARD_ACTION_ID,
      name: "New Board",
      shortcut: "Ctrl+N B",
      menuGroup: "File",
      menuSubGroup: "create",
      do: async () => {
        const board = await this.newBoard();
        const args: IBoardActivityParams = {
          openBoardId: board.id,
          name: board.data.name
        }
        const activity = activityService.startActivity<IBoardActivityParams>(BOARD_ACTIVITY_TAG, args);
        activityService.switchToActivity(activity.id);
      },
      canDo: async (_context) => true,
    });

    actionService.addAction({
      id: OPEN_BOARD_ACTION_ID,
      name: "Open Board",
      shortcut: "Ctrl+O B",
      menuGroup: "File",
      menuSubGroup: "open",
      do: async () => {
        const board = await this.newBoard();
        const args: IBoardActivityParams = {
          openBoardId: board.id,
          name: board.data.name
        }
        const activity = activityService.startActivity<IBoardActivityParams>(BOARD_ACTIVITY_TAG, args);
        activityService.switchToActivity(activity.id);
      },
      canDo: async (_context) => true,
    });
  }


}

