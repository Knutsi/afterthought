import { BaseComponent, defineComponent } from '../../gui/core/BaseComponent';

export class ProjectBrowser extends BaseComponent {
  static get observedAttributes(): string[] {
    return ['title', 'theme'];
  }

  protected onInit(): void {
    this.addEventListeners();
  }

  protected onAttributeChange(
    name: string,
    oldValue: string | null,
    newValue: string | null
  ): void {
    if (name === 'title') {
      // BaseComponent will trigger re-render automatically
      super.onAttributeChange(name, oldValue, newValue);
    }
  }

  protected onDestroy(): void {
    this.removeEventListeners();
  }

  protected render(): void {
    this.shadowRoot!.innerHTML = `
      <style>
        :host { display: block; padding: 10px; border: 1px solid #ccc; }
        h1 { color: blue; }
      </style>
      <h1>${this.getAttribute('title') ?? 'Default Title'}</h1>
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

  private _handleClick = (e: Event): void => {
    console.log('Clicked!', e);
  }
}

defineComponent('project-browser', ProjectBrowser);

declare global {
  interface HTMLElementTagNameMap {
    'project-browser': ProjectBrowser;
  }
}
