export abstract class BaseComponent extends HTMLElement {
  protected _initialized: boolean = false;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes(): string[] {
    return [];
  }

  protected onInit(): void {
    // Override in subclass
  }

  protected onDestroy(): void {
    // Override in subclass
  }

  protected onAttributeChange(_name: string, _oldValue: string | null, _newValue: string | null): void {
    if (this._initialized) {
      this.render();
    }
  }

  protected abstract render(): void;

  // Standard Web Component lifecycle (final - don't override these)
  connectedCallback(): void {
    if (this._initialized) return;
    this.render();
    this.onInit();
    this._initialized = true;
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue) return;
    this.onAttributeChange(name, oldValue, newValue);
  }

  disconnectedCallback(): void {
    this.onDestroy();
  }
}

export function defineComponent<T extends CustomElementConstructor>(
  tagName: string,
  componentClass: T,
  logMessage?: string | false
): void {
  customElements.define(tagName, componentClass as CustomElementConstructor);
  if (logMessage !== false) {
    console.log(logMessage || `Feature added: ${componentClass.name}`);
  }
}

export type ComponentInstance<T extends typeof BaseComponent> = InstanceType<T>;
