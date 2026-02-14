// core services and functions:
import { getDefaultServiceLayer } from "./service/ServiceLayer.ts";
import { GitStorageProvider } from "./service/storage/GitStorageProvider.ts";
import { PersonalStore } from "./service/database/PersonalStore.ts";
import type { IUiState } from "./service/database/PersonalStore.ts";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { getMatches } from "@tauri-apps/plugin-cli";
import { openDatabaseWindow } from "./feature/git/openDatabaseWindow.ts";

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
import "./feature/git/NewDatabaseActivity.ts";

// gui toolkit and modal:
import "./gui/toolkit/Button";
import "./gui/toolkit/FormField";
import "./gui/toolkit/Dialog";
import "./gui/modal/ModalOverlay";

// Import default actions setup:
import { setupDefaultActions } from "./default-actions.ts";
import { setupKeyboardFeature } from "./feature/keyboard/setupKeyboardFeature.ts";
import { setupCommandPaletteFeature } from "./feature/command-palette/setupCommandPaletteFeature.ts";
import { setupBoardFeature } from "./feature/board/setupBoardFeature.ts";
import { setupHomeFeature } from "./feature/home/setupHomeFeature.ts";
import { setupTaskFeature } from "./feature/task/setupTaskFeature.ts";
import { setupGitFeature } from "./feature/git/setupGitFeature.ts";

interface ICliFlags {
  noRestoreDatabases: boolean;
  noRestoreActivities: boolean;
}

function isPrimaryWindow(): boolean {
  const params = new URLSearchParams(window.location.search);
  return !params.has('database');
}

async function getCliFlags(): Promise<ICliFlags> {
  if (!isPrimaryWindow()) {
    return { noRestoreDatabases: false, noRestoreActivities: false };
  }
  try {
    const matches = await getMatches();
    return {
      noRestoreDatabases: !!matches.args['no-restore-databases']?.occurrences,
      noRestoreActivities: !!matches.args['no-restore-activities']?.occurrences,
    };
  } catch {
    return { noRestoreDatabases: false, noRestoreActivities: false };
  }
}

async function resolveDatabasePath(
  serviceLayer: import("./service/ServiceLayer").ServiceLayer,
  cliFlags: ICliFlags,
): Promise<string> {
  const databaseService = serviceLayer.databaseService;

  // secondary window: use url param
  const params = new URLSearchParams(window.location.search);
  const paramPath = params.get('database');
  if (paramPath) {
    const info = await databaseService.openDatabase(paramPath);
    return info.path;
  }

  // primary window: try session restore
  if (!cliFlags.noRestoreDatabases) {
    const sessionDbs = await serviceLayer.sessionService.getOpenDatabases();
    if (sessionDbs && sessionDbs.length > 0) {
      // take first for self, spawn windows for the rest
      const [first, ...rest] = sessionDbs;
      for (const dbPath of rest) {
        const valid = await databaseService.isValidDatabase(dbPath);
        if (valid) {
          const name = dbPath.split('/').pop()!;
          openDatabaseWindow({ name, path: dbPath });
        }
      }
      const valid = await databaseService.isValidDatabase(first);
      if (valid) {
        return first;
      }
    }
  }

  // fallback: last opened
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
  const cliFlags = await getCliFlags();

  // resolve database path
  const databasePath = await resolveDatabasePath(serviceLayer, cliFlags);

  // initialize storage layer
  const storageProvider = new GitStorageProvider(databasePath);
  await serviceLayer.objectService.initialize(storageProvider);

  // initialize personal store
  const personalStore = new PersonalStore(storageProvider);
  await personalStore.initialize();
  serviceLayer.personalStore = personalStore;

  // track as recent
  const name = databasePath.split('/').pop()!;
  await serviceLayer.databaseService.addRecentDatabase({ name, path: databasePath });

  // setup default actions:
  setupDefaultActions(serviceLayer);

  // setup keyboard shortcuts:
  setupKeyboardFeature(serviceLayer);

  // setup command palette:
  setupCommandPaletteFeature(serviceLayer);

  // main container for activities:
  const activityContainer = getActivityContainer();
  serviceLayer.activityService.registerActivityContainer(activityContainer);

  // modal container:
  const modalContainer = document.getElementById("modal-container");
  if (modalContainer) {
    serviceLayer.activityService.registerModalContainer(modalContainer);
  }

  // theme:
  await serviceLayer.getThemeService().initialize(serviceLayer.objectService);
  serviceLayer.getThemeService().registerActions(serviceLayer.actionService);

  // register all features:
  const featureSetups = [
    setupGitFeature,
    setupHomeFeature,
    setupBoardFeature,
    setupTaskFeature,
  ];

  for (const setupFeature of featureSetups) {
    await setupFeature(serviceLayer);
  }

  // restore activities from previous session
  if (!cliFlags.noRestoreActivities) {
    const uiState = await personalStore.getUiState<IUiState>();
    if (uiState?.activities) {
      for (const activity of uiState.activities) {
        // skip home activities, setupHomeFeature already creates one
        if (activity.isHomeActivity) continue;
        serviceLayer.activityService.startActivity(
          activity.elementName,
          activity.params,
        );
      }
    }
  }

  // Trigger initial action availability check after all initialization is complete
  serviceLayer.actionService.updateActionAvailability();

  // register close handler to save state
  const appWindow = getCurrentWebviewWindow();
  appWindow.onCloseRequested(async () => {
    // save per-database activity state
    const entries = serviceLayer.activityService.getActivityEntries();
    await personalStore.setUiState({ activities: entries } as IUiState);

    // save open databases to session (primary window updates session file)
    await serviceLayer.sessionService.saveOpenDatabases([databasePath]);
  });
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
