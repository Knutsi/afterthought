import { Diagram } from "../diagram-core/Diagram";
import { ElementChangeCallback, SelectionChangeCallback, SelectionRequestCallback } from "../diagram-core/types";
import { BoardIdleMode, OnTaskCreateCallback } from "./modes";
import { getDefaultServiceLayer } from "../../../../service/ServiceLayer";

export interface BoardDiagramOptions {
  onTaskCreate?: OnTaskCreateCallback;
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
    },
    {
      createIdleModeFn: (d) => new BoardIdleMode(d, options?.onTaskCreate),
      getThemeFn: () => serviceLayer.getThemeService().getTheme(),
    }
  );
  diagram.start();
  return diagram;
}
