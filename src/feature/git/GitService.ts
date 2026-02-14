import type { ServiceLayer } from "../../service/ServiceLayer";
import type { IAction } from "../../service/ActionService";
import type { IContext } from "../../service/context/types";
import type { IDatabaseInfo } from "../../service/database/types";
import { open as dialogOpen } from "@tauri-apps/plugin-dialog";
import { openDatabaseWindow } from "./openDatabaseWindow";
import { NEW_DATABASE_ACTION_ID, NEW_DATABASE_ACTIVITY_TAG, OPEN_DATABASE_ACTION_ID, RELOAD_DATABASE_ACTION_ID } from "./types";

export class GitService {
  private serviceLayer: ServiceLayer;

  constructor(serviceLayer: ServiceLayer) {
    this.serviceLayer = serviceLayer;
  }

  public async openAndTrackDatabase(info: IDatabaseInfo): Promise<void> {
    await this.serviceLayer.databaseService.addRecentDatabase(info);
    await openDatabaseWindow(info);
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
        await this.promptOpenDatabase();
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

  private async promptOpenDatabase(): Promise<void> {
    const selectedFile = await dialogOpen({
      title: "Open database",
      filters: [{ name: "Afterthought Database", extensions: ["afdb"] }],
    });
    if (!selectedFile) return;

    const dbPath = selectedFile.substring(0, selectedFile.lastIndexOf('/'));
    const info = await this.serviceLayer.databaseService.openDatabase(dbPath);
    await this.openAndTrackDatabase(info);
  }
}
