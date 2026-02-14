import type { ServiceLayer } from "../../service/ServiceLayer";
import type { DatabaseService } from "../../service/database/DatabaseService";
import { GitService } from "./GitService";
import { GIT_SERVICE_NAME } from "./types";

export function setupGitFeature(serviceLayer: ServiceLayer, databaseService: DatabaseService): void {
  const gitService = new GitService(serviceLayer, databaseService);
  serviceLayer.registerFeatureService(GIT_SERVICE_NAME, gitService);
  gitService.registerActions();
}
