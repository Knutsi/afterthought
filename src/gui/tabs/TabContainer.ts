// Import TabPage type for TypeScript
import type { TabPage } from './TabPage';

// 1. Define the class
export class TabContainer extends HTMLElement {
  // Private state with type annotation
  private _initialized: boolean = false;
  private _activeTabIndex: number = 0;
  private _tabButtons: NodeListOf<HTMLElement> | null = null;
  private _tabPages: TabPage[] = [];
  private _mutationObserver: MutationObserver | null = null;

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

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7c63dc10-2a92-4fcd-8166-8cbdf231ab2d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TabContainer.ts:25',message:'connectedCallback entry',data:{childrenCount:this.children.length,childTags:Array.from(this.children).map(c=>c.tagName)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    this.discoverTabs();
    this.render();
    this.addEventListeners();
    this.setupMutationObserver();
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
    this.cleanupMutationObserver();
  }

  // --- Methods ---

  private discoverTabs(): void {
    // Query light DOM for tab-page children
    const allChildren = Array.from(this.children);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7c63dc10-2a92-4fcd-8166-8cbdf231ab2d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TabContainer.ts:53',message:'discoverTabs before filter',data:{allChildrenCount:allChildren.length,allChildrenTags:allChildren.map(c=>c.tagName)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    this._tabPages = allChildren.filter(
      (child): child is TabPage => child.tagName.toLowerCase() === 'tab-page'
    ) as TabPage[];
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7c63dc10-2a92-4fcd-8166-8cbdf231ab2d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TabContainer.ts:58',message:'discoverTabs after filter',data:{tabPagesCount:this._tabPages.length,tabLabels:this._tabPages.map(t=>t.getLabel())},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
  }

  private render(): void {
    if (!this.shadowRoot) return;

    // Build tab bar buttons
    const tabButtons = this._tabPages.map((tab, index) => {
      const label = tab.getLabel() || `Tab ${index + 1}`;
      return `<button class="tab-button ${index === this._activeTabIndex ? 'active' : ''}" 
                      data-tab-index="${index}">${label}</button>`;
    }).join('');

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        .tab-bar {
          display: flex;
          gap: 8px;
          border-bottom: 1px solid #ccc;
          padding: 0;
          margin: 0;
        }
        .tab-button {
          padding: 8px 16px;
          border: none;
          background: transparent;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: border-color 0.2s;
        }
        .tab-button:hover {
          background: rgba(0, 0, 0, 0.05);
        }
        .tab-button.active {
          border-bottom-color: #0066cc;
          font-weight: bold;
          color: #0066cc;
        }
      </style>
      <div class="tab-bar">${tabButtons}</div>
      <slot></slot>
    `;

    // Cache references after render
    this._tabButtons = this.shadowRoot.querySelectorAll('.tab-button');
    this.updateTabVisibility();
  }

  private updateTabVisibility(): void {
    // Show/hide tab pages based on active index
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7c63dc10-2a92-4fcd-8166-8cbdf231ab2d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TabContainer.ts:107',message:'updateTabVisibility entry',data:{activeTabIndex:this._activeTabIndex,tabPagesCount:this._tabPages.length},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    this._tabPages.forEach((tab, index) => {
      const shouldShow = index === this._activeTabIndex;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7c63dc10-2a92-4fcd-8166-8cbdf231ab2d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TabContainer.ts:110',message:'updateTabVisibility forEach',data:{index,shouldShow,hasHiddenBefore:tab.hasAttribute('hidden'),tabElement:tab.tagName},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      if (shouldShow) {
        tab.removeAttribute('hidden');
        tab.style.display = 'block';
      } else {
        tab.setAttribute('hidden', '');
        tab.style.display = 'none';
      }
      // #region agent log
      const slot = tab.shadowRoot?.querySelector('slot');
      const slotContent = slot?.assignedNodes().filter(n => n.nodeType === Node.ELEMENT_NODE) as Element[];
      fetch('http://127.0.0.1:7242/ingest/7c63dc10-2a92-4fcd-8166-8cbdf231ab2d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TabContainer.ts:120',message:'updateTabVisibility after set',data:{index,hasHiddenAfter:tab.hasAttribute('hidden'),styleDisplay:tab.style.display,computedDisplay:window.getComputedStyle(tab).display,slotContentCount:slotContent?.length,firstSlotContentDisplay:slotContent?.[0]?window.getComputedStyle(slotContent[0]).display:'N/A',tabOffsetHeight:tab.offsetHeight,tabOffsetWidth:tab.offsetWidth},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
    });
  }

  private addEventListeners(): void {
    // Use event delegation on the tab bar
    const tabBar = this.shadowRoot?.querySelector('.tab-bar');
    if (tabBar) {
      tabBar.addEventListener('click', this._handleTabClick);
    }
  }

  private removeEventListeners(): void {
    const tabBar = this.shadowRoot?.querySelector('.tab-bar');
    if (tabBar) {
      tabBar.removeEventListener('click', this._handleTabClick);
    }
  }

  // Use an arrow function to automatically bind 'this'
  private _handleTabClick = (e: Event): void => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('tab-button')) {
      const tabIndex = parseInt(target.dataset.tabIndex || '0', 10);
      this.setActiveTab(tabIndex);
    }
  };

  private setActiveTab(index: number): void {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7c63dc10-2a92-4fcd-8166-8cbdf231ab2d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TabContainer.ts:142',message:'setActiveTab entry',data:{index,tabPagesLength:this._tabPages.length,currentActiveIndex:this._activeTabIndex},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    if (index < 0 || index >= this._tabPages.length) return;
    if (index === this._activeTabIndex) return;

    this._activeTabIndex = index;

    // Update button active states
    this._tabButtons?.forEach((button, i) => {
      button.classList.toggle('active', i === index);
    });

    // Update tab visibility
    this.updateTabVisibility();
  }

  private setupMutationObserver(): void {
    // Watch for tab-page additions/removals
    this._mutationObserver = new MutationObserver(() => {
      this.discoverTabs();
      this.render();
      this.addEventListeners();
      // Ensure active tab is still valid
      if (this._activeTabIndex >= this._tabPages.length) {
        this._activeTabIndex = Math.max(0, this._tabPages.length - 1);
        this.setActiveTab(this._activeTabIndex);
      }
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

  // Public method for external updates (called by TabPage when label changes)
  public updateTabs(): void {
    if (!this._initialized) return;
    this.discoverTabs();
    this.render();
    this.addEventListeners();
  }
}

export function setupTabContainer(): void {
  // 6. Register the component
  customElements.define('tab-container', TabContainer);
  console.log("Feature added: TabContainer");
}

// 7. TypeScript Specific: Global Type Augmentation
// This allows TypeScript to recognize document.createElement('tab-container')
declare global {
  interface HTMLElementTagNameMap {
    'tab-container': TabContainer;
  }
}
