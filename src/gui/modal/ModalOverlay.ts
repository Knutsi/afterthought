import { BaseComponent, defineComponent } from "../core/BaseComponent";

const MODAL_OVERLAY_TAG = "modal-overlay";

export class ModalOverlay extends BaseComponent {
  private observer: MutationObserver | null = null;
  private escapeHandler: ((e: KeyboardEvent) => void) | null = null;

  protected onInit(): void {
    this.observer = new MutationObserver(() => this.updateVisibility());
    this.observer.observe(this, { childList: true });

    this.escapeHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && this.children.length > 0) {
        e.stopPropagation();
        const topChild = this.children[this.children.length - 1];
        const activityService = this.getServiceLayer().activityService;
        activityService.closeActivity(topChild.id);
      }
    };
    document.addEventListener("keydown", this.escapeHandler, true);

    this.updateVisibility();
  }

  protected onDestroy(): void {
    this.observer?.disconnect();
    this.observer = null;
    if (this.escapeHandler) {
      document.removeEventListener("keydown", this.escapeHandler, true);
      this.escapeHandler = null;
    }
  }

  protected render(): void {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: none;
          position: fixed;
          inset: 0;
          z-index: 8000;
          background: rgba(0, 0, 0, 0.4);
          place-items: center;
        }

        :host(.visible) {
          display: grid;
        }
      </style>
      <slot></slot>
    `;
  }

  private updateVisibility(): void {
    if (this.children.length > 0) {
      this.classList.add("visible");
    } else {
      this.classList.remove("visible");
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener("click", (e: Event) => {
      if (e.target === this && this.children.length > 0) {
        const topChild = this.children[this.children.length - 1];
        const activityService = this.getServiceLayer().activityService;
        activityService.closeActivity(topChild.id);
      }
    });
  }
}

defineComponent(MODAL_OVERLAY_TAG, ModalOverlay);

declare global {
  interface HTMLElementTagNameMap {
    [MODAL_OVERLAY_TAG]: ModalOverlay;
  }
}
