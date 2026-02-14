import {
  readTextFile,
  writeTextFile,
  mkdir,
  exists,
} from '@tauri-apps/plugin-fs';
import { documentDir, appDataDir, join } from '@tauri-apps/api/path';
import { invoke } from '@tauri-apps/api/core';
import type { IDatabaseInfo } from './types';

const DATABASE_VERSION = 1;
const RECENT_DATABASES_FILE = 'recent-databases.json';

interface IRecentDatabases {
  databases: IDatabaseInfo[];
  lastOpened: string | null;
}

export class DatabaseService {
  async createDatabase(parentDir: string, name: string): Promise<IDatabaseInfo> {
    const dbPath = await invoke<string>('create_database', {
      parentDir,
      name,
      version: DATABASE_VERSION,
    });

    return { name, path: dbPath };
  }

  async openDatabase(path: string): Promise<IDatabaseInfo> {
    const valid = await this.isValidDatabase(path);
    if (!valid) {
      throw new Error(`Not a valid database: ${path}`);
    }

    const name = path.split('/').pop()!;
    return { name, path };
  }

  async isValidDatabase(path: string): Promise<boolean> {
    const name = path.split('/').pop()!;
    const metaPath = await join(path, `${name}.afdb`);
    return exists(metaPath);
  }

  async getDefaultDatabasePath(): Promise<string> {
    const docDir = await documentDir();
    return join(docDir, 'Afterthought');
  }

  async ensureDefaultDatabase(): Promise<IDatabaseInfo> {
    const defaultPath = await this.getDefaultDatabasePath();
    const defaultExists = await exists(defaultPath);

    if (defaultExists) {
      const valid = await this.isValidDatabase(defaultPath);
      if (valid) {
        return { name: 'Afterthought', path: defaultPath };
      }
    }

    const docDir = await documentDir();
    return this.createDatabase(docDir, 'Afterthought');
  }

  async getRecentDatabases(): Promise<IDatabaseInfo[]> {
    const data = await this.readRecentData();
    return data.databases;
  }

  async addRecentDatabase(info: IDatabaseInfo): Promise<void> {
    const data = await this.readRecentData();
    data.databases = data.databases.filter(db => db.path !== info.path);
    data.databases.unshift(info);
    data.lastOpened = info.path;
    await this.writeRecentData(data);
  }

  async getLastOpenedDatabase(): Promise<string | null> {
    const data = await this.readRecentData();
    if (!data.lastOpened) return null;

    const valid = await this.isValidDatabase(data.lastOpened);
    return valid ? data.lastOpened : null;
  }

  private async readRecentData(): Promise<IRecentDatabases> {
    const dir = await appDataDir();
    const filePath = await join(dir, RECENT_DATABASES_FILE);
    const fileExists = await exists(filePath);

    if (!fileExists) {
      return { databases: [], lastOpened: null };
    }

    const content = await readTextFile(filePath);
    return JSON.parse(content) as IRecentDatabases;
  }

  private async writeRecentData(data: IRecentDatabases): Promise<void> {
    const dir = await appDataDir();
    await mkdir(dir, { recursive: true });
    const filePath = await join(dir, RECENT_DATABASES_FILE);
    await writeTextFile(filePath, JSON.stringify(data, null, 2));
  }
}
