import type { IActivityView } from "../activity/runtime/types";

export interface ITextPromptViewState {
  title: string;
  value: string;
  placeholder: string;
  confirmLabel: string;
}

export interface ITextPromptViewCallbacks {
  onConfirm(): void;
  onCancel(): void;
  onValueChange(value: string): void;
}

export class TextPromptView implements IActivityView {
  private shadowRoot: ShadowRoot | null = null;
  private callbacks: ITextPromptViewCallbacks | null = null;
  private rendered = false;

  public setCallbacks(callbacks: ITextPromptViewCallbacks): void {
    this.callbacks = callbacks;
  }

  public mount(shadowRoot: ShadowRoot): void {
    this.shadowRoot = shadowRoot;
  }

  public render(): void {
    // initial render handled by update
  }

  public update(state: ITextPromptViewState): void {
    if (!this.shadowRoot) return;

    if (!this.rendered) {
      this.renderInitial(state);
      this.rendered = true;
    } else {
      this.updateDynamic(state);
    }
  }

  private renderInitial(state: ITextPromptViewState): void {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        input[type="text"] {
          font-family: var(--theme-font-family, system-ui, -apple-system, sans-serif);
          font-size: var(--theme-font-size, 13px);
          padding: 6px 8px;
          border: 1px solid color-mix(in srgb, var(--theme-color-secondary, #64748b) 40%, transparent);
          border-radius: var(--theme-spacing-border-radius, 5px);
          background: var(--theme-color-background, #ffffff);
          color: var(--theme-color-text, #1e293b);
          outline: none;
          width: 100%;
          box-sizing: border-box;
        }

        input[type="text"]:focus {
          border-color: var(--theme-color-primary, #2563eb);
          box-shadow: 0 0 0 2px color-mix(in srgb, var(--theme-color-primary, #2563eb) 20%, transparent);
        }
      </style>
      <at-dialog dialog-title="${this.escapeAttr(state.title)}">
        <at-form-field label="${this.escapeAttr(state.title)}">
          <input type="text" id="prompt-input" value="${this.escapeAttr(state.value)}" placeholder="${this.escapeAttr(state.placeholder)}" />
        </at-form-field>

        <div slot="actions">
          <at-button variant="secondary" id="cancel-btn">Cancel</at-button>
          <at-button variant="primary" id="confirm-btn">${this.escapeHtml(state.confirmLabel)}</at-button>
        </div>
      </at-dialog>
    `;

    this.bindEvents();
  }

  private updateDynamic(state: ITextPromptViewState): void {
    if (!this.shadowRoot) return;

    const input = this.shadowRoot.querySelector("#prompt-input") as HTMLInputElement | null;
    if (input && input.value !== state.value) {
      input.value = state.value;
    }
  }

  private bindEvents(): void {
    if (!this.shadowRoot || !this.callbacks) return;

    const cancelBtn = this.shadowRoot.querySelector("#cancel-btn");
    cancelBtn?.addEventListener("click", () => this.callbacks!.onCancel());

    const confirmBtn = this.shadowRoot.querySelector("#confirm-btn");
    confirmBtn?.addEventListener("click", () => this.callbacks!.onConfirm());

    const input = this.shadowRoot.querySelector("#prompt-input") as HTMLInputElement | null;
    input?.addEventListener("input", () => {
      this.callbacks!.onValueChange(input.value);
    });
    input?.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.callbacks!.onConfirm();
      }
    });

    const dialog = this.shadowRoot.querySelector("at-dialog");
    dialog?.addEventListener("close", () => this.callbacks!.onCancel());

    input?.focus();
    input?.select();
  }

  private escapeAttr(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  private escapeHtml(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  public destroy(): void {
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = "";
    }
    this.shadowRoot = null;
    this.callbacks = null;
  }
}
