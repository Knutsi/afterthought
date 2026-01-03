import { BaseComponent, defineComponent } from "../../gui/core/BaseComponent";
import { HOME_ACTIVITY_TAG } from "./types";

export class HomeActivity extends BaseComponent {
  static get observedAttributes(): string[] {
    return [];
  }

  protected onInit(): void {
    this.ensureTabAttributes();
  }

  protected render(): void {
    if (!this.shadowRoot) return;

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

  private ensureTabAttributes(): void {
    if (!this.hasAttribute("tab-label")) {
      this.setAttribute("tab-label", "Home");
    }

    if (!this.hasAttribute("tab-icon")) {
      this.setAttribute("tab-icon", "home");
    }

    if (!this.hasAttribute("tab-right")) {
      this.setAttribute("tab-right", "");
    }

    if (this.hasAttribute("closeable")) {
      this.removeAttribute("closeable");
    }
  }
}

defineComponent(HOME_ACTIVITY_TAG, HomeActivity);

declare global {
  interface HTMLElementTagNameMap {
    [HOME_ACTIVITY_TAG]: HomeActivity;
  }
}
