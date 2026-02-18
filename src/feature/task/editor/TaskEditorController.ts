import type { IContextPart } from "../../../service/context/types";
import type { IActivityController } from "../../../gui/activity/runtime/types";
import type { ServiceLayer } from "../../../service/ServiceLayer";
import type { ITaskEditorParams } from "./types";
import { TaskEditorView } from "./TaskEditorView";
import { resolveTaskEditor } from "./showTaskEditor";
import { parseUri } from "../../../core-model/uri";
import { TaskService } from "../TaskService";
import { TASK_SERVICE_NAME } from "../types";

export class TaskEditorController
  implements IActivityController<ITaskEditorParams, TaskEditorView>
{
  private serviceLayer: ServiceLayer;
  private view: TaskEditorView | null = null;
  private activityId: string = "";
  private editorId: string = "";
  private taskUri: string = "";
  private name: string = "";
  private deadline: string = "";

  constructor(serviceLayer: ServiceLayer) {
    this.serviceLayer = serviceLayer;
  }

  public attachView(view: TaskEditorView): void {
    this.view = view;
    view.setCallbacks({
      onSave: () => this.save(),
      onCancel: () => this.cancel(),
      onNameChange: (val) => { this.name = val; },
      onDeadlineChange: (val) => { this.deadline = val; },
    });
  }

  public async initialize(params: ITaskEditorParams, activityId: string): Promise<void> {
    this.activityId = activityId;
    this.editorId = params.editorId;
    this.taskUri = params.taskUri;

    const parsed = parseUri(params.taskUri);
    if (parsed) {
      const taskService = this.serviceLayer.getFeatureService<TaskService>(TASK_SERVICE_NAME);
      const taskObj = await taskService.getTask(parsed.id);
      if (taskObj) {
        this.name = taskObj.data.name ?? "";
        this.deadline = taskObj.data.deadline ? this.formatDate(new Date(taskObj.data.deadline)) : "";
      }
    }

    this.updateView();
  }

  public activate(_contextPart: IContextPart): void {}
  public deactivate(): void {}

  public destroy(): void {
    this.view = null;
  }

  private async save(): Promise<void> {
    const parsed = parseUri(this.taskUri);
    if (parsed) {
      const taskService = this.serviceLayer.getFeatureService<TaskService>(TASK_SERVICE_NAME);
      await taskService.updateTaskName(parsed.id, this.name);
      const deadlineDate = this.deadline ? new Date(this.deadline) : null;
      await taskService.updateTaskDeadline(parsed.id, deadlineDate);
    }
    resolveTaskEditor(this.editorId, true);
    this.serviceLayer.activityService.closeActivity(this.activityId);
  }

  private cancel(): void {
    resolveTaskEditor(this.editorId, false);
    this.serviceLayer.activityService.closeActivity(this.activityId);
  }

  private updateView(): void {
    this.view?.update({
      name: this.name,
      deadline: this.deadline,
    });
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
}
