import { BaseComponent, defineComponent } from "../core/BaseComponent";
import { EventListeners } from "../core/utilities";
import { noSelect } from "../styles/cssUtilities";

export class MenuBar extends BaseComponent {
  private _menus: HTMLElement[] = [];
  private _currentOpenMenu: HTMLElement | null = null;
  private events = new EventListeners();
  private cleanupMutationObserver: (() => void) | null = null;

  static get observedAttributes(): string[] {
    return [];
  }

  protected onInit(): void {
    this.discoverMenus();

    // Listen for menu-opened events to track which menu is open
    this.events.add(this, "menu-opened", this._handleMenuOpened);

    // Listen for menu-action events (when menu item is clicked)
    this.events.add(this, "menu-action", this._handleMenuAction);

    // Listen for clicks outside menubar to close menus
    this.events.add(document, "click", this._handleDocumentClick);

    // Listen for keyboard navigation
    this.events.add(this, "keydown", this._handleKeydown as EventListener);

    // Watch for changes in DynamicMenuBar's children (menu elements being added/removed)
    const menuBarElement = this.shadowRoot?.host as HTMLElement;
    if (menuBarElement) {
      const parentShadowRoot = menuBarElement.getRootNode() as ShadowRoot;
      const dynamicMenuBar = parentShadowRoot?.host as HTMLElement;

      if (dynamicMenuBar) {
        const observer = new MutationObserver(() => {
          this.discoverMenus();
        });

        observer.observe(dynamicMenuBar, {
          childList: true,
          subtree: false,
        });

        this.cleanupMutationObserver = () => {
          observer.disconnect();
        };
      }
    }
  }

  protected onDestroy(): void {
    this.events.removeAll();
    this.cleanupMutationObserver?.();

    if (this._currentOpenMenu) {
      (this._currentOpenMenu as any).close?.();
      this._currentOpenMenu = null;
    }
  }

  private discoverMenus(): void {
    // In nested slot architecture, MenuBar is inside DynamicMenuBar's shadow DOM
    // We need to traverse up to find DynamicMenuBar and query its Light DOM children
    const menuBarElement = this.shadowRoot?.host as HTMLElement;
    if (menuBarElement) {
      const parentShadowRoot = menuBarElement.getRootNode() as ShadowRoot;
      const dynamicMenuBar = parentShadowRoot?.host as HTMLElement;

      if (dynamicMenuBar && dynamicMenuBar.tagName.toLowerCase() === 'dynamic-menu-bar') {
        this._menus = Array.from(dynamicMenuBar.children).filter(
          (el): el is HTMLElement => el.tagName.toLowerCase() === 'menu-menu'
        ) as HTMLElement[];
      } else {
        this._menus = [];
      }
    } else {
      this._menus = [];
    }
  }

  protected render(): void {
    this.shadowRoot!.innerHTML = `
      <style>
        :host {
          display: block;
          background-color: var(--theme-color-background);
          border-bottom: 1px solid color-mix(in srgb, var(--theme-color-secondary) 30%, transparent);
          ${noSelect()}
          position: relative;
          z-index: 100;
        }

        .menubar-container {
          display: flex;
          align-items: center;
          height: var(--theme-size-menubar-height, 32px);
          padding: 0;
        }

        ::slotted(menu-menu) {
          ${noSelect()}
        }
      </style>
      <div class="menubar-container">
        <slot></slot>
      </div>
    `;
  }

  public hasOpenMenu(): boolean {
    return this._currentOpenMenu !== null;
  }

  private _handleMenuOpened = (e: Event): void => {
    const target = e.target as HTMLElement;

    // Close currently open menu if different from the one being opened
    if (this._currentOpenMenu && this._currentOpenMenu !== target) {
      (this._currentOpenMenu as any).close?.();
    }

    this._currentOpenMenu = target;
  };

  private _handleMenuAction = (e: Event): void => {
    const customEvent = e as CustomEvent;
    const actionId = customEvent.detail.actionId;

    if (!actionId) return;

    console.log("Menu action triggered:", actionId, customEvent.detail);

    // Close all menus after action
    if (this._currentOpenMenu) {
      (this._currentOpenMenu as any).close?.();
      this._currentOpenMenu = null;
    }
  };

  private _handleDocumentClick = (e: Event): void => {
    // Use composedPath() to check if click was inside menubar
    const path = e.composedPath();

    // If click was inside menubar, don't close menus
    if (path.includes(this)) {
      return;
    }

    // Click was outside menubar, close all menus
    if (this._currentOpenMenu) {
      (this._currentOpenMenu as any).close?.();
      this._currentOpenMenu = null;
    }
  };

  private _handleKeydown = (e: KeyboardEvent): void => {
    if (!this._menus.length) return;

    let handled = false;

    switch (e.key) {
      case "ArrowLeft":
        this.navigateToPreviousMenu();
        handled = true;
        break;
      case "ArrowRight":
        this.navigateToNextMenu();
        handled = true;
        break;
      case "Escape":
        if (this._currentOpenMenu) {
          (this._currentOpenMenu as any).close?.();
          this._currentOpenMenu = null;
          handled = true;
        }
        break;
    }

    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  public navigateToPreviousMenu(): void {
    if (!this._currentOpenMenu) return;

    const currentIndex = this._menus.indexOf(this._currentOpenMenu);
    if (currentIndex <= 0) return;

    const previousMenu = this._menus[currentIndex - 1];
    (this._currentOpenMenu as any).close?.();
    (previousMenu as any).open?.();
  }

  public navigateToNextMenu(): void {
    if (!this._currentOpenMenu) return;

    const currentIndex = this._menus.indexOf(this._currentOpenMenu);
    if (currentIndex >= this._menus.length - 1) return;

    const nextMenu = this._menus[currentIndex + 1];
    (this._currentOpenMenu as any).close?.();
    (nextMenu as any).open?.();
  }
}

defineComponent("menu-bar", MenuBar);

declare global {
  interface HTMLElementTagNameMap {
    "menu-bar": MenuBar;
  }
}
