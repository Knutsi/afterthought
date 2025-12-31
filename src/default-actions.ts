import { IAction } from "./service/ActionService";
import { getDefaultServiceLayer } from "./service/ServiceLayer";

var newProjectAction: IAction = {
  id: "core.newProject",
  name: "New Project",
  shortcut: "Ctrl+N",
  group: "File",
  do: async () => {
    console.log("New Project");
  },
  canDo: async () => true,
};

var quitAction: IAction = {
  id: "core.quit",
  name: "Quit",
  shortcut: "Ctrl+Q",
  group: "File",
  do: async () => {
    console.log("Quit");
  },
  canDo: async () => true,
};

var helpAction: IAction = {
  id: "core.help",
  name: "Help",
  shortcut: "F1",
  group: "Help",
  do: async () => {
    console.log("Help");
  },
  canDo: async () => true,
};

var undoAction: IAction = {
  id: "core.undo",
  name: "Undo",
  shortcut: "Ctrl+Z",
  group: "Edit",
  do: async () => {
    console.log("Undo");
  },
  canDo: async () => true,
};

var redoAction: IAction = {
  id: "core.redo",
  name: "Redo",
  shortcut: "Ctrl+Y",
  group: "Edit",
  do: async () => {
    console.log("Redo");
  },
  canDo: async () => true,
};

var cutAction: IAction = {
  id: "core.cut",
  name: "Cut",
  shortcut: "Ctrl+X",
  group: "Edit",
  do: async () => {
    console.log("Cut");
  },
  canDo: async () => true,
};

var copyAction: IAction = {
  id: "core.copy",
  name: "Copy",
  shortcut: "Ctrl+C",
  group: "Edit",
  do: async () => {
    console.log("Copy");
  },
  canDo: async () => true,
};

var pasteAction: IAction = {
  id: "core.paste",
  name: "Paste",
  shortcut: "Ctrl+V",
  group: "Edit",
  do: async () => {
    console.log("Paste");
  },
  canDo: async () => true,
};

var aboutAction: IAction = {
  id: "core.about",
  name: "About",
  shortcut: "",
  group: "Help",
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
