/**
 * Utility functions for common Web Component patterns
 */

/**
 * Creates a managed MutationObserver that auto-cleans up
 * Returns cleanup function to call in onDestroy
 */
export function useMutationObserver(
  target: Node,
  callback: MutationCallback,
  options: MutationObserverInit
): () => void {
  const observer = new MutationObserver(callback);
  observer.observe(target, options);

  return () => {
    observer.disconnect();
  };
}

/**
 * Event listener manager for Shadow DOM elements
 * Automatically handles add/remove pairs
 */
export class EventListeners {
  private listeners: Array<{
    element: Element | Document;
    event: string;
    handler: EventListener;
  }> = [];

  /**
   * Add event listener that will be auto-removed on cleanup
   */
  add(element: Element | Document | null | undefined, event: string, handler: EventListener): void {
    if (!element) return;
    element.addEventListener(event, handler);
    this.listeners.push({ element, event, handler });
  }

  /**
   * Add event listener to shadow root element (queries for it first)
   */
  addToShadow(shadowRoot: ShadowRoot | null, selector: string, event: string, handler: EventListener): void {
    if (!shadowRoot) return;
    const element = shadowRoot.querySelector(selector);
    this.add(element, event, handler);
  }

  /**
   * Remove all registered event listeners
   * Call this in onDestroy
   */
  removeAll(): void {
    this.listeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.listeners = [];
  }
}

/**
 * Helper to discover child elements by tag name
 */
export function discoverChildren<T extends HTMLElement>(
  parent: HTMLElement,
  tagName: string
): T[] {
  return Array.from(parent.children).filter(
    (child): child is T => child.tagName.toLowerCase() === tagName
  ) as T[];
}
