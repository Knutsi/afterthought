import { BaseComponent, defineComponent } from "../core/BaseComponent";
import { EventListeners } from "../core/utilities";
import { noSelect } from "../styles/cssUtilities";
import type { ActionAvailabilityMap, IAction } from "../../service/ActionService";

interface ScoredAction {
  action: IAction;
  score: number;
}

export class CommandPalette extends BaseComponent {
  private events = new EventListeners();
  private allActions: IAction[] = [];
  private filteredActions: IAction[] = [];
  private selectedIndex = 0;
  private availability: ActionAvailabilityMap = new Map();

  public onExecute?: (actionId: string) => void;
  public onCancel?: () => void;

  protected onInit(): void {
    this.render();
  }

  protected onDestroy(): void {
    this.events.removeAll();
  }

  public configure(actions: IAction[], availability: ActionAvailabilityMap): void {
    this.availability = availability;
    this.allActions = actions.filter((a) => !a.hideFromMenu && this.isActionAvailable(a.id));
    this.selectedIndex = 0;
    this.filteredActions = this.allActions;
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
      this.filteredActions = this.allActions;
    } else {
      const query = text.toLowerCase();
      const scored: ScoredAction[] = [];

      for (const action of this.allActions) {
        const name = action.name.toLowerCase();
        const score = this.scoreMatch(name, query);
        if (score > 0) {
          scored.push({ action, score });
        }
      }

      scored.sort((a, b) => b.score - a.score);
      this.filteredActions = scored.map((s) => s.action);
    }

    this.renderResults();
  }

  private isActionAvailable(actionId: string): boolean {
    return this.availability.get(actionId) ?? false;
  }

  private scoreMatch(name: string, query: string): number {
    if (name === query) return 100;
    if (name.startsWith(query)) return 80;
    if (name.includes(query)) return 60;
    if (this.fuzzyMatch(name, query)) return 40;
    return 0;
  }

  private fuzzyMatch(name: string, query: string): boolean {
    let qi = 0;
    for (let ni = 0; ni < name.length && qi < query.length; ni++) {
      if (name[ni] === query[qi]) qi++;
    }
    return qi === query.length;
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

        .palette {
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
          grid-template-columns: 1fr auto;
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

        .result .shortcut {
          font-family: monospace;
          font-size: 0.85em;
          color: color-mix(in srgb, var(--theme-color-text) 60%, transparent);
        }

        .result .name {
          ${noSelect()}
        }

        .empty {
          padding: 16px;
          text-align: center;
          color: color-mix(in srgb, var(--theme-color-text) 60%, transparent);
          font-style: italic;
        }
      </style>
      <div class="backdrop"></div>
      <div class="palette">
        <input class="search-input" type="text" placeholder="Search actions..." />
        <div class="results">
          ${resultItems}
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private buildResultItems(): string {
    if (this.filteredActions.length === 0) {
      return '<div class="empty">No matching actions</div>';
    }

    return this.filteredActions
      .map((action, index) => {
        const selectedClass = index === this.selectedIndex ? "selected" : "";
        const shortcutDisplay = action.shortcuts.length > 0 ? action.shortcuts[0] : "";
        return `
          <div class="result ${selectedClass}" data-index="${index}">
            <span class="name">${action.name}</span>
            <span class="shortcut">${shortcutDisplay}</span>
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
        this.executeAction(index);
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
        this.executeAction(index);
      });
    });
  }

  private handleKeydown(e: KeyboardEvent): void {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (this.filteredActions.length > 0) {
          this.selectedIndex = (this.selectedIndex + 1) % this.filteredActions.length;
          this.updateSelection();
        }
        break;

      case "ArrowUp":
        e.preventDefault();
        if (this.filteredActions.length > 0) {
          this.selectedIndex = this.selectedIndex <= 0 ? this.filteredActions.length - 1 : this.selectedIndex - 1;
          this.updateSelection();
        }
        break;

      case "Enter":
        e.preventDefault();
        if (this.filteredActions.length > 0) {
          this.executeAction(this.selectedIndex);
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

  private executeAction(index: number): void {
    if (index >= 0 && index < this.filteredActions.length) {
      this.onExecute?.(this.filteredActions[index].id);
    }
  }
}

defineComponent("command-palette", CommandPalette);

declare global {
  interface HTMLElementTagNameMap {
    "command-palette": CommandPalette;
  }
}
