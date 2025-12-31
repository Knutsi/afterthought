import type { IAction } from "../../service/ActionService";

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

export interface IDynamicMenuBarModel {
  orderedMenus: IMenu[];
}

export interface IMenu {
  id: string;
  label: string;
  orderedGroups: IMenuGroup[];
}

export interface IMenuGroup {
  id: string;
  orderedItems: IMenuItem[];
}

export interface IMenuItem {
  id: string;
  label: string;
  shortcut: string;
  actionId: string;
  disabled: boolean;
}

/**
 * Sorts items by preferred order, then alphabetically.
 * Items in preferredOrder come first, others come after alphabetically.
 */
function sortByPreferredOrder<T>(
  items: T[],
  preferredOrder: string[],
  getKey: (item: T) => string
): T[] {
  return [...items].sort((a, b) => {
    const aKey = getKey(a);
    const bKey = getKey(b);

    const aIndex = preferredOrder.indexOf(aKey);
    const bIndex = preferredOrder.indexOf(bKey);

    // Both in preferred list
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }

    // Only a is in preferred list
    if (aIndex !== -1) return -1;

    // Only b is in preferred list
    if (bIndex !== -1) return 1;

    // Neither in preferred list, sort alphabetically
    return aKey.localeCompare(bKey, undefined, { sensitivity: "base" });
  });
}

/**
 * Extracts unique menu names from actions and returns them sorted.
 */
function extractUniqueMenus(actions: IAction[]): string[] {
  const menuSet = new Set<string>();

  for (const action of actions) {
    menuSet.add(action.menuGroup);
  }

  const menus = Array.from(menuSet);
  return sortByPreferredOrder(menus, preferredMenuOrder, (menu) => menu);
}

/**
 * Groups actions by their menu group.
 */
function groupActionsByMenu(actions: IAction[]): Map<string, IAction[]> {
  const menuMap = new Map<string, IAction[]>();

  for (const action of actions) {
    if (!menuMap.has(action.menuGroup)) {
      menuMap.set(action.menuGroup, []);
    }
    menuMap.get(action.menuGroup)!.push(action);
  }

  return menuMap;
}

/**
 * Groups actions by their subgroup.
 * Returns a Map with subgroups sorted by preferred order.
 */
function groupActionsBySubgroup(actions: IAction[]): Map<string | undefined, IAction[]> {
  const subgroupMap = new Map<string | undefined, IAction[]>();

  for (const action of actions) {
    const subgroupKey = action.menuSubGroup || undefined;

    if (!subgroupMap.has(subgroupKey)) {
      subgroupMap.set(subgroupKey, []);
    }
    subgroupMap.get(subgroupKey)!.push(action);
  }

  return subgroupMap;
}

/**
 * Builds menu items from actions, checking canDo() in parallel.
 */
async function buildMenuItems(actions: IAction[]): Promise<IMenuItem[]> {
  const itemPromises = actions.map(async (action) => {
    const canDo = await action.canDo().catch(() => false);
    return {
      id: action.id,
      label: action.name,
      shortcut: action.shortcut,
      actionId: action.id,
      disabled: !canDo,
    } as IMenuItem;
  });

  return Promise.all(itemPromises);
}

/**
 * Builds menu groups from actions, sorting subgroups and building items.
 */
async function buildMenuGroups(actions: IAction[]): Promise<IMenuGroup[]> {
  const subgroupMap = groupActionsBySubgroup(actions);

  // Sort subgroups by preferred order
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

  // Build groups with their items
  const groups: IMenuGroup[] = [];

  for (const subgroup of sortedSubgroups) {
    const actionsInSubgroup = subgroupMap.get(subgroup)!;
    const orderedItems = await buildMenuItems(actionsInSubgroup);

    groups.push({
      id: subgroup || "",
      orderedItems,
    });
  }

  return groups;
}

/**
 * Builds the complete menu bar model from actions.
 * This is the main orchestrator function that calls the helpers in sequence.
 */
export async function buildMenuBarModel(actions: IAction[]): Promise<IDynamicMenuBarModel> {
  // Step 1: Get unique menus sorted by preferred order
  const menuLabels = extractUniqueMenus(actions);

  // Step 2: Group actions by menu
  const menuMap = groupActionsByMenu(actions);

  // Step 3: Build each menu with its groups and items
  const orderedMenus: IMenu[] = [];

  for (const menuLabel of menuLabels) {
    const actionsInMenu = menuMap.get(menuLabel)!;
    const orderedGroups = await buildMenuGroups(actionsInMenu);

    orderedMenus.push({
      id: `menu-${menuLabel.toLowerCase().replace(/\s+/g, '-')}`,
      label: menuLabel,
      orderedGroups,
    });
  }

  return { orderedMenus };
}
