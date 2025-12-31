import { getDefaultServiceLayer } from "../../service/ServiceLayer";
import { ActionEvents, type IAction } from "../../service/ActionService";

// 1. Define the class
export class ActionList extends HTMLElement {
  // Private state with type annotation
  private _initialized: boolean = false;
  private _actionService = getDefaultServiceLayer().actionService;
  private _actionAddedHandler?: (e: Event) => void;

  constructor() {
    super();
    // Attach Shadow DOM
    this.attachShadow({ mode: 'open' });
  }

  // 2. Define observed attributes
  static get observedAttributes(): string[] {
    return [];
  }

  // 3. Lifecycle: Connected
  connectedCallback(): void {
    if (this._initialized) return;

    this.render();
    this.addEventListeners();
    this._initialized = true;
  }

  // 4. Lifecycle: Attribute Changed
  attributeChangedCallback(
    _name: string,
    oldValue: string | null,
    newValue: string | null
  ): void {
    if (oldValue === newValue) return;
  }

  // 5. Lifecycle: Disconnected
  disconnectedCallback(): void {
    this.removeEventListeners();
  }

  // --- Methods ---

  private render(): void {
    const actions = this._actionService.getActions();
    
    const actionsHtml = actions.length > 0
      ? actions.map(action => this.renderAction(action)).join('')
      : '<div class="no-actions">No actions registered</div>';

    this.shadowRoot!.innerHTML = `
      <style>
        :host { 
          display: block; 
          padding: 16px; 
          border-left: 1px solid #ccc; 
          background-color: #f9f9f9;
          height: 100%;
          overflow-y: auto;
        }
        h2 {
          margin-top: 0;
          margin-bottom: 16px;
          font-size: 1.2em;
          color: #333;
        }
        .action-item {
          padding: 8px;
          margin-bottom: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background-color: #fff;
        }
        .action-name {
          font-weight: bold;
          color: #333;
          margin-bottom: 4px;
        }
        .action-id {
          font-size: 0.85em;
          color: #666;
          font-family: monospace;
          margin-bottom: 4px;
        }
        .action-shortcut {
          font-size: 0.9em;
          color: #888;
          margin-bottom: 4px;
        }
        .action-group {
          font-size: 0.85em;
          color: #999;
          font-style: italic;
        }
        .no-actions {
          color: #999;
          font-style: italic;
          padding: 16px;
          text-align: center;
        }
      </style>
      <h2>Actions</h2>
      <div class="actions-list">
        ${actionsHtml}
      </div>
    `;
  }

  private renderAction(action: IAction): string {
    const subGroup = action.menuSubGroup ? ` > ${this.escapeHtml(action.menuSubGroup)}` : '';
    return `
      <div class="action-item">
        <div class="action-name">${this.escapeHtml(action.name)}</div>
        <div class="action-id">${this.escapeHtml(action.id)}</div>
        <div class="action-shortcut">Shortcut: ${this.escapeHtml(action.shortcut)}</div>
        <div class="action-group">Group: ${this.escapeHtml(action.menuGroup)}${subGroup}</div>
      </div>
    `;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private addEventListeners(): void {
    // Listen for new actions being added
    this._actionAddedHandler = () => {
      this.render();
    };
    this._actionService.addEventListener(ActionEvents.ACTION_ADDED, this._actionAddedHandler);
  }

  private removeEventListeners(): void {
    if (this._actionAddedHandler) {
      this._actionService.removeEventListener(ActionEvents.ACTION_ADDED, this._actionAddedHandler);
      this._actionAddedHandler = undefined;
    }
  }
}

// 7. TypeScript Specific: Global Type Augmentation
// This allows TypeScript to recognize document.createElement('action-list')
declare global {
  interface HTMLElementTagNameMap {
    'action-list': ActionList;
  }
}
