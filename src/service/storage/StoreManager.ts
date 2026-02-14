import type { IStorageProvider } from './IStorageProvider';
import { IStore, IObject, IStoreRegistry } from './types';

const STORE_SCHEMA_VERSION = 1;
const OBJECT_SCHEMA_VERSION = 1;

export class StoreManager {
  private storageProvider: IStorageProvider;

  constructor(storageProvider: IStorageProvider) {
    this.storageProvider = storageProvider;
  }

  private generateId(): string {
    return crypto.randomUUID();
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  // Store Registry Operations

  async getStoreRegistry(): Promise<IStoreRegistry> {
    const registry = await this.storageProvider.readJson<IStoreRegistry>('stores.json');
    return registry ?? { stores: [] };
  }

  private async saveStoreRegistry(registry: IStoreRegistry): Promise<void> {
    await this.storageProvider.writeJson('stores.json', registry);
  }

  // Store CRUD Operations

  async createStore(name: string): Promise<IStore> {
    const id = this.generateId();
    return this.createStoreWithId(id, name);
  }

  async createStoreWithId(id: string, name: string): Promise<IStore> {
    const now = this.getTimestamp();

    const store: IStore = {
      id,
      name,
      createdAt: now,
      modifiedAt: now,
      schemaVersion: STORE_SCHEMA_VERSION,
    };

    await this.storageProvider.ensureStoreDirectoryExists(id);
    await this.storageProvider.writeJson(`stores/${id}/meta.json`, store);

    const registry = await this.getStoreRegistry();
    if (!registry.stores.includes(id)) {
      registry.stores.push(id);
      await this.saveStoreRegistry(registry);
    }

    return store;
  }

  async getStore(id: string): Promise<IStore | null> {
    return this.storageProvider.readJson<IStore>(`stores/${id}/meta.json`);
  }

  async getAllStores(): Promise<IStore[]> {
    const registry = await this.getStoreRegistry();
    const stores: IStore[] = [];

    for (const storeId of registry.stores) {
      const store = await this.getStore(storeId);
      if (store) {
        stores.push(store);
      }
    }

    return stores;
  }

  async updateStore(id: string, name: string): Promise<IStore | null> {
    const store = await this.getStore(id);
    if (!store) return null;

    store.name = name;
    store.modifiedAt = this.getTimestamp();
    if (store.schemaVersion === undefined) {
      store.schemaVersion = STORE_SCHEMA_VERSION;
    }

    await this.storageProvider.writeJson(`stores/${id}/meta.json`, store);
    return store;
  }

  async deleteStore(id: string): Promise<boolean> {
    const store = await this.getStore(id);
    if (!store) return false;

    await this.storageProvider.deleteDirectory(`stores/${id}`);

    const registry = await this.getStoreRegistry();
    registry.stores = registry.stores.filter(s => s !== id);
    await this.saveStoreRegistry(registry);

    return true;
  }

  // Object CRUD Operations

  async createObjectWithId(storeId: string, id: string, type: string, data: any): Promise<IObject> {
    const store = await this.getStore(storeId);
    if (!store) {
      throw new Error(`Store ${storeId} not found`);
    }

    const now = this.getTimestamp();

    const object: IObject = {
      id,
      type,
      data,
      storeId,
      createdAt: now,
      modifiedAt: now,
      schemaVersion: OBJECT_SCHEMA_VERSION,
    };

    await this.storageProvider.writeJson(`stores/${storeId}/objects/${id}.json`, object);

    // Update store modified time
    store.modifiedAt = now;
    await this.storageProvider.writeJson(`stores/${storeId}/meta.json`, store);

    return object;
  }

  async getObject(storeId: string, objectId: string): Promise<IObject | null> {
    return this.storageProvider.readJson<IObject>(`stores/${storeId}/objects/${objectId}.json`);
  }

  async getObjectsByStore(storeId: string): Promise<IObject[]> {
    const store = await this.getStore(storeId);
    if (!store) return [];

    const objects: IObject[] = [];
    const objectsPath = `stores/${storeId}/objects`;
    const dirExists = await this.storageProvider.directoryExists(objectsPath);

    if (!dirExists) return [];

    const filenames = await this.storageProvider.listDirectory(objectsPath);

    for (const filename of filenames) {
      if (filename.endsWith('.json')) {
        const objectId = filename.replace('.json', '');
        const object = await this.getObject(storeId, objectId);
        if (object) {
          objects.push(object);
        }
      }
    }

    return objects;
  }

  async updateObject(storeId: string, objectId: string, data: any): Promise<IObject | null> {
    const object = await this.getObject(storeId, objectId);
    if (!object) return null;

    const now = this.getTimestamp();
    object.data = data;
    object.modifiedAt = now;
    if (object.schemaVersion === undefined) {
      object.schemaVersion = OBJECT_SCHEMA_VERSION;
    }

    await this.storageProvider.writeJson(`stores/${storeId}/objects/${objectId}.json`, object);

    // Update store modified time
    const store = await this.getStore(storeId);
    if (store) {
      store.modifiedAt = now;
      await this.storageProvider.writeJson(`stores/${storeId}/meta.json`, store);
    }

    return object;
  }

  async deleteObject(storeId: string, objectId: string): Promise<boolean> {
    const object = await this.getObject(storeId, objectId);
    if (!object) return false;

    await this.storageProvider.deleteFile(`stores/${storeId}/objects/${objectId}.json`);

    // Update store modified time
    const store = await this.getStore(storeId);
    if (store) {
      store.modifiedAt = this.getTimestamp();
      await this.storageProvider.writeJson(`stores/${storeId}/meta.json`, store);
    }

    return true;
  }
}
