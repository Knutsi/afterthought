import { BaseComponent, defineComponent } from '../core/BaseComponent';
import { EventListeners } from '../core/utilities';
import { noSelect } from '../styles/cssUtilities';

export class MenuItem extends BaseComponent {
  private events = new EventListeners();

  static get observedAttributes(): string[] {
    return ['label', 'shortcut', 'action-id', 'disabled', 'separator', 'selected'];
  }

  protected onInit(): void {
    this.events.addToShadow(this.shadowRoot, '.menu-item', 'click', this._handleClick);
  }

  protected onDestroy(): void {
    this.events.removeAll();
  }

  protected render(): void {
    const isSeparator = this.hasAttribute('separator');

    if (isSeparator) {
      this.shadowRoot!.innerHTML = `
        <style>
          :host {
            display: block;
            ${noSelect()}
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
      const selected = this.hasAttribute('selected');

      this.shadowRoot!.innerHTML = `
        <style>
          :host {
            display: block;
            ${noSelect()}
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
            ${noSelect()}
          }

          .menu-item:hover:not(.disabled),
          .menu-item.selected:not(.disabled) {
            background-color: var(--theme-color-primary);
            color: var(--theme-color-background);
          }

          .menu-item.disabled {
            opacity: 0.4;
            cursor: default;
          }

          .label {
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 250px;
            ${noSelect()}
          }

          .shortcut {
            margin-left: 32px;
            font-size: 12px;
            opacity: 0.7;
            ${noSelect()}
          }
        </style>
        <div class="menu-item ${disabled ? 'disabled' : ''} ${selected ? 'selected' : ''}" part="menu-item">
          <span class="label">${label}</span>
          <span class="shortcut">${shortcut}</span>
        </div>
      `;
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

defineComponent('menu-item', MenuItem);

declare global {
  interface HTMLElementTagNameMap {
    'menu-item': MenuItem;
  }
}
