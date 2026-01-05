import type { ServiceLayer } from "./ServiceLayer";

export const ContextEvents = {
  CONTEXT_CHANGED: "contextChanged",
  SELECTION_CHANGED: "selectionChanged",
};

export interface IContext {
  activityId: string;
  objects: unknown[];
  selection: unknown[];
}

function DefaultContext(): IContext {
  return {
    activityId: "",
    objects: [],
    selection: [],
  };
}

export class ContextService extends EventTarget {
  private activeContext: IContext;

  constructor(_: ServiceLayer) {
    super();
    this.activeContext = DefaultContext();
  }

  public getActiveContext(): IContext {
    return this.activeContext;
  }

  public addObject(object: unknown) {
    this.activeContext.objects.push(object);
    this.dispatchEvent(new CustomEvent(ContextEvents.CONTEXT_CHANGED));
  }

  public removeObject(object: unknown) {
    this.activeContext.objects = this.activeContext.objects.filter((o) => o !== object);
    this.dispatchEvent(new CustomEvent(ContextEvents.CONTEXT_CHANGED));
  }

  public updateObject(object: unknown) {
    this.activeContext.objects = this.activeContext.objects.map((o) => (o === object ? object : o));
    this.dispatchEvent(new CustomEvent(ContextEvents.CONTEXT_CHANGED));
  }

  public setSelection(selection: unknown[]) {
    this.activeContext.selection = selection;
    this.dispatchEvent(new CustomEvent(ContextEvents.SELECTION_CHANGED));
  }

  public getSelection(): unknown[] {
    return this.activeContext.selection;
  }
}
