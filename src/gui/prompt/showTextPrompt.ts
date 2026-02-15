import type { ServiceLayer } from "../../service/ServiceLayer";
import type { TextPromptOptions } from "./types";
import { TEXT_PROMPT_TAG } from "./types";

const pendingPrompts = new Map<string, (value: string | null) => void>();

export function showTextPrompt(serviceLayer: ServiceLayer, options: TextPromptOptions): Promise<string | null> {
  const promptId = crypto.randomUUID();

  return new Promise<string | null>((resolve) => {
    pendingPrompts.set(promptId, resolve);
    serviceLayer.activityService.startActivity(TEXT_PROMPT_TAG, { promptId, ...options });
  });
}

export function resolveTextPrompt(promptId: string, value: string | null): void {
  const resolve = pendingPrompts.get(promptId);
  if (resolve) {
    pendingPrompts.delete(promptId);
    resolve(value);
  }
}
