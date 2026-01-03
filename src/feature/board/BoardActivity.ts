import { BaseComponent, defineComponent } from "../../gui/core/BaseComponent";
import { BOARD_ACTIVITY_TAG, BOARD_SERVICE_NAME } from "./types";
import { BoardService } from "./BoardService";
import { getDefaultServiceLayer, ServiceLayer } from "../../service/ServiceLayer";

export interface IBoardActivityData {
  name: string;
}

export class BoardActivity extends BaseComponent {
  private boardService!: BoardService;
  private serviceLayer!: ServiceLayer;
  private data!: IBoardActivityData;

  static get observedAttributes(): string[] {
    return [];
  }

  protected onInit(): void {
    this.ensureTabAttributes();

    this.serviceLayer = getDefaultServiceLayer();
    this.boardService = this.serviceLayer.getFeatureService(BOARD_SERVICE_NAME);
    console.log("BoardActivity initialized", this.boardService);

    this.data = this.boardService.getEmptyBoardData();
    this.setAttribute("tab-label", this.data.name);
    this.render();
  }

  protected render(): void {
    if (!this.shadowRoot) return;

    if (!this.data) {
      this.shadowRoot.innerHTML = `<div class="board-content">...</div>`;
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
        }

        .board-content {
          padding: 16px;
          color: var(--theme-color-text, #333);
          font-size: var(--theme-font-size, 14px);
        }
      </style>
      <div class="board-content">BOARD: ${this.data.name}</div>
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
