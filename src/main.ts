import { IAction } from "./service/ActionService.ts";

// core services and functions:
import { setupSharedUxComponents } from "./gui/setup.ts";
import { getDefaultServiceLayer } from "./service/ServiceLayer.ts";

// features:
import { setupProjectBrowser } from "./feature/project-browser/ProjectBrowser";
import { addDebugFeature as setupDebugFeature } from "./feature/debug/setup";

// apply default theme:
getDefaultServiceLayer().getThemeService().applyDefaultTheme();

// setup features:
setupSharedUxComponents();
setupProjectBrowser();
setupDebugFeature();


// setup default actions:

var newProjectAction: IAction = {
  id: "core.newProject",
  name: "New Project",
  shortcut: "Ctrl+N",
  group: "File",
  do: async () => {
    console.log("New Project");
  },
  canDo: async () => true
}

var quitAction: IAction = {
  id: "core.quit",
  name: "Quit",
  shortcut: "Ctrl+Q",
  group: "File",
  do: async () => {
    console.log("Quit");
  },
  canDo: async () => true
}

var helpAction: IAction = {
  id: "core.help",
  name: "Help",
  shortcut: "F1",
  group: "Help",
  do: async () => {
    console.log("Help");
  },
  canDo: async () => true
}

getDefaultServiceLayer().actionService.addAction(newProjectAction);
getDefaultServiceLayer().actionService.addAction(quitAction);
getDefaultServiceLayer().actionService.addAction(helpAction);

// Additional actions for Edit menu
const dummyActions = [
  { id: "core.undo", name: "Undo", shortcut: "Ctrl+Z", group: "Edit" },
  { id: "core.redo", name: "Redo", shortcut: "Ctrl+Y", group: "Edit" },
  { id: "core.cut", name: "Cut", shortcut: "Ctrl+X", group: "Edit" },
  { id: "core.copy", name: "Copy", shortcut: "Ctrl+C", group: "Edit" },
  { id: "core.paste", name: "Paste", shortcut: "Ctrl+V", group: "Edit" },
  { id: "core.about", name: "About", shortcut: "", group: "Help" }
];

dummyActions.forEach(action => {
  getDefaultServiceLayer().actionService.addAction({
    ...action,
    do: async () => console.log(action.name),
    canDo: async () => true
  });
});
