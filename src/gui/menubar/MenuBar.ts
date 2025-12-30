export class MenuBar extends HTMLElement {
  private _initialized: boolean = false;
  private _menus: HTMLElement[] = [];
  private _currentOpenMenu: HTMLElement | null = null;
  private _mutationObserver: MutationObserver | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes(): string[] {
    return [];
  }

  connectedCallback(): void {
    if (this._initialized) return;

    this.discoverMenus();
    this.render();
    this.addEventListeners();
    this.setupMutationObserver();
    this._initialized = true;
  }

  disconnectedCallback(): void {
    this.removeEventListeners();
    this.cleanupMutationObserver();

    if (this._currentOpenMenu) {
      (this._currentOpenMenu as any).close?.();
      this._currentOpenMenu = null;
    }
  }

  private discoverMenus(): void {
    const allChildren = Array.from(this.children);
    this._menus = allChildren.filter(
      (child): child is HTMLElement =>
        child.tagName.toLowerCase() === 'menu-menu'
    ) as HTMLElement[];
  }

  private render(): void {
    this.shadowRoot!.innerHTML = `
      <style>
        :host {
          display: block;
          background-color: var(--theme-color-background);
          border-bottom: 1px solid color-mix(in srgb, var(--theme-color-secondary) 30%, transparent);
          user-select: none;
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
          /* Styles for slotted menus if needed */
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

  private addEventListeners(): void {
    this.addEventListener('menu-opened', this._handleMenuOpened);
    this.addEventListener('menu-action', this._handleMenuAction);

    // Listen for global clicks to close all menus
    document.addEventListener('click', this._handleDocumentClick);

    // Keyboard navigation
    this.addEventListener('keydown', this._handleKeydown);
  }

  private removeEventListeners(): void {
    this.removeEventListener('menu-opened', this._handleMenuOpened);
    this.removeEventListener('menu-action', this._handleMenuAction);
    document.removeEventListener('click', this._handleDocumentClick);
    this.removeEventListener('keydown', this._handleKeydown);
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

    // Future: Execute action via ActionService
    // const actionService = getDefaultServiceLayer().actionService;
    // actionService.doAction(actionId);

    console.log('Menu action triggered:', actionId, customEvent.detail);

    // Close all menus after action
    if (this._currentOpenMenu) {
      (this._currentOpenMenu as any).close?.();
      this._currentOpenMenu = null;
    }
  };

  private _handleDocumentClick = (e: Event): void => {
    const target = e.target as Node;

    // If click is outside menubar, close all menus
    if (!this.contains(target)) {
      if (this._currentOpenMenu) {
        (this._currentOpenMenu as any).close?.();
        this._currentOpenMenu = null;
      }
    }
  };

  private _handleKeydown = (e: KeyboardEvent): void => {
    if (!this._menus.length) return;

    let handled = false;

    switch (e.key) {
      case 'ArrowLeft':
        this.navigateToPreviousMenu();
        handled = true;
        break;
      case 'ArrowRight':
        this.navigateToNextMenu();
        handled = true;
        break;
      case 'Escape':
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

  private navigateToPreviousMenu(): void {
    if (!this._currentOpenMenu) return;

    const currentIndex = this._menus.indexOf(this._currentOpenMenu);
    if (currentIndex <= 0) return;

    const previousMenu = this._menus[currentIndex - 1];
    (this._currentOpenMenu as any).close?.();
    (previousMenu as any).open?.();
  }

  private navigateToNextMenu(): void {
    if (!this._currentOpenMenu) return;

    const currentIndex = this._menus.indexOf(this._currentOpenMenu);
    if (currentIndex >= this._menus.length - 1) return;

    const nextMenu = this._menus[currentIndex + 1];
    (this._currentOpenMenu as any).close?.();
    (nextMenu as any).open?.();
  }

  private setupMutationObserver(): void {
    this._mutationObserver = new MutationObserver(() => {
      this.discoverMenus();
    });

    this._mutationObserver.observe(this, {
      childList: true,
      subtree: false
    });
  }

  private cleanupMutationObserver(): void {
    if (this._mutationObserver) {
      this._mutationObserver.disconnect();
      this._mutationObserver = null;
    }
  }
}

export function setupMenuBar(): void {
  customElements.define('menu-bar', MenuBar);
  console.log("Feature added: MenuBar");
}

declare global {
  interface HTMLElementTagNameMap {
    'menu-bar': MenuBar;
  }
}
