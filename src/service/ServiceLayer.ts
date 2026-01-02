import { ActionService } from "./ActionService";
import { ActiveContextService } from "./ActiveContextService";
import { ObjectService } from "./ObjectService";
import { ThemeService } from "./ThemeService";
import { ActivityService } from "./ActivityService";

export class ServiceLayer {
  actionService: ActionService;
  activeContextService: ActiveContextService;
  objectService: ObjectService;
  themeService: ThemeService;
  activityService: ActivityService;

  private featureServices: Record<string, any> = {};

  constructor() {
    this.actionService = new ActionService(this);
    this.activeContextService = new ActiveContextService(this);
    this.objectService = new ObjectService(this);
    this.themeService = new ThemeService();
    this.activityService = new ActivityService();
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

  public getFeatureService<T>(featureName: string): T {
    return this.featureServices[featureName] as T;
  }

  public registerFeatureService<T>(featureName: string, featureService: T) {
    this.featureServices[featureName] = featureService;
  }
}

let defaultServiceLayer: ServiceLayer = new ServiceLayer();

export function getDefaultServiceLayer(): ServiceLayer {
  return defaultServiceLayer;
}

(window as any).serviceLayer = getDefaultServiceLayer();

console.log("Service layer initialized", getDefaultServiceLayer());
