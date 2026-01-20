/**
 * Context interface providing diagram access to modes.
 * Modes use this to push/pop modes and modify diagram state.
 */
export interface IDiagramModeContext {
  pushMode(mode: IDiagramMode): void;
  popMode(): void;
  setOffset(x: number, y: number): void;
  getOffset(): { x: number; y: number };
}

export interface IDiagramMode {
  name: string;

  // Lifecycle
  onEnter(): void;
  onExit(): void;

  // Pointer events (all coordinates in world space)
  onPointerDown(worldX: number, worldY: number, event: PointerEvent): void;
  onPointerMove(worldX: number, worldY: number, deltaX: number, deltaY: number, event: PointerEvent): void;
  onPointerUp(worldX: number, worldY: number, event: PointerEvent): void;

  // Keyboard events
  onKeyDown(event: KeyboardEvent): void;
  onKeyUp(event: KeyboardEvent): void;
}
