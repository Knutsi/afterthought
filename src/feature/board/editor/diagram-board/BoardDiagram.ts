import { Diagram } from "../diagram-core/Diagram";
import { ElementChangeCallback } from "../diagram-core/types";
import { BoardIdleMode, OnTaskCreateCallback } from "./modes";
import { getDefaultServiceLayer } from "../../../../service/ServiceLayer";

export interface BoardDiagramOptions {
  onTaskCreate?: OnTaskCreateCallback;
  onElementChange?: ElementChangeCallback;
}

export function createBoardDiagram(
  container: HTMLElement,
  options?: BoardDiagramOptions
): Diagram {
  const serviceLayer = getDefaultServiceLayer();
  const diagram = new Diagram(
    container,
    { onElementChange: options?.onElementChange },
    {
      createIdleModeFn: (d) => new BoardIdleMode(d, options?.onTaskCreate),
      getThemeFn: () => serviceLayer.getThemeService().getTheme(),
    }
  );
  diagram.start();
  return diagram;
}
