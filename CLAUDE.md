# Notes for Claude

## Project Architecture

This is a **Tauri application** consisting of:
- **Backend**: Rust (Tauri framework)
- **Frontend**: TypeScript + Web Components
- **UI Layer**: Custom Web Components using Shadow DOM

All UI components are built using native **Web Components** (Custom Elements) for modularity and encapsulation.

## Component Registration Pattern

All components extend `BaseComponent` and use `defineComponent()` for registration:

```typescript
import { BaseComponent, defineComponent } from '../core/BaseComponent';

export class MyComponent extends BaseComponent {
  static get observedAttributes(): string[] {
    return ['my-attr'];
  }

  protected onInit(): void {
    // Initialization logic
  }

  protected onDestroy(): void {
    // Cleanup logic
  }

  protected render(): void {
    this.shadowRoot!.innerHTML = `<div>My Component</div>`;
  }
}

defineComponent('my-component', MyComponent);
```

**Key principles:**
- Components auto-register when their module is imported (side-effect)
- No setup functions needed
- BaseComponent handles Shadow DOM, lifecycle, and initialization boilerplate
- Use `defineComponent()` at the end of each component file

## Allowed Build Commands

You can run the following commands to verify code:
- `npm run build` - Build the project
- `npm run tauri build` - Build the Tauri application
- `tsc --noEmit` - Type check without emitting files

**DO NOT** run the dev server (`npm run dev`) as it requires user interaction.
