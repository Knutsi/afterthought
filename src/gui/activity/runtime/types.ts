import type { Uri } from "../../../core-model/uri";
import type { ActivityType } from "../../../service/ActivityService";
import type { ServiceLayer } from "../../../service/ServiceLayer";
import type { IContextPart } from "../../../service/context/types";

export interface IActivityTabMeta {
  label?: string;
  icon?: string;
  closeable?: boolean;
  right?: boolean;
}

export interface IContextEntrySpec {
  uri: Uri;
  feature: string;
  parentUri?: Uri;
}

export interface IActivityView {
  mount(shadowRoot: ShadowRoot): void;
  render(): void;
  destroy(): void;
}

export interface IActivityController<TParams, TView extends IActivityView> {
  attachView(view: TView): void;
  initialize(params: TParams): void | Promise<void>;
  activate(contextPart: IContextPart): void;
  deactivate(): void;
  destroy(): void;
  getContextEntries?(): ReadonlyArray<IContextEntrySpec>;
}

export interface IActivityDefinition<
  TParams,
  TView extends IActivityView,
  TController extends IActivityController<TParams, TView>,
> {
  readonly activityType: ActivityType;
  parseParams(rawParameters: string | null): TParams;
  createView(): TView;
  createController(serviceLayer: ServiceLayer): TController;
  getTabMeta?(params: TParams): IActivityTabMeta;
}
