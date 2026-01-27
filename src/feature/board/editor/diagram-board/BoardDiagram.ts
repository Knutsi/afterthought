import { Diagram } from "../diagram-core/Diagram";
import { BoardIdleMode, OnTaskCreateCallback } from "./modes";

export interface BoardDiagramOptions {
  onTaskCreate?: OnTaskCreateCallback;
}

export function createBoardDiagram(
  container: HTMLElement,
  options?: BoardDiagramOptions
): Diagram {
  const diagram = new Diagram(container, {
    createIdleModeFn: (d) => new BoardIdleMode(d, options?.onTaskCreate),
  });
  diagram.start();
  return diagram;
}
