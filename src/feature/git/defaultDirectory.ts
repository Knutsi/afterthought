import { documentDir, homeDir } from "@tauri-apps/api/path";

export async function getDefaultParentDir(): Promise<string> {
  try {
    return await documentDir();
  } catch {
    return await homeDir();
  }
}
