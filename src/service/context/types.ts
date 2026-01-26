// URI System
export type Uri = string; // Format: "scheme://id" (e.g., "board://abc123")

export const URI_SCHEMES = {
  BOARD: "board",
  TASK: "task",
  SETTINGS: "settings",
} as const;

export type UriScheme = (typeof URI_SCHEMES)[keyof typeof URI_SCHEMES];

// URI Utility Functions
export function createUri(scheme: string, id: string): Uri {
  return `${scheme}://${id}`;
}

export function parseUri(uri: Uri): { scheme: string; id: string } | null {
  const match = uri.match(/^([^:]+):\/\/(.+)$/);
  if (!match) return null;
  return { scheme: match[1], id: match[2] };
}

export function getUriScheme(uri: Uri): string | null {
  const parsed = parseUri(uri);
  return parsed?.scheme ?? null;
}

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
