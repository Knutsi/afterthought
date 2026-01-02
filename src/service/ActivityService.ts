export class ActivityService extends EventTarget {
  private activityContainer: HTMLElement | null = null;

  public registerActivityContainer(container: HTMLElement) {
    this.activityContainer = container;
  }

  public startActivity<TArgs>(elementName: string, parameters: TArgs) {
    if (!this.activityContainer) {
      throw new Error("Activity container not registered");
    }

    const activityElement = document.createElement(elementName);
    activityElement.setAttribute("id", crypto.randomUUID());
    activityElement.setAttribute("data-activity-name", elementName);
    activityElement.setAttribute("data-activity-parameters", JSON.stringify(parameters));
    this.activityContainer.appendChild(activityElement);
  }
}
