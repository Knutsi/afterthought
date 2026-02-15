import { BaseComponent, defineComponent } from "../core/BaseComponent";
import { EventListeners } from "../core/utilities";
import { noSelect } from "../styles/cssUtilities";
import { IS_MAC, formatShortcutForDisplay } from "../../service/platformUtils";

export interface PickerItem {
  id: string;
  name: string;
  detail?: string;
}

interface ShortcutEntry {
  item: PickerItem;
  shortcutKey: string;
  shortcutDisplay: string;
}

const SHORTCUT_KEYS = [
  "1", "2", "3", "4", "5", "6", "7", "8", "9",
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
  "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
];

export class SearchPicker extends BaseComponent {
  private events = new EventListeners();
  private allEntries: ShortcutEntry[] = [];
  private filteredEntries: ShortcutEntry[] = [];
  private selectedIndex = 0;

  public onSelect?: (item: PickerItem) => void;
  public onCancel?: () => void;

  protected onInit(): void {
    this.render();
  }

  protected onDestroy(): void {
    this.events.removeAll();
  }

  public configure(items: PickerItem[]): void {
    const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));
    this.allEntries = sorted.map((item, i) => {
      const shortcutKey = i < SHORTCUT_KEYS.length ? SHORTCUT_KEYS[i] : "";
      const shortcutDisplay = shortcutKey
        ? formatShortcutForDisplay(`Mod+${shortcutKey}`)
        : "";
      return { item, shortcutKey, shortcutDisplay };
    });
    this.filteredEntries = this.allEntries;
    this.selectedIndex = 0;
    this.render();
  }

  public show(): void {
    this.setAttribute("visible", "");
    this.render();
    requestAnimationFrame(() => {
      const input = this.shadowRoot!.querySelector<HTMLInputElement>(".search-input");
      if (input) {
        input.value = "";
        input.focus();
      }
    });
  }

  public hide(): void {
    this.removeAttribute("visible");
    this.selectedIndex = 0;
  }

  public isVisible(): boolean {
    return this.hasAttribute("visible");
  }

  private applyFilter(text: string): void {
    this.selectedIndex = 0;

    if (!text.trim()) {
      this.filteredEntries = this.allEntries;
    } else {
      const query = text.toLowerCase();
      this.filteredEntries = this.allEntries.filter((entry) => {
        const name = entry.item.name.toLowerCase();
        const detail = (entry.item.detail ?? "").toLowerCase();
        return name.includes(query) || detail.includes(query);
      });
    }

    this.renderResults();
  }

  protected render(): void {
    this.events.removeAll();

    const resultItems = this.buildResultItems();

    this.shadowRoot!.innerHTML = `
      <style>
        :host {
          display: none;
          position: fixed;
          inset: 0;
          z-index: 10000;
          ${noSelect()}
        }

        :host([visible]) {
          display: block;
        }

        .backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.3);
        }

        .panel {
          position: fixed;
          top: 20%;
          left: 50%;
          transform: translateX(-50%);
          width: min(500px, 80vw);
          background: var(--theme-color-background);
          border: 1px solid color-mix(in srgb, var(--theme-color-secondary) 40%, transparent);
          border-radius: var(--theme-spacing-border-radius);
          box-shadow: 4px 4px 16px rgba(0, 0, 0, 0.3);
          display: grid;
          grid-template-rows: auto 1fr;
          max-height: 60vh;
          overflow: hidden;
        }

        .search-input {
          width: 100%;
          box-sizing: border-box;
          padding: 10px 16px;
          border: none;
          border-bottom: 1px solid color-mix(in srgb, var(--theme-color-secondary) 30%, transparent);
          background: transparent;
          color: var(--theme-color-text);
          font-size: var(--theme-font-size, 14px);
          font-family: var(--theme-font-family, system-ui, -apple-system, sans-serif);
          outline: none;
        }

        .search-input::placeholder {
          color: color-mix(in srgb, var(--theme-color-text) 50%, transparent);
        }

        .results {
          overflow-y: auto;
          padding: 4px 0;
        }

        .result {
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 12px;
          padding: 6px 16px;
          cursor: pointer;
          font-size: var(--theme-font-size, 14px);
          font-family: var(--theme-font-family, system-ui, -apple-system, sans-serif);
          color: var(--theme-color-text);
          align-items: center;
        }

        .result:hover,
        .result.selected {
          background: color-mix(in srgb, var(--theme-color-primary) 15%, transparent);
        }

        .result .name {
          ${noSelect()}
        }

        .result .detail {
          color: color-mix(in srgb, var(--theme-color-text) 50%, transparent);
          font-size: 0.9em;
        }

        .result .key {
          font-family: monospace;
          font-weight: 600;
          background: color-mix(in srgb, var(--theme-color-secondary) 20%, transparent);
          padding: 2px 8px;
          border-radius: 4px;
          text-align: center;
          font-size: 0.85em;
        }

        .empty {
          padding: 16px;
          text-align: center;
          color: color-mix(in srgb, var(--theme-color-text) 60%, transparent);
          font-style: italic;
        }
      </style>
      <div class="backdrop"></div>
      <div class="panel">
        <input class="search-input" type="text" placeholder="Search..." />
        <div class="results">
          ${resultItems}
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private buildResultItems(): string {
    if (this.filteredEntries.length === 0) {
      return '<div class="empty">No matches</div>';
    }

    return this.filteredEntries
      .map((entry, index) => {
        const selectedClass = index === this.selectedIndex ? "selected" : "";
        const detailHtml = entry.item.detail
          ? `<span class="detail">${entry.item.detail}</span>`
          : `<span></span>`;
        const keyHtml = entry.shortcutDisplay
          ? `<span class="key">${entry.shortcutDisplay}</span>`
          : `<span></span>`;
        return `
          <div class="result ${selectedClass}" data-index="${index}">
            <span class="name">${entry.item.name}</span>
            ${detailHtml}
            ${keyHtml}
          </div>
        `;
      })
      .join("");
  }

  private renderResults(): void {
    const resultsContainer = this.shadowRoot!.querySelector(".results");
    if (!resultsContainer) return;

    resultsContainer.innerHTML = this.buildResultItems();

    resultsContainer.querySelectorAll(".result").forEach((el) => {
      el.addEventListener("click", () => {
        const index = parseInt(el.getAttribute("data-index") || "0", 10);
        this.selectItem(index);
      });
    });
  }

  private bindEvents(): void {
    this.events.addToShadow(this.shadowRoot, ".backdrop", "click", () => this.onCancel?.());

    const input = this.shadowRoot!.querySelector<HTMLInputElement>(".search-input");
    if (input) {
      this.events.add(input, "input", () => {
        this.applyFilter(input.value);
      });

      this.events.add(input, "keydown", ((e: KeyboardEvent) => {
        this.handleKeydown(e);
      }) as EventListener);
    }

    this.shadowRoot!.querySelectorAll(".result").forEach((el) => {
      el.addEventListener("click", () => {
        const index = parseInt(el.getAttribute("data-index") || "0", 10);
        this.selectItem(index);
      });
    });
  }

  private handleKeydown(e: KeyboardEvent): void {
    const modHeld = IS_MAC ? e.metaKey : e.ctrlKey;

    if (modHeld) {
      const key = e.key.toUpperCase();
      // digits: e.key is already "1"-"9"
      const match = this.allEntries.find((entry) => entry.shortcutKey === key);
      if (match) {
        // only select if visible in filtered results
        const visibleIndex = this.filteredEntries.indexOf(match);
        if (visibleIndex >= 0) {
          e.preventDefault();
          this.selectItem(visibleIndex);
          return;
        }
      }
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (this.filteredEntries.length > 0) {
          this.selectedIndex = (this.selectedIndex + 1) % this.filteredEntries.length;
          this.updateSelection();
        }
        break;

      case "ArrowUp":
        e.preventDefault();
        if (this.filteredEntries.length > 0) {
          this.selectedIndex = this.selectedIndex <= 0
            ? this.filteredEntries.length - 1
            : this.selectedIndex - 1;
          this.updateSelection();
        }
        break;

      case "Enter":
        e.preventDefault();
        if (this.filteredEntries.length > 0) {
          this.selectItem(this.selectedIndex);
        }
        break;

      case "Escape":
        e.preventDefault();
        this.onCancel?.();
        break;
    }
  }

  private updateSelection(): void {
    const results = this.shadowRoot!.querySelectorAll(".result");
    results.forEach((el, index) => {
      if (index === this.selectedIndex) {
        el.classList.add("selected");
        el.scrollIntoView({ block: "nearest" });
      } else {
        el.classList.remove("selected");
      }
    });
  }

  private selectItem(index: number): void {
    if (index >= 0 && index < this.filteredEntries.length) {
      this.onSelect?.(this.filteredEntries[index].item);
    }
  }
}

defineComponent("search-picker", SearchPicker);

declare global {
  interface HTMLElementTagNameMap {
    "search-picker": SearchPicker;
  }
}
