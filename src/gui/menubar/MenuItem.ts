export class MenuItem extends HTMLElement {
  private _initialized: boolean = false;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes(): string[] {
    return ['label', 'shortcut', 'action-id', 'disabled', 'separator'];
  }

  connectedCallback(): void {
    if (this._initialized) return;
    this.render();
    this.addEventListeners();
    this._initialized = true;
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue) return;
    if (this._initialized) {
      this.render();
    }
  }

  disconnectedCallback(): void {
    this.removeEventListeners();
  }

  private render(): void {
    const isSeparator = this.hasAttribute('separator');

    if (isSeparator) {
      this.shadowRoot!.innerHTML = `
        <style>
          :host {
            display: block;
            user-select: none;
          }
          .separator {
            height: 1px;
            margin: 4px 8px;
            background-color: color-mix(in srgb, var(--theme-color-secondary) 30%, transparent);
            border: none;
          }
        </style>
        <div class="separator"></div>
      `;
    } else {
      const label = this.getAttribute('label') || '';
      const shortcut = this.getAttribute('shortcut') || '';
      const disabled = this.hasAttribute('disabled');

      this.shadowRoot!.innerHTML = `
        <style>
          :host {
            display: block;
            user-select: none;
          }

          .menu-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 4px 24px 4px 12px;
            min-height: 24px;
            cursor: pointer;
            font-size: var(--theme-font-size, 14px);
            font-family: var(--theme-font-family, system-ui, -apple-system, sans-serif);
            color: var(--theme-color-text);
            background-color: var(--theme-color-background);
            transition: background-color 0.1s ease;
          }

          .menu-item:hover:not(.disabled) {
            background-color: var(--theme-color-primary);
            color: var(--theme-color-background);
          }

          .menu-item.disabled {
            opacity: 0.4;
            cursor: default;
          }

          .label {
            flex: 1;
          }

          .shortcut {
            margin-left: 32px;
            font-size: 12px;
            opacity: 0.7;
          }
        </style>
        <div class="menu-item ${disabled ? 'disabled' : ''}" part="menu-item">
          <span class="label">${label}</span>
          <span class="shortcut">${shortcut}</span>
        </div>
      `;
    }
  }

  private addEventListeners(): void {
    const menuItem = this.shadowRoot?.querySelector('.menu-item');
    if (menuItem) {
      menuItem.addEventListener('click', this._handleClick);
    }
  }

  private removeEventListeners(): void {
    const menuItem = this.shadowRoot?.querySelector('.menu-item');
    if (menuItem) {
      menuItem.removeEventListener('click', this._handleClick);
    }
  }

  private _handleClick = (e: Event): void => {
    e.stopPropagation();

    const disabled = this.hasAttribute('disabled');
    const isSeparator = this.hasAttribute('separator');

    if (disabled || isSeparator) return;

    // Dispatch custom event for parent Menu to handle
    this.dispatchEvent(new CustomEvent('menuitem-click', {
      bubbles: true,
      composed: true,
      detail: {
        label: this.getAttribute('label'),
        actionId: this.getAttribute('action-id'),
        shortcut: this.getAttribute('shortcut')
      }
    }));
  };
}

export function setupMenuItem(): void {
  customElements.define('menu-item', MenuItem);
  console.log("Feature added: MenuItem");
}

declare global {
  interface HTMLElementTagNameMap {
    'menu-item': MenuItem;
  }
}
