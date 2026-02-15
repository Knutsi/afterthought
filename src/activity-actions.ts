import type { IAction } from "./service/ActionService";
import { getDefaultServiceLayer, ServiceLayer } from "./service/ServiceLayer";
import type { IContext } from "./service/context/types";

var closeActivityAction: IAction = {
  id: "core.closeActivity",
  name: "Close",
  shortcuts: ["Alt+W"],
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
  shortcuts: ["Alt+L"],
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
  shortcuts: ["Alt+H"],
  menuGroup: "View",
  menuSubGroup: "activity",
  do: async (_context: IContext, _args?: Record<string, unknown>) => {
    const activityService = getDefaultServiceLayer().activityService;
    activityService.switchToPreviousActivity();
  },
  canDo: async () => true,
};

export function setupActivityActions(serviceLayer: ServiceLayer) {
  const actionService = serviceLayer.actionService;

  actionService.addAction(closeActivityAction);
  actionService.addAction(switchActivityAction);
  actionService.addAction(nextActivityAction);
  actionService.addAction(previousActivityAction);
}
