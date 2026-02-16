import { DiagramModel, IDiagramCallbacks, IDiagramOptions, IDiagram, IDiagramContext, DiagramElement, SelectionRequestCallback } from "./types";
import type { ITheme } from "../../../../service/ThemeService";
import { IDiagramMode } from "./modes/types";
import { IdleMode } from "./modes/IdleMode";
import { InputManager } from "./managers/InputManager";
import { StageManager } from "./managers/StageManager";
import { GeometryManager } from "./managers/GeometryManager";
import { SelectionManager } from "./managers/SelectionManager";
import { ScrollManager } from "./managers/ScrollManager";

export class Diagram implements IDiagram {
  private static instanceCounter = 0;
  private readonly instanceId: number;
  private data: DiagramModel;
  private container: HTMLElement;
  private eventLayer!: HTMLDivElement;
  private canvas!: HTMLCanvasElement;
  private context: CanvasRenderingContext2D | null = null;
  private resizeObserver?: ResizeObserver;
  private inputManager!: InputManager;
  private stageManager!: StageManager;
  private geometryManager!: GeometryManager;
  private selectionManager!: SelectionManager;
  private scrollManager!: ScrollManager;
  private renderPending = false;
  private getThemeFn: () => ITheme;
  private onSelectionSetRequest?: SelectionRequestCallback;
  private onSelectionAddRequest?: SelectionRequestCallback;
  private onSelectionRemoveRequest?: SelectionRequestCallback;
  private onBackgroundDoubleClick?: (worldX: number, worldY: number) => void;
  private onMoveComplete?: (elements: DiagramElement[], deltaX: number, deltaY: number) => void;

  constructor(container: HTMLElement, callbacks: IDiagramCallbacks | undefined, options: IDiagramOptions) {
    this.instanceId = Diagram.instanceCounter++;
    this.data = new DiagramModel();
    this.container = container;
    this.getThemeFn = options.getThemeFn;
    this.onSelectionSetRequest = callbacks?.onSelectionSetRequest;
    this.onSelectionAddRequest = callbacks?.onSelectionAddRequest;
    this.onSelectionRemoveRequest = callbacks?.onSelectionRemoveRequest;
    this.onBackgroundDoubleClick = callbacks?.onBackgroundDoubleClick;
    this.onMoveComplete = callbacks?.onMoveComplete;
    this.createDOMStructure();
    this.setupResizeObserver();
    this.initializeModeStack();
    this.inputManager = new InputManager(this, this.eventLayer, this.canvas);
    this.inputManager.attach();
    this.geometryManager = new GeometryManager(this.data.layers);
    this.stageManager = new StageManager(this, this.data.layers, this.geometryManager, callbacks?.onElementChange);
    this.selectionManager = new SelectionManager(this, callbacks?.onSelectionChange);
    this.scrollManager = new ScrollManager(this, this.eventLayer, this.geometryManager);
  }

  private createDOMStructure(): void {
    const root = document.createElement("div");
    root.id = `diagram-root-${this.instanceId}`;
    root.className = "diagram-root";
    root.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      user-select: none;
      -webkit-user-drag: none;
    `;
    root.draggable = false;

    this.canvas = document.createElement("canvas");
    this.canvas.id = `diagram-canvas-${this.instanceId}`;
    this.canvas.className = "diagram-canvas";
    this.canvas.style.cssText = `
      position: absolute;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      user-select: none;
      -webkit-user-drag: none;
    `;
    this.canvas.draggable = false;

    this.eventLayer = document.createElement("div");
    this.eventLayer.id = `diagram-event-layer-${this.instanceId}`;
    this.eventLayer.className = "diagram-event-layer";
    this.eventLayer.tabIndex = 0;
    this.eventLayer.style.cssText = `
      position: absolute;
      inset: 0;
      overflow: hidden;
      box-sizing: border-box;
      z-index: 1;
      background: transparent;
      pointer-events: auto;
      user-select: none;
      -webkit-user-drag: none;
    `;
    this.eventLayer.draggable = false;

    this.context = this.canvas.getContext("2d");
    if (!this.context) {
      throw new Error("Failed to get 2D context from canvas");
    }

    root.appendChild(this.canvas);
    root.appendChild(this.eventLayer);
    this.container.appendChild(root);
  }

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.resizeCanvas();
    });
    this.resizeObserver.observe(this.container);
  }

  private resizeCanvas(): void {
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = this.container.clientWidth;
    const cssHeight = this.container.clientHeight;

    this.canvas.style.width = `${cssWidth}px`;
    this.canvas.style.height = `${cssHeight}px`;
    this.canvas.width = cssWidth * dpr;
    this.canvas.height = cssHeight * dpr;

    this.performRender();  // sync render — no gap after canvas clear
  }

  private initializeModeStack(): void {
    const idleMode = new IdleMode(this);
    this.data.modeStack.push(idleMode);
    idleMode.onEnter();
  }

  public getCurrentMode(): IDiagramMode {
    return this.data.modeStack[this.data.modeStack.length - 1];
  }

  public pushMode(mode: IDiagramMode): void {
    this.data.modeStack.push(mode);
    mode.onEnter();
    this.requestRender();
  }

  public popMode(): void {
    if (this.data.modeStack.length <= 1) {
      return;
    }
    const mode = this.data.modeStack.pop();
    mode?.onExit();
    this.requestRender();
  }

  private setupRenderTransform(ctx: CanvasRenderingContext2D): void {
    const S = (window.devicePixelRatio || 1) * this.data.zoom;
    ctx.setTransform(S, 0, 0, S, -this.data.offsetX * S, -this.data.offsetY * S);
  }

  private renderBackground(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1 / this.data.zoom;

    const visibleLeft = this.data.offsetX;
    const visibleTop = this.data.offsetY;
    const visibleWidth = this.canvas.width / window.devicePixelRatio / this.data.zoom;
    const visibleHeight = this.canvas.height / window.devicePixelRatio / this.data.zoom;

    const gridStartX = Math.floor(visibleLeft / 100) * 100;
    const gridEndX = visibleLeft + visibleWidth;
    const gridStartY = Math.floor(visibleTop / 100) * 100;
    const gridEndY = visibleTop + visibleHeight;

    for (let x = gridStartX; x <= gridEndX; x += 100) {
      ctx.beginPath();
      ctx.moveTo(x, visibleTop);
      ctx.lineTo(x, visibleTop + visibleHeight);
      ctx.stroke();
    }

    for (let y = gridStartY; y <= gridEndY; y += 100) {
      ctx.beginPath();
      ctx.moveTo(visibleLeft, y);
      ctx.lineTo(visibleLeft + visibleWidth, y);
      ctx.stroke();
    }
  }

  private renderElements(ctx: CanvasRenderingContext2D, theme: ITheme): void {
    for (const layer of this.data.layers) {
      for (const element of layer.elements) {
        const diagramCtx: IDiagramContext = {
          isSelected: this.selectionManager.isSelected(element.id),
          theme,
        };
        element.render(ctx, diagramCtx);
      }
    }
  }

  public requestRender(): void {
    if (this.renderPending) return;
    this.renderPending = true;
    requestAnimationFrame(() => {
      this.renderPending = false;
      this.performRender();
    });
  }

  private performRender(): void {
    const ctx = this.context;
    if (!ctx) {
      throw new Error("Context not found");
    }

    const theme = this.getThemeFn();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.setupRenderTransform(ctx);
    ctx.save();
    this.renderBackground(ctx);
    this.renderElements(ctx, theme);
    ctx.restore();
    this.scrollManager.syncToViewport(
      this.data.zoom, this.data.offsetX, this.data.offsetY,
      this.container.clientWidth, this.container.clientHeight,
    );
  }

  public setZoom(zoom: number): void {
    if (zoom <= 0) {
      throw new Error("Zoom must be positive");
    }
    if (zoom < 0.1 || zoom > 5.0) {
      console.warn("Zoom value outside recommended range (0.1 - 5.0)");
    }
    this.data.zoom = zoom;
    this.requestRender();
  }

  public setZoomAtPoint(newZoom: number, anchorClientX?: number, anchorClientY?: number): void {
    if (newZoom <= 0) {
      throw new Error("Zoom must be positive");
    }
    if (newZoom < 0.1 || newZoom > 5.0) {
      console.warn("Zoom value outside recommended range (0.1 - 5.0)");
    }

    const oldZoom = this.data.zoom;
    const rect = this.canvas.getBoundingClientRect();

    const ax = anchorClientX !== undefined ? anchorClientX - rect.left : rect.width / 2;
    const ay = anchorClientY !== undefined ? anchorClientY - rect.top : rect.height / 2;

    const anchorWorldX = this.data.offsetX + ax / oldZoom;
    const anchorWorldY = this.data.offsetY + ay / oldZoom;

    this.data.zoom = newZoom;
    this.data.offsetX = anchorWorldX - ax / newZoom;
    this.data.offsetY = anchorWorldY - ay / newZoom;
    this.requestRender();
  }

  public getZoom(): number {
    return this.data.zoom;
  }

  public getOffset(): { x: number; y: number } {
    return {
      x: this.data.offsetX,
      y: this.data.offsetY,
    };
  }

  public setOffset(x: number, y: number): void {
    this.data.offsetX = x;
    this.data.offsetY = y;
    this.requestRender();
  }

  public panByWorldOffset(deltaX: number, deltaY: number): void {
    this.setOffset(this.data.offsetX - deltaX, this.data.offsetY - deltaY);
  }

  public panByCanvas(canvasDeltaX: number, canvasDeltaY: number): void {
    this.data.offsetX -= canvasDeltaX / this.data.zoom;
    this.data.offsetY -= canvasDeltaY / this.data.zoom;
    this.requestRender();
  }

  public setCursor(cursorStyle: string): void {
    this.eventLayer.style.cursor = cursorStyle;
  }

  public getViewportSize(): { width: number; height: number } {
    return {
      width: this.container.clientWidth,
      height: this.container.clientHeight,
    };
  }

  public start(): void {
    this.requestRender();
  }

  public getStageManager(): StageManager {
    return this.stageManager;
  }

  public getGeometryManager(): GeometryManager {
    return this.geometryManager;
  }

  public getSelectionManager(): SelectionManager {
    return this.selectionManager;
  }

  public requestSelectionSet(elements: DiagramElement[]): void {
    this.onSelectionSetRequest?.(elements);
  }

  public requestSelectionAdd(elements: DiagramElement[]): void {
    this.onSelectionAddRequest?.(elements);
  }

  public requestSelectionRemove(elements: DiagramElement[]): void {
    this.onSelectionRemoveRequest?.(elements);
  }

  public fireBackgroundDoubleClick(worldX: number, worldY: number): void {
    this.onBackgroundDoubleClick?.(worldX, worldY);
  }

  public fireMoveComplete(elements: DiagramElement[], deltaX: number, deltaY: number): void {
    this.onMoveComplete?.(elements, deltaX, deltaY);
  }
}
