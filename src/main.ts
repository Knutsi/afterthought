import { IAction } from "./service/ActionService.ts";

// core services and functions:
import { setupSharedUxComponents } from "./gui/setup.ts";
import { getDefaultServiceLayer } from "./service/ServiceLayer.ts";

// features:
import { setupProjectBrowser } from "./feature/project-browser/ProjectBrowser";
import { addDebugFeature as setupDebugFeature } from "./feature/debug/setup";
import { setupDefaultActions } from "./default-actions.ts";

// apply default theme:
getDefaultServiceLayer().getThemeService().applyDefaultTheme();

// setup features:
setupSharedUxComponents();
setupProjectBrowser();
setupDebugFeature();

// setup default actions:
setupDefaultActions();
