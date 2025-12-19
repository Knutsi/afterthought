export const ElementName = "app-root";

// 1. Define the class
export class App extends HTMLElement {
  // Private state with type annotation
  private _initialized: boolean = false;

  constructor() {
    super();
    // Attach Shadow DOM
    this.attachShadow({ mode: 'open' });
  }

  // 2. Define observed attributes
  static get observedAttributes(): string[] {
    return ['title', 'theme'];
  }

  // 3. Lifecycle: Connected
  connectedCallback(): void {
    if (this._initialized) return;

    this.render();
    this.addEventListeners();
    this._initialized = true;
  }

  // 4. Lifecycle: Attribute Changed
  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null
  ): void {
    if (oldValue === newValue) return;

    if (name === 'title') {
      this.render(); // Re-render on title change
    }
  }

  // 5. Lifecycle: Disconnected
  disconnectedCallback(): void {
    this.removeEventListeners();
  }

  // --- Methods ---

  private render(): void {
    // We use the non-null assertion (!) because we know we attached shadowRoot in the constructor
    // In strict mode, you might prefer: if (!this.shadowRoot) return;
    this.shadowRoot!.innerHTML = `
      <style>
      </style>
      <h1>APPLICATION</h1>
      <slot></slot>
    `;
  }

  private addEventListeners(): void {
    const h1 = this.shadowRoot?.querySelector('h1');
    if (h1) {
      h1.addEventListener('click', this._handleClick);
    }
  }

  private removeEventListeners(): void {
    const h1 = this.shadowRoot?.querySelector('h1');
    if (h1) {
      h1.removeEventListener('click', this._handleClick);
    }
  }

  // Use an arrow function to automatically bind 'this'
  private _handleClick = (e: Event): void => {
    console.log('Clicked!', e);
  }
}





// 7. TypeScript Specific: Global Type Augmentation
// This allows TypeScript to recognize document.createElement('my-component')
declare global {
  interface HTMLElementTagNameMap {
    ElementName: App;
  }
}