import type { ServiceLayer } from "../../service/ServiceLayer";
import { GitService } from "./GitService";
import { GIT_SERVICE_NAME } from "./types";

export function setupGitFeature(serviceLayer: ServiceLayer): void {
  const gitService = new GitService(serviceLayer);
  serviceLayer.registerFeatureService(GIT_SERVICE_NAME, gitService);
  gitService.registerActions();
}
