import { IObject } from "../../service/ObjectService";
import { ServiceLayer } from "../../service/ServiceLayer";
import { createUri, parseUri, URI_SCHEMES } from "../../core-model/uri";
import type { IBoardActivityData } from "./BoardActivity";
import { createNewBoardAction, createOpenBoardAction, createNewTaskAction } from "./actions";
import { TaskService } from "../task/TaskService";
import { TASK_SERVICE_NAME } from "../task/types";
import {
  BoardTaskPlacement,
  BoardData,
  AddTaskResult,
  BoardEvents,
  TaskAddedEventDetail,
  TaskUpdatedEventDetail,
  TaskRemovedEventDetail,
  DEFAULT_TASK_PLACEMENT_WIDTH,
  DEFAULT_TASK_PLACEMENT_HEIGHT,
  DEFAULT_TASK_PLACEMENT_X,
  DEFAULT_TASK_PLACEMENT_Y,
} from "./types";

const BOARD_STORE_ID = 'board-store';

export class BoardService extends EventTarget {
  private serviceLayer: ServiceLayer;
  private boardCount = 0;

  constructor(serviceLayer: ServiceLayer) {
    super();
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
    return objectService.createObject(BOARD_STORE_ID, 'board', { name, tasks: [] });
  }

  public openBoard(_id: string): IBoardActivityData {
    // TODO: re-open a store based on the ID
    return {
      name: "Old board!",
    }
  }

  public saveBoard() {

  }

  public async getBoardData(boardId: string): Promise<BoardData | null> {
    const objectService = this.serviceLayer.getObjectService();
    const boardObject = await objectService.getObject(BOARD_STORE_ID, boardId);
    if (!boardObject) return null;

    return {
      id: boardObject.id,
      name: boardObject.data.name,
      tasks: boardObject.data.tasks ?? [],
    };
  }

  public async updateBoardData(boardId: string, updates: Partial<Omit<BoardData, 'id'>>): Promise<IObject | null> {
    const objectService = this.serviceLayer.getObjectService();
    const existing = await objectService.getObject(BOARD_STORE_ID, boardId);
    if (!existing) return null;

    return objectService.updateObject(BOARD_STORE_ID, boardId, {
      ...existing.data,
      ...updates,
    });
  }

  public async addTask(boardUri: string): Promise<AddTaskResult> {
    const parsed = parseUri(boardUri);
    if (!parsed || parsed.scheme !== URI_SCHEMES.BOARD) {
      throw new Error(`Invalid board URI: ${boardUri}`);
    }
    const boardId = parsed.id;

    const boardData = await this.getBoardData(boardId);
    if (!boardData) {
      throw new Error(`Board not found: ${boardId}`);
    }

    const taskService = this.serviceLayer.getFeatureService<TaskService>(TASK_SERVICE_NAME);
    const taskObject = await taskService.newTask("New task");
    const taskUri = createUri(URI_SCHEMES.TASK, taskObject.id);

    const existingTasks = boardData.tasks;
    const staggerOffset = existingTasks.length * 20;

    const placement: BoardTaskPlacement = {
      taskUri,
      x: DEFAULT_TASK_PLACEMENT_X + staggerOffset,
      y: DEFAULT_TASK_PLACEMENT_Y + staggerOffset,
      width: DEFAULT_TASK_PLACEMENT_WIDTH,
      height: DEFAULT_TASK_PLACEMENT_HEIGHT,
    };

    await this.updateBoardData(boardId, {
      tasks: [...existingTasks, placement],
    });

    this.dispatchEvent(new CustomEvent<TaskAddedEventDetail>(BoardEvents.TASK_ADDED, {
      detail: { boardUri, taskUri, placement },
    }));

    return { taskUri, placement };
  }

  public async removeTaskFromBoard(boardUri: string, taskUri: string): Promise<boolean> {
    const parsed = parseUri(boardUri);
    if (!parsed || parsed.scheme !== URI_SCHEMES.BOARD) {
      return false;
    }
    const boardId = parsed.id;

    const boardData = await this.getBoardData(boardId);
    if (!boardData) return false;

    const filteredTasks = boardData.tasks.filter(t => t.taskUri !== taskUri);
    if (filteredTasks.length === boardData.tasks.length) {
      return false;
    }

    await this.updateBoardData(boardId, { tasks: filteredTasks });

    this.dispatchEvent(new CustomEvent<TaskRemovedEventDetail>(BoardEvents.TASK_REMOVED, {
      detail: { boardUri, taskUri },
    }));

    return true;
  }

  public async updateTaskPlacement(
    boardUri: string,
    taskUri: string,
    placement: Partial<Omit<BoardTaskPlacement, 'taskUri'>>
  ): Promise<BoardTaskPlacement | null> {
    const parsed = parseUri(boardUri);
    if (!parsed || parsed.scheme !== URI_SCHEMES.BOARD) {
      return null;
    }
    const boardId = parsed.id;

    const boardData = await this.getBoardData(boardId);
    if (!boardData) return null;

    const taskIndex = boardData.tasks.findIndex(t => t.taskUri === taskUri);
    if (taskIndex === -1) return null;

    const updatedPlacement: BoardTaskPlacement = {
      ...boardData.tasks[taskIndex],
      ...placement,
    };

    const updatedTasks = [...boardData.tasks];
    updatedTasks[taskIndex] = updatedPlacement;

    await this.updateBoardData(boardId, { tasks: updatedTasks });

    this.dispatchEvent(new CustomEvent<TaskUpdatedEventDetail>(BoardEvents.TASK_UPDATED, {
      detail: { boardUri, taskUri, placement: updatedPlacement },
    }));

    return updatedPlacement;
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

