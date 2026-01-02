import { HOME_ACTIVITY_TAG } from "./types";
import { ServiceLayer } from "../../service/ServiceLayer";

export function setupHomeFeature(serviceLayer: ServiceLayer) {
  serviceLayer.activityService.startActivity(HOME_ACTIVITY_TAG, {});
}
