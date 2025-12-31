// Unified setup module for menubar components
// Components auto-register via defineComponent() when imported
import './MenuItem';
import './Menu';
import './MenuBar';

/**
 * Sets up all menubar-related custom elements.
 * This function imports all menubar components, triggering their auto-registration.
 */
export function setupMenubar(): void {
  // Components are already registered via side-effect imports above
  console.log("Menubar module initialized");
}

// Re-export the component classes for convenience
export { MenuItem } from './MenuItem';
export { Menu } from './Menu';
export { MenuBar } from './MenuBar';
