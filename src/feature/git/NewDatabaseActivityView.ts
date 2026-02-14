import type { IActivityView } from "../../gui/activity/runtime/types";

export interface INewDatabaseViewCallbacks {
  onBrowse(): void;
  onCreate(): void;
  onCancel(): void;
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

  public update(state: { parentDir: string; name: string; createNewDirectory: boolean }): void {
    if (!this.shadowRoot) return;

    if (!this.rendered) {
      this.renderInitial(state);
      this.rendered = true;
    } else {
      this.updateDynamic(state);
    }
  }

  private renderInitial(state: { parentDir: string; name: string; createNewDirectory: boolean }): void {
    if (!this.shadowRoot) return;

    const { parentDir, name, createNewDirectory } = state;
    const { previewDir, previewFile } = this.computePreview(state);

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
        }

        .preview-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--theme-color-secondary, #64748b);
          margin-bottom: 2px;
        }

        .preview-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--theme-color-text, #1e293b);
        }

        .preview-row .icon {
          flex-shrink: 0;
          opacity: 0.6;
        }

        .preview-row .path {
          font-family: ui-monospace, monospace;
          font-size: 11px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          direction: rtl;
          text-align: left;
        }

        .preview-row .type-label {
          flex-shrink: 0;
          font-size: 11px;
          color: var(--theme-color-secondary, #64748b);
          min-width: 28px;
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
            <input type="checkbox" id="create-dir-checkbox" ${createNewDirectory ? "checked" : ""} />
            Create new directory
          </label>

          <div class="preview">
            <div class="preview-label">Will create</div>
            <div class="preview-row">
              <span class="type-label">Dir</span>
              <span class="icon">&#128193;</span>
              <span class="path" id="preview-dir">${previewDir}</span>
            </div>
            <div class="preview-row">
              <span class="type-label">File</span>
              <span class="icon">&#128196;</span>
              <span class="path" id="preview-file">${previewFile}</span>
            </div>
          </div>
        </div>

        <div slot="actions">
          <at-button variant="secondary" id="cancel-btn">Cancel</at-button>
          <at-button variant="primary" id="create-btn" ${!parentDir || !name ? "disabled" : ""}>Create</at-button>
        </div>
      </at-dialog>
    `;

    this.bindEvents();
  }

  private updateDynamic(state: { parentDir: string; name: string; createNewDirectory: boolean }): void {
    if (!this.shadowRoot) return;

    const { parentDir, name, createNewDirectory } = state;
    const { previewDir, previewFile } = this.computePreview(state);

    const pathDisplay = this.shadowRoot.querySelector(".path-display");
    if (pathDisplay) pathDisplay.textContent = parentDir || "No directory selected";

    const previewDirEl = this.shadowRoot.querySelector("#preview-dir");
    if (previewDirEl) previewDirEl.textContent = previewDir;

    const previewFileEl = this.shadowRoot.querySelector("#preview-file");
    if (previewFileEl) previewFileEl.textContent = previewFile;

    const createBtn = this.shadowRoot.querySelector("#create-btn") as HTMLElement | null;
    if (createBtn) {
      if (!parentDir || !name) {
        createBtn.setAttribute("disabled", "");
      } else {
        createBtn.removeAttribute("disabled");
      }
    }

    const checkbox = this.shadowRoot.querySelector("#create-dir-checkbox") as HTMLInputElement | null;
    if (checkbox && checkbox.checked !== createNewDirectory) {
      checkbox.checked = createNewDirectory;
    }
  }

  private computePreview(state: { parentDir: string; name: string; createNewDirectory: boolean }): { previewDir: string; previewFile: string } {
    const { parentDir, name, createNewDirectory } = state;
    if (createNewDirectory) {
      return {
        previewDir: parentDir && name ? `${parentDir}/${name}` : parentDir || "...",
        previewFile: parentDir && name ? `${parentDir}/${name}/${name}.afdb` : "...",
      };
    }
    return {
      previewDir: parentDir || "...",
      previewFile: parentDir && name ? `${parentDir}/${name}.afdb` : "...",
    };
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
      this.dispatchNameChange(nameInput.value);
    });

    const checkbox = this.shadowRoot.querySelector("#create-dir-checkbox") as HTMLInputElement | null;
    checkbox?.addEventListener("change", () => {
      this.dispatchCheckboxChange(checkbox.checked);
    });

    const dialog = this.shadowRoot.querySelector("at-dialog");
    dialog?.addEventListener("close", () => this.callbacks!.onCancel());

    // auto-focus name input
    nameInput?.focus();
  }

  private dispatchNameChange(value: string): void {
    this.shadowRoot?.host.dispatchEvent(
      new CustomEvent("name-change", { detail: { value }, bubbles: false })
    );
  }

  private dispatchCheckboxChange(checked: boolean): void {
    this.shadowRoot?.host.dispatchEvent(
      new CustomEvent("create-dir-change", { detail: { checked }, bubbles: false })
    );
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
