// core services and functions:
import { getDefaultServiceLayer } from "./service/ServiceLayer.ts";

// Import components directly (they auto-register via defineComponent):
import "./gui/layout/MainLayout";
import "./gui/menubar/MenuItem";
import "./gui/menubar/Menu";
import "./gui/menubar/DynamicMenuBar";
import "./gui/tabs/TabPage";
import "./gui/tabs/TabContainer";
import "./feature/project-browser/ProjectBrowser";
import "./feature/debug/ActionList";

// Import default actions setup:
import { setupDefaultActions } from "./default-actions.ts";

// apply default theme:
getDefaultServiceLayer().getThemeService().applyDefaultTheme();

// setup default actions:
setupDefaultActions();

// Trigger initial action availability check after all initialization is complete
getDefaultServiceLayer().actionService.updateActionAvailability();
