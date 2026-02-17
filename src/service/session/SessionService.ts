import { readTextFile, writeTextFile, exists, ensureAppDataDir, appDataPath } from '../fs';
import type { ISessionState, IWindowGeometry } from './types';

const SESSION_FILE = 'session.json';

export class SessionService {
  async saveOpenDatabases(paths: string[]): Promise<void> {
    const state: ISessionState = { openDatabases: paths };
    await ensureAppDataDir();
    const filePath = await appDataPath(SESSION_FILE);
    await writeTextFile(filePath, JSON.stringify(state, null, 2));
  }

  async getSessionState(): Promise<ISessionState | null> {
    const filePath = await appDataPath(SESSION_FILE);
    const sessionExists = await exists(filePath);

    if (!sessionExists) {
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
