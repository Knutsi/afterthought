import { ActionService } from "./ActionService";
import { ContextService } from "./ContextService";
import { ObjectService } from "./ObjectService";
import { ThemeService } from "./ThemeService";
import { ActivityService } from "./ActivityService";

export class ServiceLayer {
  actionService: ActionService;
  activeContextService: ContextService;
  objectService: ObjectService;
  themeService: ThemeService;
  activityService: ActivityService;

  private featureServices: Record<string, any> = {};

  constructor() {
    this.actionService = new ActionService(this);
    this.activeContextService = new ContextService(this);
    this.objectService = new ObjectService(this);
    this.themeService = new ThemeService();
    this.activityService = new ActivityService();
  }

  public getContextService(): ContextService {
    return this.activeContextService;
  }

  public getObjectService(): ObjectService {
    return this.objectService;
  }

  public getThemeService(): ThemeService {
    return this.themeService;
  }

  public getActivityService(): ActivityService {
    return this.activityService;
  }

  public getFeatureService<T>(featureName: string): T {
    return this.featureServices[featureName] as T;
  }

  public registerFeatureService<T>(featureName: string, featureService: T) {
    this.featureServices[featureName] = featureService;
  }

  public getLoggers() {
    return {
      logInfo: (message: string) => {
        console.log(message);
      },
      logError: (message: string) => {
        console.error(message);
      },
      logWarn: (message: string) => {
        console.warn(message);
      },
    };
  }
}

let defaultServiceLayer: ServiceLayer = new ServiceLayer();

export function getDefaultServiceLayer(): ServiceLayer {
  return defaultServiceLayer;
}

(window as any).serviceLayer = getDefaultServiceLayer();

console.log("Service layer initialized", getDefaultServiceLayer());
