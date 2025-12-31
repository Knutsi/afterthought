/**
 * CSS Utility Functions for Web Components
 *
 * Provides reusable CSS snippets for common patterns, especially vendor-prefixed properties.
 * These utilities work with template literal styles in Shadow DOM components.
 *
 * @example
 * ```typescript
 * import { noSelect, flexRow } from '../styles/cssUtilities';
 *
 * this.shadowRoot!.innerHTML = `
 *   <style>
 *     .my-element {
 *       ${noSelect()}
 *       ${flexRow()}
 *     }
 *   </style>
 * `;
 * ```
 */

/**
 * User Selection Utilities
 */

/**
 * Prevents text selection on an element.
 * Includes vendor prefixes for maximum browser compatibility (Tauri/WebKit).
 *
 * @returns CSS rules to disable user selection
 *
 * @example
 * ```typescript
 * .menu-button {
 *   ${noSelect()}
 *   cursor: pointer;
 * }
 * ```
 */
export const noSelect = (): string => `  -webkit-user-select: none;
  user-select: none;`;

/**
 * Allows text selection on an element (default behavior).
 * Useful for explicitly enabling selection after it was disabled on a parent.
 *
 * @returns CSS rules to enable user selection
 */
export const allowSelect = (): string => `  -webkit-user-select: text;
  user-select: text;`;

/**
 * Enables selection of all text content on interaction.
 *
 * @returns CSS rules for select-all behavior
 */
export const selectAll = (): string => `  -webkit-user-select: all;
  user-select: all;`;

/**
 * Typography Utilities
 */

/**
 * Truncates text with ellipsis when it overflows.
 * Requires a defined width or max-width on the element.
 *
 * @returns CSS rules for text truncation
 *
 * @example
 * ```typescript
 * .label {
 *   ${truncate()}
 *   max-width: 250px;
 * }
 * ```
 */
export const truncate = (): string => `  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;`;

/**
 * Limits text to a specific number of lines with ellipsis.
 * Uses -webkit-line-clamp for multi-line truncation.
 *
 * @param lines - Number of lines to display before truncating
 * @returns CSS rules for multi-line truncation
 */
export const lineClamp = (lines: number): string => `  display: -webkit-box;
  -webkit-line-clamp: ${lines};
  -webkit-box-orient: vertical;
  overflow: hidden;`;

/**
 * Flexbox Utilities
 */

/**
 * Creates a flex container with centered content (both axes).
 *
 * @returns CSS rules for centered flex container
 */
export const flexCenter = (): string => `  display: flex;
  align-items: center;
  justify-content: center;`;

/**
 * Creates a flex row container with vertically centered items.
 *
 * @param gap - Optional gap between flex items (e.g., '8px', '1rem')
 * @returns CSS rules for horizontal flex container
 */
export const flexRow = (gap?: string): string => {
  const gapRule = gap ? `\n  gap: ${gap};` : '';
  return `  display: flex;
  align-items: center;${gapRule}`;
};

/**
 * Creates a flex column container.
 *
 * @param gap - Optional gap between flex items (e.g., '8px', '1rem')
 * @returns CSS rules for vertical flex container
 */
export const flexColumn = (gap?: string): string => {
  const gapRule = gap ? `\n  gap: ${gap};` : '';
  return `  display: flex;
  flex-direction: column;${gapRule}`;
};

/**
 * Transform Utilities (with vendor prefixes)
 */

/**
 * Applies a CSS transform with vendor prefixes.
 *
 * @param value - Transform value (e.g., 'translateX(10px)', 'rotate(45deg)')
 * @returns CSS rules for transform with vendor prefixes
 */
export const transform = (value: string): string => `  -webkit-transform: ${value};
  transform: ${value};`;

/**
 * Enables GPU-accelerated rendering for smoother animations.
 * Uses translate3d hack for hardware acceleration.
 *
 * @returns CSS rules for GPU acceleration
 */
export const gpuAccelerate = (): string => `  -webkit-transform: translate3d(0, 0, 0);
  transform: translate3d(0, 0, 0);`;

/**
 * Appearance Utilities (with vendor prefixes)
 */

/**
 * Removes default browser styling from form elements.
 * Useful for creating custom-styled buttons, inputs, etc.
 *
 * @returns CSS rules to remove appearance
 */
export const noAppearance = (): string => `  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;`;

/**
 * Composite Utilities
 */

/**
 * Common utility for interactive menu items/buttons.
 * Combines no-select and cursor pointer.
 *
 * @returns CSS rules for clickable menu elements
 */
export const clickable = (): string => `  ${noSelect()}
  cursor: pointer;`;

/**
 * Common utility for non-interactive UI elements.
 * Prevents selection and pointer events.
 *
 * @returns CSS rules for non-interactive elements
 */
export const nonInteractive = (): string => `  ${noSelect()}
  pointer-events: none;`;
