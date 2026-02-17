import { invoke } from '@tauri-apps/api/core';
import { appDataDir, join } from '@tauri-apps/api/path';

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
  const dir = await appDataDir();
  return join(dir, filename);
}

export async function ensureAppDataDir(): Promise<void> {
  const dir = await appDataDir();
  await mkdir(dir);
}
