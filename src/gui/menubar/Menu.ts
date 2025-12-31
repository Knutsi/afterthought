import { BaseComponent, defineComponent } from "../core/BaseComponent";
import { EventListeners, useMutationObserver, discoverChildren } from "../core/utilities";
import { noSelect } from "../styles/cssUtilities";

export class Menu extends BaseComponent {
  // React-style callback props (passed from DynamicMenuBar)
  public onToggle?: (menuId: string, currentlyOpen: boolean) => void;
  public onSelectItem?: (menuId: string, index: number) => void;
  public onNavigateNext?: () => void;
  public onNavigatePrevious?: () => void;
  public onClose?: (menuId: string) => void;
  public hasOpenMenu?: () => boolean;

  private events = new EventListeners();
  private cleanupMutationObserver: (() => void) | null = null;

  static get observedAttributes(): string[] {
    return ["label", "open", "data-menu-id", "selected-index"];
  }

  protected onInit(): void {
    this.discoverMenuItems();

    // Make menu focusable for keyboard navigation
    this.setAttribute("tabindex", "0");

    // Listen to button clicks in shadow DOM
    this.events.addToShadow(this.shadowRoot, ".menu-button", "mousedown", this._handleButtonClick);

    // Listen to hover on button for menu switching
    this.events.addToShadow(this.shadowRoot, ".menu-button", "mouseenter", this._handleMouseEnter);

    // Listen to keyboard events for navigation
    this.events.add(this, "keydown", this._handleKeydown as EventListener);

    this.cleanupMutationObserver = useMutationObserver(
      this,
      () => {
        this.discoverMenuItems();
      },
      { childList: true, subtree: false },
    );
  }

  protected onDestroy(): void {
    this.events.removeAll();
    this.cleanupMutationObserver?.();
  }

  protected onAttributeChange(name: string, _oldValue: string | null, _newValue: string | null): void {
    if (!this._initialized) return;

    if (name === "open") {
      this.updateDropdownVisibility();
    } else if (name === "selected-index") {
      this.updateSelectedItem();
    } else {
      this.render();
    }
  }

  private discoverMenuItems(): void {
    discoverChildren(this, "menu-item");
  }

  protected render(): void {
    const label = this.getAttribute("label") || "";

    this.shadowRoot!.innerHTML = `
      <style>
        :host {
          display: inline-block;
          position: relative;
          ${noSelect()}
        }

        :host(:focus) {
          outline: none;
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
      <button class="menu-button" part="menu-button" role="button" aria-haspopup="true" aria-expanded="${this.hasAttribute("open")}">
        <span class="label">${label}</span>
      </button>
      <div class="dropdown" part="dropdown" role="menu">
        <slot></slot>
      </div>
    `;

    this.updateDropdownVisibility();
  }

  private updateDropdownVisibility(): void {
    const dropdown = this.shadowRoot?.querySelector(".dropdown");
    const button = this.shadowRoot?.querySelector(".menu-button");

    if (!dropdown || !button) return;

    const isOpen = this.hasAttribute("open");
    if (isOpen) {
      dropdown.classList.add("open");
      button.classList.add("open");
      button.setAttribute("aria-expanded", "true");
    } else {
      dropdown.classList.remove("open");
      button.classList.remove("open");
      button.setAttribute("aria-expanded", "false");
    }
  }

  private _handleButtonClick = (e: Event): void => {
    e.stopPropagation();

    const menuId = this.getAttribute("data-menu-id");
    const isOpen = this.hasAttribute("open");
    if (menuId && this.onToggle) {
      this.onToggle(menuId, isOpen);
    }
  };

  private _handleMouseEnter = (): void => {
    const menuId = this.getAttribute("data-menu-id");
    const isOpen = this.hasAttribute("open");

    if (this.hasOpenMenu?.() && !isOpen && menuId && this.onToggle) {
      this.onToggle(menuId, false);
    }
  };

  private _handleKeydown = (e: KeyboardEvent): void => {
    const isOpen = this.hasAttribute("open");
    if (!isOpen) return;

    const menuItems = this.getSelectableMenuItems();
    if (menuItems.length === 0) return;

    let handled = false;
    const menuId = this.getAttribute("data-menu-id");

    switch (e.key) {
      case "ArrowDown": {
        const currentIndex = parseInt(this.getAttribute("selected-index") || "-1", 10);
        const nextIndex = (currentIndex + 1) % menuItems.length;
        if (menuId && this.onSelectItem) {
          this.onSelectItem(menuId, nextIndex);
        }
        handled = true;
        break;
      }

      case "ArrowUp": {
        const currentIndex = parseInt(this.getAttribute("selected-index") || "-1", 10);
        const nextIndex = currentIndex <= 0 ? menuItems.length - 1 : currentIndex - 1;
        if (menuId && this.onSelectItem) {
          this.onSelectItem(menuId, nextIndex);
        }
        handled = true;
        break;
      }

      case "Enter":
      case " ": {
        const currentIndex = parseInt(this.getAttribute("selected-index") || "-1", 10);
        if (currentIndex >= 0 && currentIndex < menuItems.length) {
          const selectedItem = menuItems[currentIndex] as any;
          selectedItem.activate?.();
          handled = true;
        }
        break;
      }

      case "ArrowLeft":
        if (this.onNavigatePrevious) {
          this.onNavigatePrevious();
          handled = true;
        }
        break;

      case "ArrowRight":
        if (this.onNavigateNext) {
          this.onNavigateNext();
          handled = true;
        }
        break;

      case "Escape":
        if (menuId && this.onClose) {
          this.onClose(menuId);
        }
        handled = true;
        break;
    }

    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  private getSelectableMenuItems(): HTMLElement[] {
    return Array.from(this.children).filter((child) => {
      return (
        child.tagName.toLowerCase() === "menu-item" &&
        !child.hasAttribute("separator") &&
        !child.hasAttribute("disabled")
      );
    }) as HTMLElement[];
  }

  private updateSelectedItem(): void {
    const menuItems = this.getSelectableMenuItems();
    const selectedIndex = parseInt(this.getAttribute("selected-index") || "-1", 10);

    menuItems.forEach((item, index) => {
      if (index === selectedIndex) {
        item.setAttribute("selected", "");
      } else {
        item.removeAttribute("selected");
      }
    });
  }
}

defineComponent("menu-menu", Menu);

declare global {
  interface HTMLElementTagNameMap {
    "menu-menu": Menu;
  }
}
