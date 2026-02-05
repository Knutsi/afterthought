import { IAction } from "./service/ActionService";
import { getDefaultServiceLayer, ServiceLayer } from "./service/ServiceLayer";
import type { IContext } from "./service/context/types";
import { invoke } from '@tauri-apps/api/core';

const UNDO_REDO_SUBGROUP = "undo-redo";

var newProjectAction: IAction = {
  id: "core.newProject",
  name: "New Project",
  shortcuts: ["Ctrl+N"],
  menuGroup: "File",
  menuSubGroup: "create",
  do: async (_context: IContext, _args?: Record<string, unknown>) => {
    console.log("New Project");
  },
  canDo: async () => true,
};

var quitAction: IAction = {
  id: "core.quit",
  name: "Quit",
  shortcuts: ["Ctrl+Q"],
  menuGroup: "File",
  menuSubGroup: "exit",
  do: async (_context: IContext, _args?: Record<string, unknown>) => {
    await invoke('quit_app');
  },
  canDo: async () => true,
};

var helpAction: IAction = {
  id: "core.help",
  name: "Documentation",
  shortcuts: ["F1"],
  menuGroup: "Help",
  menuSubGroup: "Docs",
  do: async (_context: IContext, _args?: Record<string, unknown>) => {
    console.log("Help");
  },
  canDo: async () => true,
};

var undoAction: IAction = {
  id: "core.undo",
  name: "Undo",
  shortcuts: ["Ctrl+Z", "U"],
  menuGroup: "Edit",
  menuSubGroup: UNDO_REDO_SUBGROUP,
  repeatable: false,
  do: async (_context: IContext, _args?: Record<string, unknown>) => {
    await getDefaultServiceLayer().actionService.undo();
  },
  canDo: async () => getDefaultServiceLayer().actionService.canUndo(),
};

var redoAction: IAction = {
  id: "core.redo",
  name: "Redo",
  shortcuts: ["Ctrl+Y", "R"],
  menuGroup: "Edit",
  menuSubGroup: UNDO_REDO_SUBGROUP,
  repeatable: false,
  do: async (_context: IContext, _args?: Record<string, unknown>) => {
    await getDefaultServiceLayer().actionService.redo();
  },
  canDo: async () => getDefaultServiceLayer().actionService.canRedo(),
};

var cutAction: IAction = {
  id: "core.cut",
  name: "Cut",
  shortcuts: ["Ctrl+X"],
  menuGroup: "Edit",
  menuSubGroup: "clipboard",
  do: async (_context: IContext, _args?: Record<string, unknown>) => {
    console.log("Cut");
  },
  canDo: async () => true,
};

var copyAction: IAction = {
  id: "core.copy",
  name: "Copy",
  shortcuts: ["Ctrl+C"],
  menuGroup: "Edit",
  menuSubGroup: "clipboard",
  do: async (_context: IContext, _args?: Record<string, unknown>) => {
    console.log("Copy");
  },
  canDo: async () => true,
};

var pasteAction: IAction = {
  id: "core.paste",
  name: "Paste",
  shortcuts: ["Ctrl+V"],
  menuGroup: "Edit",
  menuSubGroup: "clipboard",
  do: async (_context: IContext, _args?: Record<string, unknown>) => {
    console.log("Paste");
  },
  canDo: async () => true,
};

var repeatAction: IAction = {
  id: "core.repeat",
  name: "Repeat Last Action",
  shortcuts: ["."],
  menuGroup: "Edit",
  menuSubGroup: UNDO_REDO_SUBGROUP,
  repeatable: false,
  do: async (_context: IContext, _args?: Record<string, unknown>) => {
    const actionService = getDefaultServiceLayer().actionService;
    const lastActionId = actionService.getLastActionId();
    if (lastActionId) {
      await actionService.doAction(lastActionId, actionService.getLastArgs());
    }
  },
  canDo: async () => getDefaultServiceLayer().actionService.canRepeat(),
};

var aboutAction: IAction = {
  id: "core.about",
  name: "About",
  shortcuts: [],
  menuGroup: "Help",
  menuSubGroup: "About",
  do: async (_context: IContext, _args?: Record<string, unknown>) => {
    console.log("About");
  },
  canDo: async () => true,
};

export function setupDefaultActions(serviceLayer: ServiceLayer) {
  const actionService = serviceLayer.actionService;
  actionService.addAction(newProjectAction);
  actionService.addAction(quitAction);
  actionService.addAction(helpAction);
  actionService.addAction(undoAction);
  actionService.addAction(redoAction);
  actionService.addAction(repeatAction);
  actionService.addAction(cutAction);
  actionService.addAction(copyAction);
  actionService.addAction(pasteAction);
  actionService.addAction(aboutAction);
}
