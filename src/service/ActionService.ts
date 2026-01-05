import type { IContext } from "./ContextService";
import type { ServiceLayer } from "./ServiceLayer";

export interface IAction {
  id: string;
  name: string;
  shortcut: string;
  menuGroup: string;
  menuSubGroup?: string;
  do: () => Promise<void>;
  undo?: () => Promise<void>;
  canUndo?: () => Promise<boolean>;
  canDo: (context: IContext) => Promise<boolean>;
}

export const ActionEvents = {
  ACTION_ADDED: "actionAdded",
  ACTION_AVAILABILITY_UPDATED: "actionAvailabilityUpdated",
  ACTION_DONE: "actionDone",
};

export class ActionService extends EventTarget {
  private actions: IAction[] = [];

  constructor(_serviceLayer: ServiceLayer) {
    super();
    this.actions = [];
  }

  public doAction(actionId: string): void {
    const action = this.actions.find((a) => a.id === actionId);
    if (!action) {
      throw new Error(`Action ${actionId} not found`);
    }

    console.log(`Doing action ${action.id}: ${action.name}`);
    action.do();
    this.dispatchEvent(new CustomEvent(ActionEvents.ACTION_DONE, { detail: { actionId } }));
  }

  public addAction(action: IAction) {
    console.log(`Adding action ${action.id}: ${action.name}`);
    this.validateAction(action);
    this.actions.push(action);
    this.dispatchEvent(new CustomEvent(ActionEvents.ACTION_ADDED, { detail: { action } }));
  }

  public getActions(): IAction[] {
    return this.actions;
  }

  public updateActionAvailability(): void {
    // Dispatch event to notify listeners that action availability should be rechecked
    this.dispatchEvent(new Event(ActionEvents.ACTION_AVAILABILITY_UPDATED));
  }

  private validateAction(action: IAction): void {
    if (!action.id) {
      throw new Error("Action ID is required");
    }
    if (!action.name) {
      throw new Error("Action name is required");
    }

    if (this.actions.find((a) => a.id === action.id)) {
      throw new Error(`Action ${action.id} already exists`);
    }

    if (!action.do) {
      throw new Error("Action do function is required");
    }

    if (!action.canDo) {
      throw new Error("Action canDo function is required");
    }
  }
}
