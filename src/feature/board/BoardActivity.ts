import { BaseComponent, defineComponent } from "../../gui/core/BaseComponent";
import { ActivityType, type IActivity } from "../../service/ActivityService";
import { createUri, type Uri, URI_SCHEMES } from "../../core-model/uri";
import type { IContextPart } from "../../service/context/types";
import {
  BOARD_ACTIVITY_TAG,
  BOARD_SERVICE_NAME,
  SELECTION_SET_ACTION_ID,
  SELECTION_ADD_ACTION_ID,
  SELECTION_REMOVE_ACTION_ID,
  MOVE_ELEMENTS_ACTION_ID,
  type IBoardActivityParams,
  type SelectionRequestArgs,
  type MoveElementsArgs,
} from "./types";
import { createBoardDiagram } from "./editor/diagram-board/BoardDiagram";
import { Diagram } from "./editor/diagram-core/Diagram";
import { BoardActivityViewModel } from "./BoardActivityViewModel";
import type { BoardSyncAdapter } from "./BoardSyncAdapter";
import type { DiagramElement } from "./editor/diagram-core/types";

export interface IBoardActivityData {
  name: string;
}

export class BoardActivity extends BaseComponent implements IActivity {
  private data!: IBoardActivityData;
  private diagram: Diagram | null = null;
  private boardUri: Uri | null = null;
  private viewModel: BoardActivityViewModel | null = null;
  private contextPart: IContextPart | null = null;

  static get observedAttributes(): string[] {
    return [];
  }

  // IActivity implementation
  get activityId(): string {
    return this.id;
  }

  get activityType(): ActivityType {
    return ActivityType.TAB;
  }

  getDiagram(): Diagram | null {
    return this.diagram;
  }

  getBoardUri(): Uri | null {
    return this.boardUri;
  }

  getContextPart(): IContextPart | null {
    return this.contextPart;
  }

  getSyncAdapter(): BoardSyncAdapter | null {
    return this.viewModel?.getSyncAdapter() ?? null;
  }

  onGetContext(contextPart: IContextPart): void {
    this.contextPart = contextPart;
    if (this.boardUri && !contextPart.hasEntry(this.boardUri)) {
      contextPart.addEntry(this.boardUri, BOARD_SERVICE_NAME);
    }
  }

  onDropContext(): void {
  }

  protected onInit(): void {
    this.ensureTabAttributes();

    const argumentJson = this.getAttribute("data-parameters");
    const args = JSON.parse(argumentJson!) as IBoardActivityParams;

    this.data = { name: args.name };
    this.setAttribute("tab-label", args.name);

    // Build the board URI for context management
    this.boardUri = createUri(URI_SCHEMES.BOARD, args.openBoardId ?? crypto.randomUUID());

    this.render();

    const container = this.shadowRoot!.querySelector(".board-container") as HTMLElement;
    if (!container) {
      throw new Error("Board container not found");
    }
    // sets up the main event loop of the board:
    this.diagram = createBoardDiagram(container, {
      onBackgroundDoubleClick: this.handleBackgroundDoubleClick.bind(this),
      onSelectionSetRequest: this.handleSelectionSetRequest.bind(this),
      onSelectionAddRequest: this.handleSelectionAddRequest.bind(this),
      onSelectionRemoveRequest: this.handleSelectionRemoveRequest.bind(this),
      onMoveComplete: this.handleMoveComplete.bind(this),
    }, this.getServiceLayer());

    // Initialize viewmodel
    if (this.diagram && this.boardUri) {
      this.viewModel = new BoardActivityViewModel(this.getServiceLayer(), this.boardUri, this.diagram);
      this.viewModel.initialize();
    }
  }

  protected render(): void {
    if (!this.shadowRoot) return;

    if (!this.data) {
      this.shadowRoot.innerHTML = `<div class="board-content">...</div>`;
      return;
    }

    if (this.diagram) {
      throw new Error("Diagram already exists. BoardActivity cannot render twice after data is set.");
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
        }

        .board-container {
          width: 100%;
          height: 100%;
        }
      </style>
      <div class="board-container"></div>
    `;
  }

  protected onDestroy(): void {
    if (this.viewModel) {
      this.viewModel.destroy();
      this.viewModel = null;
    }
    this.contextPart = null;
  }

  private handleBackgroundDoubleClick(worldX: number, worldY: number): void {
    console.log(`Create task at (${worldX}, ${worldY})`);
    // TODO: Integrate with task service
  }

  private handleSelectionSetRequest(elements: DiagramElement[]): void {
    const selectionManager = this.diagram?.getSelectionManager();
    const stageManager = this.diagram?.getStageManager();
    if (!selectionManager || !stageManager || !this.boardUri) return;

    const selectionArgs: SelectionRequestArgs = {
      elements,
      selectionManager,
      stageManager,
      boardUri: this.boardUri,
    };
    this.getServiceLayer().actionService.doAction(SELECTION_SET_ACTION_ID, selectionArgs);
  }

  private handleSelectionAddRequest(elements: DiagramElement[]): void {
    const selectionManager = this.diagram?.getSelectionManager();
    const stageManager = this.diagram?.getStageManager();
    if (!selectionManager || !stageManager || !this.boardUri) return;

    const selectionArgs: SelectionRequestArgs = {
      elements,
      selectionManager,
      stageManager,
      boardUri: this.boardUri,
    };
    this.getServiceLayer().actionService.doAction(SELECTION_ADD_ACTION_ID, selectionArgs);
  }

  private handleSelectionRemoveRequest(elements: DiagramElement[]): void {
    const selectionManager = this.diagram?.getSelectionManager();
    const stageManager = this.diagram?.getStageManager();
    if (!selectionManager || !stageManager || !this.boardUri) return;

    const selectionArgs: SelectionRequestArgs = {
      elements,
      selectionManager,
      stageManager,
      boardUri: this.boardUri,
    };
    this.getServiceLayer().actionService.doAction(SELECTION_REMOVE_ACTION_ID, selectionArgs);
  }

  private handleMoveComplete(
    elements: DiagramElement[],
    deltaX: number,
    deltaY: number
  ): void {
    const selectionManager = this.diagram?.getSelectionManager();
    if (!selectionManager || !this.boardUri) return;

    const moveArgs: MoveElementsArgs = {
      elements,
      deltaX,
      deltaY,
      selectionManager,
      boardUri: this.boardUri,
    };
    this.getServiceLayer().actionService.doAction(MOVE_ELEMENTS_ACTION_ID, moveArgs);
  }

  private ensureTabAttributes(): void {
    if (!this.hasAttribute("tab-label")) {
      this.setAttribute("tab-label", "Board ..");
      this.setAttribute("closeable", "");
    }
  }
}

defineComponent(BOARD_ACTIVITY_TAG, BoardActivity);

declare global {
  interface HTMLElementTagNameMap {
    [BOARD_ACTIVITY_TAG]: BoardActivity;
  }
}
