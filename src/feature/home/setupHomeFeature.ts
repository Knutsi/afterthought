import { HOME_ACTIVITY_TAG } from "./types";
import { ServiceLayer } from "../../service/ServiceLayer";

export function setupHomeFeature(serviceLayer: ServiceLayer) {
  const homeActivity = serviceLayer.activityService.startActivity(HOME_ACTIVITY_TAG, {}, true);
  serviceLayer.activityService.switchToActivity(homeActivity.id);
}
