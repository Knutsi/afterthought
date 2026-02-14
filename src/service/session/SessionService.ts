import {
  readTextFile,
  writeTextFile,
  mkdir,
  exists,
} from '@tauri-apps/plugin-fs';
import { appDataDir, join } from '@tauri-apps/api/path';
import type { ISessionState } from './types';

const SESSION_FILE = 'session.json';

export class SessionService {
  async saveOpenDatabases(paths: string[]): Promise<void> {
    const state: ISessionState = { openDatabases: paths };
    const dir = await appDataDir();
    await mkdir(dir, { recursive: true });
    const filePath = await join(dir, SESSION_FILE);
    await writeTextFile(filePath, JSON.stringify(state, null, 2));
  }

  async getOpenDatabases(): Promise<string[] | null> {
    const dir = await appDataDir();
    const filePath = await join(dir, SESSION_FILE);
    const fileExists = await exists(filePath);

    if (!fileExists) {
      return null;
    }

    const content = await readTextFile(filePath);
    const state = JSON.parse(content) as ISessionState;
    return state.openDatabases;
  }
}
