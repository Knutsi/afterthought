// 1. Define the class
export class TabPage extends HTMLElement {
  // Private state with type annotation
  private _initialized: boolean = false;

  constructor() {
    super();
    // Attach Shadow DOM
    this.attachShadow({ mode: 'open' });
  }

  // 2. Define observed attributes
  static get observedAttributes(): string[] {
    return ['label'];
  }

  // 3. Lifecycle: Connected
  connectedCallback(): void {
    if (this._initialized) return;

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7c63dc10-2a92-4fcd-8166-8cbdf231ab2d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TabPage.ts:18',message:'TabPage connectedCallback entry',data:{label:this.getAttribute('label'),childrenCount:this.children.length,hasShadowRoot:!!this.shadowRoot},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    this.render();
    this._initialized = true;

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7c63dc10-2a92-4fcd-8166-8cbdf231ab2d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TabPage.ts:24',message:'TabPage connectedCallback after render',data:{label:this.getAttribute('label'),hasSlot:!!this.shadowRoot?.querySelector('slot'),slotAssignedNodes:this.shadowRoot?.querySelector('slot')?.assignedNodes().length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
  }

  // 4. Lifecycle: Attribute Changed
  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null
  ): void {
    if (oldValue === newValue) return;

    if (name === 'label') {
      // Notify parent container if label changes
      const container = this.parentElement;
      if (container && container.tagName.toLowerCase() === 'tab-container') {
        // Trigger update in container (it will query for new labels)
        (container as any).updateTabs?.();
      }
    }
  }

  // 5. Lifecycle: Disconnected
  disconnectedCallback(): void {
    // Notify parent container when removed
    const container = this.parentElement;
    if (container && container.tagName.toLowerCase() === 'tab-container') {
      (container as any).updateTabs?.();
    }
  }

  // --- Methods ---

  private render(): void {
    // We use the non-null assertion (!) because we know we attached shadowRoot in the constructor
    // In strict mode, you might prefer: if (!this.shadowRoot) return;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7c63dc10-2a92-4fcd-8166-8cbdf231ab2d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TabPage.ts:54',message:'TabPage render before innerHTML',data:{childrenCount:this.children.length,childrenHTML:Array.from(this.children).map(c=>c.outerHTML.substring(0,50))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    this.shadowRoot!.innerHTML = `
      <style>
        :host {
          display: block;
        }
        :host([hidden]) {
          display: none;
        }
      </style>
      <slot></slot>
    `;
    // #region agent log
    const slot = this.shadowRoot!.querySelector('slot');
    fetch('http://127.0.0.1:7242/ingest/7c63dc10-2a92-4fcd-8166-8cbdf231ab2d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TabPage.ts:68',message:'TabPage render after innerHTML',data:{hasSlot:!!slot,slotAssignedNodesCount:slot?.assignedNodes().length,computedDisplay:window.getComputedStyle(this).display,hasHiddenAttr:this.hasAttribute('hidden')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
  }

  // Public method to get label
  public getLabel(): string {
    return this.getAttribute('label') || '';
  }
}

export function setupTabPage(): void {
  // 6. Register the component
  customElements.define('tab-page', TabPage);
  console.log("Feature added: TabPage");
}

// 7. TypeScript Specific: Global Type Augmentation
// This allows TypeScript to recognize document.createElement('tab-page')
declare global {
  interface HTMLElementTagNameMap {
    'tab-page': TabPage;
  }
}
