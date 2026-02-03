import { Diagram } from "../diagram-core/Diagram";
import { ElementChangeCallback, SelectionChangeCallback, SelectionRequestCallback } from "../diagram-core/types";
import { getDefaultServiceLayer } from "../../../../service/ServiceLayer";

export interface BoardDiagramOptions {
  onBackgroundDoubleClick?: (worldX: number, worldY: number) => void;
  onElementChange?: ElementChangeCallback;
  onSelectionChange?: SelectionChangeCallback;
  onSelectionSetRequest?: SelectionRequestCallback;
  onSelectionAddRequest?: SelectionRequestCallback;
  onSelectionRemoveRequest?: SelectionRequestCallback;
}

export function createBoardDiagram(
  container: HTMLElement,
  options?: BoardDiagramOptions
): Diagram {
  const serviceLayer = getDefaultServiceLayer();
  const diagram = new Diagram(
    container,
    {
      onElementChange: options?.onElementChange,
      onSelectionChange: options?.onSelectionChange,
      onSelectionSetRequest: options?.onSelectionSetRequest,
      onSelectionAddRequest: options?.onSelectionAddRequest,
      onSelectionRemoveRequest: options?.onSelectionRemoveRequest,
      onBackgroundDoubleClick: options?.onBackgroundDoubleClick,
    },
    {
      getThemeFn: () => serviceLayer.getThemeService().getTheme(),
    }
  );
  diagram.start();
  return diagram;
}
