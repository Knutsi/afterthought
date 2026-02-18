import { IObject } from "../../service/ObjectService";
import { ServiceLayer } from "../../service/ServiceLayer";
import { createUri, parseUri, type Uri, URI_SCHEMES } from "../../core-model/uri";
import type { IBoardActivityData } from "./BoardActivity";
import {
  createNewBoardAction,
  createOpenBoardAction,
  createNewTaskAction,
  createEditTaskAction,
  createSelectAllAction,
  createSelectNoneAction,
  createSelectionSetAction,
  createSelectionAddAction,
  createSelectionRemoveAction,
  createMoveElementsAction,
  createRenameBoardAction,
  createZoomInAction,
  createZoomOutAction,
  createResetZoomAction,
} from "./actions";
import { TaskService } from "../task/TaskService";
import { TASK_SERVICE_NAME } from "../task/types";
import { TaskElement } from "./editor/diagram-board/elements/TaskElement";
import type { Diagram } from "./editor/diagram-core/Diagram";
import type { SearchPicker, PickerItem } from "../../gui/picker/SearchPicker";
import "../../gui/picker/SearchPicker";
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
  BOARD_ACTIVITY_TAG,
  IBoardActivityParams,
} from "./types";

const BOARD_STORE_ID = 'board-store';

export class BoardService extends EventTarget {
  private serviceLayer: ServiceLayer;
  private boardCount = 0;
  private diagrams = new Map<Uri, Diagram>();

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

  public registerDiagram(boardUri: Uri, diagram: Diagram): void {
    this.diagrams.set(boardUri, diagram);
  }

  public unregisterDiagram(boardUri: Uri): void {
    this.diagrams.delete(boardUri);
  }

  public getDiagram(boardUri: Uri): Diagram | undefined {
    return this.diagrams.get(boardUri);
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

  public async refreshTaskElement(boardUri: Uri, taskUri: string): Promise<void> {
    const diagram = this.diagrams.get(boardUri);
    if (!diagram) return;

    const parsed = parseUri(taskUri);
    if (!parsed) return;

    const taskService = this.serviceLayer.getFeatureService<TaskService>(TASK_SERVICE_NAME);
    const taskObj = await taskService.getTask(parsed.id);
    if (!taskObj) return;

    const allElements = diagram.getStageManager().getAllElements();
    for (const element of allElements) {
      if (element instanceof TaskElement && element.taskUri === taskUri) {
        element.title = taskObj.data.name ?? "Task";
        diagram.requestRender();
        break;
      }
    }
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

  public async createBoardWithActivity(): Promise<{ boardId: string; activityId: string; board: IObject }> {
    const activityService = this.serviceLayer.getActivityService();
    const board = await this.newBoard();
    const activityArgs: IBoardActivityParams = { openBoardId: board.id, name: board.data.name };
    const activity = activityService.startActivity<IBoardActivityParams>(BOARD_ACTIVITY_TAG, activityArgs);
    activityService.switchToActivity(activity.id);
    return { boardId: board.id, activityId: activity.id, board };
  }

  public async deleteBoardAndCloseActivity(boardId: string, activityId: string): Promise<void> {
    const activityService = this.serviceLayer.getActivityService();
    activityService.closeActivity(activityId);
    await this.deleteBoard(boardId);
  }

  public async openBoardPicker(): Promise<void> {
    const activityService = this.serviceLayer.getActivityService();
    const boards = await this.listBoards();

    const openActivities = activityService.findActivitiesByTag(BOARD_ACTIVITY_TAG);
    const openBoardIds = new Map<string, string>();
    for (const a of openActivities) {
      const boardId = a.params.openBoardId as string;
      if (boardId) openBoardIds.set(boardId, a.id);
    }

    const items: PickerItem[] = boards.map((b) => {
      const isOpen = openBoardIds.has(b.id);
      return {
        id: b.id,
        name: b.name,
        detail: `${b.taskCount} task${b.taskCount !== 1 ? "s" : ""}${isOpen ? " (open)" : ""}`,
      };
    });

    const picker = document.getElementById("search-picker") as SearchPicker;
    picker.configure(items);

    picker.onSelect = (item: PickerItem) => {
      picker.hide();
      const existingActivityId = openBoardIds.get(item.id);
      if (existingActivityId) {
        activityService.switchToActivity(existingActivityId);
      } else {
        const activityArgs: IBoardActivityParams = { openBoardId: item.id, name: item.name };
        const activity = activityService.startActivity<IBoardActivityParams>(BOARD_ACTIVITY_TAG, activityArgs);
        activityService.switchToActivity(activity.id);
      }
    };

    picker.onCancel = () => {
      picker.hide();
    };

    picker.show();
  }

  public async renameBoard(boardId: string, newName: string): Promise<string> {
    const boardData = await this.getBoardData(boardId);
    const oldName = boardData?.name ?? "Untitled";

    await this.updateBoardData(boardId, { name: newName });

    // update tab label on open board activities
    const activityService = this.serviceLayer.getActivityService();
    const openActivities = activityService.findActivitiesByTag(BOARD_ACTIVITY_TAG);
    for (const a of openActivities) {
      if (a.params.openBoardId === boardId) {
        const el = document.getElementById(a.id);
        if (el) {
          el.setAttribute("tab-label", newName);
          // sync data-parameters so session persistence picks up the new name
          const params = JSON.parse(el.getAttribute("data-parameters") || "{}");
          params.name = newName;
          el.setAttribute("data-parameters", JSON.stringify(params));
        }
      }
    }

    return oldName;
  }

  public registerActions(): void {
    const actionService = this.serviceLayer.actionService;
    actionService.addAction(createNewBoardAction(this.serviceLayer));
    actionService.addAction(createOpenBoardAction(this.serviceLayer));
    actionService.addAction(createNewTaskAction(this.serviceLayer));
    actionService.addAction(createEditTaskAction(this.serviceLayer));
    actionService.addAction(createSelectAllAction(this.serviceLayer));
    actionService.addAction(createSelectNoneAction(this.serviceLayer));
    actionService.addAction(createSelectionSetAction(this.serviceLayer));
    actionService.addAction(createSelectionAddAction(this.serviceLayer));
    actionService.addAction(createSelectionRemoveAction(this.serviceLayer));
    actionService.addAction(createMoveElementsAction(this.serviceLayer));
    actionService.addAction(createRenameBoardAction(this.serviceLayer));
    actionService.addAction(createZoomInAction(this.serviceLayer));
    actionService.addAction(createZoomOutAction(this.serviceLayer));
    actionService.addAction(createResetZoomAction(this.serviceLayer));
  }


}

