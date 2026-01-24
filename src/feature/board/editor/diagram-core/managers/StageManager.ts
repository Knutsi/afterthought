import { DiagramElement, DiagramLayer, IDiagram } from "../types";

/**
 * StageManager handles layer and element CRUD operations.
 * Each mutating method calls requestRender() after making changes.
 */
export class StageManager {
  constructor(
    private diagram: IDiagram,
    private layers: DiagramLayer[]
  ) {}

  // ==================== Layer Operations ====================

  /**
   * Add a new layer with the given name.
   * @param name - Name for the new layer
   * @returns The created layer
   */
  addLayer(name: string): DiagramLayer {
    const layer = new DiagramLayer(name);
    this.layers.push(layer);
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
    this.diagram.requestRender();
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
    layer.elements.splice(index, 1);
    this.diagram.requestRender();
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
    this.diagram.requestRender();
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
    this.diagram.requestRender();
    return true;
  }
}
