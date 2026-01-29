import { DiagramElement, DiagramLayer, ElementChangeCallback, IDiagram } from "../types";

/**
 * Cached bounds for an element, used for hit-testing.
 */
interface ElementBounds {
  element: DiagramElement;
  layerId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * StageManager handles layer and element CRUD operations.
 * Each mutating method calls requestRender() after making changes.
 */
export class StageManager {
  private geometryCache: ElementBounds[] = [];
  private onElementChange?: ElementChangeCallback;

  constructor(
    private diagram: IDiagram,
    private layers: DiagramLayer[],
    onElementChange?: ElementChangeCallback
  ) {
    this.onElementChange = onElementChange;
  }

  /**
   * Rebuild the geometry cache from all layers and elements.
   * Elements are ordered from top layer to bottom for hit-testing priority.
   */
  private rebuildGeometryCache(): void {
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
  }

  /**
   * Get the element at a given world coordinate point.
   * Returns the topmost element at that point, or null if none.
   * @param worldX - X coordinate in world space
   * @param worldY - Y coordinate in world space
   */
  getElementAtPoint(worldX: number, worldY: number): DiagramElement | null {
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

  /**
   * Get all elements whose bounds intersect a given rectangle.
   * Useful for drag-select operations.
   * @param x - Left edge of rectangle in world space
   * @param y - Top edge of rectangle in world space
   * @param width - Width of rectangle
   * @param height - Height of rectangle
   */
  getElementsInRect(
    x: number,
    y: number,
    width: number,
    height: number
  ): DiagramElement[] {
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

  // ==================== Layer Operations ====================

  /**
   * Add a new layer with the given name.
   * @param name - Name for the new layer
   * @returns The created layer
   */
  addLayer(name: string): DiagramLayer {
    const layer = new DiagramLayer(name);
    this.layers.push(layer);
    this.rebuildGeometryCache();
    this.diagram.requestRender();
    return layer;
  }

  /**
   * Insert a new layer at a specific index.
   * Index 0 = bottom (renders first), higher = on top.
   * @param index - Position to insert at
   * @param name - Name for the new layer
   * @returns The created layer
   */
  insertLayerAt(index: number, name: string): DiagramLayer {
    const layer = new DiagramLayer(name);
    this.layers.splice(index, 0, layer);
    this.rebuildGeometryCache();
    this.diagram.requestRender();
    return layer;
  }

  /**
   * Remove a layer by ID.
   * @param layerId - ID of the layer to remove
   * @returns true if layer was found and removed, false otherwise
   */
  removeLayer(layerId: string): boolean {
    const index = this.layers.findIndex((l) => l.id === layerId);
    if (index === -1) return false;
    this.layers.splice(index, 1);
    this.rebuildGeometryCache();
    this.diagram.requestRender();
    return true;
  }

  /**
   * Get a layer by ID.
   * @param layerId - ID of the layer to find
   * @returns The layer if found, undefined otherwise
   */
  getLayer(layerId: string): DiagramLayer | undefined {
    return this.layers.find((l) => l.id === layerId);
  }

  /**
   * Get all layers.
   * @returns Array of all layers
   */
  getLayers(): DiagramLayer[] {
    return this.layers;
  }

  // ==================== Element Operations ====================

  /**
   * Add an element to a layer.
   * @param layerId - ID of the layer to add the element to
   * @param element - The element to add
   * @returns true if layer was found and element was added, false otherwise
   */
  addElement(layerId: string, element: DiagramElement): boolean {
    const layer = this.getLayer(layerId);
    if (!layer) return false;
    layer.elements.push(element);
    this.rebuildGeometryCache();
    this.diagram.requestRender();
    this.onElementChange?.({ type: 'added', element, layerId });
    return true;
  }

  /**
   * Remove an element from a layer.
   * @param layerId - ID of the layer containing the element
   * @param elementId - ID of the element to remove
   * @returns true if element was found and removed, false otherwise
   */
  removeElement(layerId: string, elementId: string): boolean {
    const layer = this.getLayer(layerId);
    if (!layer) return false;
    const index = layer.elements.findIndex((e) => e.id === elementId);
    if (index === -1) return false;
    const element = layer.elements[index];
    layer.elements.splice(index, 1);
    this.rebuildGeometryCache();
    this.diagram.requestRender();
    this.onElementChange?.({ type: 'removed', element, layerId });
    return true;
  }

  /**
   * Get an element from a layer by ID.
   * @param layerId - ID of the layer containing the element
   * @param elementId - ID of the element to find
   * @returns The element if found, undefined otherwise
   */
  getElement(layerId: string, elementId: string): DiagramElement | undefined {
    const layer = this.getLayer(layerId);
    return layer?.elements.find((e) => e.id === elementId);
  }

  // ==================== Element Positioning/Sizing ====================

  /**
   * Set the position of an element.
   * @param layerId - ID of the layer containing the element
   * @param elementId - ID of the element to move
   * @param x - New X position
   * @param y - New Y position
   * @returns true if element was found and moved, false otherwise
   */
  setElementPosition(
    layerId: string,
    elementId: string,
    x: number,
    y: number
  ): boolean {
    const element = this.getElement(layerId, elementId);
    if (!element) return false;
    element.posX = x;
    element.posY = y;
    this.rebuildGeometryCache();
    this.diagram.requestRender();
    this.onElementChange?.({ type: 'moved', element, layerId });
    return true;
  }

  /**
   * Set the size of an element.
   * @param layerId - ID of the layer containing the element
   * @param elementId - ID of the element to resize
   * @param width - New width
   * @param height - New height
   * @returns true if element was found and resized, false otherwise
   */
  setElementSize(
    layerId: string,
    elementId: string,
    width: number,
    height: number
  ): boolean {
    const element = this.getElement(layerId, elementId);
    if (!element) return false;
    element.width = width;
    element.height = height;
    this.rebuildGeometryCache();
    this.diagram.requestRender();
    this.onElementChange?.({ type: 'resized', element, layerId });
    return true;
  }
}
