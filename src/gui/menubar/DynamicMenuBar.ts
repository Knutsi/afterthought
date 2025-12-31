import { BaseComponent, defineComponent } from "../core/BaseComponent";
import { EventListeners } from "../core/utilities";
import { getDefaultServiceLayer } from "../../service/ServiceLayer";
import { ActionEvents, type IAction } from "../../service/ActionService";

const preferredMenuOrder = ["File", "Edit", "View", "Project", "Task", "Tools", "Window", "Help", "Settings", "About"];
const preferredMenuGroupOrder = [
  "create",
  "exit",
  "edit",
  "view",
  "project",
  "task",
  "tools",
  "window",
  "help",
  "settings",
  "about",
];

interface IDynamicMenuBarModel {
  orderedMenus: IMenu[];
}

interface IMenu {
  id: string;
  label: string;
  orderedGroups: IMenuGroup[];
}

interface IMenuGroup {
  id: string;
  orderedItems: IMenuItem[];
}

interface IMenuItem {
  id: string;
  label: string;
  shortcut: string;
  actionId: string;
  disabled: boolean;
}

interface IDynamicMenuBarViewState {
  openMenuId: string | null;
  selectedItemIndices: Map<string, number>;
}

export class DynamicMenuBar extends BaseComponent {
  private events = new EventListeners();
  private rebuildTimeoutId: number | null = null;
  private model: IDynamicMenuBarModel | null = null;
  private viewState: IDynamicMenuBarViewState = {
    openMenuId: null,
    selectedItemIndices: new Map(),
  };

  static get observedAttributes(): string[] {
    return [];
  }

  protected onInit(): void {
    const actionService = getDefaultServiceLayer().actionService;

    // Listen to action events - trigger rebuild on changes
    actionService.addEventListener(ActionEvents.ACTION_ADDED, () => {
      this.scheduleRebuild();
    });

    actionService.addEventListener(ActionEvents.ACTION_AVAILABILITY_UPDATED, () => {
      this.scheduleRebuild();
    });

    // Initial menu population
    this.rebuild();
  }

  protected onDestroy(): void {
    this.events.removeAll();

    if (this.rebuildTimeoutId !== null) {
      clearTimeout(this.rebuildTimeoutId);
      this.rebuildTimeoutId = null;
    }

    // Close any open menu
    if (this.viewState.openMenuId) {
      this.closeMenu(this.viewState.openMenuId);
    }
  }

  // Public API: State queries
  public getOpenMenuId(): string | null {
    return this.viewState.openMenuId;
  }

  public getSelectedIndex(menuId: string): number {
    return this.viewState.selectedItemIndices.get(menuId) ?? -1;
  }

  public hasOpenMenu(): boolean {
    return this.viewState.openMenuId !== null;
  }

  // Public API: State updates
  public openMenu(menuId: string): void {
    // Close currently open menu if different
    if (this.viewState.openMenuId && this.viewState.openMenuId !== menuId) {
      this.closeMenu(this.viewState.openMenuId);
    }

    this.viewState.openMenuId = menuId;
    this.viewState.selectedItemIndices.set(menuId, -1); // Reset selection

    // Update DOM: set 'open' attribute on menu element
    const menuElement = this.getMenuElement(menuId);
    if (menuElement) {
      menuElement.setAttribute('open', '');
      // Focus the menu for keyboard navigation
      (menuElement as any).focus?.();
    }
  }

  public closeMenu(menuId: string): void {
    if (this.viewState.openMenuId === menuId) {
      this.viewState.openMenuId = null;
    }
    this.viewState.selectedItemIndices.set(menuId, -1);

    // Update DOM: remove 'open' attribute
    const menuElement = this.getMenuElement(menuId);
    if (menuElement) {
      menuElement.removeAttribute('open');
      menuElement.removeAttribute('selected-index');
    }
  }

  public selectItem(menuId: string, index: number): void {
    this.viewState.selectedItemIndices.set(menuId, index);

    // Update DOM: set 'selected-index' attribute on menu
    const menuElement = this.getMenuElement(menuId);
    if (menuElement) {
      menuElement.setAttribute('selected-index', String(index));
    }
  }

  public navigateToNextMenu(): void {
    if (!this.model || !this.viewState.openMenuId) return;

    const currentIndex = this.model.orderedMenus.findIndex(
      m => m.id === this.viewState.openMenuId
    );
    if (currentIndex < 0 || currentIndex >= this.model.orderedMenus.length - 1) return;

    const nextMenuId = this.model.orderedMenus[currentIndex + 1].id;
    this.closeMenu(this.viewState.openMenuId);
    this.openMenu(nextMenuId);
  }

  public navigateToPreviousMenu(): void {
    if (!this.model || !this.viewState.openMenuId) return;

    const currentIndex = this.model.orderedMenus.findIndex(
      m => m.id === this.viewState.openMenuId
    );
    if (currentIndex <= 0) return;

    const previousMenuId = this.model.orderedMenus[currentIndex - 1].id;
    this.closeMenu(this.viewState.openMenuId);
    this.openMenu(previousMenuId);
  }

  // Helper to get menu element by ID
  private getMenuElement(menuId: string): HTMLElement | null {
    return Array.from(this.children).find(
      child => child.tagName.toLowerCase() === 'menu-menu' &&
               child.getAttribute('data-menu-id') === menuId
    ) as HTMLElement | null;
  }

  protected render(): void {
    this.shadowRoot!.innerHTML = `
      <style>
        :host {
          display: block;
          background-color: var(--theme-color-background);
          border-bottom: 1px solid color-mix(in srgb, var(--theme-color-secondary) 30%, transparent);
          position: relative;
          z-index: 100;
        }

        .menubar-container {
          display: flex;
          align-items: center;
          height: var(--theme-size-menubar-height, 32px);
          padding: 0;
        }
      </style>
      <div class="menubar-container">
        <slot></slot>
      </div>
    `;

    // Handle outside clicks to close menus
    this.events.add(document, 'click', this._handleDocumentClick);
  }

  private _handleDocumentClick = (e: Event): void => {
    if (!this.viewState.openMenuId) return;

    // Use composedPath() to check if click was inside this component
    const path = e.composedPath();
    if (!path.includes(this)) {
      // Click was outside, close the open menu
      this.closeMenu(this.viewState.openMenuId);
    }
  };

  private scheduleRebuild(): void {
    if (this.rebuildTimeoutId !== null) {
      clearTimeout(this.rebuildTimeoutId);
    }

    this.rebuildTimeoutId = setTimeout(() => {
      this.rebuild();
      this.rebuildTimeoutId = null;
    }, 10) as unknown as number;
  }

  private async rebuild(): Promise<void> {
    const actionService = getDefaultServiceLayer().actionService;
    const actions = actionService.getActions();
    const model = await this.buildMenuBarModel(actions);
    this.renderFromModel(model);
  }

  private async buildMenuBarModel(actions: IAction[]): Promise<IDynamicMenuBarModel> {
    // Group actions by menuGroup, then by menuSubGroup
    const menuMap = new Map<string, Map<string | undefined, IAction[]>>();

    for (const action of actions) {
      if (!menuMap.has(action.menuGroup)) {
        menuMap.set(action.menuGroup, new Map());
      }
      const subgroupMap = menuMap.get(action.menuGroup)!;
      const subgroupKey = action.menuSubGroup || undefined;

      if (!subgroupMap.has(subgroupKey)) {
        subgroupMap.set(subgroupKey, []);
      }
      subgroupMap.get(subgroupKey)!.push(action);
    }

    // Build menu items with parallel canDo() calls
    const orderedMenus: IMenu[] = [];

    for (const [menuLabel, subgroupMap] of menuMap.entries()) {
      const orderedGroups: IMenuGroup[] = [];

      // Sort subgroups: by preferredMenuGroupOrder, then alphabetically
      const sortedSubgroups = Array.from(subgroupMap.keys()).sort((a, b) => {
        if (a === undefined && b === undefined) return 0;
        if (a === undefined) return -1;
        if (b === undefined) return 1;

        const aIndex = preferredMenuGroupOrder.indexOf(a);
        const bIndex = preferredMenuGroupOrder.indexOf(b);

        // Both in preferred list
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        }

        // Only a is in preferred list
        if (aIndex !== -1) return -1;

        // Only b is in preferred list
        if (bIndex !== -1) return 1;

        // Neither in preferred list, sort alphabetically
        return a.localeCompare(b, undefined, { sensitivity: "base" });
      });

      for (const subgroup of sortedSubgroups) {
        const actionsInSubgroup = subgroupMap.get(subgroup)!;

        // Build menu items with parallel canDo() calls
        const itemPromises = actionsInSubgroup.map(async (action) => {
          const canDo = await action.canDo().catch(() => false);
          return {
            id: action.id,
            label: action.name,
            shortcut: action.shortcut,
            actionId: action.id,
            disabled: !canDo,
          } as IMenuItem;
        });

        const orderedItems = await Promise.all(itemPromises);

        orderedGroups.push({
          id: subgroup || "",
          orderedItems,
        });
      }

      orderedMenus.push({
        id: `menu-${menuLabel.toLowerCase().replace(/\s+/g, '-')}`,
        label: menuLabel,
        orderedGroups,
      });
    }

    // Sort menus by preferredMenuOrder, then alphabetically
    orderedMenus.sort((a, b) => {
      const aIndex = preferredMenuOrder.indexOf(a.label);
      const bIndex = preferredMenuOrder.indexOf(b.label);

      // Both in preferred list
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }

      // Only a is in preferred list
      if (aIndex !== -1) return -1;

      // Only b is in preferred list
      if (bIndex !== -1) return 1;

      // Neither in preferred list, sort alphabetically
      return a.label.localeCompare(b.label, undefined, { sensitivity: "base" });
    });

    return { orderedMenus };
  }

  private renderFromModel(model: IDynamicMenuBarModel): void {
    // Store model for state management
    this.model = model;

    // Save currently open menu ID (not label!)
    const openMenuId = this.viewState.openMenuId;

    // Clear existing menu-menu children
    Array.from(this.children).forEach((child) => {
      if (child.tagName.toLowerCase() === "menu-menu") {
        child.remove();
      }
    });

    // Create menus from model
    for (const menu of model.orderedMenus) {
      const menuElement = document.createElement("menu-menu");
      menuElement.setAttribute("label", menu.label);
      menuElement.setAttribute("data-menu-id", menu.id);  // Add menu ID

      // Set callbacks (React-style props)
      (menuElement as any).onToggle = (menuId: string, currentlyOpen: boolean) => {
        if (currentlyOpen) {
          this.closeMenu(menuId);
        } else {
          this.openMenu(menuId);
        }
      };

      (menuElement as any).onSelectItem = (menuId: string, index: number) => {
        this.selectItem(menuId, index);
      };

      (menuElement as any).onNavigateNext = () => {
        this.navigateToNextMenu();
      };

      (menuElement as any).onNavigatePrevious = () => {
        this.navigateToPreviousMenu();
      };

      (menuElement as any).onClose = (menuId: string) => {
        this.closeMenu(menuId);
      };

      (menuElement as any).hasOpenMenu = () => {
        return this.hasOpenMenu();
      };

      // Add menu items for each group
      for (let groupIndex = 0; groupIndex < menu.orderedGroups.length; groupIndex++) {
        const group = menu.orderedGroups[groupIndex];

        for (const item of group.orderedItems) {
          const menuItem = document.createElement("menu-item");
          menuItem.setAttribute("label", item.label);
          menuItem.setAttribute("shortcut", item.shortcut);
          menuItem.setAttribute("action-id", item.actionId);

          // Set onClick callback (React-style prop)
          (menuItem as any).onClick = (actionId: string) => {
            // Close the menu
            this.closeMenu(menu.id);

            // Execute the action
            this._handleMenuAction(actionId);
          };

          if (group.id) {
            menuItem.setAttribute("data-subgroup", group.id);
          }

          if (item.disabled) {
            menuItem.setAttribute("disabled", "");
          }

          menuElement.appendChild(menuItem);
        }

        // Add separator after group (except for last group)
        if (groupIndex < menu.orderedGroups.length - 1) {
          const separator = document.createElement("menu-item");
          separator.setAttribute("separator", "");
          menuElement.appendChild(separator);
        }
      }

      this.appendChild(menuElement);
    }

    // Restore open menu using ID
    if (openMenuId) {
      this.openMenu(openMenuId);
    }
  }

  private _handleMenuAction = (actionId: string): void => {
    if (!actionId) return;

    const actionService = getDefaultServiceLayer().actionService;
    try {
      actionService.doAction(actionId);
    } catch (error) {
      console.error(`Failed to execute action ${actionId}:`, error);
    }
  };
}

defineComponent("dynamic-menu-bar", DynamicMenuBar);

declare global {
  interface HTMLElementTagNameMap {
    "dynamic-menu-bar": DynamicMenuBar;
  }
}
