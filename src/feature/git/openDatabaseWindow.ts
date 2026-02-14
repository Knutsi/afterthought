import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import type { IDatabaseInfo } from "../../service/database/types";

export function openDatabaseWindow(info: IDatabaseInfo): void {
  new WebviewWindow(`db-${Date.now()}`, {
    url: `index.html?database=${encodeURIComponent(info.path)}`,
    title: info.name,
    width: 800,
    height: 600,
  });
}
