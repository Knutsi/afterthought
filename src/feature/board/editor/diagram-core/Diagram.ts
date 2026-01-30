import { DiagramModel, IDiagramCallbacks, IDiagramOptions, IDiagram, IdleModeFactoryFn } from "./types";
import { IDiagramMode } from "./modes/types";
import { IdleMode } from "./modes/IdleMode";
import { InputManager } from "./managers/InputManager";
import { StageManager } from "./managers/StageManager";
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

  // Render scheduling
  private renderPending = false;

  // Mode factory
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
    this.stageManager = new StageManager(this, this.data.layers, callbacks?.onElementChange);
  }

  /**
   * Create the DOM structure: root container with scroll area and canvas as siblings.
   */
  private createDOMStructure(): void {
    // Create root container
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

    // Create canvas (below scroll area)
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

    // Create scroll area (on top of canvas, transparent)
    this.scrollArea = document.createElement("div");
    this.scrollArea.id = `diagram-scroll-area-${this.instanceId}`;
    this.scrollArea.className = "diagram-scroll-area";
    this.scrollArea.tabIndex = 0; // Make focusable to capture keyboard events
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

    // Create extent div (creates scrollbars)
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

    // Get canvas context
    this.context = this.canvas.getContext("2d");
    if (!this.context) {
      throw new Error("Failed to get 2D context from canvas");
    }

    // Create status text overlay (sibling to scroll area)
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

    // Assemble DOM hierarchy: canvas first (bottom), then scroll area (middle), then status (top)
    this.scrollArea.appendChild(this.extentDiv);
    root.appendChild(this.canvas);
    root.appendChild(this.scrollArea);
    root.appendChild(this.statusDiv);
    this.container.appendChild(root);
  }

  /**
   * Update extent div size based on world size and zoom.
   * Extent div must be scaled by zoom so scrollbars match zoomed content.
   */
  private updateExtentDivSize(): void {
    const zoomedWidth = this.data.extentWidth * this.data.zoom;
    const zoomedHeight = this.data.extentHeight * this.data.zoom;
    this.extentDiv.style.width = `${zoomedWidth}px`;
    this.extentDiv.style.height = `${zoomedHeight}px`;
  }

  /**
   * Setup scroll event listener to track viewport offset.
   */
  private setupScrollListener(): void {
    this.scrollArea.addEventListener("scroll", this.handleScroll, { passive: true });
  }

  /**
   * Handle scroll events and update diagram model offset.
   * Convert from CSS pixels (zoomed space) to world units.
   */
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

  /**
   * Setup ResizeObserver to handle container size changes.
   */
  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.resizeCanvas();
    });
    // Observe the container, not the scroll area
    this.resizeObserver.observe(this.container);
  }

  /**
   * Resize canvas to match container while handling DPI scaling.
   */
  private resizeCanvas(): void {
    const dpr = window.devicePixelRatio || 1;

    // Get CSS size from container (the root now fills the container)
    const cssWidth = this.container.clientWidth;
    const cssHeight = this.container.clientHeight;

    // Set canvas CSS size (logical pixels)
    this.canvas.style.width = `${cssWidth}px`;
    this.canvas.style.height = `${cssHeight}px`;

    // Set backing store size (physical pixels)
    this.canvas.width = cssWidth * dpr;
    this.canvas.height = cssHeight * dpr;

    this.requestRender();
  }

  // ==================== Mode Management ====================

  /**
   * Initialize mode stack with IdleMode as the base.
   */
  private initializeModeStack(): void {
    const idleMode = this.createIdleMode(this);
    this.data.modeStack.push(idleMode);
    idleMode.onEnter();
  }

  /**
   * Get the current active mode (top of stack).
   */
  public getCurrentMode(): IDiagramMode {
    return this.data.modeStack[this.data.modeStack.length - 1];
  }

  /**
   * Push a new mode onto the stack.
   * @param mode - Mode to push
   */
  public pushMode(mode: IDiagramMode): void {
    this.data.modeStack.push(mode);
    mode.onEnter();
    this.requestRender();
  }

  /**
   * Pop the current mode from the stack.
   * Will not pop if only one mode (Idle) remains.
   */
  public popMode(): void {
    if (this.data.modeStack.length <= 1) {
      return;
    }
    const mode = this.data.modeStack.pop();
    mode?.onExit();
    this.requestRender();
  }

  // ==================== Rendering ====================

  /**
   * Configure canvas context transformation matrix for rendering in diagram space.
   * After calling this, all draw operations use diagram space coordinates directly.
   * @param ctx - Canvas 2D rendering context
   */
  private setupRenderTransform(ctx: CanvasRenderingContext2D): void {
    // Combined scale: DPI * zoom
    const S = (window.devicePixelRatio || 1) * this.data.zoom;

    // Single transform: scale by S, translate by -offset * S
    // This transforms: world point (wx, wy) -> ((wx - offsetX) * zoom * dpr, (wy - offsetY) * zoom * dpr)
    ctx.setTransform(S, 0, 0, S, -this.data.offsetX * S, -this.data.offsetY * S);
  }

  /**
   * Render background grid (optional, for testing).
   */
  private renderBackground(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1 / this.data.zoom; // Maintain 1px line at any zoom

    // offsetX/offsetY are already in world units
    const visibleLeft = this.data.offsetX;
    const visibleTop = this.data.offsetY;
    const visibleWidth = this.canvas.width / window.devicePixelRatio / this.data.zoom;
    const visibleHeight = this.canvas.height / window.devicePixelRatio / this.data.zoom;

    // Clamp to extent bounds
    const gridStartX = Math.max(0, Math.floor(visibleLeft / 100) * 100) - 1;
    const gridEndX = Math.min(this.data.extentWidth, visibleLeft + visibleWidth) - 1;
    const gridStartY = Math.max(0, Math.floor(visibleTop / 100) * 100) - 1;
    const gridEndY = Math.min(this.data.extentHeight, visibleTop + visibleHeight) - 1;

    // Draw vertical lines
    for (let x = gridStartX; x <= gridEndX; x += 100) {
      ctx.beginPath();
      ctx.moveTo(x, Math.max(0, visibleTop));
      ctx.lineTo(x, Math.min(this.data.extentHeight, visibleTop + visibleHeight));
      ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = gridStartY; y <= gridEndY; y += 100) {
      ctx.beginPath();
      ctx.moveTo(Math.max(0, visibleLeft), y);
      ctx.lineTo(Math.min(this.data.extentWidth, visibleLeft + visibleWidth), y);
      ctx.stroke();
    }
  }

  /**
   * Render all diagram elements across all layers.
   */
  private renderElements(ctx: CanvasRenderingContext2D): void {
    for (const layer of this.data.layers) {
      for (const element of layer.elements) {
        element.render(ctx);
      }
    }
  }

  /**
   * Update status text overlay with current diagram state.
   */
  private updateStatusText(): void {
    const dpr = window.devicePixelRatio || 1;
    this.statusDiv.textContent =
      `Mode: ${this.getCurrentMode().name}\n` +
      `Offset: (${this.data.offsetX.toFixed(1)}, ${this.data.offsetY.toFixed(1)})\n` +
      `Extent: ${this.data.extentWidth} × ${this.data.extentHeight}\n` +
      `Zoom: ${(this.data.zoom * 100).toFixed(0)}%\n` +
      `DPI: ${dpr.toFixed(2)}x`;
  }

  /**
   * Request a render on the next animation frame.
   * Multiple requests within the same frame are coalesced.
   */
  public requestRender(): void {
    if (this.renderPending) return;
    this.renderPending = true;
    requestAnimationFrame(() => {
      this.renderPending = false;
      this.performRender();
    });
  }

  /**
   * Main render method with coordinate transformation pipeline.
   */
  private performRender(): void {
    const ctx = this.context;
    if (!ctx) {
      throw new Error("Context not found");
    }

    // Step 1: Clear canvas (physical pixels)
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Step 2: Setup transformation to diagram space
    this.setupRenderTransform(ctx);

    // Step 3: Save state
    ctx.save();

    // Step 4: Render content (all coordinates in diagram space)
    this.renderBackground(ctx);
    this.renderElements(ctx);

    // Step 5: Restore state
    ctx.restore();

    // Step 6: Update status text
    this.updateStatusText();
  }

  /**
   * Set the scrollable extent (diagram bounds).
   * @param width - Total width in diagram space pixels
   * @param height - Total height in diagram space pixels
   */
  public setExtent(width: number, height: number): void {
    this.data.extentWidth = width;
    this.data.extentHeight = height;
    this.updateExtentDivSize();
  }

  /**
   * Get current extent dimensions.
   * @returns {width, height} of scrollable area
   */
  public getExtent(): { width: number; height: number } {
    return {
      width: this.data.extentWidth,
      height: this.data.extentHeight,
    };
  }

  /**
   * Set zoom level.
   * @param zoom - Zoom factor (1.0 = 100%, 0.5 = 50%, 2.0 = 200%)
   */
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

  /**
   * Set zoom level anchored at a specific screen point.
   * The world point under the anchor stays under the anchor after zoom.
   * @param newZoom - New zoom factor
   * @param anchorClientX - Anchor X in client coordinates (optional, defaults to center)
   * @param anchorClientY - Anchor Y in client coordinates (optional, defaults to center)
   */
  public setZoomAtPoint(newZoom: number, anchorClientX?: number, anchorClientY?: number): void {
    if (newZoom <= 0) {
      throw new Error("Zoom must be positive");
    }
    if (newZoom < 0.1 || newZoom > 5.0) {
      console.warn("Zoom value outside recommended range (0.1 - 5.0)");
    }

    const oldZoom = this.data.zoom;
    const rect = this.canvas.getBoundingClientRect();

    // Default anchor to center of canvas
    const ax = anchorClientX !== undefined ? anchorClientX - rect.left : rect.width / 2;
    const ay = anchorClientY !== undefined ? anchorClientY - rect.top : rect.height / 2;

    // Calculate world position at anchor point (before zoom)
    const anchorWorldX = this.data.offsetX + ax / oldZoom;
    const anchorWorldY = this.data.offsetY + ay / oldZoom;

    // Update zoom
    this.data.zoom = newZoom;
    this.updateExtentDivSize();

    // Calculate new offset to keep anchor point fixed
    const newOffsetX = anchorWorldX - ax / newZoom;
    const newOffsetY = anchorWorldY - ay / newZoom;

    // Clamp offsets to valid range
    const viewW = rect.width / newZoom;
    const viewH = rect.height / newZoom;
    const maxX = Math.max(0, this.data.extentWidth - viewW);
    const maxY = Math.max(0, this.data.extentHeight - viewH);

    this.data.offsetX = Math.min(Math.max(0, newOffsetX), maxX);
    this.data.offsetY = Math.min(Math.max(0, newOffsetY), maxY);

    // Update scroll position to match new offset
    this.scrollArea.scrollLeft = this.data.offsetX * newZoom;
    this.scrollArea.scrollTop = this.data.offsetY * newZoom;

    this.requestRender();
  }

  /**
   * Get current zoom level.
   * @returns Current zoom factor
   */
  public getZoom(): number {
    return this.data.zoom;
  }

  /**
   * Get current scroll offset.
   * @returns {x, y} scroll offset in pixels
   */
  public getOffset(): { x: number; y: number } {
    return {
      x: this.data.offsetX,
      y: this.data.offsetY,
    };
  }

  /**
   * Programmatically set scroll offset.
   * @param x - Horizontal offset in world units
   * @param y - Vertical offset in world units
   */
  public setOffset(x: number, y: number): void {
    const { scrollLeft, scrollTop } = worldOffsetToScrollPosition(x, y, this.data.zoom);
    this.scrollArea.scrollLeft = scrollLeft;
    this.scrollArea.scrollTop = scrollTop;
    // Scroll event will trigger and update data.offsetX/offsetY
  }

  /**
   * Pan the viewport by a world-space delta.
   * Moves the view in the opposite direction of the delta
   * (drag left = view moves right, revealing content to the left).
   * @param deltaX - World-space X delta
   * @param deltaY - World-space Y delta
   */
  public panByWorldOffset(deltaX: number, deltaY: number): void {
    this.setOffset(this.data.offsetX - deltaX, this.data.offsetY - deltaY);
  }

  /**
   * Pan the viewport by canvas-space delta (CSS pixels).
   * Directly adjusts scroll position without coordinate conversion.
   * @param canvasDeltaX - Canvas-space X delta (CSS pixels)
   * @param canvasDeltaY - Canvas-space Y delta (CSS pixels)
   */
  public panByCanvas(canvasDeltaX: number, canvasDeltaY: number): void {
    this.scrollArea.scrollLeft -= canvasDeltaX;
    this.scrollArea.scrollTop -= canvasDeltaY;
    // Scroll event will trigger and update data.offsetX/offsetY
  }

  /**
   * Set the cursor style for the diagram.
   * @param cursorStyle - CSS cursor value (e.g., "grab", "grabbing", "default")
   */
  public setCursor(cursorStyle: string): void {
    this.scrollArea.style.cursor = cursorStyle;
  }

  /**
   * Get viewport size in CSS pixels (not world space).
   * This is the visible area of the canvas in browser coordinates.
   * Use with panByCanvas() which also operates in CSS pixels.
   */
  public getViewportSize(): { width: number; height: number } {
    return {
      width: this.container.clientWidth,
      height: this.container.clientHeight,
    };
  }

  /**
   * Start the diagram (trigger initial render).
   */
  public start(): void {
    this.requestRender();
  }

  /**
   * Get the stage manager for layer and element operations.
   */
  public getStageManager(): StageManager {
    return this.stageManager;
  }
}
