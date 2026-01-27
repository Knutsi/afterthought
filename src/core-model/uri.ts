export type Uri = string; // Format: "scheme://id" (e.g., "board://abc123")

export const URI_SCHEMES = {
  BOARD: "board",
  TASK: "task",
  SETTINGS: "settings",
} as const;

export type UriScheme = (typeof URI_SCHEMES)[keyof typeof URI_SCHEMES];

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
