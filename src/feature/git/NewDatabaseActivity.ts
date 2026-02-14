import { defineComponent } from "../../gui/core/BaseComponent";
import { ActivityType } from "../../service/ActivityService";
import { ActivityElementBase } from "../../gui/activity/runtime/ActivityElementBase";
import type { IActivityDefinition } from "../../gui/activity/runtime/types";
import type { ServiceLayer } from "../../service/ServiceLayer";
import { NEW_DATABASE_ACTIVITY_TAG, GIT_SERVICE_NAME } from "./types";
import type { GitService } from "./GitService";
import {
  NewDatabaseActivityController,
  type INewDatabaseActivityParams,
} from "./NewDatabaseActivityController";
import { NewDatabaseActivityView } from "./NewDatabaseActivityView";

const NEW_DATABASE_ACTIVITY_DEFINITION: IActivityDefinition<
  INewDatabaseActivityParams,
  NewDatabaseActivityView,
  NewDatabaseActivityController
> = {
  activityType: ActivityType.MODAL,
  parseParams: (_rawParams: string | null): INewDatabaseActivityParams => {
    return {};
  },
  createView: (): NewDatabaseActivityView => {
    return new NewDatabaseActivityView();
  },
  createController: (serviceLayer: ServiceLayer): NewDatabaseActivityController => {
    const gitService = serviceLayer.getFeatureService<GitService>(GIT_SERVICE_NAME);
    return new NewDatabaseActivityController(serviceLayer, gitService.getDatabaseService());
  },
};

export class NewDatabaseActivity extends ActivityElementBase<
  INewDatabaseActivityParams,
  NewDatabaseActivityView,
  NewDatabaseActivityController
> {
  constructor() {
    super(NEW_DATABASE_ACTIVITY_DEFINITION);
  }

  protected onInit(): void {
    super.onInit();
    // wire up custom events from the view to the controller
    this.addEventListener("name-change", ((e: CustomEvent) => {
      this.getActivityController()?.handleNameChange(e.detail.value);
    }) as EventListener);

    this.addEventListener("replace-special-signs-change", ((e: CustomEvent) => {
      this.getActivityController()?.handleReplaceSpecialSignsChange(e.detail.checked);
    }) as EventListener);

    // give the controller access to this element's id for closing
    this.getActivityController()?.setActivityId(this.id);
  }
}

defineComponent(NEW_DATABASE_ACTIVITY_TAG, NewDatabaseActivity);

declare global {
  interface HTMLElementTagNameMap {
    [NEW_DATABASE_ACTIVITY_TAG]: NewDatabaseActivity;
  }
}
