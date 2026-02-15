import type { IContextPart } from "../../service/context/types";
import type { IActivityController } from "../activity/runtime/types";
import type { ServiceLayer } from "../../service/ServiceLayer";
import { TextPromptView } from "./TextPromptView";
import { resolveTextPrompt } from "./showTextPrompt";

export interface ITextPromptParams {
  promptId: string;
  title: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
}

export class TextPromptController
  implements IActivityController<ITextPromptParams, TextPromptView>
{
  private serviceLayer: ServiceLayer;
  private view: TextPromptView | null = null;
  private activityId: string = "";
  private promptId: string = "";
  private value: string = "";
  private title: string = "Prompt";
  private placeholder: string = "";
  private confirmLabel: string = "OK";

  constructor(serviceLayer: ServiceLayer) {
    this.serviceLayer = serviceLayer;
  }

  public attachView(view: TextPromptView): void {
    this.view = view;
    view.setCallbacks({
      onConfirm: () => this.confirm(),
      onCancel: () => this.cancel(),
      onValueChange: (val) => {
        this.value = val;
      },
    });
  }

  public initialize(params: ITextPromptParams, activityId: string): void {
    this.activityId = activityId;
    this.promptId = params.promptId;
    this.title = params.title;
    this.value = params.defaultValue ?? "";
    this.placeholder = params.placeholder ?? "";
    this.confirmLabel = params.confirmLabel ?? "OK";
    this.updateView();
  }

  public activate(_contextPart: IContextPart): void {}
  public deactivate(): void {}

  public destroy(): void {
    this.view = null;
  }

  private confirm(): void {
    resolveTextPrompt(this.promptId, this.value);
    this.serviceLayer.activityService.closeActivity(this.activityId);
  }

  private cancel(): void {
    resolveTextPrompt(this.promptId, null);
    this.serviceLayer.activityService.closeActivity(this.activityId);
  }

  private updateView(): void {
    this.view?.update({
      title: this.title,
      value: this.value,
      placeholder: this.placeholder,
      confirmLabel: this.confirmLabel,
    });
  }
}
