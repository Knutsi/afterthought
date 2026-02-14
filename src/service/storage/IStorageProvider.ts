export interface IStorageProvider {
  initialize(): Promise<void>;
  readJson<T>(path: string): Promise<T | null>;
  writeJson<T>(path: string, data: T): Promise<void>;
  fileExists(path: string): Promise<boolean>;
  directoryExists(path: string): Promise<boolean>;
  deleteFile(path: string): Promise<void>;
  deleteDirectory(path: string): Promise<void>;
  ensureDirectoryExists(path: string): Promise<void>;
  ensureStoreDirectoryExists(storeId: string): Promise<void>;
  listDirectory(path: string): Promise<string[]>;
}
