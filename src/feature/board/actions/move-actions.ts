import type { IAction, UndoFunction, RedoFunction } from "../../../service/ActionService";
import type { ServiceLayer } from "../../../service/ServiceLayer";
import type { IContext } from "../../../service/context/types";
import type { DiagramElement } from "../editor/diagram-core/types";
import type { BoardMovementService, PositionMap } from "../service/BoardMovementService";
import { MOVE_ELEMENTS_ACTION_ID, BOARD_MOVEMENT_SERVICE_NAME, type MoveElementsArgs } from "../types";

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
      const { elements, deltaX, deltaY, boardUri, diagram } = typedArgs;

      if (deltaX === undefined || deltaY === undefined) return;

      const movementService = serviceLayer.getFeatureService<BoardMovementService>(BOARD_MOVEMENT_SERVICE_NAME);
      const { originalPositions, movedPositions } = await movementService.moveElements(boardUri, elements, deltaX, deltaY);

      diagram.getSelectionManager().setSelection(elements.map(e => e.id));

      const makeUndoFn = (from: PositionMap, to: PositionMap, els: DiagramElement[]): UndoFunction => {
        return async (): Promise<RedoFunction | void> => {
          await movementService.applyPositions(boardUri, els, to);
          return async (): Promise<UndoFunction | void> => {
            await movementService.applyPositions(boardUri, els, from);
            return makeUndoFn(from, to, els);
          };
        };
      };

      return makeUndoFn(movedPositions, originalPositions, elements);
    },
    canDo: async () => true,
  };
}
