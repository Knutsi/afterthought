export interface IStore {
  id: string;
  name: string;
  createdAt: string;
  modifiedAt: string;
  schemaVersion?: number;
}

export interface IObject {
  id: string;
  type: string;
  data: any;
  storeId: string;
  createdAt: string;
  modifiedAt: string;
  schemaVersion?: number;
}

export type ObjectEventType = 'created' | 'updated' | 'deleted' | 'reloaded';

export interface IObjectChangeEvent {
  type: ObjectEventType;
  object: IObject;
  storeId: string;
}

export type StoreEventType = 'created' | 'updated' | 'deleted';

export interface IStoreChangeEvent {
  type: StoreEventType;
  store: IStore;
}

export interface ISubscription {
  unsubscribe(): void;
}

export type ObjectCallback = (event: IObjectChangeEvent) => void;
export type StoreCallback = (event: IStoreChangeEvent) => void;

export interface IStoreRegistry {
  stores: string[];
}
