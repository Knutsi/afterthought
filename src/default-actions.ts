import { IAction } from "./service/ActionService";
import { getDefaultServiceLayer } from "./service/ServiceLayer";

var newProjectAction: IAction = {
  id: "core.newProject",
  name: "New Project",
  shortcut: "Ctrl+N",
  menuGroup: "File",
  menuSubGroup: "create",
  do: async () => {
    console.log("New Project");
  },
  canDo: async () => true,
};

var quitAction: IAction = {
  id: "core.quit",
  name: "Quit",
  shortcut: "Ctrl+Q",
  menuGroup: "File",
  menuSubGroup: "exit",
  do: async () => {
    console.log("Quit");
  },
  canDo: async () => true,
};

var helpAction: IAction = {
  id: "core.help",
  name: "Documentation",
  shortcut: "F1",
  menuGroup: "Help",
  menuSubGroup: "Docs",
  do: async () => {
    console.log("Help");
  },
  canDo: async () => true,
};

var undoAction: IAction = {
  id: "core.undo",
  name: "Undo",
  shortcut: "Ctrl+Z",
  menuGroup: "Edit",
  menuSubGroup: "Basic",
  do: async () => {
    console.log("Undo");
  },
  canDo: async () => true,
};

var redoAction: IAction = {
  id: "core.redo",
  name: "Redo",
  shortcut: "Ctrl+Y",
  menuGroup: "Edit",
  menuSubGroup: "Basic",
  do: async () => {
    console.log("Redo");
  },
  canDo: async () => true,
};

var cutAction: IAction = {
  id: "core.cut",
  name: "Cut",
  shortcut: "Ctrl+X",
  menuGroup: "Edit",
  menuSubGroup: "Clipboard",
  do: async () => {
    console.log("Cut");
  },
  canDo: async () => true,
};

var copyAction: IAction = {
  id: "core.copy",
  name: "Copy",
  shortcut: "Ctrl+C",
  menuGroup: "Edit",
  menuSubGroup: "Clipboard",
  do: async () => {
    console.log("Copy");
  },
  canDo: async () => true,
};

var pasteAction: IAction = {
  id: "core.paste",
  name: "Paste",
  shortcut: "Ctrl+V",
  menuGroup: "Edit",
  menuSubGroup: "Clipboard",
  do: async () => {
    console.log("Paste");
  },
  canDo: async () => true,
};

var aboutAction: IAction = {
  id: "core.about",
  name: "About",
  shortcut: "",
  menuGroup: "Help",
  menuSubGroup: "About",
  do: async () => {
    console.log("About");
  },
  canDo: async () => true,
};

export function setupDefaultActions() {
  const actionService = getDefaultServiceLayer().actionService;
  actionService.addAction(newProjectAction);
  actionService.addAction(quitAction);
  actionService.addAction(helpAction);
  actionService.addAction(undoAction);
  actionService.addAction(redoAction);
  actionService.addAction(cutAction);
  actionService.addAction(copyAction);
  actionService.addAction(pasteAction);
  actionService.addAction(aboutAction);
}
