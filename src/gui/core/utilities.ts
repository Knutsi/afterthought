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

export class EventListeners {
  private listeners: Array<{
    element: Element | Document;
    event: string;
    handler: EventListener;
  }> = [];

  add(element: Element | Document | null | undefined, event: string, handler: EventListener): void {
    if (!element) return;
    element.addEventListener(event, handler);
    this.listeners.push({ element, event, handler });
  }

  addToShadow(shadowRoot: ShadowRoot | null, selector: string, event: string, handler: EventListener): void {
    if (!shadowRoot) return;
    const element = shadowRoot.querySelector(selector);
    this.add(element, event, handler);
  }

  removeAll(): void {
    this.listeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.listeners = [];
  }
}

export function discoverChildren<T extends HTMLElement>(
  parent: HTMLElement,
  tagName: string
): T[] {
  return Array.from(parent.children).filter(
    (child): child is T => child.tagName.toLowerCase() === tagName
  ) as T[];
}
