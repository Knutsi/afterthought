// core services and functions:
import { getDefaultServiceLayer } from "./service/ServiceLayer.ts";
import { DatabaseService } from "./service/database/DatabaseService.ts";

// Import components directly (they auto-register via defineComponent):
import "./gui/core/ServiceProvider";
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
import { setupKeyboardFeature } from "./feature/keyboard/setupKeyboardFeature.ts";
import { setupCommandPaletteFeature } from "./feature/command-palette/setupCommandPaletteFeature.ts";
import { setupBoardFeature } from "./feature/board/setupBoardFeature.ts";
import { setupHomeFeature } from "./feature/home/setupHomeFeature.ts";
import { setupTaskFeature } from "./feature/task/setupTaskFeature.ts";
import { CREATE_BOARD_ACTION_ID } from "./feature/board/types.ts";

async function resolveDatabasePath(databaseService: DatabaseService): Promise<string> {
  // check url param first (set when opening from another window)
  const params = new URLSearchParams(window.location.search);
  const paramPath = params.get('database');
  if (paramPath) {
    const info = await databaseService.openDatabase(paramPath);
    return info.path;
  }

  // check last opened database
  const lastOpened = await databaseService.getLastOpenedDatabase();
  if (lastOpened) {
    return lastOpened;
  }

  // first run: create default database
  const info = await databaseService.ensureDefaultDatabase();
  return info.path;
}

async function initializeApp(): Promise<void> {
  const serviceLayer = getDefaultServiceLayer();
  const databaseService = new DatabaseService();

  // resolve database path
  const databasePath = await resolveDatabasePath(databaseService);

  // initialize storage layer with resolved path
  await serviceLayer.objectService.initialize(databasePath);

  // track as recent
  const name = databasePath.split('/').pop()!;
  await databaseService.addRecentDatabase({ name, path: databasePath });

  // setup default actions:
  setupDefaultActions(serviceLayer, databaseService);

  // setup keyboard shortcuts:
  setupKeyboardFeature(serviceLayer);

  // setup command palette:
  setupCommandPaletteFeature(serviceLayer);

  // main container for activities:
  const activityContainer = getActivityContainer();
  serviceLayer.activityService.registerActivityContainer(activityContainer);

  // theme:
  await serviceLayer.getThemeService().initialize(serviceLayer.objectService);
  serviceLayer.getThemeService().registerActions(serviceLayer.actionService);

  // register all features:
  const featureSetups = [
    setupHomeFeature,
    setupBoardFeature,
    setupTaskFeature,
  ];

  for (const setupFeature of featureSetups) {
    await setupFeature(serviceLayer);
  }

  // Trigger initial action availability check after all initialization is complete
  serviceLayer.actionService.updateActionAvailability();

  // DEBUG:
  serviceLayer.actionService.doAction(CREATE_BOARD_ACTION_ID);
}

const showBody = () => requestAnimationFrame(() => document.body.style.visibility = 'visible');
initializeApp().then(showBody).catch((e) => { showBody(); console.error(e); });

/* SUPPORTING FUNCTIONS */
function getActivityContainer(): HTMLElement {
  const activityContainer = document.getElementById("activity-container") as HTMLElement;
  if (!activityContainer) {
    throw new Error("Activity container not found");
  }
  return activityContainer;
}
