// Unified setup module for menubar components
import { setupMenuItem } from './MenuItem';
import { setupMenu } from './Menu';
import { setupMenuBar } from './MenuBar';

/**
 * Sets up all menubar-related custom elements.
 * This function registers menu-item, menu-menu, and menu-bar components.
 */
export function setupMenubar(): void {
  setupMenuItem();
  setupMenu();
  setupMenuBar();
  console.log("Menubar module initialized");
}

// Re-export the component classes and setup functions for convenience
export { MenuItem, setupMenuItem } from './MenuItem';
export { Menu, setupMenu } from './Menu';
export { MenuBar, setupMenuBar } from './MenuBar';
