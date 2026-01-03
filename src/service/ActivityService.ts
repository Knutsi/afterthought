export interface IActivityReference {
  id: string;
}

export const ActivityEvents = {
  ACTIVITY_SWITCHED: "activitySwitched",
};

export class ActivityService extends EventTarget {
  private activityContainer: HTMLElement | null = null;
  private activeActivityId: string = "";

  public registerActivityContainer(container: HTMLElement) {
    this.activityContainer = container;
  }

  public startActivity<TArgs>(elementName: string, parameters: TArgs): IActivityReference {
    if (!this.activityContainer) {
      throw new Error("Activity container not registered");
    }

    const activityElement = document.createElement(elementName);
    activityElement.setAttribute("id", crypto.randomUUID().substring(0, 8));
    activityElement.setAttribute("data-activity-parameters", JSON.stringify(parameters));
    this.activityContainer.appendChild(activityElement);

    return { id: activityElement.id };
  }

  public switchToActivity(id: string): void {
    this.activeActivityId = id;
    this.dispatchEvent(new CustomEvent(ActivityEvents.ACTIVITY_SWITCHED));
  }

  public getActiveActivityId(): string {
    return this.activeActivityId;
  }
}
