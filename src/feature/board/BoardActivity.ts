import { BaseComponent, defineComponent } from "../../gui/core/BaseComponent";

export class BoardActivity extends BaseComponent {
  static get observedAttributes(): string[] {
    return [];
  }

  protected onInit(): void {
    this.ensureTabAttributes();
  }

  protected render(): void {
    if (!this.shadowRoot) return;

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
      <div class="board-content">BOARD</div>
    `;
  }

  private ensureTabAttributes(): void {
    if (!this.hasAttribute("tab-label")) {
      this.setAttribute("tab-label", "Board");
      this.setAttribute("closeable", "");
    }
  }
}

defineComponent("board-activity", BoardActivity);

declare global {
  interface HTMLElementTagNameMap {
    "board-activity": BoardActivity;
  }
}
