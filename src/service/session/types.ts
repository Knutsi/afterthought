export interface IWindowGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ISessionState {
  openDatabases: string[];
  windowGeometry?: Record<string, IWindowGeometry>;
}
