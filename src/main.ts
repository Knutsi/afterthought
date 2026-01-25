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
import { setupBoardFeature } from "./feature/board/setupBoardFeature.ts";
import { setupHomeFeature } from "./feature/home/setupHomeFeature.ts";
import { setupTaskFeature } from "./feature/task/setupTaskFeature.ts";
import { CREATE_BOARD_ACTION_ID } from "./feature/board/types.ts";

async function initializeApp(): Promise<void> {
  const serviceLayer = getDefaultServiceLayer();

  // Initialize storage layer first
  await serviceLayer.objectService.initialize();

  // setup default actions:
  setupDefaultActions(serviceLayer);

  // main container for activities:
  const activityContainer = getActivityContainer();
  serviceLayer.activityService.registerActivityContainer(activityContainer);

  // theme:
  await serviceLayer.getThemeService().initialize(serviceLayer.objectService);
  serviceLayer.getThemeService().registerActions(serviceLayer.actionService);

  // register all features:
  setupHomeFeature(serviceLayer);
  await setupBoardFeature(serviceLayer);
  await setupTaskFeature(serviceLayer);

  // Trigger initial action availability check after all initialization is complete
  serviceLayer.actionService.updateActionAvailability();

  // DEBUG:
  serviceLayer.actionService.doAction(CREATE_BOARD_ACTION_ID);
}

initializeApp().catch(console.error);

/* SUPPORTING FUNCTIONS */
function getActivityContainer(): HTMLElement {
  const activityContainer = document.getElementById("activity-container") as HTMLElement;
  if (!activityContainer) {
    throw new Error("Activity container not found");
  }
  return activityContainer;
}
