# Notes for Claude

## Project Architecture

This is a **Tauri application** consisting of:

- **Overall**: Tauri 2 framework (dont confuse with Tauri 1)
- **Backend**: Rust (Tauri framework)
- **Frontend**: TypeScript + Web Components
- **UI Layer**: Custom Web Components using Shadow DOM

All UI components are built using native **Web Components** (Custom Elements) for modularity and encapsulation.

main.ts is the entrypoint

## Component Registration Pattern

All components extend `BaseComponent` and use `defineComponent()` for registration:

```typescript
import { BaseComponent, defineComponent } from "../core/BaseComponent";

export class MyComponent extends BaseComponent {
  static get observedAttributes(): string[] {
    return ["my-attr"];
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

defineComponent("my-component", MyComponent);
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
- `npx tsc --noEmit` - Type check without emitting files

**DO NOT** run the dev server (`npm run dev`) as it requires user interaction.

**Organization**

Afterthought has a core set of services, and a collection of features. 

"Features"" provide 
(a) Actions and 
(b) **Activities**. Activities all have a custom HTML element, and are added to the DOM. Examples of activities are: settings dialog, home tab, boards, task list. 

**Context** binds activities (what the user is seeing and interacting with at any given moment) to actions, and actions materialize and commands in lists, toolbar buttons, menus and keyboard shortcuts. Their availability changes by what is in the context, or what HAS been in it.   

- Core application features as a base:
  - theme
  - dynamic menus
  - actions (unified system for application actions, added by features, respond to context, base for menu items)
  - activity (tabs, modals)
  - service layer (extended further by features)
  - more ..
- Features go in separate directories, e.g. :
  - Task feature (write, store and process tasks)
  - Home-view (pinned tab as a starting point)
  - Settings
  - (more to come)

  Features can use core application mehanisms directly, but need to go through an interface to talk to other non-core features.

**Prefered choices**

- Prefer css grid to flex
- themes use css variables
- never commit to git yourself


Code style:
- Add CONSTANTS_IN_CAPS to avoid magic strings in the modules. Place constants on top of modules and only export the needed ones. 
- For constants used in more than one file, put them into the relevant types.ts file. 
