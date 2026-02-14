import type { ServiceLayer } from "../../service/ServiceLayer";
import type { DatabaseService } from "../../service/database/DatabaseService";
import type { IAction } from "../../service/ActionService";
import type { IContext } from "../../service/context/types";
import { open as dialogOpen } from "@tauri-apps/plugin-dialog";
import { openDatabaseWindow } from "./openDatabaseWindow";
import { NEW_DATABASE_ACTION_ID, NEW_DATABASE_ACTIVITY_TAG, OPEN_DATABASE_ACTION_ID, RELOAD_DATABASE_ACTION_ID } from "./types";

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

    const openDatabaseAction: IAction = {
      id: OPEN_DATABASE_ACTION_ID,
      name: "Open Database",
      shortcuts: ["Ctrl+O"],
      menuGroup: "File",
      menuSubGroup: "open",
      do: async (_context: IContext, _args?: Record<string, unknown>) => {
        const selectedFile = await dialogOpen({
          title: "Open database",
          filters: [{ name: "Afterthought Database", extensions: ["afdb"] }],
        });
        if (!selectedFile) return;

        const dbPath = selectedFile.substring(0, selectedFile.lastIndexOf('/'));
        const info = await this.databaseService.openDatabase(dbPath);
        await this.databaseService.addRecentDatabase(info);

        openDatabaseWindow(info);
      },
      canDo: async () => true,
    };

    const reloadDatabaseAction: IAction = {
      id: RELOAD_DATABASE_ACTION_ID,
      name: "Reload Database",
      shortcuts: [],
      menuGroup: "File",
      menuSubGroup: "open",
      do: async (_context: IContext, _args?: Record<string, unknown>) => {
        await this.serviceLayer.objectService.reload();
      },
      canDo: async () => true,
    };

    this.serviceLayer.actionService.addAction(newDatabaseAction);
    this.serviceLayer.actionService.addAction(openDatabaseAction);
    this.serviceLayer.actionService.addAction(reloadDatabaseAction);
  }
}
