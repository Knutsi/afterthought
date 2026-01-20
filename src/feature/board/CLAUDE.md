**Board feature**

This activity (see the root CLAUDE.md) implements a "board" where the user is free to place tasks and misc. visual tools to categorize and manage the tasks. The actual task data editing is managed by the task feature (might not be implemented yet).

Some initial plans that may or may not be implemented when you read this:
- Task nodes with dependencies
- Areas that categorize task nodes dropped into them
- In-diagram state machine drawing that can be applied to the elements, tracking their state
- 

**Organization and architecture**

- diagram-core: canvas-based interactive visual diagram that fucntions as the base of editing generic diagram elements
- diagram-board: extends diagram-core to work with the specific diagram elements of the board concept

The diagram will rely on "managers" that handle various aspects of the diagram:
- Stage (the elements)
- Input manager 
- Mode manager
- Geometry manager (lookup mechanism to find areas on and off screen where elements aree)

Modes are controllers that inputs are handed to at any given times, e.g. idle, drag-select, pan etc. They can be provided from outside the core (think?), so that e.g. diagram-type specific  

It is important that diagram-core remains generic and usable by other parts of the system later. It cannot depend on the board, but board can depend on core.
