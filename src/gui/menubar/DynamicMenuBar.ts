import { BaseComponent, defineComponent } from '../core/BaseComponent';
import { EventListeners } from '../core/utilities';
import { getDefaultServiceLayer } from '../../service/ServiceLayer';
import { ActionEvents, type IAction } from '../../service/ActionService';

export class DynamicMenuBar extends BaseComponent {
  private events = new EventListeners();

  // Track existing DOM elements to prevent recreation
  private menuElements: Map<string, HTMLElement> = new Map();
  private menuItems: Map<string, HTMLElement> = new Map();
  private subgroupsByMenu: Map<string, Set<string | undefined>> = new Map();

  static get observedAttributes(): string[] {
    return [];
  }

  protected onInit(): void {
    const actionService = getDefaultServiceLayer().actionService;

    // Listen to action events - incremental updates instead of full regeneration
    actionService.addEventListener(ActionEvents.ACTION_ADDED, (e: Event) => {
      const customEvent = e as CustomEvent;
      this.addActionToMenu(customEvent.detail.action);
    });

    actionService.addEventListener(ActionEvents.ACTION_AVAILABILITY_UPDATED, () => {
      this.updateMenuAvailability();
    });

    // Listen for menu-action events and route to ActionService
    this.events.add(this, "menu-action", this._handleMenuAction);

    // Initial menu population - add each action incrementally
    const actions = actionService.getActions();
    actions.forEach(action => this.addActionToMenu(action));
  }

  protected onDestroy(): void {
    this.events.removeAll();
    this.menuElements.clear();
    this.menuItems.clear();
    this.subgroupsByMenu.clear();
  }

  protected render(): void {
    this.shadowRoot!.innerHTML = `
      <style>
        :host {
          display: block;
        }
      </style>
      <menu-bar>
        <slot></slot>
      </menu-bar>
    `;
  }

  private getOrCreateMenu(menuGroup: string): HTMLElement {
    // Return existing menu if it exists
    if (this.menuElements.has(menuGroup)) {
      return this.menuElements.get(menuGroup)!;
    }

    // Create new menu-menu element
    const menuMenu = document.createElement('menu-menu');
    menuMenu.setAttribute('label', menuGroup);

    // Find insertion position (alphabetical by menuGroup)
    let insertIndex = 0;
    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i];
      if (child.tagName.toLowerCase() === 'menu-menu') {
        const existingLabel = child.getAttribute('label') || '';
        if (menuGroup.localeCompare(existingLabel) > 0) {
          insertIndex = i + 1;
        }
      }
    }

    // Insert menu in correct position
    if (insertIndex >= this.children.length) {
      this.appendChild(menuMenu);
    } else {
      this.insertBefore(menuMenu, this.children[insertIndex]);
    }

    // Track menu and initialize subgroup set
    this.menuElements.set(menuGroup, menuMenu);
    this.subgroupsByMenu.set(menuGroup, new Set());

    return menuMenu;
  }

  private addActionToMenu(action: IAction): void {
    // Get or create the menu for this action's menuGroup
    const menu = this.getOrCreateMenu(action.menuGroup);

    // Create menu-item element
    const menuItem = document.createElement('menu-item');
    menuItem.setAttribute('label', action.name);
    menuItem.setAttribute('shortcut', action.shortcut);
    menuItem.setAttribute('action-id', action.id);

    // Store subgroup in data attribute for easy lookup
    if (action.menuSubGroup) {
      menuItem.setAttribute('data-subgroup', action.menuSubGroup);
    }

    // Set initial availability
    action.canDo().then(canDo => {
      if (!canDo) {
        menuItem.setAttribute('disabled', '');
      }
    });

    // Track this menu item
    this.menuItems.set(action.id, menuItem);

    // Track subgroup (for divider management)
    const subgroups = this.subgroupsByMenu.get(action.menuGroup)!;
    const isNewSubgroup = !subgroups.has(action.menuSubGroup);
    subgroups.add(action.menuSubGroup);

    // Find correct insertion position
    const position = this.findInsertPositionInMenu(menu, action);

    // Insert menu item at correct position
    if (position >= menu.children.length) {
      menu.appendChild(menuItem);
    } else {
      menu.insertBefore(menuItem, menu.children[position]);
    }

    // Update dividers if we added a new subgroup
    if (isNewSubgroup && subgroups.size > 1) {
      this.updateDividersForMenu(menu);
    }
  }

  private findInsertPositionInMenu(menu: HTMLElement, action: IAction): number {
    const targetSubgroup = action.menuSubGroup;

    for (let i = 0; i < menu.children.length; i++) {
      const child = menu.children[i];

      // Skip separators when counting position
      if (child.hasAttribute('separator')) {
        continue;
      }

      if (child.tagName.toLowerCase() === 'menu-item') {
        const itemSubgroup = child.getAttribute('data-subgroup') || undefined;

        // Undefined subgroups come first
        if (targetSubgroup === undefined && itemSubgroup !== undefined) {
          return i;
        }

        // If both defined, compare alphabetically
        if (targetSubgroup !== undefined && itemSubgroup !== undefined) {
          if (targetSubgroup.localeCompare(itemSubgroup) < 0) {
            return i;
          }
        }
      }
    }

    // Insert at end if no earlier position found
    return menu.children.length;
  }

  private updateDividersForMenu(menu: HTMLElement): void {
    // Remove all existing separators
    const separators = Array.from(menu.querySelectorAll('[separator]'));
    separators.forEach(sep => sep.remove());

    // Insert dividers between subgroups
    let previousSubgroup: string | undefined = undefined;

    for (let i = 0; i < menu.children.length; i++) {
      const child = menu.children[i];

      if (child.tagName.toLowerCase() === 'menu-item' && !child.hasAttribute('separator')) {
        const currentSubgroup = child.getAttribute('data-subgroup') || undefined;

        // Insert divider if subgroup changed (but not before first subgroup)
        if (previousSubgroup !== undefined && previousSubgroup !== currentSubgroup) {
          const separator = document.createElement('menu-item');
          separator.setAttribute('separator', '');
          menu.insertBefore(separator, child);
          i++; // Skip the separator we just inserted
        }

        previousSubgroup = currentSubgroup;
      }
    }
  }

  private _handleMenuAction = (e: Event): void => {
    const customEvent = e as CustomEvent;
    const actionId = customEvent.detail.actionId;

    if (!actionId) return;

    const actionService = getDefaultServiceLayer().actionService;
    try {
      actionService.doAction(actionId);
    } catch (error) {
      console.error(`Failed to execute action ${actionId}:`, error);
    }
  };

  private updateMenuAvailability(): void {
    const actionService = getDefaultServiceLayer().actionService;
    const allActions = actionService.getActions();

    // Iterate tracked items instead of querying DOM
    this.menuItems.forEach((menuItem, actionId) => {
      const action = allActions.find(a => a.id === actionId);
      if (!action) return;

      action.canDo().then(canDo => {
        if (canDo) {
          menuItem.removeAttribute('disabled');
        } else {
          menuItem.setAttribute('disabled', '');
        }
      });
    });
  }
}

defineComponent('dynamic-menu-bar', DynamicMenuBar);

declare global {
  interface HTMLElementTagNameMap {
    'dynamic-menu-bar': DynamicMenuBar;
  }
}
