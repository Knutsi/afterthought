import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { invoke } from "@tauri-apps/api/core";
import type { IDatabaseInfo } from "../../service/database/types";
import type { IWindowGeometry } from "../../service/session/types";

export async function openDatabaseWindow(
  info: IDatabaseInfo,
  geometry?: IWindowGeometry,
): Promise<void> {
  const found = await invoke<boolean>('find_window_for_database', { path: info.path });
  if (found) return;

  const options: ConstructorParameters<typeof WebviewWindow>[1] = {
    url: `index.html?database=${encodeURIComponent(info.path)}`,
    title: info.name,
    width: geometry?.width ?? 800,
    height: geometry?.height ?? 600,
  };

  if (geometry) {
    options.x = geometry.x;
    options.y = geometry.y;
  }

  new WebviewWindow(`db-${Date.now()}`, options);
}
