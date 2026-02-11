import { IDiagram } from "../types";
import { GeometryManager } from "./GeometryManager";

const CONTENT_PADDING = 500;
const OFFSET_THRESHOLD = 0.5;

export class ScrollManager {
  private sizerDiv: HTMLDivElement;
  private isProgrammaticScroll = false;
  private scrollBounds: { minX: number; minY: number; maxX: number; maxY: number } | null = null;
  private lastZoom = 1;

  constructor(
    private diagram: IDiagram,
    private eventLayer: HTMLDivElement,
    private geometryManager: GeometryManager,
  ) {
    this.sizerDiv = document.createElement("div");
    this.sizerDiv.style.cssText = `
      pointer-events: none;
      visibility: hidden;
    `;
    this.eventLayer.appendChild(this.sizerDiv);
    this.eventLayer.style.overflow = "auto";
    this.eventLayer.addEventListener("scroll", this.handleScroll);
  }

  syncToViewport(
    zoom: number,
    offsetX: number,
    offsetY: number,
    viewportWidth: number,
    viewportHeight: number,
  ): void {
    this.lastZoom = zoom;
    const bounds = this.geometryManager.getContentBounds();

    if (!bounds) {
      this.sizerDiv.style.width = "0px";
      this.sizerDiv.style.height = "0px";
      this.scrollBounds = null;
      return;
    }

    const sb = {
      minX: bounds.minX - CONTENT_PADDING,
      minY: bounds.minY - CONTENT_PADDING,
      maxX: bounds.maxX + CONTENT_PADDING,
      maxY: bounds.maxY + CONTENT_PADDING,
    };
    this.scrollBounds = sb;

    const contentWidthWorld = sb.maxX - sb.minX;
    const contentHeightWorld = sb.maxY - sb.minY;
    const sizerW = contentWidthWorld * zoom + viewportWidth;
    const sizerH = contentHeightWorld * zoom + viewportHeight;

    this.sizerDiv.style.width = `${sizerW}px`;
    this.sizerDiv.style.height = `${sizerH}px`;

    const scrollLeft = (offsetX - sb.minX) * zoom;
    const scrollTop = (offsetY - sb.minY) * zoom;

    this.isProgrammaticScroll = true;
    this.eventLayer.scrollLeft = scrollLeft;
    this.eventLayer.scrollTop = scrollTop;
    requestAnimationFrame(() => {
      this.isProgrammaticScroll = false;
    });
  }

  private handleScroll = (): void => {
    if (this.isProgrammaticScroll) return;
    if (!this.scrollBounds) return;

    const zoom = this.lastZoom;
    const sb = this.scrollBounds;

    const newOffsetX = this.eventLayer.scrollLeft / zoom + sb.minX;
    const newOffsetY = this.eventLayer.scrollTop / zoom + sb.minY;

    const current = this.diagram.getOffset();
    if (
      Math.abs(newOffsetX - current.x) < OFFSET_THRESHOLD &&
      Math.abs(newOffsetY - current.y) < OFFSET_THRESHOLD
    ) {
      return;
    }

    this.diagram.setOffset(newOffsetX, newOffsetY);
  };
}
