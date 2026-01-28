import type { IContext } from "./context/types";
import type { ServiceLayer } from "./ServiceLayer";

export type UndoFunction = () => Promise<void>;

export interface IAction {
  id: string;
  name: string;
  shortcut: string;
  menuGroup: string;
  menuSubGroup?: string;
  do: () => Promise<UndoFunction | void>;
  canDo: (context: IContext) => Promise<boolean>;
}

export const UNDO_ACTION_ID = "core.undo";
export const REDO_ACTION_ID = "core.redo";

export const ActionEvents = {
  ACTION_ADDED: "actionAdded",
  ACTION_AVAILABILITY_UPDATED: "actionAvailabilityUpdated",
  ACTION_DONE: "actionDone",
  HISTORY_CHANGED: "historyChanged",
};

export class ActionService extends EventTarget {
  private actions: IAction[] = [];
  private undoStack: UndoFunction[] = [];
  private redoStack: UndoFunction[] = [];

  constructor(_serviceLayer: ServiceLayer) {
    super();
    this.actions = [];
  }

  public async doAction(actionId: string): Promise<void> {
    const action = this.actions.find((a) => a.id === actionId);
    if (!action) {
      throw new Error(`Action ${actionId} not found`);
    }

    console.log(`Doing action ${action.id}: ${action.name}`);
    const undoFn = await action.do();

    if (undoFn) {
      this.undoStack.push(undoFn);
      this.redoStack = [];
      this.dispatchEvent(new Event(ActionEvents.HISTORY_CHANGED));
      this.updateActionAvailability();
    }

    this.dispatchEvent(new CustomEvent(ActionEvents.ACTION_DONE, { detail: { actionId } }));
  }

  public async undo(): Promise<void> {
    const undoFn = this.undoStack.pop();
    if (!undoFn) return;

    await undoFn();
    this.redoStack.push(undoFn);
    this.dispatchEvent(new Event(ActionEvents.HISTORY_CHANGED));
    this.updateActionAvailability();
  }

  public async redo(): Promise<void> {
    const redoFn = this.redoStack.pop();
    if (!redoFn) return;

    await redoFn();
    this.undoStack.push(redoFn);
    this.dispatchEvent(new Event(ActionEvents.HISTORY_CHANGED));
    this.updateActionAvailability();
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
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
