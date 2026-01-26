Here is how the service will work (an example):

1. The application adds the current application settings object to the context (just it's URI + source service that identifies it). This happens on application start.
2. User opens a board (in some way). Board gets added to the context service. 
3. User adds a Task to the board (using the TaskService). The task gets selected, and selection adds the Task to the context alongside the board, with the board marked as the parent of the task
4. The user switches activity to another board. The current context gets deactivated (no longer current), then the new board gets added (or re-activated).

Every time anything in the context changes, the canDo(context) method on all actions are re-evaluated. Each action context.

Each program instance can only have one active context at a time, but inactive ones can exist.
