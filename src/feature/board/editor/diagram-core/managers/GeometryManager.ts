import { DiagramElement, DiagramLayer } from "../types";

interface ElementBounds {
  element: DiagramElement;
  layerId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export class GeometryManager {
  private geometryCache: ElementBounds[] = [];
  private dirty = true;

  constructor(private layers: DiagramLayer[]) {}

  invalidate(): void {
    this.dirty = true;
  }

  getElementAtPoint(worldX: number, worldY: number): DiagramElement | null {
    this.rebuildCacheIfNeeded();
    for (const bounds of this.geometryCache) {
      if (
        worldX >= bounds.x &&
        worldX <= bounds.x + bounds.width &&
        worldY >= bounds.y &&
        worldY <= bounds.y + bounds.height
      ) {
        return bounds.element;
      }
    }
    return null;
  }

  getElementsInRect(
    x: number,
    y: number,
    width: number,
    height: number
  ): DiagramElement[] {
    this.rebuildCacheIfNeeded();
    const result: DiagramElement[] = [];
    const rectRight = x + width;
    const rectBottom = y + height;

    for (const bounds of this.geometryCache) {
      const boundsRight = bounds.x + bounds.width;
      const boundsBottom = bounds.y + bounds.height;

      // Check for AABB intersection
      if (
        bounds.x < rectRight &&
        boundsRight > x &&
        bounds.y < rectBottom &&
        boundsBottom > y
      ) {
        result.push(bounds.element);
      }
    }
    return result;
  }

  private rebuildCacheIfNeeded(): void {
    if (!this.dirty) return;

    this.geometryCache = [];
    // Iterate layers in reverse (top layer = last in array = first in cache)
    for (let i = this.layers.length - 1; i >= 0; i--) {
      const layer = this.layers[i];
      // Elements within a layer: last element is on top
      for (let j = layer.elements.length - 1; j >= 0; j--) {
        const element = layer.elements[j];
        this.geometryCache.push({
          element,
          layerId: layer.id,
          x: element.posX,
          y: element.posY,
          width: element.width,
          height: element.height,
        });
      }
    }
    this.dirty = false;
  }
}
