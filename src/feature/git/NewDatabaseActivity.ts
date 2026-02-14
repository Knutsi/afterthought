import { defineComponent } from "../../gui/core/BaseComponent";
import { ActivityType } from "../../service/ActivityService";
import { ActivityElementBase } from "../../gui/activity/runtime/ActivityElementBase";
import type { IActivityDefinition } from "../../gui/activity/runtime/types";
import type { ServiceLayer } from "../../service/ServiceLayer";
import { NEW_DATABASE_ACTIVITY_TAG } from "./types";
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
    return new NewDatabaseActivityController(serviceLayer);
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
}

defineComponent(NEW_DATABASE_ACTIVITY_TAG, NewDatabaseActivity);

declare global {
  interface HTMLElementTagNameMap {
    [NEW_DATABASE_ACTIVITY_TAG]: NewDatabaseActivity;
  }
}
