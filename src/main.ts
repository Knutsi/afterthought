// core services and functions:
import { getDefaultServiceLayer } from "./service/ServiceLayer.ts";

// Import components directly (they auto-register via defineComponent):
import "./gui/layout/MainLayout";
import "./gui/menubar/MenuItem";
import "./gui/menubar/Menu";
import "./gui/menubar/DynamicMenuBar";
import "./gui/activity/TabView";
import "./feature/project-browser/ProjectBrowser";
import "./feature/debug/ActionList";
import "./feature/home/HomeActivity.ts";
import "./feature/board/BoardActivity.ts";

// Import default actions setup:
import { setupDefaultActions } from "./default-actions.ts";

// apply default theme:
getDefaultServiceLayer().getThemeService().applyDefaultTheme();

// setup default actions:
setupDefaultActions();

const serviceLayer = getDefaultServiceLayer();

// register theme actions:
serviceLayer.getThemeService().registerActions(serviceLayer.actionService);

// register activity container (set up in index.html):
const activityContainer = document.getElementById("activity-container") as HTMLElement;
if (!activityContainer) {
  throw new Error("Activity container not found");
}
serviceLayer.activityService.registerActivityContainer(activityContainer);

serviceLayer.activityService.startActivity("home-activity", {});
serviceLayer.activityService.startActivity("board-activity", {});
serviceLayer.activityService.startActivity("board-activity", {});

// Trigger initial action availability check after all initialization is complete
serviceLayer.actionService.updateActionAvailability();
