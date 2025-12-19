// Import theme for colors
import { getTheme } from '../theme';



// 1. Define the class
export class MenuBarView extends HTMLElement {
  // Private state with type annotation
  private _initialized: boolean = false;
  private _openMenuIndex: number | null = null;
  private _menuItems: MenuItem[] = [];
  private _clickOutsideHandler: ((e: MouseEvent) => void) | null = null;

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

    this._menuItems = [
      {
        label: 'File',
        items: ['New', 'Open', 'Save', 'Exit']
      },
      {
        label: 'Edit',
        items: ['Undo', 'Redo', 'Cut', 'Copy', 'Paste']
      },
      {
        label: 'View',
        items: ['Zoom In', 'Zoom Out', 'Reset Zoom']
      },
      {
        label: 'Help',
        items: ['About']
      }
    ];

    this.render();
    this.addEventListeners();
    this._initialized = true;
  }

  // 4. Lifecycle: Attribute Changed
  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null
  ): void {
    if (oldValue === newValue) return;
    // No attributes to observe currently
  }

  // 5. Lifecycle: Disconnected
  disconnectedCallback(): void {
    this.removeEventListeners();
  }

  // --- Methods ---

  private render(): void {
    if (!this.shadowRoot) return;

    // Get theme colors
    const theme = getTheme();
    const { primary, secondary, background, text } = theme.colors;

    // Build menu items HTML with submenus
    const menuItemsHTML = this._menuItems.map((menu, index) => {
      const isOpen = this._openMenuIndex === index;
      const submenuHTML = menu.items.map(item => 
        `<div class="submenu-item" data-action="${item}">${item}</div>`
      ).join('');

      return `
        <div class="menu-group">
          <button class="menu-button ${isOpen ? 'active' : ''}" data-menu-index="${index}">
            ${menu.label}
          </button>
          <div class="submenu ${isOpen ? 'open' : ''}">
            ${submenuHTML}
          </div>
        </div>
      `;
    }).join('');

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
        }
        
        .menubar {
          display: flex;
          align-items: center;
          background-color: ${background};
          border-bottom: 1px solid ${secondary}33;
          padding: 0;
          margin: 0;
          height: 32px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        
        .menu-group {
          position: relative;
          display: flex;
          align-items: center;
        }
        
        .menu-button {
          padding: 6px 12px;
          border: none;
          background: transparent;
          color: ${text};
          font-size: 13px;
          font-weight: 400;
          cursor: pointer;
          border-radius: 4px;
          margin: 0 2px;
          transition: all 0.2s ease;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        
        .menu-button:hover {
          background-color: ${primary}15;
          color: ${primary};
        }
        
        .menu-button.active {
          background-color: ${primary}15;
          color: ${primary};
        }
        
        .menu-button:focus {
          outline: 2px solid ${primary}40;
          outline-offset: -2px;
        }
        
        .submenu {
          position: absolute;
          top: 100%;
          left: 0;
          background-color: ${background};
          border: 1px solid ${secondary}33;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          min-width: 160px;
          padding: 4px 0;
          margin-top: 2px;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-8px);
          transition: all 0.2s ease;
          z-index: 1000;
        }
        
        .submenu.open {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }
        
        .submenu-item {
          padding: 8px 16px;
          color: ${text};
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        
        .submenu-item:hover {
          background-color: ${primary}15;
          color: ${primary};
        }
        
        .submenu-item:active {
          background-color: ${primary}25;
        }
      </style>
      <div class="menubar">
        ${menuItemsHTML}
      </div>
    `;

  }

  private addEventListeners(): void {
    if (!this.shadowRoot) return;

    // Use event delegation on the menubar
    const menubar = this.shadowRoot.querySelector('.menubar');
    if (menubar) {
      menubar.addEventListener('click', this._handleMenubarClick);
    }

    // Handle clicks outside to close menus
    this._clickOutsideHandler = (e: MouseEvent) => {
      if (!this.shadowRoot) return;
      const target = e.target as Node;
      if (!this.shadowRoot.contains(target)) {
        this.closeMenu();
      }
    };
    document.addEventListener('click', this._clickOutsideHandler);
  }

  private removeEventListeners(): void {
    if (!this.shadowRoot) return;

    const menubar = this.shadowRoot.querySelector('.menubar');
    if (menubar) {
      menubar.removeEventListener('click', this._handleMenubarClick);
    }

    if (this._clickOutsideHandler) {
      document.removeEventListener('click', this._clickOutsideHandler);
      this._clickOutsideHandler = null;
    }
  }

  private _handleMenubarClick = (e: Event): void => {
    const target = e.target as HTMLElement;
    
    // Check if clicked on menu button
    const menuButton = target.closest('.menu-button');
    if (menuButton) {
      e.stopPropagation();
      const menuIndex = parseInt(menuButton.getAttribute('data-menu-index') || '-1', 10);
      if (menuIndex !== -1) {
        if (this._openMenuIndex === menuIndex) {
          this.closeMenu();
        } else {
          this.openMenu(menuIndex);
        }
      }
      return;
    }

    // Check if clicked on submenu item
    const submenuItem = target.closest('.submenu-item');
    if (submenuItem) {
      e.stopPropagation();
      const action = submenuItem.getAttribute('data-action');
      if (action) {
        console.log(`Menu action: ${action}`);
        // TODO: Implement actual menu actions
        this.closeMenu();
      }
      return;
    }
  };


  private openMenu(index: number): void {
    this._openMenuIndex = index;
    this.render();
  }

  private closeMenu(): void {
    this._openMenuIndex = null;
    this.render();
  }
}

export function setupMenuBar(): void {
  // 6. Register the component
  customElements.define('menu-bar', MenuBarView);
  console.log("Feature added: MenuBar");
}

// 7. TypeScript Specific: Global Type Augmentation
// This allows TypeScript to recognize document.createElement('menu-bar')
declare global {
  interface HTMLElementTagNameMap {
    'menu-bar': MenuBarView;
  }
}
