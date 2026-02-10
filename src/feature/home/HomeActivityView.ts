import type { IActivityView } from "../../gui/activity/runtime/types";

export class HomeActivityView implements IActivityView {
  private shadowRoot: ShadowRoot | null = null;

  public mount(shadowRoot: ShadowRoot): void {
    this.shadowRoot = shadowRoot;
  }

  public render(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
        }

        .home-content {
          padding: 16px;
          color: var(--theme-color-text, #333);
          font-size: var(--theme-font-size, 14px);
        }
      </style>
      <div class="home-content">TBD</div>
    `;
  }

  public destroy(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = "";
    this.shadowRoot = null;
  }
}
