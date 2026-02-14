import type { IActivityView } from "../../gui/activity/runtime/types";

export interface INewDatabaseViewState {
  parentDir: string;
  name: string;
  effectiveName: string;
  replaceSpecialSigns: boolean;
  targetDirWarning: string;
}

export interface INewDatabaseViewCallbacks {
  onBrowse(): void;
  onCreate(): void;
  onCancel(): void;
  onNameChange(value: string): void;
  onReplaceSpecialSignsChange(checked: boolean): void;
}

export class NewDatabaseActivityView implements IActivityView {
  private shadowRoot: ShadowRoot | null = null;
  private callbacks: INewDatabaseViewCallbacks | null = null;
  private rendered = false;

  public setCallbacks(callbacks: INewDatabaseViewCallbacks): void {
    this.callbacks = callbacks;
  }

  public mount(shadowRoot: ShadowRoot): void {
    this.shadowRoot = shadowRoot;
  }

  public render(): void {
    if (!this.shadowRoot) return;
    // initial render handled by update
  }

  public update(state: INewDatabaseViewState): void {
    if (!this.shadowRoot) return;

    if (!this.rendered) {
      this.renderInitial(state);
      this.rendered = true;
    } else {
      this.updateDynamic(state);
    }
  }

  private renderInitial(state: INewDatabaseViewState): void {
    if (!this.shadowRoot) return;

    const { parentDir, name, replaceSpecialSigns, targetDirWarning } = state;
    const preview = this.computePreview(state);

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .form {
          display: grid;
          gap: 16px;
        }

        .location-row {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px;
          align-items: end;
        }

        .path-display {
          font-family: var(--theme-font-family, system-ui, -apple-system, sans-serif);
          font-size: var(--theme-font-size, 13px);
          padding: 6px 8px;
          background: color-mix(in srgb, var(--theme-color-secondary, #64748b) 10%, transparent);
          border: 1px solid color-mix(in srgb, var(--theme-color-secondary, #64748b) 25%, transparent);
          border-radius: var(--theme-spacing-border-radius, 5px);
          color: var(--theme-color-text, #1e293b);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-height: 20px;
          direction: rtl;
          text-align: left;
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

        .checkbox-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--theme-font-family, system-ui, -apple-system, sans-serif);
          font-size: var(--theme-font-size, 13px);
          color: var(--theme-color-text, #1e293b);
        }

        .checkbox-row input[type="checkbox"] {
          margin: 0;
        }

        .preview {
          background: color-mix(in srgb, var(--theme-color-secondary, #64748b) 8%, transparent);
          border-radius: var(--theme-spacing-border-radius, 5px);
          padding: 12px;
          display: grid;
          gap: 6px;
          overflow: hidden;
        }

        .preview-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--theme-color-secondary, #64748b);
          margin-bottom: 2px;
        }

        .preview-items {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 4px 6px;
          align-items: center;
          font-size: 12px;
          color: var(--theme-color-text, #1e293b);
        }

        .preview-items .icon {
          opacity: 0.6;
          text-align: center;
        }

        .preview-items .path {
          font-family: ui-monospace, monospace;
          font-size: 11px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          direction: rtl;
          text-align: left;
          min-width: 0;
        }

        .preview-items .path-ltr {
          font-family: ui-monospace, monospace;
          font-size: 11px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
        }

        .warning {
          background: color-mix(in srgb, #f59e0b 15%, transparent);
          border: 1px solid color-mix(in srgb, #f59e0b 40%, transparent);
          border-radius: var(--theme-spacing-border-radius, 5px);
          padding: 8px 12px;
          font-family: var(--theme-font-family, system-ui, -apple-system, sans-serif);
          font-size: var(--theme-font-size, 13px);
          color: var(--theme-color-text, #1e293b);
        }
      </style>
      <at-dialog dialog-title="New Database">
        <div class="form">
          <at-form-field label="Location">
            <div class="location-row">
              <div class="path-display">${parentDir || "No directory selected"}</div>
              <at-button variant="secondary" id="browse-btn">Browse</at-button>
            </div>
          </at-form-field>

          <at-form-field label="Name">
            <input type="text" id="name-input" value="${this.escapeAttr(name)}" placeholder="My Database" />
          </at-form-field>

          <label class="checkbox-row">
            <input type="checkbox" id="replace-special-checkbox" ${replaceSpecialSigns ? "checked" : ""} />
            Replace special signs
          </label>

          ${targetDirWarning ? `<div class="warning" id="target-warning">${this.escapeHtml(targetDirWarning)}</div>` : '<div class="warning" id="target-warning" style="display:none"></div>'}

          <div class="preview">
            <div class="preview-label">Will create</div>
            <div class="preview-items" id="preview-content">
              ${this.renderPreviewContent(preview)}
            </div>
          </div>
        </div>

        <div slot="actions">
          <at-button variant="secondary" id="cancel-btn">Cancel</at-button>
          <at-button variant="primary" id="create-btn" ${!parentDir || !state.effectiveName || targetDirWarning ? "disabled" : ""}>Create</at-button>
        </div>
      </at-dialog>
    `;

    this.bindEvents();
  }

  private updateDynamic(state: INewDatabaseViewState): void {
    if (!this.shadowRoot) return;

    const { parentDir, name, replaceSpecialSigns, targetDirWarning } = state;
    const preview = this.computePreview(state);

    const nameInput = this.shadowRoot.querySelector("#name-input") as HTMLInputElement | null;
    if (nameInput && nameInput.value !== name) {
      nameInput.value = name;
    }

    const pathDisplay = this.shadowRoot.querySelector(".path-display");
    if (pathDisplay) pathDisplay.textContent = parentDir || "No directory selected";

    const previewContent = this.shadowRoot.querySelector("#preview-content");
    if (previewContent) previewContent.innerHTML = this.renderPreviewContent(preview);

    const warningEl = this.shadowRoot.querySelector("#target-warning") as HTMLElement | null;
    if (warningEl) {
      if (targetDirWarning) {
        warningEl.textContent = targetDirWarning;
        warningEl.style.display = "";
      } else {
        warningEl.textContent = "";
        warningEl.style.display = "none";
      }
    }

    const createBtn = this.shadowRoot.querySelector("#create-btn") as HTMLElement | null;
    if (createBtn) {
      const { effectiveName } = state;
      if (!parentDir || !effectiveName || targetDirWarning) {
        createBtn.setAttribute("disabled", "");
      } else {
        createBtn.removeAttribute("disabled");
      }
    }

    const replaceCheckbox = this.shadowRoot.querySelector("#replace-special-checkbox") as HTMLInputElement | null;
    if (replaceCheckbox && replaceCheckbox.checked !== replaceSpecialSigns) {
      replaceCheckbox.checked = replaceSpecialSigns;
    }
  }

  private computePreview(state: INewDatabaseViewState): { basePath: string; dbFile: string } | null {
    const { parentDir, name, effectiveName } = state;
    if (!parentDir || !name) return null;
    const basePath = `${parentDir}/${effectiveName}`;
    return { basePath, dbFile: `${basePath}/${effectiveName}.afdb` };
  }

  private renderPreviewContent(preview: { basePath: string; dbFile: string } | null): string {
    if (!preview) {
      return `<span class="icon">&#128193;</span><span class="path">...</span>`;
    }
    return `
      <span class="icon">&#128193;</span>
      <span class="path">${this.escapeHtml(preview.basePath)}</span>
      <span class="icon">&#128196;</span>
      <span class="path">${this.escapeHtml(preview.dbFile)}</span>
      <span class="icon">&#9729;</span>
      <span class="path-ltr">${this.escapeHtml(preview.basePath)} will be checked into git</span>
    `;
  }

  private bindEvents(): void {
    if (!this.shadowRoot || !this.callbacks) return;

    const browseBtn = this.shadowRoot.querySelector("#browse-btn");
    browseBtn?.addEventListener("click", () => this.callbacks!.onBrowse());

    const cancelBtn = this.shadowRoot.querySelector("#cancel-btn");
    cancelBtn?.addEventListener("click", () => this.callbacks!.onCancel());

    const createBtn = this.shadowRoot.querySelector("#create-btn");
    createBtn?.addEventListener("click", () => this.callbacks!.onCreate());

    const nameInput = this.shadowRoot.querySelector("#name-input") as HTMLInputElement | null;
    nameInput?.addEventListener("input", () => {
      this.callbacks!.onNameChange(nameInput.value);
    });

    const replaceCheckbox = this.shadowRoot.querySelector("#replace-special-checkbox") as HTMLInputElement | null;
    replaceCheckbox?.addEventListener("change", () => {
      this.callbacks!.onReplaceSpecialSignsChange(replaceCheckbox.checked);
    });

    const dialog = this.shadowRoot.querySelector("at-dialog");
    dialog?.addEventListener("close", () => this.callbacks!.onCancel());

    // auto-focus name input
    nameInput?.focus();
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
