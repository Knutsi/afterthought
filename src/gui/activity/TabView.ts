import { BaseComponent, defineComponent } from '../core/BaseComponent';
import { EventListeners, useMutationObserver } from '../core/utilities';
import { noSelect, flexRow, flexCenter, clickable } from '../styles/cssUtilities';

export class TabView extends BaseComponent {
  private _activeTabIndex: number = 0;
  private _visibleChildren: HTMLElement[] = [];
  private events = new EventListeners();
  private cleanupMutationObserver: (() => void) | null = null;

  static get observedAttributes(): string[] {
    return [];
  }

  protected onInit(): void {
    this.setupMutationObserver();
  }

  protected onDestroy(): void {
    this.events.removeAll();
    if (this.cleanupMutationObserver) {
      this.cleanupMutationObserver();
      this.cleanupMutationObserver = null;
    }
  }

  protected render(): void {
    if (!this.shadowRoot) return;

    // Discover children first (they're in light DOM)
    this.discoverChildren();

    const tabButtons = this.renderTabButtons();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
        }

        .tab-bar {
          ${flexRow('0')}
          padding: 0;
          background: var(--theme-color-background, #fff);
          border-bottom: 2px solid var(--theme-color-secondary, #e0e0e0);
          flex-shrink: 0;
        }

        .tab-button {
          ${flexRow('8px')}
          padding: 12px 24px;
          border: none;
          background: transparent;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          margin-bottom: -2px;
          transition: all 0.2s ease;
          color: var(--theme-color-text, #666);
          font-size: var(--theme-font-size, 14px);
          font-weight: 400;
          ${noSelect()}
          position: relative;
        }

        .tab-button:hover {
          background: color-mix(in srgb, var(--theme-color-primary, #0066cc) 5%, transparent);
          color: var(--theme-color-text, #333);
        }

        .tab-button.active {
          background: transparent;
          color: var(--theme-color-primary, #0066cc);
          border-bottom-color: var(--theme-color-primary, #0066cc);
          font-weight: 500;
        }

        .tab-label {
          display: inline-block;
        }

        .tab-label.error-label {
          color: #cc0000;
          font-weight: bold;
        }

        .tab-button.active .tab-label.error-label {
          color: #cc0000;
        }

        .close-button {
          ${flexCenter()}
          width: 18px;
          height: 18px;
          border-radius: 3px;
          font-size: 18px;
          line-height: 1;
          ${clickable()}
          opacity: 0.6;
        }

        .close-button:hover {
          background: color-mix(in srgb, var(--theme-color-primary, #0066cc) 15%, transparent);
          opacity: 1;
        }

        .empty-message {
          padding: 12px 24px;
          color: var(--theme-color-text-muted, #999);
          font-style: italic;
        }

        .content-area {
          flex: 1;
          overflow: auto;
          display: block;
        }
      </style>
      <div class="tab-bar">${tabButtons}</div>
      <div class="content-area">
        <slot></slot>
      </div>
    `;

    // Add event listeners after render
    this.events.addToShadow(this.shadowRoot, '.tab-bar', 'click', this._handleTabClick);

    this.updateTabVisibility();
  }

  private discoverChildren(): void {
    // Get all direct children
    const allChildren = Array.from(this.children) as HTMLElement[];

    // Filter to only visible children (not hidden)
    this._visibleChildren = allChildren.filter(
      child => child.getAttribute('data-tab-hidden') !== 'true'
    );

    // Ensure active tab index is valid
    if (this._activeTabIndex >= this._visibleChildren.length) {
      this._activeTabIndex = Math.max(0, this._visibleChildren.length - 1);
    }
    if (this._visibleChildren.length === 0) {
      this._activeTabIndex = -1;
    }
  }

  private renderTabButtons(): string {
    if (this._visibleChildren.length === 0) {
      return '<div class="empty-message">No tabs available</div>';
    }

    return this._visibleChildren.map((child, index) => {
      const label = child.getAttribute('tab-label');
      const displayLabel = label || 'NO LABEL';
      const isError = !label;
      const closeable = child.hasAttribute('closeable');
      const isActive = index === this._activeTabIndex;

      const labelClass = isError ? 'tab-label error-label' : 'tab-label';
      const closeButton = closeable
        ? `<span class="close-button" data-tab-index="${index}">×</span>`
        : '';

      return `
        <button class="tab-button ${isActive ? 'active' : ''}"
                data-tab-index="${index}">
          <span class="${labelClass}">${displayLabel}</span>
          ${closeButton}
        </button>
      `;
    }).join('');
  }

  private updateTabVisibility(): void {
    this._visibleChildren.forEach((child, index) => {
      const shouldShow = index === this._activeTabIndex;
      if (shouldShow) {
        child.style.display = 'block';
      } else {
        child.style.display = 'none';
      }
    });
  }

  private _handleTabClick = (e: Event): void => {
    const target = e.target as HTMLElement;

    // Handle close button
    if (target.classList.contains('close-button')) {
      e.stopPropagation();
      const index = parseInt(target.dataset.tabIndex || '0', 10);
      this.closeTab(index);
      return;
    }

    // Handle tab selection
    if (target.classList.contains('tab-button') || target.closest('.tab-button')) {
      const button = target.classList.contains('tab-button')
        ? target
        : target.closest('.tab-button') as HTMLElement;
      const index = parseInt(button.dataset.tabIndex || '0', 10);
      this.setActiveTab(index);
    }
  };

  private setActiveTab(index: number): void {
    if (index < 0 || index >= this._visibleChildren.length) return;
    if (index === this._activeTabIndex) return;

    this._activeTabIndex = index;
    this.render();
  }

  private closeTab(index: number): void {
    if (index < 0 || index >= this._visibleChildren.length) return;

    const child = this._visibleChildren[index];

    // Hide the child
    child.setAttribute('data-tab-hidden', 'true');
    child.style.display = 'none';

    // Re-discover children to update visible list
    this.discoverChildren();

    // If closed tab was active, switch to another tab
    if (index === this._activeTabIndex) {
      if (this._visibleChildren.length > 0) {
        // Switch to first visible tab
        this._activeTabIndex = 0;
      } else {
        // No tabs left
        this._activeTabIndex = -1;
      }
    } else if (index < this._activeTabIndex) {
      // Adjust active index if we removed a tab before it
      this._activeTabIndex--;
    }

    this.render();
  }

  private setupMutationObserver(): void {
    this.cleanupMutationObserver = useMutationObserver(
      this,
      () => {
        this.discoverChildren();
        this.render();
      },
      {
        childList: true,
        subtree: false,
        attributes: true,
        attributeFilter: ['tab-label', 'closeable']
      }
    );
  }
}

defineComponent('tab-view', TabView);

declare global {
  interface HTMLElementTagNameMap {
    'tab-view': TabView;
  }
}
