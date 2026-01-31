import { DiagramModel, IDiagramCallbacks, IDiagramOptions, IDiagram, IdleModeFactoryFn, IDiagramContext } from "./types";
import { IDiagramMode } from "./modes/types";
import { IdleMode } from "./modes/IdleMode";
import { InputManager } from "./managers/InputManager";
import { StageManager } from "./managers/StageManager";
import { GeometryManager } from "./managers/GeometryManager";
import { SelectionManager } from "./managers/SelectionManager";
import {
  worldOffsetToScrollPosition,
  scrollPositionToWorldOffset,
} from "./calculations";

export class Diagram implements IDiagram {
  private static instanceCounter = 0;
  private readonly instanceId: number;
  private data: DiagramModel;
  private container: HTMLElement;
  private scrollArea!: HTMLDivElement;
  private extentDiv!: HTMLDivElement;
  private canvas!: HTMLCanvasElement;
  private context: CanvasRenderingContext2D | null = null;
  private resizeObserver?: ResizeObserver;
  private statusDiv!: HTMLDivElement;
  private inputManager!: InputManager;
  private stageManager!: StageManager;
  private geometryManager!: GeometryManager;
  private selectionManager!: SelectionManager;
  private renderPending = false;
  private createIdleMode: IdleModeFactoryFn;

  constructor(container: HTMLElement, callbacks?: IDiagramCallbacks, options?: IDiagramOptions) {
    this.instanceId = Diagram.instanceCounter++;
    this.data = new DiagramModel();
    this.container = container;
    this.createIdleMode = options?.createIdleModeFn ?? ((d) => new IdleMode(d));
    this.createDOMStructure();
    this.updateExtentDivSize();
    this.setupScrollListener();
    this.setupResizeObserver();
    this.initializeModeStack();
    this.inputManager = new InputManager(this, this.scrollArea, this.canvas);
    this.inputManager.attach();
    this.geometryManager = new GeometryManager(this.data.layers);
    this.stageManager = new StageManager(this, this.data.layers, this.geometryManager, callbacks?.onElementChange);
    this.selectionManager = new SelectionManager(this, callbacks?.onSelectionChange);
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

    this.scrollArea = document.createElement("div");
    this.scrollArea.id = `diagram-scroll-area-${this.instanceId}`;
    this.scrollArea.className = "diagram-scroll-area";
    this.scrollArea.tabIndex = 0;
    this.scrollArea.style.cssText = `
      position: absolute;
      inset: 0;
      overflow: auto;
      box-sizing: border-box;
      z-index: 1;
      background: transparent;
      pointer-events: auto;
      user-select: none;
      -webkit-user-drag: none;
    `;
    this.scrollArea.draggable = false;

    this.extentDiv = document.createElement("div");
    this.extentDiv.id = `diagram-extent-${this.instanceId}`;
    this.extentDiv.className = "diagram-extent";
    this.extentDiv.style.cssText = `
      width: ${this.data.extentWidth}px;
      height: ${this.data.extentHeight}px;
      pointer-events: none;
      user-select: none;
      -webkit-user-drag: none;
    `;
    this.extentDiv.draggable = false;

    this.context = this.canvas.getContext("2d");
    if (!this.context) {
      throw new Error("Failed to get 2D context from canvas");
    }

    this.statusDiv = document.createElement("div");
    this.statusDiv.id = `diagram-status-${this.instanceId}`;
    this.statusDiv.className = "diagram-status";
    this.statusDiv.style.cssText = `
      position: absolute;
      bottom: 8px;
      left: 8px;
      padding: 8px 12px;
      background: rgba(0, 0, 0, 0.7);
      color: #fff;
      font-family: monospace;
      font-size: 12px;
      line-height: 1.5;
      border-radius: 4px;
      pointer-events: none;
      z-index: 2;
      white-space: pre;
    `;

    this.scrollArea.appendChild(this.extentDiv);
    root.appendChild(this.canvas);
    root.appendChild(this.scrollArea);
    root.appendChild(this.statusDiv);
    this.container.appendChild(root);
  }

  private updateExtentDivSize(): void {
    const zoomedWidth = this.data.extentWidth * this.data.zoom;
    const zoomedHeight = this.data.extentHeight * this.data.zoom;
    this.extentDiv.style.width = `${zoomedWidth}px`;
    this.extentDiv.style.height = `${zoomedHeight}px`;
  }

  private setupScrollListener(): void {
    this.scrollArea.addEventListener("scroll", this.handleScroll, { passive: true });
  }

  private handleScroll = (): void => {
    const { offsetX, offsetY } = scrollPositionToWorldOffset(
      this.scrollArea.scrollLeft,
      this.scrollArea.scrollTop,
      this.data.zoom
    );
    this.data.offsetX = offsetX;
    this.data.offsetY = offsetY;
    this.requestRender();
  };

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

    this.requestRender();
  }

  private initializeModeStack(): void {
    const idleMode = this.createIdleMode(this);
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

    const gridStartX = Math.max(0, Math.floor(visibleLeft / 100) * 100) - 1;
    const gridEndX = Math.min(this.data.extentWidth, visibleLeft + visibleWidth) - 1;
    const gridStartY = Math.max(0, Math.floor(visibleTop / 100) * 100) - 1;
    const gridEndY = Math.min(this.data.extentHeight, visibleTop + visibleHeight) - 1;

    for (let x = gridStartX; x <= gridEndX; x += 100) {
      ctx.beginPath();
      ctx.moveTo(x, Math.max(0, visibleTop));
      ctx.lineTo(x, Math.min(this.data.extentHeight, visibleTop + visibleHeight));
      ctx.stroke();
    }

    for (let y = gridStartY; y <= gridEndY; y += 100) {
      ctx.beginPath();
      ctx.moveTo(Math.max(0, visibleLeft), y);
      ctx.lineTo(Math.min(this.data.extentWidth, visibleLeft + visibleWidth), y);
      ctx.stroke();
    }
  }

  private renderElements(ctx: CanvasRenderingContext2D): void {
    for (const layer of this.data.layers) {
      for (const element of layer.elements) {
        const diagramCtx: IDiagramContext = {
          isSelected: this.selectionManager.isSelected(element.id),
        };
        element.render(ctx, diagramCtx);
      }
    }
  }

  private updateStatusText(): void {
    const dpr = window.devicePixelRatio || 1;
    this.statusDiv.textContent =
      `Mode: ${this.getCurrentMode().name}\n` +
      `Offset: (${this.data.offsetX.toFixed(1)}, ${this.data.offsetY.toFixed(1)})\n` +
      `Extent: ${this.data.extentWidth} × ${this.data.extentHeight}\n` +
      `Zoom: ${(this.data.zoom * 100).toFixed(0)}%\n` +
      `DPI: ${dpr.toFixed(2)}x`;
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

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.setupRenderTransform(ctx);
    ctx.save();
    this.renderBackground(ctx);
    this.renderElements(ctx);
    ctx.restore();
    this.updateStatusText();
  }

  public setExtent(width: number, height: number): void {
    this.data.extentWidth = width;
    this.data.extentHeight = height;
    this.updateExtentDivSize();
  }

  public getExtent(): { width: number; height: number } {
    return {
      width: this.data.extentWidth,
      height: this.data.extentHeight,
    };
  }

  public setZoom(zoom: number): void {
    if (zoom <= 0) {
      throw new Error("Zoom must be positive");
    }
    if (zoom < 0.1 || zoom > 5.0) {
      console.warn("Zoom value outside recommended range (0.1 - 5.0)");
    }
    this.data.zoom = zoom;
    this.updateExtentDivSize();
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
    this.updateExtentDivSize();

    const newOffsetX = anchorWorldX - ax / newZoom;
    const newOffsetY = anchorWorldY - ay / newZoom;

    const viewW = rect.width / newZoom;
    const viewH = rect.height / newZoom;
    const maxX = Math.max(0, this.data.extentWidth - viewW);
    const maxY = Math.max(0, this.data.extentHeight - viewH);

    this.data.offsetX = Math.min(Math.max(0, newOffsetX), maxX);
    this.data.offsetY = Math.min(Math.max(0, newOffsetY), maxY);

    this.scrollArea.scrollLeft = this.data.offsetX * newZoom;
    this.scrollArea.scrollTop = this.data.offsetY * newZoom;

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
    const { scrollLeft, scrollTop } = worldOffsetToScrollPosition(x, y, this.data.zoom);
    this.scrollArea.scrollLeft = scrollLeft;
    this.scrollArea.scrollTop = scrollTop;
  }

  public panByWorldOffset(deltaX: number, deltaY: number): void {
    this.setOffset(this.data.offsetX - deltaX, this.data.offsetY - deltaY);
  }

  public panByCanvas(canvasDeltaX: number, canvasDeltaY: number): void {
    this.scrollArea.scrollLeft -= canvasDeltaX;
    this.scrollArea.scrollTop -= canvasDeltaY;
  }

  public setCursor(cursorStyle: string): void {
    this.scrollArea.style.cursor = cursorStyle;
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
}
