import {
  readTextFile,
  writeTextFile,
  readDir,
  mkdir,
  remove,
  exists,
} from '@tauri-apps/plugin-fs';
import type { IStorageProvider } from './IStorageProvider';

export class GitStorageProvider implements IStorageProvider {
  private initialized = false;
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.ensureDirectoryExists('stores');

    this.initialized = true;
  }

  async ensureDirectoryExists(path: string): Promise<void> {
    const fullPath = `${this.basePath}/${path}`;
    const dirExists = await exists(fullPath);
    if (!dirExists) {
      await mkdir(fullPath, { recursive: true });
    }
  }

  async fileExists(path: string): Promise<boolean> {
    return exists(`${this.basePath}/${path}`);
  }

  async directoryExists(path: string): Promise<boolean> {
    return exists(`${this.basePath}/${path}`);
  }

  async readJson<T>(path: string): Promise<T | null> {
    const fullPath = `${this.basePath}/${path}`;
    const fileExists = await exists(fullPath);
    if (!fileExists) {
      return null;
    }

    const content = await readTextFile(fullPath);
    return JSON.parse(content) as T;
  }

  async writeJson<T>(path: string, data: T): Promise<void> {
    const fullPath = `${this.basePath}/${path}`;
    const content = JSON.stringify(data, null, 2);
    await writeTextFile(fullPath, content);
  }

  async deleteFile(path: string): Promise<void> {
    const fullPath = `${this.basePath}/${path}`;
    const fileExists = await exists(fullPath);
    if (fileExists) {
      await remove(fullPath);
    }
  }

  async deleteDirectory(path: string): Promise<void> {
    const fullPath = `${this.basePath}/${path}`;
    const dirExists = await exists(fullPath);
    if (dirExists) {
      await remove(fullPath, { recursive: true });
    }
  }

  async ensureStoreDirectoryExists(storeId: string): Promise<void> {
    await this.ensureDirectoryExists(`stores/${storeId}`);
    await this.ensureDirectoryExists(`stores/${storeId}/objects`);
  }

  async listDirectory(path: string): Promise<string[]> {
    const fullPath = `${this.basePath}/${path}`;
    const dirExists = await exists(fullPath);
    if (!dirExists) return [];

    const entries = await readDir(fullPath);
    return entries
      .map(entry => entry.name)
      .filter((name): name is string => name !== undefined);
  }
}
