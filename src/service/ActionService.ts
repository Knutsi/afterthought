import type { IContext } from "./context/types";
import type { ServiceLayer } from "./ServiceLayer";

export type RedoFunction = () => Promise<UndoFunction | void>;
export type UndoFunction = () => Promise<RedoFunction | void>;
export type DoFunction = (context: IContext, args?: Record<string, unknown>) => Promise<UndoFunction | void>;
export type ActionAvailabilityMap = ReadonlyMap<string, boolean>;

export interface IAction {
  id: string;
  name: string;
  shortcuts: string[];
  menuGroup: string;
  menuSubGroup?: string;
  hideFromMenu?: boolean;
  repeatable?: boolean;
  do: DoFunction;
  canDo: (context: IContext) => Promise<boolean>;
}

export const UNDO_ACTION_ID = "core.undo";
export const REDO_ACTION_ID = "core.redo";
export const REPEAT_ACTION_ID = "core.repeat";

interface UndoEntry {
  actionId: string;
  actionName: string;
  undoFn: UndoFunction;
}

interface RedoEntry {
  actionId: string;
  actionName: string;
  redoFn: RedoFunction;
}

export const ActionEvents = {
  ACTION_ADDED: "actionAdded",
  ACTION_AVAILABILITY_UPDATED: "actionAvailabilityUpdated",
  ACTION_DONE: "actionDone",
  HISTORY_CHANGED: "historyChanged",
};

export class ActionService extends EventTarget {
  private actions: IAction[] = [];
  private undoStack: UndoEntry[] = [];
  private redoStack: RedoEntry[] = [];
  private serviceLayer: ServiceLayer;
  private lastActionId: string | null = null;
  private lastArgs: Record<string, unknown> | undefined = undefined;
  private availabilityByActionId: Map<string, boolean> = new Map();
  private availabilityVersion = 0;
  private availabilityUpdateRunning = false;
  private availabilityUpdateQueued = false;

  constructor(serviceLayer: ServiceLayer) {
    super();
    this.actions = [];
    this.serviceLayer = serviceLayer;
  }

  public async doAction(actionId: string, args?: Record<string, unknown>): Promise<void> {
    const action = this.actions.find((a) => a.id === actionId);
    if (!action) {
      throw new Error(`Action ${actionId} not found`);
    }

    console.log(`Doing action ${action.id}: ${action.name}`);
    const context = this.serviceLayer.getContextService();
    const undoFn = await action.do(context, args);

    if (undoFn) {
      this.undoStack.push({
        actionId: action.id,
        actionName: action.name,
        undoFn,
      });
      this.redoStack = [];
      this.dispatchEvent(new Event(ActionEvents.HISTORY_CHANGED));
      this.updateActionAvailability();
    }

    if (action.repeatable !== false) {
      this.lastActionId = actionId;
      this.lastArgs = args;
    }

    this.dispatchEvent(new CustomEvent(ActionEvents.ACTION_DONE, { detail: { actionId } }));
  }

  public async undo(): Promise<void> {
    const entry = this.undoStack.pop();
    if (!entry) return;

    const redoFn = await entry.undoFn();
    if (redoFn) {
      this.redoStack.push({
        actionId: entry.actionId,
        actionName: entry.actionName,
        redoFn,
      });
    }
    this.dispatchEvent(new Event(ActionEvents.HISTORY_CHANGED));
    this.updateActionAvailability();
  }

  public async redo(): Promise<void> {
    const entry = this.redoStack.pop();
    if (!entry) return;

    const undoFn = await entry.redoFn();
    if (undoFn) {
      this.undoStack.push({
        actionId: entry.actionId,
        actionName: entry.actionName,
        undoFn,
      });
    }
    this.dispatchEvent(new Event(ActionEvents.HISTORY_CHANGED));
    this.updateActionAvailability();
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public getUndoDescription(): string | null {
    if (this.undoStack.length === 0) return null;
    return this.undoStack[this.undoStack.length - 1].actionName;
  }

  public getRedoDescription(): string | null {
    if (this.redoStack.length === 0) return null;
    return this.redoStack[this.redoStack.length - 1].actionName;
  }

  public getLastActionId(): string | null {
    return this.lastActionId;
  }

  public getLastArgs(): Record<string, unknown> | undefined {
    return this.lastArgs;
  }

  public canRepeat(): boolean {
    return this.lastActionId !== null;
  }

  public addAction(action: IAction) {
    console.log(`Adding action ${action.id}: ${action.name}`);
    this.validateAction(action);
    this.actions.push(action);
    this.dispatchEvent(new CustomEvent(ActionEvents.ACTION_ADDED, { detail: { action } }));
    this.updateActionAvailability();
  }

  public getActions(): IAction[] {
    return this.actions;
  }

  public updateActionAvailability(): void {
    if (this.availabilityUpdateRunning) {
      this.availabilityUpdateQueued = true;
      return;
    }

    this.availabilityUpdateRunning = true;
    const actions = [...this.actions];
    const context = this.serviceLayer.getContextService();

    Promise.all(
      actions.map(async (action) => {
        const canDo = await action.canDo(context).catch(() => false);
        return [action.id, canDo] as const;
      })
    )
      .then((entries) => {
        this.availabilityByActionId = new Map(entries);
        this.availabilityVersion++;
        this.dispatchEvent(
          new CustomEvent(ActionEvents.ACTION_AVAILABILITY_UPDATED, {
            detail: {
              availability: this.availabilityByActionId,
              version: this.availabilityVersion,
            },
          })
        );
      })
      .finally(() => {
        this.availabilityUpdateRunning = false;
        if (this.availabilityUpdateQueued) {
          this.availabilityUpdateQueued = false;
          this.updateActionAvailability();
        }
      });
  }

  public getActionAvailability(): ActionAvailabilityMap {
    return this.availabilityByActionId;
  }

  public isActionAvailable(actionId: string): boolean {
    return this.availabilityByActionId.get(actionId) ?? false;
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
