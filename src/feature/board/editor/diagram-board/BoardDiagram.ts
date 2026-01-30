import { Diagram } from "../diagram-core/Diagram";
import { ElementChangeCallback } from "../diagram-core/types";
import { BoardIdleMode, OnTaskCreateCallback } from "./modes";

export interface BoardDiagramOptions {
  onTaskCreate?: OnTaskCreateCallback;
  onElementChange?: ElementChangeCallback;
}

export function createBoardDiagram(
  container: HTMLElement,
  options?: BoardDiagramOptions
): Diagram {
  const diagram = new Diagram(container, {
    createIdleModeFn: (d) => new BoardIdleMode(d, options?.onTaskCreate),
    onElementChange: options?.onElementChange,
  });
  diagram.start();
  return diagram;
}
