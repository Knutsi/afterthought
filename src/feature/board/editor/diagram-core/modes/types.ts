// Re-export from parent types for backwards compatibility
export type { IDiagram, DiagramPointerInfo } from "../types";

import type { DiagramPointerInfo } from "../types";

export interface IDiagramMode {
  name: string;

  // Lifecycle
  onEnter(): void;
  onExit(): void;

  // Pointer events (info contains both canvas and world coordinates)
  onPointerDown(info: DiagramPointerInfo, event: PointerEvent): void;
  onPointerMove(info: DiagramPointerInfo, event: PointerEvent): void;
  onPointerUp(info: DiagramPointerInfo, event: PointerEvent): void;

  // Keyboard events
  onKeyDown(event: KeyboardEvent): void;
  onKeyUp(event: KeyboardEvent): void;

  // Wheel events (optional)
  onWheel?(event: WheelEvent): void;
}
