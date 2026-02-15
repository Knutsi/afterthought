import type { Uri } from "../../../core-model/uri";
import type { DiagramElement } from "../editor/diagram-core/types";
import { TaskElement } from "../editor/diagram-board/elements/TaskElement";
import type { BoardService } from "../BoardService";

export type PositionMap = Map<string, { x: number; y: number }>;

export class BoardMovementService {
  private boardService: BoardService;

  constructor(boardService: BoardService) {
    this.boardService = boardService;
  }

  async moveElements(
    boardUri: Uri,
    elements: DiagramElement[],
    deltaX: number,
    deltaY: number,
  ): Promise<{ originalPositions: PositionMap; movedPositions: PositionMap }> {
    const originalPositions: PositionMap = new Map();
    const movedPositions: PositionMap = new Map();

    for (const el of elements) {
      if (el instanceof TaskElement && el.taskUri) {
        originalPositions.set(el.taskUri, { x: el.posX - deltaX, y: el.posY - deltaY });
        movedPositions.set(el.taskUri, { x: el.posX, y: el.posY });

        await this.boardService.updateTaskPlacement(boardUri, el.taskUri, {
          x: el.posX,
          y: el.posY,
        });
      }
    }

    return { originalPositions, movedPositions };
  }

  async applyPositions(boardUri: Uri, elements: DiagramElement[], positions: PositionMap): Promise<void> {
    for (const el of elements) {
      if (el instanceof TaskElement && el.taskUri) {
        const pos = positions.get(el.taskUri);
        if (pos) {
          el.posX = pos.x;
          el.posY = pos.y;
          await this.boardService.updateTaskPlacement(boardUri, el.taskUri, { x: pos.x, y: pos.y });
        }
      }
    }
  }
}
