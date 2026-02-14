import { BaseComponent, defineComponent } from "../core/BaseComponent";

const DIALOG_TAG = "at-dialog";

export class Dialog extends BaseComponent {
  static get observedAttributes(): string[] {
    return ["dialog-title"];
  }

  protected render(): void {
    if (!this.shadowRoot) return;

    const title = this.getAttribute("dialog-title") || "";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          min-width: 420px;
          max-width: 560px;
          background: var(--theme-color-background, #ffffff);
          color: var(--theme-color-text, #1e293b);
          border-radius: 8px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.24);
          font-family: var(--theme-font-family, system-ui, -apple-system, sans-serif);
          font-size: var(--theme-font-size, 13px);
          overflow: hidden;
        }

        .title-bar {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid color-mix(in srgb, var(--theme-color-secondary, #64748b) 25%, transparent);
        }

        .title {
          font-size: 14px;
          font-weight: 600;
        }

        .close-button {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--theme-color-secondary, #64748b);
          padding: 4px;
          border-radius: var(--theme-spacing-border-radius, 5px);
          display: grid;
          place-items: center;
          width: 24px;
          height: 24px;
          font-size: 16px;
          line-height: 1;
        }

        .close-button:hover {
          background: color-mix(in srgb, var(--theme-color-secondary, #64748b) 15%, transparent);
          color: var(--theme-color-text, #1e293b);
        }

        .content {
          padding: 16px;
          overflow-y: auto;
          max-height: 60vh;
        }

        .actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding: 12px 16px;
          border-top: 1px solid color-mix(in srgb, var(--theme-color-secondary, #64748b) 25%, transparent);
        }
      </style>
      <div class="title-bar">
        <span class="title">${title}</span>
        <button class="close-button" id="close-btn">&times;</button>
      </div>
      <div class="content">
        <slot></slot>
      </div>
      <div class="actions">
        <slot name="actions"></slot>
      </div>
    `;

    this.shadowRoot.getElementById("close-btn")!.addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent("close", { bubbles: true, composed: true }));
    });
  }
}

defineComponent(DIALOG_TAG, Dialog);

declare global {
  interface HTMLElementTagNameMap {
    [DIALOG_TAG]: Dialog;
  }
}
