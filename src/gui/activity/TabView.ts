import { BaseComponent, defineComponent } from "../core/BaseComponent";
import { EventListeners, useMutationObserver } from "../core/utilities";
import { noSelect, flexRow, flexCenter, clickable } from "../styles/cssUtilities";
import { icons } from "../icons";
import { ActivityService, ActivityEvents } from "../../service/ActivityService";
import { getDefaultServiceLayer } from "../../service/ServiceLayer";

export class TabView extends BaseComponent {
  private _activeTabIndex: number = 0;
  private _visibleChildren: HTMLElement[] = [];
  private events = new EventListeners();
  private cleanupMutationObserver: (() => void) | null = null;
  private activityService: ActivityService | null = null;

  static get observedAttributes(): string[] {
    return [];
  }

  protected onInit(): void {
    this.setupMutationObserver();
    const serviceLayer = getDefaultServiceLayer();
    this.activityService = serviceLayer.getActivityService();
    this.activityService.addEventListener(ActivityEvents.ACTIVITY_SWITCHED, this.handleActivitySwitch);
  }

  protected onDestroy(): void {
    this.events.removeAll();
    if (this.cleanupMutationObserver) {
      this.cleanupMutationObserver();
      this.cleanupMutationObserver = null;
    }
    if (this.activityService) {
      this.activityService.removeEventListener(ActivityEvents.ACTIVITY_SWITCHED, this.handleActivitySwitch);
    }
  }

  private handleActivitySwitch = (): void => {
    if (!this.activityService) return;

    // Sync update visible children from current DOM state before searching
    this.discoverChildren();

    const activeActivityId = this.activityService.getActiveActivityId();
    console.log("handleActivitySwitch: Active activity id", activeActivityId);
    const targetIndex = this._visibleChildren.findIndex((child) => child.id === activeActivityId);

    if (targetIndex !== -1 && targetIndex !== this._activeTabIndex) {
      this._activeTabIndex = targetIndex;
      this.render();
    }
  };

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
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 4px;
          padding: 4px 4px 0 4px;
          background: rgb(193, 202, 228);
          flex-shrink: 0;
        }

        .tab-group-left {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .tab-group-right {
          display: flex;
          align-items: center;
          gap: 4px;
          justify-self: end;
        }

        .tab-button {
          ${flexRow("8px")}
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          border-radius: 4px 4px 4px 4px;
          transition: all 0.2s ease;
          color: var(--theme-color-text, #666);
          font-size: var(--theme-font-size, 14px);
          font-weight: 400;
          ${noSelect()}
          position: relative;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          align-self: flex-start;
        }

        .tab-button:hover:not(.active) {
          background: rgba(255, 255, 255, 0.8);
          box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
        }

        .tab-button.active {
          background: var(--theme-color-background, #fff);
          color: var(--theme-color-text, #333);
          font-weight: 400;
          box-shadow: none;
          padding-bottom: 12px;
          border-radius: 4px 4px 0 0;
          z-index: 1;
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
          opacity: 0.5;
        }

        .close-button:hover {
          background: rgba(0, 0, 0, 0.1);
          opacity: 1;
        }

        .tab-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }

        .tab-icon svg {
          width: 100%;
          height: 100%;
          display: block;
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
          background: var(--theme-color-background, #fff);
        }
      </style>
      <div class="tab-bar">${tabButtons}</div>
      <div class="content-area">
        <slot></slot>
      </div>
    `;

    // Add event listeners after render
    this.events.addToShadow(this.shadowRoot, ".tab-bar", "click", this._handleTabClick);

    this.updateTabVisibility();
  }

  private discoverChildren(): void {
    // Get all direct children
    const allChildren = Array.from(this.children) as HTMLElement[];

    // Filter to only visible children (not hidden)
    this._visibleChildren = allChildren.filter((child) => child.getAttribute("data-tab-hidden") !== "true");

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

    // Separate tabs into left and right groups
    const leftTabs: string[] = [];
    const rightTabs: string[] = [];

    this._visibleChildren.forEach((child, index) => {
      const label = child.getAttribute("tab-label");
      const displayLabel = label || "NO LABEL";
      const isError = !label;
      const iconName = child.getAttribute("tab-icon");
      const closeable = child.hasAttribute("closeable");
      const isRight = child.hasAttribute("tab-right");
      const isActive = index === this._activeTabIndex;

      const labelClass = isError ? "tab-label error-label" : "tab-label";
      const tabClasses = ["tab-button", isActive ? "active" : ""].filter(Boolean).join(" ");

      // Render icon if specified and exists in dictionary
      const iconSvg = iconName && icons[iconName] ? `<span class="tab-icon">${icons[iconName]}</span>` : "";

      const closeButton = closeable ? `<span class="close-button" data-tab-index="${index}">×</span>` : "";

      const tabHtml = `
        <div class="${tabClasses}"
             data-tab-index="${index}">
          ${iconSvg}
          <span class="${labelClass}">${displayLabel}</span>
          ${closeButton}
        </div>
      `;

      // Add to appropriate group
      if (isRight) {
        rightTabs.push(tabHtml);
      } else {
        leftTabs.push(tabHtml);
      }
    });

    // Return two groups in separate containers
    return `
      <div class="tab-group-left">${leftTabs.join("")}</div>
      <div class="tab-group-right">${rightTabs.join("")}</div>
    `;
  }

  private updateTabVisibility(): void {
    this._visibleChildren.forEach((child, index) => {
      const shouldShow = index === this._activeTabIndex;
      if (shouldShow) {
        child.style.display = "block";
      } else {
        child.style.display = "none";
      }
    });
  }

  private _handleTabClick = (e: Event): void => {
    const target = e.target as HTMLElement;

    // Handle close button
    if (target.classList.contains("close-button")) {
      e.stopPropagation();
      const index = parseInt(target.dataset.tabIndex || "0", 10);
      this.closeTab(index);
      return;
    }

    // Handle tab selection
    if (target.classList.contains("tab-button") || target.closest(".tab-button")) {
      const button = target.classList.contains("tab-button") ? target : (target.closest(".tab-button") as HTMLElement);
      const index = parseInt(button.dataset.tabIndex || "0", 10);
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
    child.setAttribute("data-tab-hidden", "true");
    child.style.display = "none";

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
        attributeFilter: ["tab-label", "closeable", "tab-icon", "tab-right"],
      },
    );
  }
}

defineComponent("tab-view", TabView);

declare global {
  interface HTMLElementTagNameMap {
    "tab-view": TabView;
  }
}
