import { DiagramModel } from "./types";

export class Diagram {
  private data: DiagramModel;
  private container: HTMLElement;
  private scrollArea!: HTMLDivElement;
  private extentDiv!: HTMLDivElement;
  private canvas!: HTMLCanvasElement;
  private context: CanvasRenderingContext2D | null = null;
  private resizeObserver?: ResizeObserver;
  private statusDiv!: HTMLDivElement;

  // Touch gesture state
  private touchStartDistance: number = 0;
  private touchStartZoom: number = 1;

  constructor(container: HTMLElement) {
    this.data = new DiagramModel();
    this.container = container;
    this.createDOMStructure();
    this.updateExtentDivSize();
    this.setupScrollListener();
    this.setupTouchListeners();
    this.setupResizeObserver();
  }

  /**
   * Create the DOM structure: root container with scroll area and canvas as siblings.
   */
  private createDOMStructure(): void {
    // Create root container
    const root = document.createElement("div");
    root.className = "diagram-root";
    root.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
    `;

    // Create canvas (below scroll area)
    this.canvas = document.createElement("canvas");
    this.canvas.className = "diagram-canvas";
    this.canvas.style.cssText = `
      position: absolute;
      inset: 0;
      z-index: 0;
      pointer-events: none;
    `;

    // Create scroll area (on top of canvas, transparent)
    this.scrollArea = document.createElement("div");
    this.scrollArea.className = "diagram-scroll-area";
    this.scrollArea.style.cssText = `
      position: absolute;
      inset: 0;
      overflow: auto;
      box-sizing: border-box;
      z-index: 1;
      background: transparent;
      pointer-events: auto;
    `;

    // Create extent div (creates scrollbars)
    this.extentDiv = document.createElement("div");
    this.extentDiv.className = "diagram-extent";
    this.extentDiv.style.cssText = `
      width: ${this.data.extentWidth}px;
      height: ${this.data.extentHeight}px;
      pointer-events: none;
    `;

    // Get canvas context
    this.context = this.canvas.getContext("2d");
    if (!this.context) {
      throw new Error("Failed to get 2D context from canvas");
    }

    // Create status text overlay (sibling to scroll area)
    this.statusDiv = document.createElement("div");
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
    this.data.offsetX = this.scrollArea.scrollLeft / this.data.zoom;
    this.data.offsetY = this.scrollArea.scrollTop / this.data.zoom;
    this.render();
  };

  /**
   * Setup touch event listeners for pinch-to-zoom.
   */
  private setupTouchListeners(): void {
    this.scrollArea.addEventListener("touchstart", this.handleTouchStart, { passive: false });
    this.scrollArea.addEventListener("touchmove", this.handleTouchMove, { passive: false });
    this.scrollArea.addEventListener("touchend", this.handleTouchEnd, { passive: false });
  }

  /**
   * Handle touch start - detect two-finger pinch.
   */
  private handleTouchStart = (e: TouchEvent): void => {
    if (e.touches.length === 2) {
      // Two-finger touch - start pinch gesture
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      this.touchStartDistance = this.getTouchDistance(touch1, touch2);
      this.touchStartZoom = this.data.zoom;
    }
  };

  /**
   * Handle touch move - perform pinch zoom.
   */
  private handleTouchMove = (e: TouchEvent): void => {
    if (e.touches.length === 2) {
      // Two-finger pinch zoom
      e.preventDefault();

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = this.getTouchDistance(touch1, touch2);

      // Calculate zoom factor based on distance change
      const zoomFactor = currentDistance / this.touchStartDistance;
      const newZoom = this.touchStartZoom * zoomFactor;

      // Clamp zoom to reasonable bounds
      const clampedZoom = Math.max(0.1, Math.min(5.0, newZoom));

      // Get pinch center point (midpoint between fingers)
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;

      // Apply zoom anchored at pinch center
      this.setZoomAtPoint(clampedZoom, centerX, centerY);
    }
  };

  /**
   * Handle touch end - cleanup pinch state.
   */
  private handleTouchEnd = (e: TouchEvent): void => {
    if (e.touches.length < 2) {
      // Less than two fingers - end pinch gesture
      this.touchStartDistance = 0;
    }
  };

  /**
   * Calculate distance between two touch points.
   */
  private getTouchDistance(touch1: Touch, touch2: Touch): number {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

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

    this.render();
  }

  /**
   * Convert browser event coordinates to diagram space coordinates.
   * @param browserX - event.clientX (physical pixels relative to viewport)
   * @param browserY - event.clientY (physical pixels relative to viewport)
   * @returns {x, y} in diagram space
   *
   * TODO: This will be used for event handlers (click, drag, etc.) in future tasks
   */
  // @ts-expect-error - Method reserved for future event handling implementation
  private browserToDiagram(browserX: number, browserY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Step 1: Canvas-relative physical pixels
    const canvasPhysicalX = browserX - rect.left;
    const canvasPhysicalY = browserY - rect.top;

    // Step 2: Remove DPI scaling → viewport space
    const viewportX = canvasPhysicalX / dpr;
    const viewportY = canvasPhysicalY / dpr;

    // Step 3: Add scroll offset → zoomed space
    const zoomedX = viewportX + this.data.offsetX;
    const zoomedY = viewportY + this.data.offsetY;

    // Step 4: Divide by zoom → diagram space
    const diagramX = zoomedX / this.data.zoom;
    const diagramY = zoomedY / this.data.zoom;

    return { x: diagramX, y: diagramY };
  }

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
   * Render all diagram elements.
   */
  private renderElements(ctx: CanvasRenderingContext2D): void {
    // Elements are already in diagram space coordinates
    for (const element of this.data.elements) {
      ctx.fillStyle = "#4CAF50";
      ctx.fillRect(element.posX, element.posY, element.width, element.height);

      // Element border
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 2 / this.data.zoom; // Maintain 2px border at any zoom
      ctx.strokeRect(element.posX, element.posY, element.width, element.height);
    }
  }

  /**
   * Render all connections.
   */
  private renderConnections(_ctx: CanvasRenderingContext2D): void {
    // Connection rendering logic (placeholder)
    // Source/target element positions are in diagram space
  }

  /**
   * Update status text overlay with current diagram state.
   */
  private updateStatusText(): void {
    const dpr = window.devicePixelRatio || 1;
    this.statusDiv.textContent =
      `Offset: (${this.data.offsetX.toFixed(1)}, ${this.data.offsetY.toFixed(1)})\n` +
      `Extent: ${this.data.extentWidth} × ${this.data.extentHeight}\n` +
      `Zoom: ${(this.data.zoom * 100).toFixed(0)}%\n` +
      `DPI: ${dpr.toFixed(2)}x`;
  }

  /**
   * Main render method with coordinate transformation pipeline.
   */
  private render(): void {
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
    this.renderConnections(ctx);

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
    this.render();
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

    this.render();
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
    // Convert from world units to CSS pixels (zoomed space)
    this.scrollArea.scrollLeft = x * this.data.zoom;
    this.scrollArea.scrollTop = y * this.data.zoom;
    // Scroll event will trigger and update data.offsetX/offsetY
  }

  /**
   * Start the diagram (trigger initial render).
   */
  public start(): void {
    this.render();
  }
}
