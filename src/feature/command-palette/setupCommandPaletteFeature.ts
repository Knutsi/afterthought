import type { ServiceLayer } from "../../service/ServiceLayer";
import type { IAction } from "../../service/ActionService";
import type { IContext } from "../../service/context/types";
import { KeyboardEvents } from "../../service/KeyboardService";
import type { CommandPalette } from "../../gui/command-palette/CommandPalette";

import "../../gui/command-palette/CommandPalette";

const COMMAND_PALETTE_ID = "command-palette";
const COMMAND_PALETTE_ACTION_ID = "core.commandPalette";

export function setupCommandPaletteFeature(serviceLayer: ServiceLayer): void {
  const commandPaletteAction: IAction = {
    id: COMMAND_PALETTE_ACTION_ID,
    name: "Command Palette",
    shortcuts: ["Mod+P"],
    menuGroup: "View",
    menuSubGroup: "command-palette",
    do: async (_context: IContext) => {
      toggleCommandPalette(serviceLayer);
    },
    canDo: async () => true,
  };

  serviceLayer.actionService.addAction(commandPaletteAction);

  serviceLayer.keyboardService.addEventListener(KeyboardEvents.SHIFT_SHIFT, () => {
    toggleCommandPalette(serviceLayer);
  });
}

function getCommandPalette(): CommandPalette | null {
  return document.getElementById(COMMAND_PALETTE_ID) as CommandPalette | null;
}

function toggleCommandPalette(serviceLayer: ServiceLayer): void {
  const palette = getCommandPalette();
  if (!palette) return;

  if (palette.isVisible()) {
    hideCommandPalette();
  } else {
    showCommandPalette(serviceLayer);
  }
}

function showCommandPalette(serviceLayer: ServiceLayer): void {
  const palette = getCommandPalette();
  if (!palette) return;

  const actions = serviceLayer.actionService.getActions();
  const availability = serviceLayer.actionService.getActionAvailability();
  palette.configure(actions, availability);

  palette.onExecute = async (actionId: string) => {
    hideCommandPalette();
    const context = serviceLayer.getContextService();
    const action = actions.find((a) => a.id === actionId);
    if (action && (await action.canDo(context))) {
      await serviceLayer.actionService.doAction(actionId);
    }
  };

  palette.onCancel = () => {
    hideCommandPalette();
  };

  palette.show();
}

function hideCommandPalette(): void {
  getCommandPalette()?.hide();
}
