import type { ServiceLayer } from "./ServiceLayer"

export interface IAction {
    id: string
    name: string
    shortcut: string
    group: string
    do: () => Promise<void>
    undo?: () => Promise<void>
    canUndo?: () => boolean
    canDo: () => boolean
}

export const ActionEvents = {
    ACTION_ADDED: 'actionAdded',
    ACTION_AVAILABILITY_UPDATED: 'actionAvailabilityUpdated',
    ACTION_DONE: 'actionDone',
}


export class ActionService extends EventTarget {
    private actions: IAction[] = [];
    
    constructor(_: ServiceLayer) {
        super();
        this.actions = [];
    }

    public doAction(actionId: string): void {
        const action = this.actions.find(a => a.id === actionId);
        if(!action) {
            throw new Error(`Action ${actionId} not found`);
        }

        action.do();
    }

    public addAction(action: IAction) {
        console.log(`Adding action ${action.id}: ${action.name}`);
        this.validateAction(action);
        this.actions.push(action);
        this.dispatchEvent(new CustomEvent(ActionEvents.ACTION_ADDED, { detail: action }));
    }

    public getActions(): IAction[] {
        return this.actions;
    }

    public updateActionAvailability(): void {
        // todo - check action availability against current state
        this.dispatchEvent(new CustomEvent(ActionEvents.ACTION_AVAILABILITY_UPDATED));
    }

    private validateAction(action: IAction): void {
        if (!action.id) {
            throw new Error("Action ID is required");
        }
        if (!action.name) {
            throw new Error("Action name is required");
        }

        if(this.actions.find(a => a.id === action.id)) {
            throw new Error(`Action ${action.id} already exists`);
        }

        if(!action.do) {
            throw new Error("Action do function is required");
        }

        if(!action.canDo) {
            throw new Error("Action canDo function is required");
        }
    }
}


