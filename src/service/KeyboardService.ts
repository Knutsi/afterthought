import type { ServiceLayer } from "./ServiceLayer";
import type { IAction } from "./ActionService";
import { IS_MAC, formatShortcutForDisplay as formatShortcut } from "./platformUtils";


type ChordState = { type: "idle" } | { type: "awaiting_second"; prefix: string };

export interface ChordOption {
  key: string;
  action: IAction;
  displayKey: string;
}

export const KeyboardEvents = {
  CHORD_STARTED: "chordStarted",
  CHORD_CANCELLED: "chordCancelled",
  CHORD_COMPLETED: "chordCompleted",
  SHIFT_SHIFT: "shiftShift",
};

const SHIFT_SHIFT_TIMEOUT_MS = 400;

export class KeyboardService extends EventTarget {
  private serviceLayer: ServiceLayer;
  private chordState: ChordState = { type: "idle" };
  private boundHandleKeydown: (e: KeyboardEvent) => void;
  private boundHandleKeyup: (e: KeyboardEvent) => void;
  private lastShiftKeyupTimestamp = 0;
  private shiftWasUsedWithOtherKey = false;

  constructor(serviceLayer: ServiceLayer) {
    super();
    this.serviceLayer = serviceLayer;
    this.boundHandleKeydown = this.handleKeydown.bind(this);
    this.boundHandleKeyup = this.handleKeyup.bind(this);
  }

  public initialize(): void {
    window.addEventListener("keydown", this.boundHandleKeydown, true);
    window.addEventListener("keyup", this.boundHandleKeyup, true);
  }

  public destroy(): void {
    window.removeEventListener("keydown", this.boundHandleKeydown, true);
    window.removeEventListener("keyup", this.boundHandleKeyup, true);
    this.cancelChord();
  }

  public getChordState(): ChordState {
    return this.chordState;
  }

  public cancelChord(): void {
    if (this.chordState.type === "awaiting_second") {
      this.chordState = { type: "idle" };
      this.dispatchEvent(new Event(KeyboardEvents.CHORD_CANCELLED));
    }
  }

  public getChordOptions(prefix: string): ChordOption[] {
    const actions = this.serviceLayer.actionService.getActions();
    const options: ChordOption[] = [];

    for (const action of actions) {
      if (!action.shortcuts || action.shortcuts.length === 0) continue;

      for (const shortcut of action.shortcuts) {
        if (!shortcut) continue;
        const normalized = this.normalizeShortcut(shortcut);
        if (normalized.startsWith(prefix + " ")) {
          const secondKey = normalized.slice(prefix.length + 1);
          options.push({
            key: secondKey,
            action,
            displayKey: this.formatKeyForDisplay(secondKey),
          });
        }
      }
    }

    return options;
  }

  public async executeChordOption(prefix: string, secondKey: string): Promise<boolean> {
    const fullShortcut = `${prefix} ${secondKey.toUpperCase()}`;
    this.chordState = { type: "idle" };
    this.dispatchEvent(new Event(KeyboardEvents.CHORD_COMPLETED));
    return this.matchAndExecute(fullShortcut);
  }

  private handleKeyup(e: KeyboardEvent): void {
    if (e.key === "Shift") {
      if (!this.shiftWasUsedWithOtherKey) {
        this.lastShiftKeyupTimestamp = Date.now();
      }
      this.shiftWasUsedWithOtherKey = false;
    }
  }

  private handleKeydown(e: KeyboardEvent): void {
    if (e.key === "Shift" && this.chordState.type === "idle") {
      if (!this.shiftWasUsedWithOtherKey) {
        const now = Date.now();
        if (now - this.lastShiftKeyupTimestamp < SHIFT_SHIFT_TIMEOUT_MS && this.lastShiftKeyupTimestamp > 0) {
          this.lastShiftKeyupTimestamp = 0;
          this.dispatchEvent(new Event(KeyboardEvents.SHIFT_SHIFT));
          return;
        }
      }
    }

    if (e.key !== "Shift" && e.key !== "Control" && e.key !== "Alt" && e.key !== "Meta") {
      if (e.shiftKey) {
        this.shiftWasUsedWithOtherKey = true;
      }
    }

    if (this.shouldIgnoreEvent(e)) return;

    const shortcut = this.parseKeyboardEvent(e);
    if (!shortcut) return;

    if (this.chordState.type === "awaiting_second") {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === "Escape") {
        this.cancelChord();
        return;
      }

      const secondKey = e.key.toUpperCase();
      const prefix = this.chordState.prefix;
      this.executeChordOption(prefix, secondKey);
      return;
    }

    const chordOptions = this.getChordOptions(shortcut);
    if (chordOptions.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      this.startChord(shortcut);
      return;
    }

    this.matchAndExecute(shortcut).then((matched) => {
      if (matched) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
  }

  private shouldIgnoreEvent(e: KeyboardEvent): boolean {
    const target = (e.composedPath()[0] || e.target) as HTMLElement;
    if (!target) return false;

    const tagName = target.tagName.toLowerCase();
    if (tagName === "input" || tagName === "textarea" || target.isContentEditable) {
      return true;
    }

    return false;
  }

  private parseKeyboardEvent(e: KeyboardEvent): string | null {
    if (e.key === "Control" || e.key === "Alt" || e.key === "Shift" || e.key === "Meta") {
      return null;
    }

    const parts: string[] = [];

    const hasPrimaryMod = IS_MAC ? e.metaKey : e.ctrlKey;
    if (hasPrimaryMod) parts.push("Mod");
    if (e.altKey) parts.push("Alt");
    if (e.shiftKey) parts.push("Shift");

    const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
    parts.push(key);

    return parts.join("+");
  }

  private normalizeShortcut(shortcut: string): string {
    return shortcut
      .replace(/Ctrl\+/g, "Mod+")
      .replace(/Cmd\+/g, "Mod+")
      .replace(/⌘/g, "Mod+")
      .toUpperCase()
      .replace(/MOD/g, "Mod")
      .replace(/ALT/g, "Alt")
      .replace(/SHIFT/g, "Shift");
  }

  private startChord(prefix: string): void {
    this.chordState = { type: "awaiting_second", prefix };
    this.dispatchEvent(
      new CustomEvent(KeyboardEvents.CHORD_STARTED, {
        detail: { prefix, options: this.getChordOptions(prefix) },
      })
    );
  }

  private async matchAndExecute(shortcut: string): Promise<boolean> {
    const actions = this.serviceLayer.actionService.getActions();
    const context = this.serviceLayer.getContextService();

    for (const action of actions) {
      if (!action.shortcuts || action.shortcuts.length === 0) continue;

      for (const actionShortcut of action.shortcuts) {
        if (!actionShortcut) continue;
        const normalized = this.normalizeShortcut(actionShortcut);
        if (normalized === shortcut) {
          const canDo = await action.canDo(context);
          if (canDo) {
            await this.serviceLayer.actionService.doAction(action.id);
            return true;
          }
        }
      }
    }

    return false;
  }

  private formatKeyForDisplay(key: string): string {
    return key;
  }

  public formatShortcutForDisplay(shortcut: string): string {
    return formatShortcut(shortcut);
  }
}
