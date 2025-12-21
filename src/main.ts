import { invoke } from "@tauri-apps/api/core";
import { IAction } from "./core/ActionService";

// core services and functions:
import { setupAppFeature } from "./feature/app/setup.ts";
import { setupSharedUxComponents } from "./gui/setup.ts";
import { getDefaultServiceLayer } from "./core/ServiceLayer";

// features:
import { setupProjectBrowser } from "./feature/project-browser/ProjectBrowser";
import { addDebugFeature as setupDebugFeature } from "./feature/debug/setup";

setupSharedUxComponents();

setupAppFeature();
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
  canDo: () => true
}

var quitAction: IAction = {
  id: "core.quit",
  name: "Quit",
  shortcut: "Ctrl+Q",
  group: "File",
  do: async () => {
    console.log("Quit");
  },
  canDo: () => true
}

var helpAction: IAction = {
  id: "core.help",
  name: "Help",
  shortcut: "F1",
  group: "Help",
  do: async () => {
    console.log("Help");
  },
  canDo: () => true
}

getDefaultServiceLayer().actionService.addAction(newProjectAction);
getDefaultServiceLayer().actionService.addAction(quitAction);
getDefaultServiceLayer().actionService.addAction(helpAction);
