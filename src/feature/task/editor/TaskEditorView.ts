import type { IActivityView } from "../../../gui/activity/runtime/types";

export interface ITaskEditorViewState {
  name: string;
  deadline: string;
}

export interface ITaskEditorViewCallbacks {
  onSave(): void;
  onCancel(): void;
  onNameChange(value: string): void;
  onDeadlineChange(value: string): void;
}

export class TaskEditorView implements IActivityView {
  private shadowRoot: ShadowRoot | null = null;
  private callbacks: ITaskEditorViewCallbacks | null = null;
  private rendered = false;

  public setCallbacks(callbacks: ITaskEditorViewCallbacks): void {
    this.callbacks = callbacks;
  }

  public mount(shadowRoot: ShadowRoot): void {
    this.shadowRoot = shadowRoot;
  }

  public render(): void {
    // initial render handled by update
  }

  public update(state: ITaskEditorViewState): void {
    if (!this.shadowRoot) return;

    if (!this.rendered) {
      this.renderInitial(state);
      this.rendered = true;
    } else {
      this.updateDynamic(state);
    }
  }

  private renderInitial(state: ITaskEditorViewState): void {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        input[type="text"],
        input[type="date"] {
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

        input[type="text"]:focus,
        input[type="date"]:focus {
          border-color: var(--theme-color-primary, #2563eb);
          box-shadow: 0 0 0 2px color-mix(in srgb, var(--theme-color-primary, #2563eb) 20%, transparent);
        }

        .fields {
          display: grid;
          gap: 12px;
        }
      </style>
      <at-dialog dialog-title="Edit task">
        <div class="fields">
          <at-form-field label="Name">
            <input type="text" id="name-input" value="${this.escapeAttr(state.name)}" />
          </at-form-field>
          <at-form-field label="Deadline">
            <input type="date" id="deadline-input" value="${this.escapeAttr(state.deadline)}" />
          </at-form-field>
        </div>

        <div slot="actions">
          <at-button variant="secondary" id="cancel-btn">Cancel</at-button>
          <at-button variant="primary" id="save-btn">Save</at-button>
        </div>
      </at-dialog>
    `;

    this.bindEvents();
  }

  private updateDynamic(state: ITaskEditorViewState): void {
    if (!this.shadowRoot) return;

    const nameInput = this.shadowRoot.querySelector("#name-input") as HTMLInputElement | null;
    if (nameInput && nameInput.value !== state.name) {
      nameInput.value = state.name;
    }

    const deadlineInput = this.shadowRoot.querySelector("#deadline-input") as HTMLInputElement | null;
    if (deadlineInput && deadlineInput.value !== state.deadline) {
      deadlineInput.value = state.deadline;
    }
  }

  private bindEvents(): void {
    if (!this.shadowRoot || !this.callbacks) return;

    const cancelBtn = this.shadowRoot.querySelector("#cancel-btn");
    cancelBtn?.addEventListener("click", () => this.callbacks!.onCancel());

    const saveBtn = this.shadowRoot.querySelector("#save-btn");
    saveBtn?.addEventListener("click", () => this.callbacks!.onSave());

    const nameInput = this.shadowRoot.querySelector("#name-input") as HTMLInputElement | null;
    nameInput?.addEventListener("input", () => {
      this.callbacks!.onNameChange(nameInput.value);
    });
    nameInput?.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.callbacks!.onSave();
      }
    });

    const deadlineInput = this.shadowRoot.querySelector("#deadline-input") as HTMLInputElement | null;
    deadlineInput?.addEventListener("input", () => {
      this.callbacks!.onDeadlineChange(deadlineInput.value);
    });
    deadlineInput?.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.callbacks!.onSave();
      }
    });

    const dialog = this.shadowRoot.querySelector("at-dialog");
    dialog?.addEventListener("close", () => this.callbacks!.onCancel());

    requestAnimationFrame(() => {
      nameInput?.focus();
      nameInput?.select();
    });
  }

  private escapeAttr(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  public destroy(): void {
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = "";
    }
    this.shadowRoot = null;
    this.callbacks = null;
  }
}
