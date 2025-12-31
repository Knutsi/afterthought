import { BaseComponent, defineComponent } from '../core/BaseComponent';
import { EventListeners, useMutationObserver, discoverChildren } from '../core/utilities';
import { noSelect } from '../styles/cssUtilities';

export class Menu extends BaseComponent {
  private _isOpen: boolean = false;
  private events = new EventListeners();
  private cleanupMutationObserver: (() => void) | null = null;

  static get observedAttributes(): string[] {
    return ['label', 'open'];
  }

  protected onInit(): void {
    this.discoverMenuItems();
    this.events.addToShadow(this.shadowRoot, '.menu-button', 'mousedown', this._handleButtonClick);
    this.events.add(this, 'mouseenter', this._handleMouseEnter);
    this.events.add(this, 'menuitem-click', this._handleMenuItemClick);
    this.events.add(document, 'click', this._handleDocumentClick);

    this.cleanupMutationObserver = useMutationObserver(this, () => {
      this.discoverMenuItems();
    }, { childList: true, subtree: false });
  }

  protected onDestroy(): void {
    this.events.removeAll();
    this.cleanupMutationObserver?.();
  }

  protected onAttributeChange(name: string, _oldValue: string | null, _newValue: string | null): void {
    if (!this._initialized) return;

    if (name === 'open') {
      this._isOpen = this.hasAttribute('open');
      this.updateDropdownVisibility();
    } else {
      this.render();
    }
  }

  private discoverMenuItems(): void {
    // Discover menu items (currently unused but maintained for future extensibility)
    discoverChildren(this, 'menu-item');
  }

  protected render(): void {
    const label = this.getAttribute('label') || '';

    this.shadowRoot!.innerHTML = `
      <style>
        :host {
          display: inline-block;
          position: relative;
          ${noSelect()}
        }

        .menu-button {
          padding: 6px 12px;
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: var(--theme-font-size, 14px);
          font-family: var(--theme-font-family, system-ui, -apple-system, sans-serif);
          color: var(--theme-color-text);
          ${noSelect()}
          height: var(--theme-size-menubar-height, 32px);
          display: flex;
          align-items: center;
        }

        .menu-button:hover,
        .menu-button.active {
          background-color: color-mix(in srgb, var(--theme-color-primary) 15%, transparent);
        }

        .menu-button.open {
          background-color: var(--theme-color-primary);
          color: var(--theme-color-background);
        }

        .dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          min-width: 180px;
          background-color: var(--theme-color-background);
          border: 1px solid color-mix(in srgb, var(--theme-color-secondary) 40%, transparent);
          border-radius: var(--theme-spacing-border-radius);
          box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.2);
          z-index: 1000;
          visibility: hidden;
          padding: 4px 0;
          ${noSelect()}
        }

        .dropdown.open {
          visibility: visible;
        }

        slot {
          display: block;
        }
      </style>
      <button class="menu-button" part="menu-button" role="button" aria-haspopup="true" aria-expanded="${this._isOpen}">
        <span class="label">${label}</span>
      </button>
      <div class="dropdown" part="dropdown" role="menu">
        <slot></slot>
      </div>
    `;

    this.updateDropdownVisibility();
  }

  private updateDropdownVisibility(): void {
    const dropdown = this.shadowRoot?.querySelector('.dropdown');
    const button = this.shadowRoot?.querySelector('.menu-button');

    if (!dropdown || !button) return;

    if (this._isOpen) {
      dropdown.classList.add('open');
      button.classList.add('open');
      button.setAttribute('aria-expanded', 'true');
    } else {
      dropdown.classList.remove('open');
      button.classList.remove('open');
      button.setAttribute('aria-expanded', 'false');
    }
  }

  public open(): void {
    this._isOpen = true;
    this.setAttribute('open', '');
    this.updateDropdownVisibility();

    // Notify parent MenuBar
    this.dispatchEvent(new CustomEvent('menu-opened', {
      bubbles: true,
      composed: true
    }));
  }

  public close(): void {
    this._isOpen = false;
    this.removeAttribute('open');
    this.updateDropdownVisibility();
  }

  private _handleButtonClick = (e: Event): void => {
    e.stopPropagation();

    if (this._isOpen) {
      this.close();
    } else {
      this.open();
    }
  };

  private _handleMouseEnter = (): void => {
    // Check if ANY menu in parent menubar is open
    const menuBar = this.parentElement;
    if (menuBar && menuBar.tagName.toLowerCase() === 'menu-bar') {
      const hasOpenMenu = (menuBar as any).hasOpenMenu?.();
      if (hasOpenMenu && !this._isOpen) {
        this.open();
      }
    }
  };

  private _handleDocumentClick = (e: Event): void => {
    if (!this._isOpen) return;

    const target = e.target as Node;

    // Check if click is outside this menu
    if (!this.contains(target) && !this.shadowRoot?.contains(target)) {
      this.close();
    }
  };

  private _handleMenuItemClick = (e: Event): void => {
    const customEvent = e as CustomEvent;

    // Close menu when item is clicked
    this.close();

    // Forward event to menubar for potential action execution
    this.dispatchEvent(new CustomEvent('menu-action', {
      bubbles: true,
      composed: true,
      detail: customEvent.detail
    }));
  };
}

defineComponent('menu-menu', Menu);

declare global {
  interface HTMLElementTagNameMap {
    'menu-menu': Menu;
  }
}
