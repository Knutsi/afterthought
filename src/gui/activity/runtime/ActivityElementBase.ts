import { BaseComponent } from "../../core/BaseComponent";
import { ActivityType, type IActivity } from "../../../service/ActivityService";
import type { IContextPart } from "../../../service/context/types";
import { ActivityRuntime } from "./ActivityRuntime";
import type { IActivityController, IActivityDefinition, IActivityView } from "./types";

export abstract class ActivityElementBase<
  TParams,
  TView extends IActivityView,
  TController extends IActivityController<TParams, TView>,
> extends BaseComponent implements IActivity {
  private activityDefinition: IActivityDefinition<TParams, TView, TController>;
  private runtime: ActivityRuntime<TParams, TView, TController> | null = null;
  private contextPart: IContextPart | null = null;

  constructor(activityDefinition: IActivityDefinition<TParams, TView, TController>) {
    super();
    this.activityDefinition = activityDefinition;
  }

  get activityId(): string {
    return this.id;
  }

  get activityType(): ActivityType {
    return this.activityDefinition.activityType;
  }

  onGetContext(contextPart: IContextPart): void {
    this.contextPart = contextPart;
    this.runtime?.activate(contextPart);
  }

  onDropContext(): void {
    this.runtime?.deactivate();
    this.contextPart = null;
  }

  protected onInit(): void {
    if (!this.shadowRoot) {
      throw new Error("Shadow root not found");
    }

    this.runtime = new ActivityRuntime(
      this,
      this.shadowRoot,
      this.activityDefinition,
      this.getServiceLayer()
    );
    this.runtime.initialize();
    this.render();
  }

  protected onDestroy(): void {
    this.runtime?.destroy();
    this.runtime = null;
    this.contextPart = null;
  }

  protected render(): void {
    this.runtime?.render();
  }

  protected getActivityController(): TController | null {
    return this.runtime?.getController() ?? null;
  }

  protected getActivityParameters(): TParams | null {
    return this.runtime?.getParams() ?? null;
  }

  protected getActivityContextPart(): IContextPart | null {
    return this.contextPart;
  }
}
