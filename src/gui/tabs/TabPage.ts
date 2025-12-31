import { BaseComponent, defineComponent } from '../core/BaseComponent';

export class TabPage extends BaseComponent {
  static get observedAttributes(): string[] {
    return ['label'];
  }

  protected onInit(): void {
    // Component is initialized and rendered
  }

  protected onAttributeChange(
    name: string,
    oldValue: string | null,
    newValue: string | null
  ): void {
    if (name === 'label') {
      // Notify parent container if label changes
      const container = this.parentElement;
      if (container && container.tagName.toLowerCase() === 'tab-container') {
        (container as any).updateTabs?.();
      }
    }
    // BaseComponent will trigger re-render automatically
    super.onAttributeChange(name, oldValue, newValue);
  }

  protected onDestroy(): void {
    // Notify parent container when removed
    const container = this.parentElement;
    if (container && container.tagName.toLowerCase() === 'tab-container') {
      (container as any).updateTabs?.();
    }
  }

  protected render(): void {
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
  }

  public getLabel(): string {
    return this.getAttribute('label') || '';
  }
}

defineComponent('tab-page', TabPage);

declare global {
  interface HTMLElementTagNameMap {
    'tab-page': TabPage;
  }
}
