import {
  readTextFile,
  writeTextFile,
  mkdir,
  remove,
  exists,
  BaseDirectory,
} from '@tauri-apps/plugin-fs';

const APP_DIR = 'afterthought';

export class StorageProvider {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.ensureDirectoryExists(APP_DIR);
    await this.ensureDirectoryExists(`${APP_DIR}/stores`);

    this.initialized = true;
  }

  async ensureDirectoryExists(path: string): Promise<void> {
    const dirExists = await exists(path, { baseDir: BaseDirectory.Home });
    if (!dirExists) {
      await mkdir(path, { baseDir: BaseDirectory.Home, recursive: true });
    }
  }

  async fileExists(path: string): Promise<boolean> {
    return exists(`${APP_DIR}/${path}`, { baseDir: BaseDirectory.Home });
  }

  async directoryExists(path: string): Promise<boolean> {
    return exists(`${APP_DIR}/${path}`, { baseDir: BaseDirectory.Home });
  }

  async readJson<T>(path: string): Promise<T | null> {
    const fullPath = `${APP_DIR}/${path}`;
    const fileExists = await exists(fullPath, { baseDir: BaseDirectory.Home });
    if (!fileExists) {
      return null;
    }

    const content = await readTextFile(fullPath, { baseDir: BaseDirectory.Home });
    return JSON.parse(content) as T;
  }

  async writeJson<T>(path: string, data: T): Promise<void> {
    const fullPath = `${APP_DIR}/${path}`;
    const content = JSON.stringify(data, null, 2);
    await writeTextFile(fullPath, content, { baseDir: BaseDirectory.Home });
  }

  async deleteFile(path: string): Promise<void> {
    const fullPath = `${APP_DIR}/${path}`;
    const fileExists = await exists(fullPath, { baseDir: BaseDirectory.Home });
    if (fileExists) {
      await remove(fullPath, { baseDir: BaseDirectory.Home });
    }
  }

  async deleteDirectory(path: string): Promise<void> {
    const fullPath = `${APP_DIR}/${path}`;
    const dirExists = await exists(fullPath, { baseDir: BaseDirectory.Home });
    if (dirExists) {
      await remove(fullPath, { baseDir: BaseDirectory.Home, recursive: true });
    }
  }

  async ensureStoreDirectoryExists(storeId: string): Promise<void> {
    await this.ensureDirectoryExists(`${APP_DIR}/stores/${storeId}`);
    await this.ensureDirectoryExists(`${APP_DIR}/stores/${storeId}/objects`);
  }
}
