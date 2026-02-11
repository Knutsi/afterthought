# Activity Runtime

This folder contains the shared activity lifecycle runtime used by tabs, modals, and widgets.

## Design goals

- Keep web components thin and predictable.
- Move feature logic into controllers.
- Keep rendering code in view classes.
- Centralize tab metadata and context wiring boilerplate.

## Building a new activity

1. Create a view that implements `IActivityView`.
2. Create a controller that implements `IActivityController<TParams, TView>`.
3. Define an `IActivityDefinition` with:
   - `parseParams`
   - `createView`
   - `createController`
   - optional `getTabMeta`
4. Implement the activity element by extending `ActivityElementBase`.

The activity element should only compose these pieces and expose optional compatibility methods.
