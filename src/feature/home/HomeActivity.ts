import { defineComponent } from "../../gui/core/BaseComponent";
import { ActivityType } from "../../service/ActivityService";
import { ActivityElementBase } from "../../gui/activity/runtime/ActivityElementBase";
import type { IActivityDefinition } from "../../gui/activity/runtime/types";
import { HOME_ACTIVITY_TAG } from "./types";
import { HomeActivityController, type IHomeActivityParams } from "./HomeActivityController";
import { HomeActivityView } from "./HomeActivityView";

const HOME_ACTIVITY_DEFINITION: IActivityDefinition<
  IHomeActivityParams,
  HomeActivityView,
  HomeActivityController
> = {
  activityType: ActivityType.TAB,
  parseParams: (_rawParams: string | null): IHomeActivityParams => {
    return {};
  },
  createView: (): HomeActivityView => {
    return new HomeActivityView();
  },
  createController: (): HomeActivityController => {
    return new HomeActivityController();
  },
  getTabMeta: (): { label: string; icon: string; right: boolean; closeable: boolean } => {
    return {
      label: "Home",
      icon: "home",
      right: true,
      closeable: false,
    };
  },
};

export class HomeActivity extends ActivityElementBase<
  IHomeActivityParams,
  HomeActivityView,
  HomeActivityController
> {
  constructor() {
    super(HOME_ACTIVITY_DEFINITION);
  }
}

defineComponent(HOME_ACTIVITY_TAG, HomeActivity);

declare global {
  interface HTMLElementTagNameMap {
    [HOME_ACTIVITY_TAG]: HomeActivity;
  }
}
