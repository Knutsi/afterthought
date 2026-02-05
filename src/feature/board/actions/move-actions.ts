import type { IAction, UndoFunction, RedoFunction } from "../../../service/ActionService";
import type { ServiceLayer } from "../../../service/ServiceLayer";
import type { IContext } from "../../../service/context/types";
import { TaskElement } from "../editor/diagram-board/elements/TaskElement";
import { BoardService } from "../BoardService";
import { MOVE_ELEMENTS_ACTION_ID, BOARD_SERVICE_NAME, type MoveElementsArgs } from "../types";

export function createMoveElementsAction(serviceLayer: ServiceLayer): IAction {
  return {
    id: MOVE_ELEMENTS_ACTION_ID,
    name: "Move Elements",
    shortcuts: [],
    menuGroup: "Edit",
    hideFromMenu: true,
    repeatable: false,
    do: async (_context: IContext, args?: Record<string, unknown>): Promise<UndoFunction | void> => {
      const typedArgs = args as MoveElementsArgs | undefined;
      if (!typedArgs) return;
      const { elements, deltaX, deltaY, selectionManager, boardUri } = typedArgs;

      if (deltaX === undefined || deltaY === undefined) return;

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

      const movedPositions = new Map<string, { x: number; y: number }>();
      for (const el of elements) {
        if (el instanceof TaskElement && el.taskUri) {
          movedPositions.set(el.taskUri, { x: el.posX, y: el.posY });
        }
      }

      const applyPositions = async (positions: Map<string, { x: number; y: number }>): Promise<void> => {
        for (const el of elements) {
          if (el instanceof TaskElement && el.taskUri) {
            const pos = positions.get(el.taskUri);
            if (pos) {
              el.posX = pos.x;
              el.posY = pos.y;
              await boardService.updateTaskPlacement(boardUri, el.taskUri, { x: pos.x, y: pos.y });
            }
          }
        }
      };

      const makeUndoFn = (from: Map<string, { x: number; y: number }>, to: Map<string, { x: number; y: number }>): UndoFunction => {
        return async (): Promise<RedoFunction | void> => {
          await applyPositions(to);
          return async (): Promise<UndoFunction | void> => {
            await applyPositions(from);
            return makeUndoFn(from, to);
          };
        };
      };

      return makeUndoFn(movedPositions, originalPositions);
    },
    canDo: async () => true,
  };
}
