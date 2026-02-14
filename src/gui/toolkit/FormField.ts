import { BaseComponent, defineComponent } from "../core/BaseComponent";

const FORM_FIELD_TAG = "at-form-field";

export class FormField extends BaseComponent {
  static get observedAttributes(): string[] {
    return ["label", "description"];
  }

  protected render(): void {
    if (!this.shadowRoot) return;

    const label = this.getAttribute("label") || "";
    const description = this.getAttribute("description") || "";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .field {
          display: grid;
          gap: 4px;
        }

        .label {
          font-family: var(--theme-font-family, system-ui, -apple-system, sans-serif);
          font-size: var(--theme-font-size, 13px);
          font-weight: 600;
          color: var(--theme-color-text, #1e293b);
        }

        .description {
          font-family: var(--theme-font-family, system-ui, -apple-system, sans-serif);
          font-size: 11px;
          color: var(--theme-color-secondary, #64748b);
        }
      </style>
      <div class="field">
        ${label ? `<label class="label">${label}</label>` : ""}
        <slot></slot>
        ${description ? `<span class="description">${description}</span>` : ""}
      </div>
    `;
  }
}

defineComponent(FORM_FIELD_TAG, FormField);

declare global {
  interface HTMLElementTagNameMap {
    [FORM_FIELD_TAG]: FormField;
  }
}
