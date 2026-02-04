import { BaseComponent, defineComponent } from "../core/BaseComponent";
import { EventListeners } from "../core/utilities";
import { noSelect } from "../styles/cssUtilities";
import type { ChordOption } from "../../service/KeyboardService";

export class ChordPicker extends BaseComponent {
  private events = new EventListeners();
  private chordOptions: ChordOption[] = [];
  private selectedIndex: number = 0;

  public onSelect?: (option: ChordOption) => void;
  public onCancel?: () => void;

  protected onInit(): void {
    this.events.add(this as unknown as Element, "keydown", this.handleKeydown as EventListener);
    this.setAttribute("tabindex", "0");
    this.render();
  }

  protected onDestroy(): void {
    this.events.removeAll();
  }

  public configure(options: ChordOption[]): void {
    this.chordOptions = options;
    this.selectedIndex = 0;
    this.render();
  }

  public show(): void {
    this.setAttribute("visible", "");
    this.focus();
  }

  public hide(): void {
    this.removeAttribute("visible");
  }

  protected render(): void {
    const optionItems = this.chordOptions
      .map((opt, index) => {
        const selectedClass = index === this.selectedIndex ? "selected" : "";
        return `
          <div class="option ${selectedClass}" data-index="${index}">
            <span class="name">${opt.action.name}</span>
            <span class="key">${opt.displayKey}</span>
          </div>
        `;
      })
      .join("");

    this.shadowRoot!.innerHTML = `
      <style>
        :host {
          display: none;
          position: fixed;
          inset: 0;
          ${noSelect()}
        }

        :host([visible]) {
          display: block;
        }

        :host(:focus) {
          outline: none;
        }

        .backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.3);
        }

        .picker {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: var(--theme-color-background);
          border: 1px solid color-mix(in srgb, var(--theme-color-secondary) 40%, transparent);
          border-radius: var(--theme-spacing-border-radius);
          box-shadow: 4px 4px 16px rgba(0, 0, 0, 0.3);
          min-width: 250px;
          max-width: 400px;
          overflow: hidden;
        }

        .options {
          padding: 8px 0;
        }

        .option {
          display: grid;
          grid-template-columns: 1fr 48px;
          gap: 12px;
          padding: 8px 16px;
          cursor: pointer;
          font-size: var(--theme-font-size, 14px);
          font-family: var(--theme-font-family, system-ui, -apple-system, sans-serif);
          color: var(--theme-color-text);
        }

        .option:hover,
        .option.selected {
          background: color-mix(in srgb, var(--theme-color-primary) 15%, transparent);
        }

        .option .key {
          font-family: monospace;
          font-weight: 600;
          background: color-mix(in srgb, var(--theme-color-secondary) 20%, transparent);
          padding: 2px 8px;
          border-radius: 4px;
          text-align: center;
        }

        .option .name {
          display: flex;
          align-items: center;
        }

        .empty {
          padding: 16px;
          text-align: center;
          color: color-mix(in srgb, var(--theme-color-text) 60%, transparent);
          font-style: italic;
        }
      </style>
      <div class="backdrop"></div>
      <div class="picker">
        <div class="options">
          ${optionItems || '<div class="empty">No actions available</div>'}
        </div>
      </div>
    `;

    this.events.addToShadow(this.shadowRoot, ".backdrop", "click", () => this.onCancel?.());

    this.shadowRoot!.querySelectorAll(".option").forEach((el) => {
      el.addEventListener("click", () => {
        const index = parseInt(el.getAttribute("data-index") || "0", 10);
        this.selectOption(index);
      });
    });
  }

  private handleKeydown = (e: KeyboardEvent): void => {
    let handled = false;

    switch (e.key) {
      case "ArrowDown":
        this.selectedIndex = (this.selectedIndex + 1) % this.chordOptions.length;
        this.updateSelection();
        handled = true;
        break;

      case "ArrowUp":
        this.selectedIndex = this.selectedIndex <= 0 ? this.chordOptions.length - 1 : this.selectedIndex - 1;
        this.updateSelection();
        handled = true;
        break;

      case "Enter":
      case " ":
        if (this.chordOptions.length > 0) {
          this.selectOption(this.selectedIndex);
        }
        handled = true;
        break;

      case "Escape":
        this.onCancel?.();
        handled = true;
        break;

      default: {
        const pressedKey = e.key.toUpperCase();
        const matchIndex = this.chordOptions.findIndex((opt) => opt.key === pressedKey);
        if (matchIndex >= 0) {
          this.selectOption(matchIndex);
          handled = true;
        }
        break;
      }
    }

    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  private updateSelection(): void {
    const optionEls = this.shadowRoot!.querySelectorAll(".option");
    optionEls.forEach((el, index) => {
      if (index === this.selectedIndex) {
        el.classList.add("selected");
      } else {
        el.classList.remove("selected");
      }
    });
  }

  private selectOption(index: number): void {
    if (index >= 0 && index < this.chordOptions.length) {
      this.onSelect?.(this.chordOptions[index]);
    }
  }
}

defineComponent("chord-picker", ChordPicker);

declare global {
  interface HTMLElementTagNameMap {
    "chord-picker": ChordPicker;
  }
}
