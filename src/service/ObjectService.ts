import { ServiceLayer } from "./ServiceLayer";

export const ObjectEvents = {
    OBJECT_ADDED: 'objectAdded',
    OBJECT_REMOVED: 'objectRemoved',
    OBJECT_UPDATED: 'objectUpdated',
}

export interface IObject {
    id: string;
    type: string;
    data: any;
}

export class ObjectService extends EventTarget {
    private objects: IObject[] = [];    

    constructor(_: ServiceLayer) {
        super();
        this.objects = [];
    }

    public getObjects(): IObject[] {
        return this.objects;
    }

    public addObject(object: IObject) {
        this.objects.push(object);
        this.dispatchEvent(new CustomEvent(ObjectEvents.OBJECT_ADDED, { detail: object }));
    }

    public removeObject(object: IObject) {
        this.objects = this.objects.filter(o => o.id !== object.id);
        this.dispatchEvent(new CustomEvent(ObjectEvents.OBJECT_REMOVED, { detail: object }));
    }

    public updateObject(object: IObject) {
        this.objects = this.objects.map(o => o.id === object.id ? object : o);
        this.dispatchEvent(new CustomEvent(ObjectEvents.OBJECT_UPDATED, { detail: object }));
    }
}