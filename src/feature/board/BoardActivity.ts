import { BaseComponent, defineComponent } from "../../gui/core/BaseComponent";
import { getDefaultServiceLayer } from "../../service/ServiceLayer";
import { ActivityType, type IActivity } from "../../service/ActivityService";
import { createUri, parseUri, type Uri, URI_SCHEMES } from "../../core-model/uri";
import { BOARD_ACTIVITY_TAG, BOARD_SERVICE_NAME, IBoardActivityParams } from "./types";
import { createBoardDiagram } from "./editor/diagram-board/BoardDiagram";
import { Diagram } from "./editor/diagram-core/Diagram";
import { BoardSyncAdapter } from "./BoardSyncAdapter";
import type { BoardService } from "./BoardService";

export interface IBoardActivityData {
  name: string;
}

export class BoardActivity extends BaseComponent implements IActivity {
  private data!: IBoardActivityData;
  private diagram: Diagram | null = null;
  private boardUri: Uri | null = null;
  private syncAdapter: BoardSyncAdapter | null = null;

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

  onGetContext(): void {
    if (this.boardUri) {
      const contextService = getDefaultServiceLayer().getContextService();
      if (!contextService.hasEntry(this.boardUri)) {
        contextService.addEntry(this.boardUri, BOARD_SERVICE_NAME);
      }
    }
  }

  onDropContext(): void {
    if (this.boardUri) {
      getDefaultServiceLayer().getContextService().removeEntry(this.boardUri);
    }
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
      onTaskCreate: this.handleTaskCreate.bind(this),
    });

    // Initialize sync adapter
    this.initializeSyncAdapter();
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
    // Cleanup sync adapter
    if (this.syncAdapter) {
      this.syncAdapter.destroy();
      this.syncAdapter = null;
    }

    // Remove from context if present
    if (this.boardUri) {
      getDefaultServiceLayer().getContextService().removeEntry(this.boardUri);
    }
  }

  private handleTaskCreate(worldX: number, worldY: number): void {
    console.log(`Create task at (${worldX}, ${worldY})`);
    // TODO: Integrate with task service
  }

  private async initializeSyncAdapter(): Promise<void> {
    if (!this.diagram || !this.boardUri) return;

    const serviceLayer = getDefaultServiceLayer();
    const boardService = serviceLayer.getFeatureService<BoardService>(BOARD_SERVICE_NAME);

    // Create the sync adapter
    this.syncAdapter = new BoardSyncAdapter(
      boardService,
      this.diagram.getStageManager(),
      this.boardUri
    );

    // Load existing board data
    const parsed = parseUri(this.boardUri);
    if (parsed) {
      const boardData = await boardService.getBoardData(parsed.id);
      if (boardData) {
        this.syncAdapter.loadFromBoardData(boardData);
      }
    }
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
