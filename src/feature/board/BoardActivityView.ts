import type { ServiceLayer } from "../../service/ServiceLayer";
import type { IActivityView } from "../../gui/activity/runtime/types";
import { createBoardDiagram, type BoardDiagramOptions } from "./editor/diagram-board/BoardDiagram";
import type { Diagram } from "./editor/diagram-core/Diagram";

export class BoardActivityView implements IActivityView {
  private shadowRoot: ShadowRoot | null = null;
  private isRendered: boolean = false;

  public mount(shadowRoot: ShadowRoot): void {
    this.shadowRoot = shadowRoot;
  }

  public render(): void {
    if (!this.shadowRoot || this.isRendered) {
      return;
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
    this.isRendered = true;
  }

  public destroy(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = "";
    this.shadowRoot = null;
    this.isRendered = false;
  }

  public getBoardContainer(): HTMLElement {
    if (!this.shadowRoot) {
      throw new Error("Board shadow root not mounted");
    }
    const container = this.shadowRoot.querySelector(".board-container") as HTMLElement | null;
    if (!container) {
      throw new Error("Board container not found");
    }
    return container;
  }

  public createDiagram(options: BoardDiagramOptions, serviceLayer: ServiceLayer): Diagram {
    const container = this.getBoardContainer();
    return createBoardDiagram(container, options, serviceLayer);
  }
}
