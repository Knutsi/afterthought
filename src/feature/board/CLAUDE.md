**Board feature**

This activity (see the root CLAUDE.md) implements a "board" where the user is free to place tasks and misc. visual tools to categorize and manage the tasks. The actual task data editing is managed by the task feature (might not be implemented yet).

**Subsystems**

- diagram-core: canvas-based interactive visual diagram that fucntions as the base of editing generic diagram elements
- diagram-board: extends diagram-core to work with the specific diagram elements of the board concept

It is important that diagram-core remains generic and usable by other parts of the system later. It cannot depend on the board, but board can depend on core.
