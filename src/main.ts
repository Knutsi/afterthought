// core services and functions:
import { getDefaultServiceLayer } from "./service/ServiceLayer.ts";
import { GitStorageProvider } from "./service/storage/GitStorageProvider.ts";
import { PersonalStore } from "./service/database/PersonalStore.ts";
import type { IUiState } from "./service/database/PersonalStore.ts";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { invoke } from "@tauri-apps/api/core";
import { getMatches } from "@tauri-apps/plugin-cli";
import { availableMonitors } from "@tauri-apps/api/window";
import { LogicalPosition, LogicalSize } from "@tauri-apps/api/dpi";
import { openDatabaseWindow } from "./feature/git/openDatabaseWindow.ts";
import type { IWindowGeometry } from "./service/session/types.ts";

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

const CASCADE_ORIGIN_X = 80;
const CASCADE_ORIGIN_Y = 80;
const CASCADE_OFFSET = 30;
const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 600;
const MIN_VISIBLE_PX = 100;

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

async function isGeometryVisible(geo: IWindowGeometry): Promise<boolean> {
  const monitors = await availableMonitors();
  for (const monitor of monitors) {
    const mx = monitor.position.x;
    const my = monitor.position.y;
    const mw = monitor.size.width / monitor.scaleFactor;
    const mh = monitor.size.height / monitor.scaleFactor;

    // check if at least MIN_VISIBLE_PX of the window overlaps this monitor
    const overlapX = Math.min(geo.x + geo.width, mx + mw) - Math.max(geo.x, mx);
    const overlapY = Math.min(geo.y + geo.height, my + mh) - Math.max(geo.y, my);

    if (overlapX >= MIN_VISIBLE_PX && overlapY >= MIN_VISIBLE_PX) {
      return true;
    }
  }
  return false;
}

function cascadeGeometry(index: number): IWindowGeometry {
  return {
    x: CASCADE_ORIGIN_X + index * CASCADE_OFFSET,
    y: CASCADE_ORIGIN_Y + index * CASCADE_OFFSET,
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  };
}

async function resolveGeometry(
  path: string,
  index: number,
  geometryMap?: Record<string, IWindowGeometry> | null,
): Promise<IWindowGeometry | undefined> {
  if (!geometryMap) return undefined;

  const saved = geometryMap[path];
  if (!saved) return undefined;

  const visible = await isGeometryVisible(saved);
  if (visible) return saved;

  return cascadeGeometry(index);
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
    const sessionState = await serviceLayer.sessionService.getSessionState();
    const sessionDbs = sessionState?.openDatabases;
    const geometryMap = sessionState?.windowGeometry;

    if (sessionDbs && sessionDbs.length > 0) {
      // take first for self, spawn windows for the rest
      const [first, ...rest] = sessionDbs;

      let windowIndex = 1;
      for (const dbPath of rest) {
        const valid = await databaseService.isValidDatabase(dbPath);
        if (valid) {
          const name = dbPath.split('/').pop()!;
          const geo = await resolveGeometry(dbPath, windowIndex, geometryMap);
          await openDatabaseWindow({ name, path: dbPath }, geo);
          windowIndex++;
        }
      }

      const valid = await databaseService.isValidDatabase(first);
      if (valid) {
        // apply geometry to primary window
        const geo = await resolveGeometry(first, 0, geometryMap);
        if (geo) {
          const appWindow = getCurrentWebviewWindow();
          await appWindow.setSize(new LogicalSize(geo.width, geo.height));
          await appWindow.setPosition(new LogicalPosition(geo.x, geo.y));
        }
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

  // register this window's database in Rust state
  const appWindow = getCurrentWebviewWindow();
  await invoke('register_window_database', { label: appWindow.label, path: databasePath });

  // set window title to database name
  const name = databasePath.split('/').pop()!;
  await appWindow.setTitle(name);

  // track as recent
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
  appWindow.onCloseRequested(async () => {
    // save per-database activity state
    const entries = serviceLayer.activityService.getActivityEntries();
    await personalStore.setUiState({ activities: entries } as IUiState);

    // unregister from Rust state (also writes session.json with remaining windows)
    await invoke('unregister_window_database', { label: appWindow.label });
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
