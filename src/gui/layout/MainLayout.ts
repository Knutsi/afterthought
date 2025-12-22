// 1. Define the class
export class MainLayout extends HTMLElement {
  // Private state with type annotation
  private _initialized: boolean = false;

  constructor() {
    super();
    // Attach Shadow DOM
    this.attachShadow({ mode: 'open' });
  }

  // 2. Define observed attributes
  static get observedAttributes(): string[] {
    return ['show-toolbar', 'show-menus', 'show-statusbar', 'mode'];
  }

  // 3. Lifecycle: Connected
  connectedCallback(): void {
    if (this._initialized) return;

    this.render();
    this._initialized = true;
  }

  // 4. Lifecycle: Attribute Changed
  attributeChangedCallback(
    _name: string,
    oldValue: string | null,
    newValue: string | null
  ): void {
    if (oldValue === newValue) return;
    
    // Re-render when attributes change
    if (this._initialized) {
      this.render();
    }
  }

  // 5. Lifecycle: Disconnected
  disconnectedCallback(): void {
    // Cleanup if needed
  }

  // --- Methods ---

  private getShowMenus(): boolean {
    return this.hasAttribute('show-menus');
  }

  private getShowToolbar(): boolean {
    return this.hasAttribute('show-toolbar');
  }

  private getShowStatusbar(): boolean {
    return this.hasAttribute('show-statusbar');
  }

  private getMode(): 'normal' | 'focus' {
    const mode = this.getAttribute('mode');
    return mode === 'focus' ? 'focus' : 'normal';
  }

  private render(): void {
    if (!this.shadowRoot) return;

    const showMenus = this.getShowMenus();
    const showToolbar = this.getShowToolbar();
    const showStatusbar = this.getShowStatusbar();
    const mode = this.getMode();

    // Build grid-template-rows based on visibility using CSS variables
    const gridRows: string[] = [];
    if (showMenus) gridRows.push('var(--theme-size-menubar-height)');
    if (showToolbar) gridRows.push('var(--theme-size-toolbar-height)');
    gridRows.push('1fr'); // Main content always takes remaining space
    if (showStatusbar) gridRows.push('var(--theme-size-statusbar-height)');

    const gridTemplateRows = gridRows.join(' ');

    // Calculate row numbers for each container
    let currentRow = 1;
    const menubarRow = showMenus ? currentRow++ : 0;
    const toolbarRow = showToolbar ? currentRow++ : 0;
    const mainRow = currentRow++;
    const statusbarRow = showStatusbar ? currentRow++ : 0;

    // Build container classes based on mode
    const containerClass = `layout-container ${mode === 'focus' ? 'focus-mode' : ''}`;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
        }
        
        .layout-container {
          display: grid;
          grid-template-rows: ${gridTemplateRows};
          width: 100%;
          height: 100%;
          background-color: var(--theme-color-background);
        }

        .menubar-container {
          display: ${showMenus ? 'block' : 'none'};
          ${menubarRow > 0 ? `grid-row: ${menubarRow};` : ''}
        }

        .toolbar-container {
          display: ${showToolbar ? 'block' : 'none'};
          ${toolbarRow > 0 ? `grid-row: ${toolbarRow};` : ''}
          border-bottom: 1px solid color-mix(in srgb, var(--theme-color-secondary) 20%, transparent);
        }

        .main-container {
          grid-row: ${mainRow};
          overflow: auto;
          background-color: var(--theme-color-background);
        }

        .statusbar-container {
          display: ${showStatusbar ? 'block' : 'none'};
          ${statusbarRow > 0 ? `grid-row: ${statusbarRow};` : ''}
          border-top: 1px solid color-mix(in srgb, var(--theme-color-secondary) 20%, transparent);
          background-color: var(--theme-color-background);
        }

        .focus-mode {
          /* Additional styling for focus mode if needed */
        }

        slot {
          display: block;
          width: 100%;
          height: 100%;
        }
      </style>
      <div class="${containerClass}">
        <div class="menubar-container">
          <slot name="menubar"></slot>
        </div>
        <div class="toolbar-container">
          <slot name="toolbar"></slot>
        </div>
        <div class="main-container">
          <slot name="main"></slot>
        </div>
        <div class="statusbar-container">
          <slot name="statusbar"></slot>
        </div>
      </div>
    `;
  }
}

export function setupMainLayout(): void {
  // 6. Register the component
  customElements.define('main-layout', MainLayout);
  console.log("Feature added: MainLayout");
}

// 7. TypeScript Specific: Global Type Augmentation
// This allows TypeScript to recognize document.createElement('main-layout')
declare global {
  interface HTMLElementTagNameMap {
    'main-layout': MainLayout;
  }
}

