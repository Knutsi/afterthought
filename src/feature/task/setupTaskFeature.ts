import { ServiceLayer } from "../../service/ServiceLayer";
import { TaskService } from "./TaskService";
import { TASK_SERVICE_NAME } from "./types";

export async function setupTaskFeature(serviceLayer: ServiceLayer): Promise<void> {
  const taskService = new TaskService(serviceLayer);
  await taskService.initialize();
  serviceLayer.registerFeatureService(TASK_SERVICE_NAME, taskService);
}
