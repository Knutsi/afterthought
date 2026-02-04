import type { IAction, UndoFunction } from "../../../service/ActionService";
import type { ServiceLayer } from "../../../service/ServiceLayer";
import type { IContext } from "../../../service/context/types";
import type { DiagramElement } from "../editor/diagram-core/types";
import type { SelectionManager } from "../editor/diagram-core/managers/SelectionManager";
import type { Uri } from "../../../core-model/uri";
import { TaskElement } from "../editor/diagram-board/elements/TaskElement";
import { BoardService } from "../BoardService";
import { MOVE_ELEMENTS_ACTION_ID, BOARD_SERVICE_NAME } from "../types";

export function createMoveElementsAction(serviceLayer: ServiceLayer): IAction {
  return {
    id: MOVE_ELEMENTS_ACTION_ID,
    name: "Move Elements",
    shortcut: "",
    menuGroup: "Edit",
    hideFromMenu: true,
    do: async (_context: IContext, args?: Record<string, unknown>): Promise<UndoFunction | void> => {
      const elements = args?.elements as DiagramElement[] | undefined;
      const deltaX = args?.deltaX as number | undefined;
      const deltaY = args?.deltaY as number | undefined;
      const selectionManager = args?.selectionManager as SelectionManager | undefined;
      const boardUri = args?.boardUri as Uri | undefined;

      if (!elements || deltaX === undefined || deltaY === undefined || !selectionManager || !boardUri) return;

      const boardService = serviceLayer.getFeatureService<BoardService>(BOARD_SERVICE_NAME);

      const originalPositions = new Map<string, { x: number; y: number }>();

      for (const el of elements) {
        if (el instanceof TaskElement && el.taskUri) {
          originalPositions.set(el.taskUri, { x: el.posX - deltaX, y: el.posY - deltaY });
          await boardService.updateTaskPlacement(boardUri, el.taskUri, {
            x: el.posX,
            y: el.posY,
          });
        }
      }

      selectionManager.setSelection(elements.map(e => e.id));

      return async () => {
        for (const el of elements) {
          if (el instanceof TaskElement && el.taskUri) {
            const original = originalPositions.get(el.taskUri);
            if (original) {
              el.posX = original.x;
              el.posY = original.y;
              await boardService.updateTaskPlacement(boardUri, el.taskUri, {
                x: original.x,
                y: original.y,
              });
            }
          }
        }
      };
    },
    canDo: async () => true,
  };
}
