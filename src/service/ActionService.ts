import type { ServiceLayer } from "./ServiceLayer"

export interface IAction {
    id: string
    name: string
    shortcut: string
    group: string
    do: () => Promise<void>
    undo?: () => Promise<void>
    canUndo?: () => Promise<boolean>
    canDo: () => Promise<boolean>
}

export const ActionEvents = {
    ACTION_ADDED: 'actionAdded',
    ACTION_AVAILABILITY_UPDATED: 'actionAvailabilityUpdated',
    ACTION_DONE: 'actionDone',
}


export class ActionService extends EventTarget {
    private actions: IAction[] = [];
    private serviceLayer: ServiceLayer;
    
    constructor(serviceLayer: ServiceLayer) {
        super();
        this.actions = [];
        this.serviceLayer = serviceLayer;
    }

    public doAction(actionId: string): void {
        const action = this.actions.find(a => a.id === actionId);
        if(!action) {
            throw new Error(`Action ${actionId} not found`);
        }

        console.log(`Doing action ${action.id}: ${action.name}`);
        action.do();
    }

    public addAction(action: IAction) {
        console.log(`Adding action ${action.id}: ${action.name}`);
        this.validateAction(action);
        this.actions.push(action);
    }

    public getActions(): IAction[] {
        return this.actions;
    }

    public updateActionAvailability(): void {
        for(const action of this.actions) {
            action.canDo = action.canDo();
        }
        // todo: send signal that action availability has changed
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


