import { BaseComponent, defineComponent } from "../../gui/core/BaseComponent";
import { getDefaultServiceLayer } from "../../service/ServiceLayer";
import { ActivityEvents } from "../../service/ActivityService";
import { createUri, type Uri, URI_SCHEMES } from "../../service/context/types";
import { BOARD_ACTIVITY_TAG, BOARD_SERVICE_NAME, IBoardActivityParams } from "./types";
import { createBoardDiagram } from "./editor/diagram-board/BoardDiagram";
import { Diagram } from "./editor/diagram-core/Diagram";

export interface IBoardActivityData {
  name: string;
}

export class BoardActivity extends BaseComponent {
  private data!: IBoardActivityData;
  private diagram: Diagram | null = null;
  private boardUri: Uri | null = null;
  private activitySwitchHandler = () => this.handleActivitySwitch();

  static get observedAttributes(): string[] {
    return [];
  }

  protected onInit(): void {
    this.ensureTabAttributes();

    const argumentJson = this.getAttribute("data-parameters");
    const args = JSON.parse(argumentJson!) as IBoardActivityParams;

    this.data = { name: args.name };
    this.setAttribute("tab-label", args.name);

    // Build the board URI but don't add to context yet - handleActivitySwitch will do that
    this.boardUri = createUri(URI_SCHEMES.BOARD, args.openBoardId ?? crypto.randomUUID());

    // Listen for activity switches to manage context
    const activityService = getDefaultServiceLayer().getActivityService();
    activityService.addEventListener(ActivityEvents.ACTIVITY_SWITCHED, this.activitySwitchHandler);

    // Check if we're the active activity and add to context if so
    this.handleActivitySwitch();

    this.render();

    const container = this.shadowRoot!.querySelector(".board-container") as HTMLElement;
    if (!container) {
      throw new Error("Board container not found");
    }
    // sets up the main event loop of the board:
    this.diagram = createBoardDiagram(container);
    // TODO: load board data
    console.log("Board arguments: ", this.getAttribute("data-parameters"))
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
    // Remove activity switch listener
    const activityService = getDefaultServiceLayer().getActivityService();
    activityService.removeEventListener(ActivityEvents.ACTIVITY_SWITCHED, this.activitySwitchHandler);

    // Remove from context if present
    if (this.boardUri) {
      getDefaultServiceLayer().getContextService().removeEntry(this.boardUri);
    }
  }

  private handleActivitySwitch(): void {
    const activityService = getDefaultServiceLayer().getActivityService();
    const contextService = getDefaultServiceLayer().getContextService();
    const isActive = activityService.getActiveActivityId() === this.id;

    if (isActive && this.boardUri) {
      // Becoming active - add to context
      if (!contextService.hasEntry(this.boardUri)) {
        contextService.addEntry(this.boardUri, BOARD_SERVICE_NAME);
      }
    } else if (!isActive && this.boardUri) {
      // Becoming inactive - remove from context
      contextService.removeEntry(this.boardUri);
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
