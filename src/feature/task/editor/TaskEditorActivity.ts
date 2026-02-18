import { defineComponent } from "../../../gui/core/BaseComponent";
import { ActivityType } from "../../../service/ActivityService";
import { ActivityElementBase } from "../../../gui/activity/runtime/ActivityElementBase";
import type { IActivityDefinition } from "../../../gui/activity/runtime/types";
import type { ServiceLayer } from "../../../service/ServiceLayer";
import { TASK_EDITOR_TAG, type ITaskEditorParams } from "./types";
import { TaskEditorController } from "./TaskEditorController";
import { TaskEditorView } from "./TaskEditorView";

const TASK_EDITOR_DEFINITION: IActivityDefinition<
  ITaskEditorParams,
  TaskEditorView,
  TaskEditorController
> = {
  activityType: ActivityType.MODAL,
  parseParams: (rawParams: string | null): ITaskEditorParams => {
    if (!rawParams) return { taskUri: "", editorId: "" };
    const parsed = JSON.parse(rawParams);
    return {
      taskUri: parsed.taskUri ?? "",
      editorId: parsed.editorId ?? "",
    };
  },
  createView: (): TaskEditorView => {
    return new TaskEditorView();
  },
  createController: (serviceLayer: ServiceLayer): TaskEditorController => {
    return new TaskEditorController(serviceLayer);
  },
};

export class TaskEditorActivity extends ActivityElementBase<
  ITaskEditorParams,
  TaskEditorView,
  TaskEditorController
> {
  constructor() {
    super(TASK_EDITOR_DEFINITION);
  }
}

defineComponent(TASK_EDITOR_TAG, TaskEditorActivity);

declare global {
  interface HTMLElementTagNameMap {
    [TASK_EDITOR_TAG]: TaskEditorActivity;
  }
}
