import { ActionService } from "./ActionService";
import { ActiveContextService } from "./ActiveContextService";
import { ObjectService } from "./ObjectService";
import { ThemeService } from "./ThemeService";

export class ServiceLayer {
  actionService: ActionService;
  activeContextService: ActiveContextService;
  objectService: ObjectService;
  themeService: ThemeService;
  constructor() {
    this.actionService = new ActionService(this);
    this.activeContextService = new ActiveContextService(this);
    this.objectService = new ObjectService(this);
    this.themeService = new ThemeService();
  }

  public getActiveContextService(): ActiveContextService {
    return this.activeContextService;
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
