import { BaseComponent, defineComponent } from "../core/BaseComponent";

const BUTTON_TAG = "at-button";

export class Button extends BaseComponent {
  static get observedAttributes(): string[] {
    return ["variant", "disabled"];
  }

  protected render(): void {
    if (!this.shadowRoot) return;

    const variant = this.getAttribute("variant") || "secondary";
    const disabled = this.hasAttribute("disabled");

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
        }

        button {
          font-family: var(--theme-font-family, system-ui, -apple-system, sans-serif);
          font-size: var(--theme-font-size, 13px);
          padding: 6px 16px;
          border-radius: var(--theme-spacing-border-radius, 5px);
          cursor: pointer;
          border: 1px solid transparent;
          transition: background-color 0.15s, border-color 0.15s;
          line-height: 1.4;
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        button.primary {
          background: var(--theme-color-primary, #2563eb);
          color: #fff;
          border-color: var(--theme-color-primary, #2563eb);
        }

        button.primary:hover:not(:disabled) {
          filter: brightness(1.1);
        }

        button.secondary {
          background: transparent;
          color: var(--theme-color-text, #1e293b);
          border-color: var(--theme-color-secondary, #64748b);
        }

        button.secondary:hover:not(:disabled) {
          background: color-mix(in srgb, var(--theme-color-secondary, #64748b) 15%, transparent);
        }

        button.ghost {
          background: transparent;
          color: var(--theme-color-text, #1e293b);
          border-color: transparent;
        }

        button.ghost:hover:not(:disabled) {
          background: color-mix(in srgb, var(--theme-color-secondary, #64748b) 10%, transparent);
        }
      </style>
      <button class="${variant}" ${disabled ? "disabled" : ""}>
        <slot></slot>
      </button>
    `;
  }
}

defineComponent(BUTTON_TAG, Button);

declare global {
  interface HTMLElementTagNameMap {
    [BUTTON_TAG]: Button;
  }
}
