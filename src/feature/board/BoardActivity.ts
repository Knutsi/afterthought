import { BaseComponent, defineComponent } from "../../gui/core/BaseComponent";
import { BOARD_ACTIVITY_TAG, BOARD_SERVICE_NAME } from "./types";
import { BoardService } from "./BoardService";
import { getDefaultServiceLayer, ServiceLayer } from "../../service/ServiceLayer";
import { createBoardDiagram } from "./editor/diagram-board/BoardDiagram";
import { Diagram } from "./editor/diagram-core/Diagram";

export interface IBoardActivityData {
  name: string;
}

export class BoardActivity extends BaseComponent {
  private boardService!: BoardService;
  private serviceLayer!: ServiceLayer;
  private data!: IBoardActivityData;
  private diagram: Diagram | null = null;
  static get observedAttributes(): string[] {
    return [];
  }

  protected onInit(): void {
    this.ensureTabAttributes();

    this.serviceLayer = getDefaultServiceLayer();
    this.boardService = this.serviceLayer.getFeatureService(BOARD_SERVICE_NAME);

    this.data = this.boardService.getEmptyBoardData();
    this.setAttribute("tab-label", this.data.name);
    this.render();

    const container = this.shadowRoot!.querySelector(".board-container") as HTMLElement;
    if (!container) {
      throw new Error("Board container not found");
    }
    // sets up the main event loop of the board:
    this.diagram = createBoardDiagram(container);
    // TODO: load board data
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
