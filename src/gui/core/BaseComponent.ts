/**
 * Base class for custom Web Components that handles common boilerplate
 * - Shadow DOM initialization
 * - _initialized flag pattern
 * - Attribute change detection with automatic re-render
 * - Lifecycle hooks with proper guards
 */
export abstract class BaseComponent extends HTMLElement {
  protected _initialized: boolean = false;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  /**
   * Override this to specify which attributes trigger re-renders
   * Default: empty array (no observed attributes)
   */
  static get observedAttributes(): string[] {
    return [];
  }

  /**
   * Called once when component is first connected to DOM
   * Override this instead of connectedCallback
   */
  protected onInit(): void {
    // Override in subclass
  }

  /**
   * Called when component is removed from DOM
   * Override this to clean up resources
   */
  protected onDestroy(): void {
    // Override in subclass
  }

  /**
   * Called when an observed attribute changes
   * Override this to handle specific attribute changes
   * Default behavior: re-render if initialized
   */
  protected onAttributeChange(_name: string, _oldValue: string | null, _newValue: string | null): void {
    if (this._initialized) {
      this.render();
    }
  }

  /**
   * Render the component's Shadow DOM
   * Override this with your component's template
   */
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

/**
 * Helper to register a component with global type augmentation
 * Eliminates the need for setup function + declare global boilerplate
 */
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

/**
 * Type helper for component registration
 * Usage in component file: export type MenuItemElement = InstanceType<typeof MenuItem>;
 * Then in global augmentation: 'menu-item': MenuItemElement;
 */
export type ComponentInstance<T extends typeof BaseComponent> = InstanceType<T>;
