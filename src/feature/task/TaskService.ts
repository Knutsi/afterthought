import { ServiceLayer } from "../../service/ServiceLayer";
import { IObject } from "../../service/ObjectService";
import { Task, TaskID, TaskCreateResult, TASK_STORE_ID } from "./types";
import { createUri, URI_SCHEMES } from "../../core-model/uri";
import { showTaskEditor } from "./editor/showTaskEditor";

export class TaskService {
  private serviceLayer: ServiceLayer;

  constructor(serviceLayer: ServiceLayer) {
    this.serviceLayer = serviceLayer;
  }

  async initialize(): Promise<void> {
    const objectService = this.serviceLayer.getObjectService();
    await objectService.getOrCreateStore(TASK_STORE_ID, 'tasks');
  }

  // Create new task
  async newTask(name: string): Promise<TaskCreateResult> {
    const objectService = this.serviceLayer.getObjectService();

    const taskId = crypto.randomUUID();
    const taskUri = createUri(URI_SCHEMES.TASK, taskId);

    const object = await objectService.createObjectWithId(TASK_STORE_ID, taskId, 'task', {
      id: taskUri,
      name,
      done: false,
      description: null,
      deadline: null,
      archivedAtUtc: null
    });

    return { taskUri, object };
  }

  // Delete task
  async deleteTask(taskId: TaskID): Promise<boolean> {
    const objectService = this.serviceLayer.getObjectService();
    return objectService.deleteObject(TASK_STORE_ID, taskId);
  }

  // Update task name
  async updateTaskName(taskId: TaskID, name: string): Promise<IObject | null> {
    return this.updateTask(taskId, { name });
  }

  // Update task description
  async updateTaskDescription(taskId: TaskID, description: string | null): Promise<IObject | null> {
    return this.updateTask(taskId, { description });
  }

  // Update task status (done)
  async updateTaskStatus(taskId: TaskID, done: boolean): Promise<IObject | null> {
    return this.updateTask(taskId, { done });
  }

  async updateTaskDeadline(taskId: TaskID, deadline: Date | null): Promise<IObject | null> {
    return this.updateTask(taskId, { deadline });
  }

  async openEditor(taskUri: string): Promise<boolean> {
    return showTaskEditor(this.serviceLayer, taskUri);
  }

  // Helper to update any task fields
  private async updateTask(taskId: TaskID, updates: Partial<Task>): Promise<IObject | null> {
    const objectService = this.serviceLayer.getObjectService();
    const existing = await objectService.getObject(TASK_STORE_ID, taskId);
    if (!existing) return null;

    return objectService.updateObject(TASK_STORE_ID, taskId, {
      ...existing.data,
      ...updates
    });
  }

  // Get all tasks
  async getAllTasks(): Promise<IObject[]> {
    const objectService = this.serviceLayer.getObjectService();
    return objectService.getObjectsByStore(TASK_STORE_ID);
  }

  // Get single task
  async getTask(taskId: TaskID): Promise<IObject | null> {
    const objectService = this.serviceLayer.getObjectService();
    return objectService.getObject(TASK_STORE_ID, taskId);
  }
}
