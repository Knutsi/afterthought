import {
  readTextFile,
  writeTextFile,
  mkdir,
  exists,
} from '@tauri-apps/plugin-fs';
import { appDataDir, join } from '@tauri-apps/api/path';
import type { ISessionState, IWindowGeometry } from './types';

const SESSION_FILE = 'session.json';

export class SessionService {
  async saveOpenDatabases(paths: string[]): Promise<void> {
    const state: ISessionState = { openDatabases: paths };
    const dir = await appDataDir();
    await mkdir(dir, { recursive: true });
    const filePath = await join(dir, SESSION_FILE);
    await writeTextFile(filePath, JSON.stringify(state, null, 2));
  }

  async getSessionState(): Promise<ISessionState | null> {
    const dir = await appDataDir();
    const filePath = await join(dir, SESSION_FILE);
    const fileExists = await exists(filePath);

    if (!fileExists) {
      return null;
    }

    const content = await readTextFile(filePath);
    return JSON.parse(content) as ISessionState;
  }

  async getOpenDatabases(): Promise<string[] | null> {
    const state = await this.getSessionState();
    return state?.openDatabases ?? null;
  }

  async getWindowGeometry(): Promise<Record<string, IWindowGeometry> | null> {
    const state = await this.getSessionState();
    return state?.windowGeometry ?? null;
  }
}
