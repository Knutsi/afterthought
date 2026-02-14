import type { IContextPart } from "../../service/context/types";
import type { IActivityController } from "../../gui/activity/runtime/types";
import type { HomeActivityView } from "./HomeActivityView";

export interface IHomeActivityParams {
}

export class HomeActivityController implements IActivityController<IHomeActivityParams, HomeActivityView> {
  public attachView(_view: HomeActivityView): void {
  }

  public initialize(_params: IHomeActivityParams, _activityId: string): void {
  }

  public activate(_contextPart: IContextPart): void {
  }

  public deactivate(): void {
  }

  public destroy(): void {
  }
}
