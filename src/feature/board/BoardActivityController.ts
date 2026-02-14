import type { ServiceLayer } from "../../service/ServiceLayer";
import type { Uri } from "../../core-model/uri";
import { createUri, URI_SCHEMES } from "../../core-model/uri";
import type { DiagramElement } from "./editor/diagram-core/types";
import type { Diagram } from "./editor/diagram-core/Diagram";
import type { BoardDiagramOptions } from "./editor/diagram-board/BoardDiagram";
import type { BoardSyncAdapter } from "./BoardSyncAdapter";
import { BoardActivityViewModel } from "./BoardActivityViewModel";
import type { IActivityController, IContextEntrySpec } from "../../gui/activity/runtime/types";
import type { IContextPart } from "../../service/context/types";
import type { IBoardActivityParams } from "./types";
import { BOARD_SERVICE_NAME } from "./types";
import type { BoardActivityView } from "./BoardActivityView";
import {
  MOVE_ELEMENTS_ACTION_ID,
  SELECTION_ADD_ACTION_ID,
  SELECTION_REMOVE_ACTION_ID,
  SELECTION_SET_ACTION_ID,
  type MoveElementsArgs,
  type SelectionRequestArgs,
} from "./types";

export class BoardActivityController implements IActivityController<IBoardActivityParams, BoardActivityView> {
  private serviceLayer: ServiceLayer;
  private boardUri: Uri | null = null;
  private diagram: Diagram | null = null;
  private view: BoardActivityView | null = null;
  private viewModel: BoardActivityViewModel | null = null;

  constructor(serviceLayer: ServiceLayer) {
    this.serviceLayer = serviceLayer;
  }

  public attachView(view: BoardActivityView): void {
    this.view = view;
  }

  private buildDiagramOptions(): BoardDiagramOptions {
    return {
      onBackgroundDoubleClick: this.handleBackgroundDoubleClick.bind(this),
      onSelectionSetRequest: this.handleSelectionSetRequest.bind(this),
      onSelectionAddRequest: this.handleSelectionAddRequest.bind(this),
      onSelectionRemoveRequest: this.handleSelectionRemoveRequest.bind(this),
      onMoveComplete: this.handleMoveComplete.bind(this),
    };
  }

  public initialize(params: IBoardActivityParams, _activityId: string): void {
    if (!this.view) {
      throw new Error("BoardActivityController view is not attached");
    }

    this.boardUri = createUri(URI_SCHEMES.BOARD, params.openBoardId ?? crypto.randomUUID());
    this.diagram = this.view.createDiagram(this.buildDiagramOptions(), this.serviceLayer);
    this.viewModel = new BoardActivityViewModel(this.serviceLayer, this.boardUri, this.diagram);
    this.viewModel.initialize();
  }

  public activate(_contextPart: IContextPart): void {
  }

  public deactivate(): void {
  }

  public destroy(): void {
    if (this.viewModel) {
      this.viewModel.destroy();
      this.viewModel = null;
    }
    this.diagram = null;
    this.view = null;
    this.boardUri = null;
  }

  public getContextEntries(): ReadonlyArray<IContextEntrySpec> {
    if (!this.boardUri) {
      return [];
    }

    return [
      {
        uri: this.boardUri,
        feature: BOARD_SERVICE_NAME,
      },
    ];
  }

  public getDiagram(): Diagram | null {
    return this.diagram;
  }

  public getBoardUri(): Uri | null {
    return this.boardUri;
  }

  public getSyncAdapter(): BoardSyncAdapter | null {
    return this.viewModel?.getSyncAdapter() ?? null;
  }

  private handleBackgroundDoubleClick(worldX: number, worldY: number): void {
    console.log(`Create task at (${worldX}, ${worldY})`);
    // TODO: Integrate with task service
  }

  private handleSelectionSetRequest(elements: DiagramElement[]): void {
    this.handleSelectionRequest(SELECTION_SET_ACTION_ID, elements);
  }

  private handleSelectionAddRequest(elements: DiagramElement[]): void {
    this.handleSelectionRequest(SELECTION_ADD_ACTION_ID, elements);
  }

  private handleSelectionRemoveRequest(elements: DiagramElement[]): void {
    this.handleSelectionRequest(SELECTION_REMOVE_ACTION_ID, elements);
  }

  private handleSelectionRequest(actionId: string, elements: DiagramElement[]): void {
    const selectionManager = this.diagram?.getSelectionManager();
    const stageManager = this.diagram?.getStageManager();
    if (!selectionManager || !stageManager || !this.boardUri) {
      return;
    }

    const selectionArgs: SelectionRequestArgs = {
      elements,
      selectionManager,
      stageManager,
      boardUri: this.boardUri,
    };

    this.serviceLayer.actionService.doAction(actionId, selectionArgs);
  }

  private handleMoveComplete(elements: DiagramElement[], deltaX: number, deltaY: number): void {
    const selectionManager = this.diagram?.getSelectionManager();
    if (!selectionManager || !this.boardUri) {
      return;
    }

    const moveArgs: MoveElementsArgs = {
      elements,
      deltaX,
      deltaY,
      selectionManager,
      boardUri: this.boardUri,
    };

    this.serviceLayer.actionService.doAction(MOVE_ELEMENTS_ACTION_ID, moveArgs);
  }
}
