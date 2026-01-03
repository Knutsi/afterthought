import { Diagram } from "../diagram-core/Diagram";

export function createBoardDiagram(container: HTMLElement): Diagram {
  const diagram = new Diagram(container);
  diagram.start();
  return diagram;
}
