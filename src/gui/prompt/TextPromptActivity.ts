import { defineComponent } from "../core/BaseComponent";
import { ActivityType } from "../../service/ActivityService";
import { ActivityElementBase } from "../activity/runtime/ActivityElementBase";
import type { IActivityDefinition } from "../activity/runtime/types";
import type { ServiceLayer } from "../../service/ServiceLayer";
import { TEXT_PROMPT_TAG } from "./types";
import { TextPromptController, type ITextPromptParams } from "./TextPromptController";
import { TextPromptView } from "./TextPromptView";

const TEXT_PROMPT_DEFINITION: IActivityDefinition<
  ITextPromptParams,
  TextPromptView,
  TextPromptController
> = {
  activityType: ActivityType.MODAL,
  parseParams: (rawParams: string | null): ITextPromptParams => {
    if (!rawParams) return { promptId: "", title: "Prompt" };
    const parsed = JSON.parse(rawParams);
    return {
      promptId: parsed.promptId ?? "",
      title: parsed.title ?? "Prompt",
      defaultValue: parsed.defaultValue,
      placeholder: parsed.placeholder,
      confirmLabel: parsed.confirmLabel,
    };
  },
  createView: (): TextPromptView => {
    return new TextPromptView();
  },
  createController: (serviceLayer: ServiceLayer): TextPromptController => {
    return new TextPromptController(serviceLayer);
  },
};

export class TextPromptActivity extends ActivityElementBase<
  ITextPromptParams,
  TextPromptView,
  TextPromptController
> {
  constructor() {
    super(TEXT_PROMPT_DEFINITION);
  }
}

defineComponent(TEXT_PROMPT_TAG, TextPromptActivity);

declare global {
  interface HTMLElementTagNameMap {
    [TEXT_PROMPT_TAG]: TextPromptActivity;
  }
}
