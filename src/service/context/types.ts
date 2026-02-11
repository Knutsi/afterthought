import type { Uri } from "../../core-model/uri";

// Context Entry
export interface IContextEntry {
  readonly uri: Uri;
  readonly parentUri: Uri | null;
  readonly feature: string; // Who added it (e.g., "board-service")
}

export class ContextEntry implements IContextEntry {
  readonly uri: Uri;
  readonly parentUri: Uri | null;
  readonly feature: string;

  constructor(uri: Uri, feature: string, parentUri: Uri | null = null) {
    this.uri = uri;
    this.feature = feature;
    this.parentUri = parentUri;
  }
}

// Context Interface
export interface IContext {
  readonly entries: ReadonlyMap<Uri, IContextEntry>;

  // Query methods
  hasScheme(scheme: string): boolean;
  getEntriesByScheme(scheme: string): IContextEntry[];
  hasEntry(uri: Uri): boolean;
  getEntry(uri: Uri): IContextEntry | undefined;
  getChildren(parentUri: Uri): IContextEntry[];
}

export interface IContextPart {
  readonly entries: ReadonlyMap<Uri, IContextEntry>;
  addEntry(uri: Uri, feature: string, parentUri?: Uri): IContextEntry;
  removeEntry(uri: Uri): boolean;
  removeEntriesByFeature(feature: string): void;
  hasEntry(uri: Uri): boolean;
  getEntry(uri: Uri): IContextEntry | undefined;
  getEntriesByScheme(scheme: string): IContextEntry[];
  getChildren(parentUri: Uri): IContextEntry[];
}
