import { ActionService } from "./ActionService";
import { ContextService } from "./context/ContextService";
import { ObjectService } from "./ObjectService";
import { ThemeService } from "./ThemeService";
import { ActivityService } from "./ActivityService";
import { KeyboardService } from "./KeyboardService";
import { DatabaseService } from "./database/DatabaseService";
import { SessionService } from "./session/SessionService";
import type { PersonalStore } from "./database/PersonalStore";
import type { FeatureId, IFeatureServiceMap } from "./featureTypes";

export class ServiceLayer {
  actionService: ActionService;
  activeContextService: ContextService;
  objectService: ObjectService;
  themeService: ThemeService;
  activityService: ActivityService;
  keyboardService: KeyboardService;
  databaseService: DatabaseService;
  sessionService: SessionService;
  personalStore: PersonalStore | null = null;

  private featureServices: Partial<IFeatureServiceMap> = {};

  constructor() {
    this.actionService = new ActionService(this);
    this.activeContextService = new ContextService(this);
    this.objectService = new ObjectService(this);
    this.themeService = new ThemeService();
    this.activityService = new ActivityService(this);
    this.keyboardService = new KeyboardService(this);
    this.databaseService = new DatabaseService();
    this.sessionService = new SessionService();
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

  public getFeatureService<T>(featureName: string): T;
  public getFeatureService<K extends FeatureId>(featureName: K): IFeatureServiceMap[K];
  public getFeatureService<K extends FeatureId>(featureName: K | string): IFeatureServiceMap[K] {
    return this.featureServices[featureName as K] as IFeatureServiceMap[K];
  }

  public registerFeatureService<T>(featureName: string, featureService: T): void;
  public registerFeatureService<K extends FeatureId>(featureName: K, featureService: IFeatureServiceMap[K]): void;
  public registerFeatureService<K extends FeatureId>(featureName: K | string, featureService: IFeatureServiceMap[K] | unknown): void {
    this.featureServices[featureName as K] = featureService as IFeatureServiceMap[K];
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
