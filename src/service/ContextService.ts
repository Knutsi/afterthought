import type { ServiceLayer } from "./ServiceLayer";

export const ActiveContextEvents = {
  ACTIVE_CONTEXT_CHANGED: "activeContextChanged",
};

export interface IContext {
  activityId: string;
}

const DefaultContext: IContext = {
  activityId: "",
};

export class ActiveContextService extends EventTarget {
  private activeContext: IContext;

  constructor(_: ServiceLayer) {
    super();
    this.activeContext = DefaultContext;
  }

  public getActiveContext(): IContext {
    return this.activeContext;
  }

  public setActiveContext(context: IContext) {
    this.activeContext = context;
    this.dispatchEvent(new CustomEvent(ActiveContextEvents.ACTIVE_CONTEXT_CHANGED, { detail: context }));
  }
}
