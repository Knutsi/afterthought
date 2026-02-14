import type { IContextPart } from "../../service/context/types";
import type { IActivityController } from "../../gui/activity/runtime/types";
import type { ServiceLayer } from "../../service/ServiceLayer";
import type { DatabaseService } from "../../service/database/DatabaseService";
import { NewDatabaseActivityView } from "./NewDatabaseActivityView";
import { open as dialogOpen } from "@tauri-apps/plugin-dialog";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { join } from "@tauri-apps/api/path";
import { mkdir, writeTextFile } from "@tauri-apps/plugin-fs";

export interface INewDatabaseActivityParams {}

export class NewDatabaseActivityController
  implements IActivityController<INewDatabaseActivityParams, NewDatabaseActivityView>
{
  private serviceLayer: ServiceLayer;
  private databaseService: DatabaseService;
  private view: NewDatabaseActivityView | null = null;
  private activityId: string = "";

  private parentDir: string = "";
  private name: string = "";
  private createNewDirectory: boolean = true;

  constructor(serviceLayer: ServiceLayer, databaseService: DatabaseService) {
    this.serviceLayer = serviceLayer;
    this.databaseService = databaseService;
  }

  public setActivityId(id: string): void {
    this.activityId = id;
  }

  public attachView(view: NewDatabaseActivityView): void {
    this.view = view;
    view.setCallbacks({
      onBrowse: () => this.browseDirectory(),
      onCreate: () => this.create(),
      onCancel: () => this.cancel(),
    });
  }

  public initialize(_params: INewDatabaseActivityParams): void {
    this.updateView();
  }

  public activate(_contextPart: IContextPart): void {}
  public deactivate(): void {}

  public destroy(): void {
    this.view = null;
  }

  private updateView(): void {
    this.view?.update({
      parentDir: this.parentDir,
      name: this.name,
      createNewDirectory: this.createNewDirectory,
    });
  }

  public handleNameChange(value: string): void {
    this.name = value;
    this.updateView();
  }

  public handleCreateDirChange(checked: boolean): void {
    this.createNewDirectory = checked;
    this.updateView();
  }

  private async browseDirectory(): Promise<void> {
    const selected = await dialogOpen({
      directory: true,
      title: "Choose parent directory for new database",
    });
    if (!selected) return;

    this.parentDir = selected;
    this.updateView();
  }

  private async create(): Promise<void> {
    if (!this.parentDir || !this.name) return;

    let info;
    if (this.createNewDirectory) {
      // creates parentDir/name/ with name.afdb inside
      info = await this.databaseService.createDatabase(this.parentDir, this.name);
    } else {
      // place database files directly in parentDir (no extra subdirectory)
      const dbPath = this.parentDir;
      const metaFileName = `${this.name}.afdb`;
      await mkdir(await join(dbPath, "stores"), { recursive: true });
      await mkdir(await join(dbPath, "personal"), { recursive: true });
      const meta = { name: this.name, version: 1, createdAt: new Date().toISOString() };
      await writeTextFile(await join(dbPath, metaFileName), JSON.stringify(meta, null, 2));
      await writeTextFile(await join(dbPath, ".gitignore"), "personal/\n");
      info = { name: this.name, path: dbPath };
    }

    await this.databaseService.addRecentDatabase(info);

    new WebviewWindow(`db-${Date.now()}`, {
      url: `index.html?database=${encodeURIComponent(info.path)}`,
      title: info.name,
      width: 800,
      height: 600,
    });

    this.cancel();
  }

  private cancel(): void {
    this.serviceLayer.activityService.closeActivity(this.activityId);
  }
}
