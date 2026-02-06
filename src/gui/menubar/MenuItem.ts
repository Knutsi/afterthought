import { BaseComponent, defineComponent } from '../core/BaseComponent';
import { EventListeners } from '../core/utilities';
import { noSelect } from '../styles/cssUtilities';

export class MenuItem extends BaseComponent {
  // React-style callback prop
  public onClick?: (actionId: string, label: string, shortcut: string) => void;

  private events = new EventListeners();

  static get observedAttributes(): string[] {
    return ['label', 'shortcut', 'action-id', 'disabled', 'separator', 'selected'];
  }

  protected onInit(): void {
    // Event listener setup moved to end of render() to survive re-renders
  }

  protected onDestroy(): void {
    this.events.removeAll();
  }

  public activate(): void {
    const disabled = this.hasAttribute('disabled');
    const isSeparator = this.hasAttribute('separator');

    if (disabled || isSeparator) return;

    if (this.onClick) {
      this.onClick(
        this.getAttribute('action-id') || '',
        this.getAttribute('label') || '',
        this.getAttribute('shortcut') || ''
      );
    }
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
      // No event listener needed for separators
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
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 29px;
            align-items: center;
            padding: 4px 24px 4px 12px;
            min-height: 24px;
            cursor: pointer;
            font-size: var(--theme-font-size, 14px);
            font-family: var(--theme-font-family, system-ui, -apple-system, sans-serif);
            color: var(--theme-color-text);
            background-color: var(--theme-color-background);
            transition: background-color 0.1s ease;
            white-space: nowrap;
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
            white-space: nowrap;
            ${noSelect()}
          }

          .shortcut {
            display: flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
            ${noSelect()}
          }

          .shortcut kbd {
            display: inline-block;
            padding: 2px 5px;
            font-size: 11px;
            font-family: inherit;
            line-height: 1;
            border-radius: 3px;
            background: color-mix(in srgb, var(--theme-color-text) 10%, transparent);
            border: 1px solid color-mix(in srgb, var(--theme-color-text) 20%, transparent);
            box-shadow: 0 1px 0 color-mix(in srgb, var(--theme-color-text) 15%, transparent);
          }

          .menu-item:hover:not(.disabled) kbd,
          .menu-item.selected:not(.disabled) kbd {
            background: color-mix(in srgb, var(--theme-color-background) 20%, transparent);
            border-color: color-mix(in srgb, var(--theme-color-background) 30%, transparent);
            box-shadow: 0 1px 0 color-mix(in srgb, var(--theme-color-background) 20%, transparent);
          }

          .shortcut .separator {
            opacity: 0.5;
            font-size: 10px;
          }

          .shortcut .chord-sep {
            opacity: 0.5;
            font-size: 10px;
            margin: 0 3px;
          }
        </style>
        <div class="menu-item ${disabled ? 'disabled' : ''} ${selected ? 'selected' : ''}" part="menu-item">
          <span class="label">${label}</span>
          <span class="shortcut">${this.formatShortcut(shortcut)}</span>
        </div>
      `;

      // Re-attach event listener after render
      // This ensures the listener is attached to the current Shadow DOM element
      this.events.removeAll();  // Clear old listeners
      this.events.addToShadow(this.shadowRoot, '.menu-item', 'click', this._handleClick);
    }
  }

  private formatShortcut(shortcut: string): string {
    if (!shortcut) return '';

    // split by " / " to get alternative shortcuts
    const alternatives = shortcut.split(' / ');

    return alternatives.map((alt, i) => {
      // split by space to get chord strokes (e.g., "Ctrl+N B" -> ["Ctrl+N", "B"])
      const strokes = alt.split(' ').filter(s => s);
      const formattedStrokes = strokes.map(stroke => {
        // split each stroke by "+" to get individual keys
        return stroke.split('+').map(key => `<kbd>${key.trim()}</kbd>`).join('');
      }).join('<span class="chord-sep">+</span>');

      const separator = i < alternatives.length - 1 ? '<span class="separator">/</span>' : '';
      return formattedStrokes + separator;
    }).join('');
  }

  private _handleClick = (e: Event): void => {
    e.stopPropagation();

    const disabled = this.hasAttribute('disabled');
    const isSeparator = this.hasAttribute('separator');

    if (disabled || isSeparator) return;

    if (this.onClick) {
      this.onClick(
        this.getAttribute('action-id') || '',
        this.getAttribute('label') || '',
        this.getAttribute('shortcut') || ''
      );
    }
  };
}

defineComponent('menu-item', MenuItem);

declare global {
  interface HTMLElementTagNameMap {
    'menu-item': MenuItem;
  }
}
