import { IObject } from "../../service/ObjectService";
import { ServiceLayer } from "../../service/ServiceLayer";
import { createUri, parseUri, type Uri, URI_SCHEMES } from "../../core-model/uri";
import type { IBoardActivityData } from "./BoardActivity";
import {
  createNewBoardAction,
  createOpenBoardAction,
  createNewTaskAction,
  createSelectAllAction,
  createSelectNoneAction,
  createSelectionSetAction,
  createSelectionAddAction,
  createSelectionRemoveAction,
  createMoveElementsAction,
} from "./actions";
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
  BOARD_SELECTION_FEATURE,
  BOARD_CONTENT_FEATURE,
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

  public async listBoards(): Promise<{ id: string; name: string; taskCount: number }[]> {
    const objectService = this.serviceLayer.getObjectService();
    const boards = await objectService.getObjectsByStore(BOARD_STORE_ID);
    return boards.map((b) => ({
      id: b.id,
      name: b.data.name ?? "Untitled",
      taskCount: (b.data.tasks ?? []).length,
    }));
  }

  public async newBoard(): Promise<IObject> {
    const objectService = this.serviceLayer.getObjectService();
    const name = this.getNextBoardName();
    const id = crypto.randomUUID();
    return objectService.createObjectWithId(BOARD_STORE_ID, id, 'board', { name, tasks: [] });
  }

  public async deleteBoard(boardId: string): Promise<boolean> {
    const objectService = this.serviceLayer.getObjectService();
    return objectService.deleteObject(BOARD_STORE_ID, boardId);
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

  public async createNewTaskOnBoard(boardUri: string): Promise<AddTaskResult> {
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
    const { taskUri } = await taskService.newTask("New task");

    const taskOnBoardId = crypto.randomUUID();
    const taskOnBoardUri = createUri(URI_SCHEMES.TASK_ON_BOARD, taskOnBoardId);

    const existingTasks = boardData.tasks;
    const staggerOffset = existingTasks.length * 20;

    const placement: BoardTaskPlacement = {
      uri: taskOnBoardUri,
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

    const contextPart = this.serviceLayer.getActivityService().getActiveContextPart();
    if (contextPart) {
      contextPart.addEntry(taskUri, BOARD_CONTENT_FEATURE, boardUri);
    }

    return { taskUri, taskOnBoardUri, placement };
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

    const contextPart = this.serviceLayer.getActivityService().getActiveContextPart();
    if (contextPart) {
      contextPart.removeEntry(taskUri);
      const parsedTask = parseUri(taskUri);
      if (parsedTask) {
        contextPart.removeEntry(createUri(URI_SCHEMES.SELECTED, parsedTask.id));
      }
    }

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

  public updateSelectionContext(boardUri: Uri, taskUris: Uri[]): void {
    const contextPart = this.serviceLayer.getActivityService().getActiveContextPart();
    if (!contextPart) return;

    contextPart.removeEntriesByFeature(BOARD_SELECTION_FEATURE);
    for (const taskUri of taskUris) {
      const parsed = parseUri(taskUri);
      if (parsed) {
        contextPart.addEntry(createUri(URI_SCHEMES.SELECTED, parsed.id), BOARD_SELECTION_FEATURE, boardUri);
      }
    }
  }

  public updateBoardContentContext(boardUri: Uri, taskUris: Uri[]): void {
    const contextPart = this.serviceLayer.getActivityService().getActiveContextPart();
    if (!contextPart) return;

    contextPart.removeEntriesByFeature(BOARD_CONTENT_FEATURE);
    for (const taskUri of taskUris) {
      contextPart.addEntry(taskUri, BOARD_CONTENT_FEATURE, boardUri);
    }
  }

  public registerActions(): void {
    const actionService = this.serviceLayer.actionService;
    actionService.addAction(createNewBoardAction(this.serviceLayer));
    actionService.addAction(createOpenBoardAction(this.serviceLayer));
    actionService.addAction(createNewTaskAction(this.serviceLayer));
    actionService.addAction(createSelectAllAction(this.serviceLayer));
    actionService.addAction(createSelectNoneAction(this.serviceLayer));
    actionService.addAction(createSelectionSetAction(this.serviceLayer));
    actionService.addAction(createSelectionAddAction(this.serviceLayer));
    actionService.addAction(createSelectionRemoveAction(this.serviceLayer));
    actionService.addAction(createMoveElementsAction(this.serviceLayer));
  }


}

