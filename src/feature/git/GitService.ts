import type { ServiceLayer } from "../../service/ServiceLayer";
import type { DatabaseService } from "../../service/database/DatabaseService";
import type { IAction } from "../../service/ActionService";
import type { IContext } from "../../service/context/types";
import { NEW_DATABASE_ACTION_ID, NEW_DATABASE_ACTIVITY_TAG } from "./types";

export class GitService {
  private serviceLayer: ServiceLayer;
  private databaseService: DatabaseService;

  constructor(serviceLayer: ServiceLayer, databaseService: DatabaseService) {
    this.serviceLayer = serviceLayer;
    this.databaseService = databaseService;
  }

  public getDatabaseService(): DatabaseService {
    return this.databaseService;
  }

  public registerActions(): void {
    const newDatabaseAction: IAction = {
      id: NEW_DATABASE_ACTION_ID,
      name: "New Database",
      shortcuts: ["Ctrl+N D"],
      menuGroup: "File",
      menuSubGroup: "create",
      do: async (_context: IContext, _args?: Record<string, unknown>) => {
        this.serviceLayer.activityService.startActivity(NEW_DATABASE_ACTIVITY_TAG, {});
      },
      canDo: async () => true,
    };

    this.serviceLayer.actionService.addAction(newDatabaseAction);
  }
}
