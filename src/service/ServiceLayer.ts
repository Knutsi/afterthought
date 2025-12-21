import { ActionService } from "./ActionService";
import { ContextService } from "./ContextService";
import { ObjectService } from "./ObjectService";
import { ThemeService } from "./ThemeService";

export class ServiceLayer {
    actionService: ActionService;
    contextService: ContextService;
    objectService: ObjectService;
    themeService: ThemeService;
    constructor() {
        this.actionService = new ActionService(this);
        this.contextService = new ContextService(this);
        this.objectService = new ObjectService(this);
        this.themeService = new ThemeService();
    }

    public getContextService(): ContextService {
        return this.contextService;
    }

    public getObjectService(): ObjectService {
        return this.objectService;
    }

    public getThemeService(): ThemeService {
        return this.themeService;
    }
}


let defaultServiceLayer: ServiceLayer = new ServiceLayer();

export function getDefaultServiceLayer(): ServiceLayer {
    return defaultServiceLayer;
}


(window as any).serviceLayer = getDefaultServiceLayer();


console.log("Service layer initialized", getDefaultServiceLayer());