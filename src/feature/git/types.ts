import type { GitService } from "./GitService";

export const GIT_SERVICE_NAME = "git-service";
export const NEW_DATABASE_ACTIVITY_TAG = "new-database-activity";
export const NEW_DATABASE_ACTION_ID = "database.new";
export const OPEN_DATABASE_ACTION_ID = "database.open";
export const RELOAD_DATABASE_ACTION_ID = "database.reload";

declare module "../../service/featureTypes" {
  interface IFeatureServiceMap {
    [GIT_SERVICE_NAME]: GitService;
  }
}
