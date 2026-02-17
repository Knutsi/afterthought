import { invoke } from '@tauri-apps/api/core';
import { homeDir, join } from '@tauri-apps/api/path';

const APP_DIR_NAME = '.afterthought';

export async function exists(path: string): Promise<boolean> {
  return invoke<boolean>('fs_exists', { path });
}

export async function readTextFile(path: string): Promise<string> {
  return invoke<string>('fs_read_text_file', { path });
}

export async function writeTextFile(path: string, contents: string): Promise<void> {
  await invoke('fs_write_text_file', { path, contents });
}

export async function mkdir(path: string): Promise<void> {
  await invoke('fs_mkdir', { path });
}

export async function readDir(path: string): Promise<{ name: string }[]> {
  return invoke<{ name: string }[]>('fs_read_dir', { path });
}

export async function removeFile(path: string): Promise<void> {
  await invoke('fs_remove_file', { path });
}

export async function removeDir(path: string): Promise<void> {
  await invoke('fs_remove_dir', { path });
}

export async function appDataPath(filename: string): Promise<string> {
  const home = await homeDir();
  const dir = await join(home, APP_DIR_NAME);
  return join(dir, filename);
}

export async function ensureAppDataDir(): Promise<void> {
  const home = await homeDir();
  const dir = await join(home, APP_DIR_NAME);
  await mkdir(dir);
}
