import type { IAction } from "../../../service/ActionService";
import type { ServiceLayer } from "../../../service/ServiceLayer";
import type { IContext } from "../../../service/context/types";
import { URI_SCHEMES } from "../../../core-model/uri";
import { BoardActivity } from "../BoardActivity";
import { ZOOM_IN_ACTION_ID, ZOOM_OUT_ACTION_ID, RESET_ZOOM_ACTION_ID } from "../types";

const ZOOM_IN_FACTOR = 1.1;
const ZOOM_OUT_FACTOR = 0.9;
const ZOOM_MIN = 0.1;
const ZOOM_MAX = 5.0;
const ZOOM_DEFAULT = 1.0;

export function createZoomInAction(serviceLayer: ServiceLayer): IAction {
  return {
    id: ZOOM_IN_ACTION_ID,
    name: "Zoom In",
    shortcuts: ["+"],
    menuGroup: "View",
    menuSubGroup: "zoom",
    do: async () => {
      const activeActivity = serviceLayer.getActivityService().getActiveActivity();
      if (!(activeActivity instanceof BoardActivity)) return;
      const diagram = activeActivity.getDiagram();
      if (!diagram) return;

      const currentZoom = diagram.getZoom();
      const newZoom = Math.min(ZOOM_MAX, currentZoom * ZOOM_IN_FACTOR);
      diagram.setZoomAtPoint(newZoom);
    },
    canDo: async (context: IContext): Promise<boolean> => {
      return context.hasScheme(URI_SCHEMES.BOARD);
    },
  };
}

export function createZoomOutAction(serviceLayer: ServiceLayer): IAction {
  return {
    id: ZOOM_OUT_ACTION_ID,
    name: "Zoom Out",
    shortcuts: ["-"],
    menuGroup: "View",
    menuSubGroup: "zoom",
    do: async () => {
      const activeActivity = serviceLayer.getActivityService().getActiveActivity();
      if (!(activeActivity instanceof BoardActivity)) return;
      const diagram = activeActivity.getDiagram();
      if (!diagram) return;

      const currentZoom = diagram.getZoom();
      const newZoom = Math.max(ZOOM_MIN, currentZoom * ZOOM_OUT_FACTOR);
      diagram.setZoomAtPoint(newZoom);
    },
    canDo: async (context: IContext): Promise<boolean> => {
      return context.hasScheme(URI_SCHEMES.BOARD);
    },
  };
}

export function createResetZoomAction(serviceLayer: ServiceLayer): IAction {
  return {
    id: RESET_ZOOM_ACTION_ID,
    name: "Reset Zoom",
    shortcuts: ["="],
    menuGroup: "View",
    menuSubGroup: "zoom",
    do: async () => {
      const activeActivity = serviceLayer.getActivityService().getActiveActivity();
      if (!(activeActivity instanceof BoardActivity)) return;
      const diagram = activeActivity.getDiagram();
      if (!diagram) return;

      diagram.setZoomAtPoint(ZOOM_DEFAULT);
    },
    canDo: async (context: IContext): Promise<boolean> => {
      return context.hasScheme(URI_SCHEMES.BOARD);
    },
  };
}
