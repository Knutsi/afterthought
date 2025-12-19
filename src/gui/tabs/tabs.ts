// Unified setup module for tab components
import { setupTabPage } from './TabPage';
import { setupTabContainer } from './TabContainer';

/**
 * Sets up all tab-related custom elements.
 * This function registers both tab-page and tab-container components.
 */
export function setupTabs(): void {
  setupTabPage();
  setupTabContainer();
  console.log("Tabs module initialized");
}

// Re-export the component classes and setup functions for convenience
export { TabPage, setupTabPage } from './TabPage';
export { TabContainer, setupTabContainer } from './TabContainer';

