// NOTE:
//  We currently only support one activity container, but will add support for different types in the future,
//  e.g. modals and widgets that are slotted into larger customizable workspace pages.

export enum ActivityType {
  TAB = "tab",
  WIDGET = "widget",
  MODAL = "modal",
}

export interface IActivity {
  readonly activityId: string;
  readonly activityType: ActivityType;
  onGetContext(): void;
  onDropContext(): void;
}

export interface IActivityReference {
  id: string;
}

export const ActivityEvents = {
  ACTIVITY_SWITCHED: "activitySwitched",
  ACTIVITY_CLOSED: "activityClosed",
};

interface IActivityStackEntry {
  id: string;
  element: HTMLElement;
  activityType: ActivityType;
  isHomeActivity: boolean;
}

export class ActivityService extends EventTarget {
  private activityContainer: HTMLElement | null = null;
  private activityStack: IActivityStackEntry[] = [];

  public registerActivityContainer(container: HTMLElement) {
    this.activityContainer = container;
  }

  public startActivity<TArgs>(elementName: string, parameters: TArgs, isHomeActivity: boolean = false): IActivityReference {
    if (!this.activityContainer) {
      throw new Error("Activity container not registered");
    }

    const activityElement = document.createElement(elementName);
    activityElement.setAttribute("id", crypto.randomUUID().substring(0, 8));
    activityElement.setAttribute("data-parameters", JSON.stringify(parameters));
    this.activityContainer.appendChild(activityElement);

    // Determine activity type from the element if it implements IActivity
    const activityType = this.isActivity(activityElement)
      ? activityElement.activityType
      : ActivityType.TAB;

    // Drop context from previous top activity
    const previousTop = this.activityStack.length > 0
      ? this.activityStack[this.activityStack.length - 1]
      : null;
    if (previousTop && this.isActivity(previousTop.element)) {
      previousTop.element.onDropContext();
    }

    // Push to stack
    this.activityStack.push({
      id: activityElement.id,
      element: activityElement,
      activityType,
      isHomeActivity,
    });

    // New activity gets context
    if (this.isActivity(activityElement)) {
      activityElement.onGetContext();
    }

    return { id: activityElement.id };
  }

  public switchToActivity(id: string): void {
    const targetIndex = this.activityStack.findIndex((entry) => entry.id === id);
    if (targetIndex === -1) return;

    const currentTop = this.activityStack.length > 0 ? this.activityStack[this.activityStack.length - 1] : null;
    const target = this.activityStack[targetIndex];

    // If already at top, nothing to do
    if (currentTop && currentTop.id === id) return;

    // Call onDropContext on previous top activity
    if (currentTop && this.isActivity(currentTop.element)) {
      currentTop.element.onDropContext();
    }

    // Move target to top of stack (reorder)
    this.activityStack.splice(targetIndex, 1);
    this.activityStack.push(target);

    // Call onGetContext on new top activity
    if (this.isActivity(target.element)) {
      target.element.onGetContext();
    }

    this.dispatchEvent(new CustomEvent(ActivityEvents.ACTIVITY_SWITCHED));
  }

  public closeActivity(id: string): void {
    const targetIndex = this.activityStack.findIndex((entry) => entry.id === id);
    if (targetIndex === -1) return;

    const target = this.activityStack[targetIndex];

    // HomeActivity cannot be closed
    if (target.isHomeActivity) {
      console.warn("Cannot close HomeActivity");
      return;
    }

    const isActiveActivity = targetIndex === this.activityStack.length - 1;

    // If closing the active activity, call onDropContext
    if (isActiveActivity && this.isActivity(target.element)) {
      target.element.onDropContext();
    }

    // Remove from stack
    this.activityStack.splice(targetIndex, 1);

    // Dispatch close event
    this.dispatchEvent(new CustomEvent(ActivityEvents.ACTIVITY_CLOSED, { detail: { id } }));

    // If we closed the active activity, switch to new top
    if (isActiveActivity && this.activityStack.length > 0) {
      const newTop = this.activityStack[this.activityStack.length - 1];
      // Call onGetContext on the new top
      if (this.isActivity(newTop.element)) {
        newTop.element.onGetContext();
      }
      this.dispatchEvent(new CustomEvent(ActivityEvents.ACTIVITY_SWITCHED));
    }
  }

  public getActiveActivityId(): string {
    if (this.activityStack.length === 0) return "";
    return this.activityStack[this.activityStack.length - 1].id;
  }

  public getActiveActivity(): (HTMLElement & IActivity) | null {
    if (this.activityStack.length === 0) return null;
    const top = this.activityStack[this.activityStack.length - 1];
    if (this.isActivity(top.element)) {
      return top.element;
    }
    return null;
  }

  public isActivity(element: HTMLElement): element is HTMLElement & IActivity {
    return (
      "activityId" in element &&
      "activityType" in element &&
      "onGetContext" in element &&
      "onDropContext" in element &&
      typeof (element as IActivity).onGetContext === "function" &&
      typeof (element as IActivity).onDropContext === "function"
    );
  }
}
