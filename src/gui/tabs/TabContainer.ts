import { BaseComponent, defineComponent } from '../core/BaseComponent';
import type { TabPage } from './TabPage';

export class TabContainer extends BaseComponent {
  private _activeTabIndex: number = 0;
  private _tabButtons: NodeListOf<HTMLElement> | null = null;
  private _tabPages: TabPage[] = [];
  private _mutationObserver: MutationObserver | null = null;

  static get observedAttributes(): string[] {
    return [];
  }

  protected onInit(): void {
    this.discoverTabs();
    this.addEventListeners();
    this.setupMutationObserver();
  }

  protected onDestroy(): void {
    this.removeEventListeners();
    this.cleanupMutationObserver();
  }

  protected render(): void {
    if (!this.shadowRoot) return;

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

    this._tabButtons = this.shadowRoot.querySelectorAll('.tab-button');
    this.updateTabVisibility();
  }

  private discoverTabs(): void {
    const allChildren = Array.from(this.children);
    this._tabPages = allChildren.filter(
      (child): child is TabPage => child.tagName.toLowerCase() === 'tab-page'
    ) as TabPage[];
  }

  private updateTabVisibility(): void {
    this._tabPages.forEach((tab, index) => {
      const shouldShow = index === this._activeTabIndex;
      if (shouldShow) {
        tab.removeAttribute('hidden');
        tab.style.display = 'block';
      } else {
        tab.setAttribute('hidden', '');
        tab.style.display = 'none';
      }
    });
  }

  private addEventListeners(): void {
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

  private _handleTabClick = (e: Event): void => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('tab-button')) {
      const tabIndex = parseInt(target.dataset.tabIndex || '0', 10);
      this.setActiveTab(tabIndex);
    }
  };

  private setActiveTab(index: number): void {
    if (index < 0 || index >= this._tabPages.length) return;
    if (index === this._activeTabIndex) return;

    this._activeTabIndex = index;

    this._tabButtons?.forEach((button, i) => {
      button.classList.toggle('active', i === index);
    });

    this.updateTabVisibility();
  }

  private setupMutationObserver(): void {
    this._mutationObserver = new MutationObserver(() => {
      this.discoverTabs();
      this.render();
      this.addEventListeners();
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

  public updateTabs(): void {
    if (!this._initialized) return;
    this.discoverTabs();
    this.render();
    this.addEventListeners();
  }
}

defineComponent('tab-container', TabContainer);

declare global {
  interface HTMLElementTagNameMap {
    'tab-container': TabContainer;
  }
}
