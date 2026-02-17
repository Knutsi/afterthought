import type { StageManager } from "./editor/diagram-core/managers/StageManager";
import type { BoardService } from "./BoardService";
import type { BoardData, TaskAddedEventDetail, TaskUpdatedEventDetail, TaskRemovedEventDetail } from "./types";
import { BoardEvents } from "./types";
import { TaskElement } from "./editor/diagram-board/elements/TaskElement";

const TASK_LAYER_NAME = "tasks";

export class BoardSyncAdapter {
  private boardService: BoardService;
  private stageManager: StageManager;
  private boardUri: string;
  private layerId: string | null = null;

  // Mapping from taskUri to diagram element ID
  private taskUriToElementId = new Map<string, string>();

  // Bound event handlers for cleanup
  private handleTaskAddedBound: (e: Event) => void;
  private handleTaskUpdatedBound: (e: Event) => void;
  private handleTaskRemovedBound: (e: Event) => void;

  constructor(
    boardService: BoardService,
    stageManager: StageManager,
    boardUri: string
  ) {
    this.boardService = boardService;
    this.stageManager = stageManager;
    this.boardUri = boardUri;

    this.handleTaskAddedBound = this.handleTaskAdded.bind(this);
    this.handleTaskUpdatedBound = this.handleTaskUpdated.bind(this);
    this.handleTaskRemovedBound = this.handleTaskRemoved.bind(this);

    this.subscribe();
  }

  private subscribe(): void {
    this.boardService.addEventListener(BoardEvents.TASK_ADDED, this.handleTaskAddedBound);
    this.boardService.addEventListener(BoardEvents.TASK_UPDATED, this.handleTaskUpdatedBound);
    this.boardService.addEventListener(BoardEvents.TASK_REMOVED, this.handleTaskRemovedBound);
  }

  public destroy(): void {
    this.boardService.removeEventListener(BoardEvents.TASK_ADDED, this.handleTaskAddedBound);
    this.boardService.removeEventListener(BoardEvents.TASK_UPDATED, this.handleTaskUpdatedBound);
    this.boardService.removeEventListener(BoardEvents.TASK_REMOVED, this.handleTaskRemovedBound);
    this.taskUriToElementId.clear();
  }

  public loadFromBoardData(boardData: BoardData): void {
    // Create or get the tasks layer
    let layer = this.stageManager.getLayers().find(l => l.name === TASK_LAYER_NAME);
    if (!layer) {
      layer = this.stageManager.addLayer(TASK_LAYER_NAME);
    }
    this.layerId = layer.id;

    // Create TaskElements for each task placement
    for (const placement of boardData.tasks) {
      const element = new TaskElement("Task", placement.taskUri);
      element.posX = placement.x;
      element.posY = placement.y;
      element.width = placement.width;
      element.height = placement.height;

      this.stageManager.addElement(this.layerId, element);
      this.taskUriToElementId.set(placement.taskUri, element.id);
    }
  }

  public getElementId(taskUri: string): string | undefined {
    return this.taskUriToElementId.get(taskUri);
  }

  public getTaskUri(elementId: string): string | undefined {
    for (const [uri, id] of this.taskUriToElementId) {
      if (id === elementId) return uri;
    }
    return undefined;
  }

  public getTaskUris(): string[] {
    return Array.from(this.taskUriToElementId.keys());
  }

  private ensureLayer(): string {
    if (this.layerId) return this.layerId;

    let layer = this.stageManager.getLayers().find(l => l.name === TASK_LAYER_NAME);
    if (!layer) {
      layer = this.stageManager.addLayer(TASK_LAYER_NAME);
    }
    this.layerId = layer.id;
    return this.layerId;
  }

  private handleTaskAdded(event: Event): void {
    const detail = (event as CustomEvent<TaskAddedEventDetail>).detail;

    // Filter by boardUri - only handle events for this board
    if (detail.boardUri !== this.boardUri) return;

    const layerId = this.ensureLayer();
    const { taskUri, placement } = detail;

    const element = new TaskElement("Task", taskUri);
    element.posX = placement.x;
    element.posY = placement.y;
    element.width = placement.width;
    element.height = placement.height;

    this.stageManager.addElement(layerId, element);
    this.taskUriToElementId.set(taskUri, element.id);
  }

  private handleTaskUpdated(event: Event): void {
    const detail = (event as CustomEvent<TaskUpdatedEventDetail>).detail;

    // Filter by boardUri
    if (detail.boardUri !== this.boardUri) return;

    const { taskUri, placement } = detail;
    const elementId = this.taskUriToElementId.get(taskUri);
    if (!elementId || !this.layerId) return;

    // Update position
    this.stageManager.setElementPosition(this.layerId, elementId, placement.x, placement.y);
    // Update size
    this.stageManager.setElementSize(this.layerId, elementId, placement.width, placement.height);
  }

  private handleTaskRemoved(event: Event): void {
    const detail = (event as CustomEvent<TaskRemovedEventDetail>).detail;

    // Filter by boardUri
    if (detail.boardUri !== this.boardUri) return;

    const { taskUri } = detail;
    const elementId = this.taskUriToElementId.get(taskUri);
    if (!elementId || !this.layerId) return;

    this.stageManager.removeElement(this.layerId, elementId);
    this.taskUriToElementId.delete(taskUri);
  }
}
