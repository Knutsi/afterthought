import type { IAction } from "./service/ActionService";
import { getDefaultServiceLayer, ServiceLayer } from "./service/ServiceLayer";
import type { IContext } from "./service/context/types";

var closeActivityAction: IAction = {
  id: "core.closeActivity",
  name: "Close",
  shortcuts: ["Mod2+W"],
  menuGroup: "File",
  menuSubGroup: "close",
  repeatable: false,
  do: async (_context: IContext, _args?: Record<string, unknown>) => {
    const activityService = getDefaultServiceLayer().activityService;
    const activeId = activityService.getActiveActivityId();
    if (activeId) {
      activityService.closeActivity(activeId);
    }
  },
  canDo: async () => {
    const activityService = getDefaultServiceLayer().activityService;
    const activeId = activityService.getActiveActivityId();
    const homeId = activityService.getHomeActivityId();
    return activeId !== "" && activeId !== homeId;
  },
};

var switchActivityAction: IAction = {
  id: "core.switchActivity",
  name: "Switch Activity...",
  shortcuts: [","],
  menuGroup: "View",
  menuSubGroup: "activity",
  do: async (_context: IContext, _args?: Record<string, unknown>) => {
    const activityService = getDefaultServiceLayer().activityService;
    activityService.openActivitySwitcher();
  },
  canDo: async () => true,
};

var nextActivityAction: IAction = {
  id: "core.nextActivity",
  name: "Next Activity",
  shortcuts: ["Mod2+ArrowRight"],
  menuGroup: "View",
  menuSubGroup: "activity",
  do: async (_context: IContext, _args?: Record<string, unknown>) => {
    const activityService = getDefaultServiceLayer().activityService;
    activityService.switchToNextActivity();
  },
  canDo: async () => true,
};

var previousActivityAction: IAction = {
  id: "core.previousActivity",
  name: "Previous Activity",
  shortcuts: ["Mod2+ArrowLeft"],
  menuGroup: "View",
  menuSubGroup: "activity",
  do: async (_context: IContext, _args?: Record<string, unknown>) => {
    const activityService = getDefaultServiceLayer().activityService;
    activityService.switchToPreviousActivity();
  },
  canDo: async () => true,
};

function createSwitchToTabAction(n: number): IAction {
  return {
    id: `core.switchToTab${n}`,
    name: `Switch to Tab ${n}`,
    shortcuts: [`Mod2+${n}`],
    menuGroup: "View",
    hideFromMenu: true,
    repeatable: false,
    do: async (_context: IContext, _args?: Record<string, unknown>) => {
      const activityService = getDefaultServiceLayer().activityService;
      activityService.switchToActivityByVisibleIndex(n - 1);
    },
    canDo: async () => {
      const activityService = getDefaultServiceLayer().activityService;
      return activityService.getTabActivities().length >= n;
    },
  };
}

export function setupActivityActions(serviceLayer: ServiceLayer) {
  const actionService = serviceLayer.actionService;

  actionService.addAction(closeActivityAction);
  actionService.addAction(switchActivityAction);
  actionService.addAction(nextActivityAction);
  actionService.addAction(previousActivityAction);

  for (let i = 1; i <= 9; i++) {
    actionService.addAction(createSwitchToTabAction(i));
  }
}
