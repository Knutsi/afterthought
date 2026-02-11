export interface IViewModel {
  initialize(): void | Promise<void>;
  destroy(): void;
}
