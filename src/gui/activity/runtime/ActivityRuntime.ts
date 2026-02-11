import type { Uri } from "../../../core-model/uri";
import type { ServiceLayer } from "../../../service/ServiceLayer";
import type { IContextPart } from "../../../service/context/types";
import type {
  IActivityController,
  IActivityDefinition,
  IActivityView,
  IActivityTabMeta,
  IContextEntrySpec,
} from "./types";

export class ActivityRuntime<
  TParams,
  TView extends IActivityView,
  TController extends IActivityController<TParams, TView>,
> {
  private hostElement: HTMLElement;
  private shadowRoot: ShadowRoot;
  private definition: IActivityDefinition<TParams, TView, TController>;
  private serviceLayer: ServiceLayer;
  private params: TParams | null = null;
  private view: TView | null = null;
  private controller: TController | null = null;
  private activeContextPart: IContextPart | null = null;
  private installedContextEntries: Uri[] = [];
  private initialized: boolean = false;

  constructor(
    hostElement: HTMLElement,
    shadowRoot: ShadowRoot,
    definition: IActivityDefinition<TParams, TView, TController>,
    serviceLayer: ServiceLayer
  ) {
    this.hostElement = hostElement;
    this.shadowRoot = shadowRoot;
    this.definition = definition;
    this.serviceLayer = serviceLayer;
  }

  public initialize(): void {
    if (this.initialized) {
      return;
    }

    this.params = this.definition.parseParams(this.hostElement.getAttribute("data-parameters"));
    this.applyTabMeta(this.definition.getTabMeta?.(this.params));

    this.view = this.definition.createView();
    this.view.mount(this.shadowRoot);
    this.view.render();

    this.controller = this.definition.createController(this.serviceLayer);
    this.controller.attachView(this.view);

    const initializeResult = this.controller.initialize(this.params);
    if (initializeResult instanceof Promise) {
      void initializeResult.catch((error: unknown) => {
        console.error("[ActivityRuntime] Controller initialize failed", error);
      });
    }

    this.initialized = true;
    this.render();
  }

  public activate(contextPart: IContextPart): void {
    if (!this.controller) {
      return;
    }

    this.activeContextPart = contextPart;
    this.installControllerContextEntries();
    this.controller.activate(contextPart);
  }

  public deactivate(): void {
    if (!this.controller) {
      return;
    }

    this.controller.deactivate();
    this.removeInstalledContextEntries();
    this.activeContextPart = null;
  }

  public render(): void {
    if (!this.view) {
      return;
    }
    this.view.render();
  }

  public destroy(): void {
    if (!this.initialized) {
      return;
    }

    this.deactivate();
    this.controller?.destroy();
    this.view?.destroy();

    this.controller = null;
    this.view = null;
    this.params = null;
    this.initialized = false;
  }

  public getController(): TController | null {
    return this.controller;
  }

  public getParams(): TParams | null {
    return this.params;
  }

  private applyTabMeta(meta: IActivityTabMeta | undefined): void {
    if (!meta) {
      return;
    }

    if (meta.label !== undefined) {
      this.hostElement.setAttribute("tab-label", meta.label);
    }

    if (meta.icon !== undefined) {
      this.hostElement.setAttribute("tab-icon", meta.icon);
    } else if (this.hostElement.hasAttribute("tab-icon")) {
      this.hostElement.removeAttribute("tab-icon");
    }

    this.toggleBooleanAttribute("closeable", meta.closeable ?? false);
    this.toggleBooleanAttribute("tab-right", meta.right ?? false);
  }

  private toggleBooleanAttribute(attributeName: string, enabled: boolean): void {
    if (enabled) {
      this.hostElement.setAttribute(attributeName, "");
      return;
    }
    if (this.hostElement.hasAttribute(attributeName)) {
      this.hostElement.removeAttribute(attributeName);
    }
  }

  private installControllerContextEntries(): void {
    if (!this.activeContextPart || !this.controller?.getContextEntries) {
      return;
    }

    const contextEntries = this.controller.getContextEntries();
    for (const entry of contextEntries) {
      this.installContextEntry(entry);
    }
  }

  private installContextEntry(entry: IContextEntrySpec): void {
    if (!this.activeContextPart) {
      return;
    }
    if (this.activeContextPart.hasEntry(entry.uri)) {
      return;
    }

    this.activeContextPart.addEntry(entry.uri, entry.feature, entry.parentUri);
    this.installedContextEntries.push(entry.uri);
  }

  private removeInstalledContextEntries(): void {
    if (!this.activeContextPart) {
      this.installedContextEntries = [];
      return;
    }

    for (const uri of this.installedContextEntries) {
      this.activeContextPart.removeEntry(uri);
    }
    this.installedContextEntries = [];
  }
}
