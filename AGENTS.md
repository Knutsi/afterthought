# Repository Guidelines

Goal: long term open source project. We want to develop a task- and project management program with a novel UI (not just lists), based on a canvas where the users can track tasks and their dependencies, interact visually with their projects. Basically project management for visual thinkers. We also want to integrate AI tools to assist the user in some tasks. AI is not a primary focus, but something that slots in as normal modules here and there (if the user wants it).

Target plaforms: mainly desktop initially. We want menues, shortcut keys, toolbars and traditional UI elements.

Feature set: 
- TBD

# Architecture
- Avoid dependencies on heavy framework. The project should live long with few resources and needs to have minimal maintainence burden by external code like packages chaging
- Use standard web components for views. View should have their own viewmodels that is used for rendering.
- We want to use a centralized in-memory action registry where the actions a user can take are stored. Their availability updates based on what the program is doing, and what the user has selected e.g. We call this state the current "context". 

## Project Structure & Module Organization
- `src/` hosts the TypeScript UI code. Major areas include `src/feature/` for feature modules, `src/gui/` for shared UI components, and `src/service/` for service-layer logic.
- `src/styles.css` contains global styles.
- `src-tauri/` holds the Rust/Tauri app (`src-tauri/src/`), configuration (`src-tauri/tauri.conf.json`), and icons (`src-tauri/icons/`).
- `index.html`, `vite.config.ts`, and `tsconfig.json` define the Vite entry point and build configuration.

## Build, Test, and Development Commands
- `npm run tauri dev`: Run the full Tauri app in dev mode.
- `npm run tauri build`: Build the desktop app.

You should also run `npx tsc --noEmit` to typecheck the solution

## Coding Style & Naming Conventions
- TypeScript is built with `strict` settings; keep types explicit where inference is unclear.
- Indentation and semicolons are inconsistent in the current codebase; prefer C# style code format if you can
- Module paths often use explicit `.ts` extensions (see `src/main.ts`); keep that pattern when adding new imports.
- Names are typically lowerCamelCase for variables/functions and PascalCase for classes.
- Prefix interfaces with I like in C#

## Testing Guidelines
- No automated test suite is present yet. 
- Until then `npx tsc --noEmit` to test build

## Commit & Pull Request Guidelines
- Never commit. The user will take care of this.

