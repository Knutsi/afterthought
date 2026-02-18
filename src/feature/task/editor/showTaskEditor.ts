import type { ServiceLayer } from "../../../service/ServiceLayer";
import { TASK_EDITOR_TAG } from "./types";

const PENDING_EDITORS = new Map<string, (saved: boolean) => void>();

export function showTaskEditor(serviceLayer: ServiceLayer, taskUri: string): Promise<boolean> {
  const editorId = crypto.randomUUID();

  return new Promise<boolean>((resolve) => {
    PENDING_EDITORS.set(editorId, resolve);
    serviceLayer.activityService.startActivity(TASK_EDITOR_TAG, { taskUri, editorId });
  });
}

export function resolveTaskEditor(editorId: string, saved: boolean): void {
  const resolve = PENDING_EDITORS.get(editorId);
  if (resolve) {
    PENDING_EDITORS.delete(editorId);
    resolve(saved);
  }
}
