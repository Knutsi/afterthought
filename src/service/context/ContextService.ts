import type { ServiceLayer } from "../ServiceLayer";
import { type Uri, getUriScheme } from "../../core-model/uri";
import {
  type IContext,
  type IContextEntry,
  ContextEntry,
} from "./types";

export const ContextEvents = {
  CONTEXT_CHANGED: "contextChanged",
} as const;

export class ContextService extends EventTarget implements IContext {
  private _entries: Map<Uri, IContextEntry> = new Map();
  private serviceLayer: ServiceLayer;

  constructor(serviceLayer: ServiceLayer) {
    super();
    this.serviceLayer = serviceLayer;
  }

  // IContext implementation
  get entries(): ReadonlyMap<Uri, IContextEntry> {
    return this._entries;
  }

  hasScheme(scheme: string): boolean {
    for (const entry of this._entries.values()) {
      if (getUriScheme(entry.uri) === scheme) {
        return true;
      }
    }
    return false;
  }

  getEntriesByScheme(scheme: string): IContextEntry[] {
    const result: IContextEntry[] = [];
    for (const entry of this._entries.values()) {
      if (getUriScheme(entry.uri) === scheme) {
        result.push(entry);
      }
    }
    return result;
  }

  hasEntry(uri: Uri): boolean {
    return this._entries.has(uri);
  }

  getEntry(uri: Uri): IContextEntry | undefined {
    return this._entries.get(uri);
  }

  getChildren(parentUri: Uri): IContextEntry[] {
    const result: IContextEntry[] = [];
    for (const entry of this._entries.values()) {
      if (entry.parentUri === parentUri) {
        result.push(entry);
      }
    }
    return result;
  }

  // Entry management
  addEntry(uri: Uri, feature: string, parentUri?: Uri): IContextEntry {
    const entry = new ContextEntry(uri, feature, parentUri ?? null);
    this._entries.set(uri, entry);
    this.onContextChanged(`Added entry: ${uri}`);
    return entry;
  }

  removeEntry(uri: Uri): boolean {
    const removed = this._entries.delete(uri);
    if (removed) {
      this.onContextChanged(`Removed entry: ${uri}`);
    }
    return removed;
  }

  removeEntriesByFeature(feature: string): void {
    const toRemove: Uri[] = [];
    for (const entry of this._entries.values()) {
      if (entry.feature === feature) {
        toRemove.push(entry.uri);
      }
    }
    for (const uri of toRemove) {
      this._entries.delete(uri);
    }
    if (toRemove.length > 0) {
      this.onContextChanged(`Removed ${toRemove.length} entries by feature: ${feature}`);
    }
  }

  clear(): void {
    this._entries.clear();
    this.onContextChanged("Cleared all entries");
  }

  // Internal helpers
  private onContextChanged(action: string): void {
    this.dispatchEvent(new CustomEvent(ContextEvents.CONTEXT_CHANGED));
    this.serviceLayer.actionService.updateActionAvailability();
    this.debugDump(action);
  }

  private debugDump(action: string): void {
    console.log(`[ContextService] ${action}`);
    console.log("  Entries:");

    if (this._entries.size === 0) {
      console.log("    (none)");
      return;
    }

    // Group entries by parent for hierarchical display
    const rootEntries: IContextEntry[] = [];
    const childrenByParent: Map<Uri, IContextEntry[]> = new Map();

    for (const entry of this._entries.values()) {
      if (entry.parentUri === null) {
        rootEntries.push(entry);
      } else {
        const children = childrenByParent.get(entry.parentUri) ?? [];
        children.push(entry);
        childrenByParent.set(entry.parentUri, children);
      }
    }

    const printEntry = (entry: IContextEntry, indent: string): void => {
      const parentInfo = entry.parentUri ? ` <- ${entry.parentUri}` : "";
      console.log(`${indent}${entry.uri} [${entry.feature}]${parentInfo}`);

      const children = childrenByParent.get(entry.uri);
      if (children) {
        for (const child of children) {
          printEntry(child, indent + "  ");
        }
      }
    };

    for (const entry of rootEntries) {
      printEntry(entry, "    ");
    }

    // Also print orphaned children (whose parent isn't in the context)
    for (const [parentUri, children] of childrenByParent.entries()) {
      if (!this._entries.has(parentUri)) {
        for (const child of children) {
          console.log(`    ${child.uri} [${child.feature}] <- ${parentUri} (orphan)`);
        }
      }
    }
  }
}
