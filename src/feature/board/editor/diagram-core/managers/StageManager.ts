import { DiagramElement, DiagramLayer, ElementChangeCallback, IDiagram } from "../types";
import { GeometryManager } from "./GeometryManager";

export class StageManager {
  private onElementChange?: ElementChangeCallback;

  constructor(
    private diagram: IDiagram,
    private layers: DiagramLayer[],
    private geometryManager: GeometryManager,
    onElementChange?: ElementChangeCallback
  ) {
    this.onElementChange = onElementChange;
  }

  // ==================== Layer Operations ====================

  addLayer(name: string): DiagramLayer {
    const layer = new DiagramLayer(name);
    this.layers.push(layer);
    this.geometryManager.invalidate();
    this.diagram.requestRender();
    return layer;
  }

  insertLayerAt(index: number, name: string): DiagramLayer {
    const layer = new DiagramLayer(name);
    this.layers.splice(index, 0, layer);
    this.geometryManager.invalidate();
    this.diagram.requestRender();
    return layer;
  }

  removeLayer(layerId: string): boolean {
    const index = this.layers.findIndex((l) => l.id === layerId);
    if (index === -1) return false;
    this.layers.splice(index, 1);
    this.geometryManager.invalidate();
    this.diagram.requestRender();
    return true;
  }

  getLayer(layerId: string): DiagramLayer | undefined {
    return this.layers.find((l) => l.id === layerId);
  }

  getLayers(): DiagramLayer[] {
    return this.layers;
  }

  // ==================== Element Operations ====================

  addElement(layerId: string, element: DiagramElement): boolean {
    const layer = this.getLayer(layerId);
    if (!layer) return false;
    layer.elements.push(element);
    this.geometryManager.invalidate();
    this.diagram.requestRender();
    this.onElementChange?.({ type: 'added', element, layerId });
    return true;
  }

  removeElement(layerId: string, elementId: string): boolean {
    const layer = this.getLayer(layerId);
    if (!layer) return false;
    const index = layer.elements.findIndex((e) => e.id === elementId);
    if (index === -1) return false;
    const element = layer.elements[index];
    layer.elements.splice(index, 1);
    this.geometryManager.invalidate();
    this.diagram.requestRender();
    this.onElementChange?.({ type: 'removed', element, layerId });
    return true;
  }

  getElement(layerId: string, elementId: string): DiagramElement | undefined {
    const layer = this.getLayer(layerId);
    return layer?.elements.find((e) => e.id === elementId);
  }

  // ==================== Element Positioning/Sizing ====================

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
    this.geometryManager.invalidate();
    this.diagram.requestRender();
    this.onElementChange?.({ type: 'moved', element, layerId });
    return true;
  }

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
    this.geometryManager.invalidate();
    this.diagram.requestRender();
    this.onElementChange?.({ type: 'resized', element, layerId });
    return true;
  }

  getAllElements(): DiagramElement[] {
    return this.layers.flatMap(layer => layer.elements);
  }
}
