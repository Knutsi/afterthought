import type { IContextPart } from "../../service/context/types";
import type { IActivityController } from "../../gui/activity/runtime/types";
import type { ServiceLayer } from "../../service/ServiceLayer";
import { NewDatabaseActivityView } from "./NewDatabaseActivityView";
import { open as dialogOpen } from "@tauri-apps/plugin-dialog";
import { join } from "@tauri-apps/api/path";
import { exists, readDir } from "@tauri-apps/plugin-fs";
import { getDefaultParentDir } from "./defaultDirectory";
import { suggestDatabaseName } from "./suggestDatabaseName";
import type { GitService } from "./GitService";
import { GIT_SERVICE_NAME } from "./types";

export interface INewDatabaseActivityParams {}

export class NewDatabaseActivityController
  implements IActivityController<INewDatabaseActivityParams, NewDatabaseActivityView>
{
  private serviceLayer: ServiceLayer;
  private view: NewDatabaseActivityView | null = null;
  private activityId: string = "";

  private parentDir: string = "";
  private name: string = "";
  private nameManuallyEdited: boolean = false;
  private replaceSpecialSigns: boolean = true;
  private targetDirWarning: string = "";

  constructor(serviceLayer: ServiceLayer) {
    this.serviceLayer = serviceLayer;
  }

  public attachView(view: NewDatabaseActivityView): void {
    this.view = view;
    view.setCallbacks({
      onBrowse: () => this.browseDirectory(),
      onCreate: () => this.create(),
      onCancel: () => this.cancel(),
      onNameChange: (value) => this.handleNameChange(value),
      onReplaceSpecialSignsChange: (checked) => this.handleReplaceSpecialSignsChange(checked),
    });
  }

  public initialize(_params: INewDatabaseActivityParams, activityId: string): void {
    this.activityId = activityId;
    this.updateView();
    getDefaultParentDir().then(async (dir) => {
      this.parentDir = dir;
      this.name = await suggestDatabaseName(dir);
      this.checkTargetDirectory();
    });
  }

  public activate(_contextPart: IContextPart): void {}
  public deactivate(): void {}

  public destroy(): void {
    this.view = null;
  }

  private sanitizeName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, "_");
  }

  private getEffectiveName(): string {
    const trimmed = this.name.trim();
    return this.replaceSpecialSigns ? this.sanitizeName(trimmed) : trimmed;
  }

  private updateView(): void {
    this.view?.update({
      parentDir: this.parentDir,
      name: this.name,
      effectiveName: this.getEffectiveName(),
      replaceSpecialSigns: this.replaceSpecialSigns,
      targetDirWarning: this.targetDirWarning,
    });
  }

  private handleNameChange(value: string): void {
    this.name = value;
    this.nameManuallyEdited = true;
    this.checkTargetDirectory();
  }

  private handleReplaceSpecialSignsChange(checked: boolean): void {
    this.replaceSpecialSigns = checked;
    this.checkTargetDirectory();
  }

  private async checkTargetDirectory(): Promise<void> {
    const effectiveName = this.getEffectiveName();
    if (!this.parentDir || !effectiveName) {
      this.targetDirWarning = "";
      this.updateView();
      return;
    }

    try {
      const targetPath = await join(this.parentDir, effectiveName);
      const dirExists = await exists(targetPath);
      if (dirExists) {
        const entries = await readDir(targetPath);
        if (entries.length > 0) {
          this.targetDirWarning = "This directory already exists and is not empty. Please choose an empty or new directory.";
          this.updateView();
          return;
        }
      }
    } catch {
      // ignore fs errors
    }

    this.targetDirWarning = "";
    this.updateView();
  }

  private async browseDirectory(): Promise<void> {
    const selected = await dialogOpen({
      directory: true,
      title: "Choose parent directory for new database",
    });
    if (!selected) return;

    this.parentDir = selected;
    if (!this.nameManuallyEdited) {
      this.name = await suggestDatabaseName(selected);
    }
    this.checkTargetDirectory();
  }

  private async create(): Promise<void> {
    const fsName = this.getEffectiveName();
    if (!this.parentDir || !fsName || this.targetDirWarning) return;

    const info = await this.serviceLayer.databaseService.createDatabase(this.parentDir, fsName);
    const gitService = this.serviceLayer.getFeatureService<GitService>(GIT_SERVICE_NAME);
    await gitService.openAndTrackDatabase(info);

    this.cancel();
  }

  private cancel(): void {
    this.serviceLayer.activityService.closeActivity(this.activityId);
  }
}
