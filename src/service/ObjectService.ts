import { ServiceLayer } from "./ServiceLayer";
import { StorageProvider } from "./storage/StorageProvider";
import { StoreManager } from "./storage/StoreManager";
import {
  IStore,
  IObject,
  ISubscription,
  IObjectChangeEvent,
  IStoreChangeEvent,
  ObjectCallback,
  StoreCallback,
} from "./storage/types";

export type { IStore, IObject, ISubscription, IObjectChangeEvent, IStoreChangeEvent };

export class ObjectService {
  private storageProvider: StorageProvider;
  private storeManager: StoreManager;
  private storeSubscribers: Map<string, Set<ObjectCallback>> = new Map();
  private objectSubscribers: Map<string, Set<ObjectCallback>> = new Map();
  private globalStoreSubscribers: Set<StoreCallback> = new Set();
  private initialized = false;

  constructor(_: ServiceLayer) {
    this.storageProvider = new StorageProvider();
    this.storeManager = new StoreManager(this.storageProvider);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    await this.storageProvider.initialize();
    this.initialized = true;
  }

  // Store API

  async createStore(name: string): Promise<IStore> {
    const store = await this.storeManager.createStore(name);
    this.notifyStoreSubscribers({ type: 'created', store });
    return store;
  }

  async getStore(id: string): Promise<IStore | null> {
    return this.storeManager.getStore(id);
  }

  async getAllStores(): Promise<IStore[]> {
    return this.storeManager.getAllStores();
  }

  async updateStore(id: string, name: string): Promise<IStore | null> {
    const store = await this.storeManager.updateStore(id, name);
    if (store) {
      this.notifyStoreSubscribers({ type: 'updated', store });
    }
    return store;
  }

  async deleteStore(id: string): Promise<boolean> {
    const store = await this.storeManager.getStore(id);
    if (!store) return false;

    const deleted = await this.storeManager.deleteStore(id);
    if (deleted) {
      this.notifyStoreSubscribers({ type: 'deleted', store });
      this.storeSubscribers.delete(id);
    }
    return deleted;
  }

  // Object API

  async createObject(storeId: string, type: string, data: any): Promise<IObject> {
    const object = await this.storeManager.createObject(storeId, type, data);
    this.notifyObjectSubscribers(storeId, { type: 'created', object, storeId });
    return object;
  }

  async getObject(storeId: string, objectId: string): Promise<IObject | null> {
    return this.storeManager.getObject(storeId, objectId);
  }

  async getObjectsByStore(storeId: string): Promise<IObject[]> {
    return this.storeManager.getObjectsByStore(storeId);
  }

  async updateObject(storeId: string, objectId: string, data: any): Promise<IObject | null> {
    const object = await this.storeManager.updateObject(storeId, objectId, data);
    if (object) {
      this.notifyObjectSubscribers(storeId, { type: 'updated', object, storeId });
      this.notifySpecificObjectSubscribers(storeId, objectId, { type: 'updated', object, storeId });
    }
    return object;
  }

  async deleteObject(storeId: string, objectId: string): Promise<boolean> {
    const object = await this.storeManager.getObject(storeId, objectId);
    if (!object) return false;

    const deleted = await this.storeManager.deleteObject(storeId, objectId);
    if (deleted) {
      this.notifyObjectSubscribers(storeId, { type: 'deleted', object, storeId });
      this.notifySpecificObjectSubscribers(storeId, objectId, { type: 'deleted', object, storeId });
      this.objectSubscribers.delete(`${storeId}:${objectId}`);
    }
    return deleted;
  }

  // Subscription API

  subscribeToStore(storeId: string, callback: ObjectCallback): ISubscription {
    if (!this.storeSubscribers.has(storeId)) {
      this.storeSubscribers.set(storeId, new Set());
    }
    this.storeSubscribers.get(storeId)!.add(callback);

    return {
      unsubscribe: () => {
        const subscribers = this.storeSubscribers.get(storeId);
        if (subscribers) {
          subscribers.delete(callback);
          if (subscribers.size === 0) {
            this.storeSubscribers.delete(storeId);
          }
        }
      },
    };
  }

  subscribeToObject(storeId: string, objectId: string, callback: ObjectCallback): ISubscription {
    const key = `${storeId}:${objectId}`;
    if (!this.objectSubscribers.has(key)) {
      this.objectSubscribers.set(key, new Set());
    }
    this.objectSubscribers.get(key)!.add(callback);

    return {
      unsubscribe: () => {
        const subscribers = this.objectSubscribers.get(key);
        if (subscribers) {
          subscribers.delete(callback);
          if (subscribers.size === 0) {
            this.objectSubscribers.delete(key);
          }
        }
      },
    };
  }

  subscribeToStoreChanges(callback: StoreCallback): ISubscription {
    this.globalStoreSubscribers.add(callback);

    return {
      unsubscribe: () => {
        this.globalStoreSubscribers.delete(callback);
      },
    };
  }

  // Private notification methods

  private notifyObjectSubscribers(storeId: string, event: IObjectChangeEvent): void {
    const subscribers = this.storeSubscribers.get(storeId);
    if (subscribers) {
      for (const callback of subscribers) {
        callback(event);
      }
    }
  }

  private notifySpecificObjectSubscribers(storeId: string, objectId: string, event: IObjectChangeEvent): void {
    const key = `${storeId}:${objectId}`;
    const subscribers = this.objectSubscribers.get(key);
    if (subscribers) {
      for (const callback of subscribers) {
        callback(event);
      }
    }
  }

  private notifyStoreSubscribers(event: IStoreChangeEvent): void {
    for (const callback of this.globalStoreSubscribers) {
      callback(event);
    }
  }
}
