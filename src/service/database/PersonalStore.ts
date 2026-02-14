import type { IStorageProvider } from '../storage/IStorageProvider';

const UI_STATE_PATH = 'personal/ui-state.json';
const PREFERENCES_PATH = 'personal/preferences.json';

export class PersonalStore {
  private storageProvider: IStorageProvider;

  constructor(storageProvider: IStorageProvider) {
    this.storageProvider = storageProvider;
  }

  async initialize(): Promise<void> {
    await this.storageProvider.ensureDirectoryExists('personal');
  }

  async getUiState<T>(): Promise<T | null> {
    return this.storageProvider.readJson<T>(UI_STATE_PATH);
  }

  async setUiState<T>(state: T): Promise<void> {
    await this.storageProvider.writeJson(UI_STATE_PATH, state);
  }

  async getPreferences<T>(): Promise<T | null> {
    return this.storageProvider.readJson<T>(PREFERENCES_PATH);
  }

  async setPreferences<T>(preferences: T): Promise<void> {
    await this.storageProvider.writeJson(PREFERENCES_PATH, preferences);
  }
}
