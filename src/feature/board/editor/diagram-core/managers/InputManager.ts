import { DiagramPointerInfo, IDiagram } from "../types";
import { browserToWorld, screenDeltaToWorldDelta } from "../calculations";

export const MOUSE_BUTTON_PRIMARY = 0;

export class InputManager {
  // Screen coordinate tracking for delta calculation
  private lastPointerScreenX = 0;
  private lastPointerScreenY = 0;

  // Drag state
  private isDragging = false;
  private dragStartCanvasX = 0;
  private dragStartCanvasY = 0;
  private dragStartWorldX = 0;
  private dragStartWorldY = 0;
  private canvasDragHistory: Array<{ x: number; y: number }> = [];
  private worldDragHistory: Array<{ x: number; y: number }> = [];

  // Previous click tracking
  private previousClickCanvasX = 0;
  private previousClickCanvasY = 0;
  private previousClickWorldX = 0;
  private previousClickWorldY = 0;

  constructor(
    private diagram: IDiagram,
    private eventLayer: HTMLDivElement,
    private canvas: HTMLCanvasElement
  ) {}

  public attach(): void {
    this.eventLayer.addEventListener("pointerdown", this.handlePointerDown);
    this.eventLayer.addEventListener("pointermove", this.handlePointerMove);
    this.eventLayer.addEventListener("pointerup", this.handlePointerUp);
    this.eventLayer.addEventListener("pointercancel", this.handlePointerUp);

    // prevent space key from triggering default behavior (capture phase)
    this.eventLayer.addEventListener("keydown", this.handleEventLayerKeyDown, { capture: true });

    // Wheel events for zoom
    this.eventLayer.addEventListener("wheel", this.handleWheel, { passive: false });

    // Double-click events
    this.eventLayer.addEventListener("dblclick", this.handleDoubleClick);

    // Prevent default context menu to ensure clean pointer event flow
    this.eventLayer.addEventListener("contextmenu", this.handleContextMenu);

    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("blur", this.handleWindowBlur);
  }

  public detach(): void {
    this.eventLayer.removeEventListener("pointerdown", this.handlePointerDown);
    this.eventLayer.removeEventListener("pointermove", this.handlePointerMove);
    this.eventLayer.removeEventListener("pointerup", this.handlePointerUp);
    this.eventLayer.removeEventListener("pointercancel", this.handlePointerUp);
    this.eventLayer.removeEventListener("keydown", this.handleEventLayerKeyDown, { capture: true });
    this.eventLayer.removeEventListener("wheel", this.handleWheel);
    this.eventLayer.removeEventListener("dblclick", this.handleDoubleClick);
    this.eventLayer.removeEventListener("contextmenu", this.handleContextMenu);

    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("blur", this.handleWindowBlur);
  }

  private buildPointerInfo(
    event: PointerEvent,
    canvasDeltaX: number,
    canvasDeltaY: number
  ): DiagramPointerInfo {
    const rect = this.canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
    const offset = this.diagram.getOffset();
    const zoom = this.diagram.getZoom();

    const world = browserToWorld(
      event.clientX,
      event.clientY,
      rect,
      zoom,
      offset.x,
      offset.y
    );
    const { deltaX: worldDeltaX, deltaY: worldDeltaY } = screenDeltaToWorldDelta(
      canvasDeltaX,
      canvasDeltaY,
      zoom
    );

    const elementUnderPointer = this.diagram
      .getGeometryManager()
      .getElementAtPoint(world.x, world.y);

    return {
      canvasX,
      canvasY,
      worldX: world.x,
      worldY: world.y,
      canvasDeltaX,
      canvasDeltaY,
      worldDeltaX,
      worldDeltaY,
      canvasTotalDeltaX: canvasX - this.dragStartCanvasX,
      canvasTotalDeltaY: canvasY - this.dragStartCanvasY,
      worldTotalDeltaX: world.x - this.dragStartWorldX,
      worldTotalDeltaY: world.y - this.dragStartWorldY,
      canvasDragHistory: [...this.canvasDragHistory],
      worldDragHistory: [...this.worldDragHistory],
      canvasPreviousX: this.previousClickCanvasX,
      canvasPreviousY: this.previousClickCanvasY,
      worldPreviousX: this.previousClickWorldX,
      worldPreviousY: this.previousClickWorldY,
      elementUnderPointer,
    };
  }

  private handlePointerDown = (event: PointerEvent): void => {
    // Only capture pointer and track drag for primary button (left-click)
    // Right-click and middle-click should not initiate drag tracking
    if (event.button === MOUSE_BUTTON_PRIMARY) {
      this.eventLayer.setPointerCapture(event.pointerId);
    }
    this.eventLayer.focus(); // Always focus to capture keyboard events

    const rect = this.canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
    const offset = this.diagram.getOffset();
    const zoom = this.diagram.getZoom();

    const world = browserToWorld(
      event.clientX,
      event.clientY,
      rect,
      zoom,
      offset.x,
      offset.y
    );

    // Only track drag state for primary button
    if (event.button === MOUSE_BUTTON_PRIMARY) {
      // Save previous click before updating
      this.previousClickCanvasX = this.dragStartCanvasX;
      this.previousClickCanvasY = this.dragStartCanvasY;
      this.previousClickWorldX = this.dragStartWorldX;
      this.previousClickWorldY = this.dragStartWorldY;

      // Start new drag
      this.isDragging = true;
      this.dragStartCanvasX = canvasX;
      this.dragStartCanvasY = canvasY;
      this.dragStartWorldX = world.x;
      this.dragStartWorldY = world.y;
      this.canvasDragHistory = [{ x: canvasX, y: canvasY }];
      this.worldDragHistory = [{ x: world.x, y: world.y }];
    }

    this.lastPointerScreenX = event.clientX;
    this.lastPointerScreenY = event.clientY;

    const info = this.buildPointerInfo(event, 0, 0);
    this.diagram.getCurrentMode().onPointerDown(info, event);
  };

  private handlePointerMove = (event: PointerEvent): void => {
    const canvasDeltaX = event.clientX - this.lastPointerScreenX;
    const canvasDeltaY = event.clientY - this.lastPointerScreenY;
    this.lastPointerScreenX = event.clientX;
    this.lastPointerScreenY = event.clientY;

    // Track drag history if dragging
    if (this.isDragging) {
      const rect = this.canvas.getBoundingClientRect();
      const canvasX = event.clientX - rect.left;
      const canvasY = event.clientY - rect.top;
      const offset = this.diagram.getOffset();
      const zoom = this.diagram.getZoom();

      const world = browserToWorld(
        event.clientX,
        event.clientY,
        rect,
        zoom,
        offset.x,
        offset.y
      );
      this.canvasDragHistory.push({ x: canvasX, y: canvasY });
      this.worldDragHistory.push({ x: world.x, y: world.y });
    }

    const info = this.buildPointerInfo(event, canvasDeltaX, canvasDeltaY);
    this.diagram.getCurrentMode().onPointerMove(info, event);
  };

  private handlePointerUp = (event: PointerEvent): void => {
    if (this.eventLayer.hasPointerCapture(event.pointerId)) {
      this.eventLayer.releasePointerCapture(event.pointerId);
    }

    // Only process pointer up for primary button (matches our pointerdown handling)
    if (event.button !== MOUSE_BUTTON_PRIMARY) return;

    const canvasDeltaX = event.clientX - this.lastPointerScreenX;
    const canvasDeltaY = event.clientY - this.lastPointerScreenY;

    const info = this.buildPointerInfo(event, canvasDeltaX, canvasDeltaY);
    this.isDragging = false;
    this.diagram.getCurrentMode().onPointerUp(info, event);
  };

  private handleKeyDown = (event: KeyboardEvent): void => {
    const target = (event.composedPath()[0] || event.target) as HTMLElement;
    const tag = target?.tagName?.toLowerCase();
    if (tag === "input" || tag === "textarea" || target?.isContentEditable) return;
    this.diagram.getCurrentMode().onKeyDown(event);
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    this.diagram.getCurrentMode().onKeyUp(event);
  };

  private handleEventLayerKeyDown = (event: KeyboardEvent): void => {
    if (event.code === "Space") {
      event.preventDefault();
    }
  };

  private handleWheel = (event: WheelEvent): void => {
    this.diagram.getCurrentMode().onWheel?.(event);
  };

  private buildPointerInfoFromMouse(event: MouseEvent): DiagramPointerInfo {
    const rect = this.canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
    const offset = this.diagram.getOffset();
    const zoom = this.diagram.getZoom();

    const world = browserToWorld(
      event.clientX,
      event.clientY,
      rect,
      zoom,
      offset.x,
      offset.y
    );

    const elementUnderPointer = this.diagram
      .getGeometryManager()
      .getElementAtPoint(world.x, world.y);

    return {
      canvasX,
      canvasY,
      worldX: world.x,
      worldY: world.y,
      canvasDeltaX: 0,
      canvasDeltaY: 0,
      worldDeltaX: 0,
      worldDeltaY: 0,
      canvasTotalDeltaX: 0,
      canvasTotalDeltaY: 0,
      worldTotalDeltaX: 0,
      worldTotalDeltaY: 0,
      canvasDragHistory: [],
      worldDragHistory: [],
      canvasPreviousX: this.previousClickCanvasX,
      canvasPreviousY: this.previousClickCanvasY,
      worldPreviousX: this.previousClickWorldX,
      worldPreviousY: this.previousClickWorldY,
      elementUnderPointer,
    };
  }

  private handleDoubleClick = (event: MouseEvent): void => {
    const info = this.buildPointerInfoFromMouse(event);
    this.diagram.getCurrentMode().onDoubleClick?.(info, event);
  };

  private handleWindowBlur = (): void => {
    this.diagram.getCurrentMode().onBlur?.();
  };

  private handleContextMenu = (event: MouseEvent): void => {
    event.preventDefault();
  };
}
