import { Diagram } from "../diagram-core/Diagram";
import { BoardIdleMode, OnTaskCreateCallback } from "./modes";
import { TaskElement } from "./elements/TaskElement";

const TEST_TASK_COUNT = 50;
const TEST_AREA_WIDTH = 3000;
const TEST_AREA_HEIGHT = 2000;

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
  addTestTaskElements(diagram);
  return diagram;
}

function addTestTaskElements(diagram: Diagram): void {
  const stageManager = diagram.getStageManager();
  const layer = stageManager.addLayer("tasks");

  for (let i = 0; i < TEST_TASK_COUNT; i++) {
    const task = new TaskElement(`Task #${i + 1}`);
    task.posX = Math.random() * TEST_AREA_WIDTH;
    task.posY = Math.random() * TEST_AREA_HEIGHT;
    stageManager.addElement(layer.id, task);
  }
}
