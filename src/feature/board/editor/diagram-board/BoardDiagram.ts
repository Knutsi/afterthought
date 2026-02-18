import { Diagram } from "../diagram-core/Diagram";
import { DiagramElement, ElementChangeCallback, SelectionChangeCallback, SelectionRequestCallback } from "../diagram-core/types";
import { getDefaultServiceLayer, type ServiceLayer } from "../../../../service/ServiceLayer";

export interface BoardDiagramOptions {
  onBackgroundDoubleClick?: (worldX: number, worldY: number) => void;
  onElementDoubleClick?: (element: DiagramElement) => void;
  onElementChange?: ElementChangeCallback;
  onSelectionChange?: SelectionChangeCallback;
  onSelectionSetRequest?: SelectionRequestCallback;
  onSelectionAddRequest?: SelectionRequestCallback;
  onSelectionRemoveRequest?: SelectionRequestCallback;
  onMoveComplete?: (elements: DiagramElement[], deltaX: number, deltaY: number) => void;
}

export function createBoardDiagram(
  container: HTMLElement,
  options?: BoardDiagramOptions,
  serviceLayer?: ServiceLayer
): Diagram {
  const resolvedServiceLayer = serviceLayer ?? getDefaultServiceLayer();
  const diagram = new Diagram(
    container,
    {
      onElementChange: options?.onElementChange,
      onSelectionChange: options?.onSelectionChange,
      onSelectionSetRequest: options?.onSelectionSetRequest,
      onSelectionAddRequest: options?.onSelectionAddRequest,
      onSelectionRemoveRequest: options?.onSelectionRemoveRequest,
      onBackgroundDoubleClick: options?.onBackgroundDoubleClick,
      onElementDoubleClick: options?.onElementDoubleClick,
      onMoveComplete: options?.onMoveComplete,
    },
    {
      getThemeFn: () => resolvedServiceLayer.getThemeService().getTheme(),
    }
  );
  diagram.start();
  return diagram;
}
