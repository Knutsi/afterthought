import { IObject } from "../../service/ObjectService";
import { ServiceLayer } from "../../service/ServiceLayer";
import { createUri, Uri, URI_SCHEMES } from "../../core-model/uri";
import type { IBoardActivityData } from "./BoardActivity";
import { createNewBoardAction, createOpenBoardAction, createNewTaskAction } from "./actions";

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

  public async addTask(): Promise<Uri> {
    const fakeTaskId = `task-${Date.now()}`;
    return createUri(URI_SCHEMES.TASK, fakeTaskId);
  }

  public getNextBoardName(): string {
    const name = "Board " + this.boardCount;
    this.boardCount++;
    return name;
  }

  public registerActions(): void {
    const actionService = this.serviceLayer.actionService;
    actionService.addAction(createNewBoardAction(this.serviceLayer));
    actionService.addAction(createOpenBoardAction(this.serviceLayer));
    actionService.addAction(createNewTaskAction(this.serviceLayer));
  }


}

