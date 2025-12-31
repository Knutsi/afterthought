import { BaseComponent, defineComponent } from "../core/BaseComponent";
import { EventListeners, useMutationObserver, discoverChildren } from "../core/utilities";
import { noSelect } from "../styles/cssUtilities";
import { MenuBar } from "./MenuBar";

export class Menu extends BaseComponent {
  private _isOpen: boolean = false;
  private _selectedIndex: number = -1;
  private events = new EventListeners();
  private cleanupMutationObserver: (() => void) | null = null;

  static get observedAttributes(): string[] {
    return ["label", "open"];
  }

  protected onInit(): void {
    this.discoverMenuItems();

    // Make menu focusable for keyboard navigation
    this.setAttribute("tabindex", "0");

    // Listen to button clicks in shadow DOM
    this.events.addToShadow(this.shadowRoot, ".menu-button", "mousedown", this._handleButtonClick);

    // Listen to hover on button for menu switching
    this.events.addToShadow(this.shadowRoot, ".menu-button", "mouseenter", this._handleMouseEnter);

    // Listen to menu item clicks
    this.events.add(this, "menuitem-click", this._handleMenuItemClick);

    // Listen to document clicks to close when clicking outside
    this.events.add(document, "click", this._handleDocumentClick);

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
      this._isOpen = this.hasAttribute("open");
      this.updateDropdownVisibility();
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
    const dropdown = this.shadowRoot?.querySelector(".dropdown");
    const button = this.shadowRoot?.querySelector(".menu-button");

    if (!dropdown || !button) return;

    if (this._isOpen) {
      dropdown.classList.add("open");
      button.classList.add("open");
      button.setAttribute("aria-expanded", "true");
    } else {
      dropdown.classList.remove("open");
      button.classList.remove("open");
      button.setAttribute("aria-expanded", "false");
    }
  }

  public open(): void {
    this._isOpen = true;
    this.setAttribute("open", "");
    this.updateDropdownVisibility();
    this._selectedIndex = -1;
    this.updateSelectedItem();

    // Focus the menu for keyboard navigation
    this.focus();

    // Notify parent MenuBar that this menu opened
    this.dispatchEvent(
      new CustomEvent("menu-opened", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  public close(): void {
    this._isOpen = false;
    this.removeAttribute("open");
    this.updateDropdownVisibility();
    this._selectedIndex = -1;
    this.updateSelectedItem();
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
    // Check if parent menubar has any open menu
    const menuBar = this.getMenuBar();
    if (menuBar) {
      const hasOpenMenu = (menuBar as any).hasOpenMenu?.();
      if (hasOpenMenu && !this._isOpen) {
        this.open();
      }
    }
  };

  private _handleDocumentClick = (e: Event): void => {
    if (!this._isOpen) return;

    // Use composedPath() to properly detect clicks through shadow DOM
    const path = e.composedPath();

    // If click originated from within this menu component, ignore it
    if (path.includes(this)) {
      return;
    }

    // Click was outside, close the menu
    this.close();
  };

  private _handleMenuItemClick = (e: Event): void => {
    const customEvent = e as CustomEvent;

    // Close this menu
    this.close();

    // Forward event to menubar for action execution
    this.dispatchEvent(
      new CustomEvent("menu-action", {
        bubbles: true,
        composed: true,
        detail: customEvent.detail,
      }),
    );
  };

  private _handleKeydown = (e: KeyboardEvent): void => {
    if (!this._isOpen) return;

    const menuItems = this.getSelectableMenuItems();
    if (menuItems.length === 0) return;

    let handled = false;

    switch (e.key) {
      case "ArrowDown":
        this._selectedIndex = (this._selectedIndex + 1) % menuItems.length;
        this.updateSelectedItem();
        handled = true;
        break;

      case "ArrowUp":
        this._selectedIndex = this._selectedIndex <= 0 ? menuItems.length - 1 : this._selectedIndex - 1;
        this.updateSelectedItem();
        handled = true;
        break;

      case "Enter":
      case " ":
        if (this._selectedIndex >= 0 && this._selectedIndex < menuItems.length) {
          const selectedItem = menuItems[this._selectedIndex];
          (selectedItem as any).click?.();
          handled = true;
        }
        break;

      case "ArrowLeft":
      case "ArrowRight":
        // Delegate horizontal navigation to parent MenuBar
        const menuBar = this.getMenuBar();
        if (menuBar) {
          if (e.key === "ArrowLeft") {
            (menuBar as MenuBar).navigateToPreviousMenu?.();
          } else {
            (menuBar as MenuBar).navigateToNextMenu?.();
          }
          handled = true;
        }
        break;

      case "Escape":
        this.close();
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

    menuItems.forEach((item, index) => {
      if (index === this._selectedIndex) {
        item.setAttribute("selected", "");
      } else {
        item.removeAttribute("selected");
      }
    });
  }

  private getMenuBar(): HTMLElement | null {
    // Access MenuBar through the slot (crosses Shadow DOM boundary)
    const slot = this.assignedSlot;
    if (!slot) return null;

    const menuBar = slot.parentElement;
    if (menuBar && menuBar.tagName.toLowerCase() === "menu-bar") {
      return menuBar;
    }

    return null;
  }
}

defineComponent("menu-menu", Menu);

declare global {
  interface HTMLElementTagNameMap {
    "menu-menu": Menu;
  }
}
