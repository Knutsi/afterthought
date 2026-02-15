// NOTE:
//  We currently only support one activity container, but will add support for different types in the future,
//  e.g. modals and widgets that are slotted into larger customizable workspace pages.
import type { ServiceLayer } from "./ServiceLayer";
import type { IContextPart } from "./context/types";
import type { ContextPart } from "./context/ContextService";
import type { IActivitySession } from "./database/PersonalStore";
import type { SearchPicker, PickerItem } from "../gui/picker/SearchPicker";

export enum ActivityType {
  TAB = "tab",
  WIDGET = "widget",
  MODAL = "modal",
}

export interface IActivity {
  readonly activityId: string;
  readonly activityType: ActivityType;
  onGetContext(contextPart: IContextPart): void;
  onDropContext(): void;
  onPersistSession?(): Record<string, unknown>;
}

export interface IActivityReference {
  id: string;
}

export const ActivityEvents = {
  ACTIVITY_SWITCHED: "activitySwitched",
  ACTIVITY_CLOSED: "activityClosed",
  MODAL_OPENED: "modalOpened",
  MODAL_CLOSED: "modalClosed",
};

interface IActivityStackEntry {
  id: string;
  element: HTMLElement;
  activityType: ActivityType;
  isHomeActivity: boolean;
  contextPart: ContextPart;
}

export class ActivityService extends EventTarget {
  private activityContainer: HTMLElement | null = null;
  private modalContainer: HTMLElement | null = null;
  private activityStack: IActivityStackEntry[] = [];
  private modalActivities: Map<string, HTMLElement> = new Map();
  private serviceLayer: ServiceLayer;

  constructor(serviceLayer: ServiceLayer) {
    super();
    this.serviceLayer = serviceLayer;
  }

  public registerActivityContainer(container: HTMLElement) {
    this.activityContainer = container;
  }

  public registerModalContainer(container: HTMLElement) {
    this.modalContainer = container;
  }

  public startActivity<TArgs>(elementName: string, parameters: TArgs, isHomeActivity: boolean = false): IActivityReference {
    const activityElement = document.createElement(elementName);
    activityElement.setAttribute("id", crypto.randomUUID().substring(0, 8));
    activityElement.setAttribute("data-parameters", JSON.stringify(parameters));

    // determine activity type before appending
    const activityType = this.isActivity(activityElement)
      ? activityElement.activityType
      : ActivityType.TAB;

    // modal activities go to the modal container
    if (activityType === ActivityType.MODAL) {
      if (!this.modalContainer) {
        throw new Error("Modal container not registered");
      }
      this.modalContainer.appendChild(activityElement);
      this.modalActivities.set(activityElement.id, activityElement);
      this.dispatchEvent(new CustomEvent(ActivityEvents.MODAL_OPENED, { detail: { id: activityElement.id } }));
      return { id: activityElement.id };
    }

    // tab/widget activities go to the activity container
    if (!this.activityContainer) {
      throw new Error("Activity container not registered");
    }

    this.activityContainer.appendChild(activityElement);

    const contextService = this.serviceLayer.getContextService();
    const contextPart = contextService.createPart();

    // Drop context from previous top activity
    const previousTop = this.activityStack.length > 0
      ? this.activityStack[this.activityStack.length - 1]
      : null;
    if (previousTop) {
      if (this.isActivity(previousTop.element)) {
        previousTop.element.onDropContext();
      }
    }

    // Install the new part
    contextService.installPart(contextPart);

    // Push to stack
    const stackEntry: IActivityStackEntry = {
      id: activityElement.id,
      element: activityElement,
      activityType,
      isHomeActivity,
      contextPart,
    };

    this.activityStack.push(stackEntry);

    // New activity gets context
    if (this.isActivity(activityElement)) {
      activityElement.onGetContext(contextPart);
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

    // Swap context parts
    const contextService = this.serviceLayer.getContextService();
    if (currentTop) {
      contextService.swapPart(currentTop.contextPart, target.contextPart);
    } else {
      contextService.installPart(target.contextPart);
    }

    // Call onGetContext on new top activity
    if (this.isActivity(target.element)) {
      target.element.onGetContext(target.contextPart);
    }

    this.dispatchEvent(new CustomEvent(ActivityEvents.ACTIVITY_SWITCHED));
  }

  public closeActivity(id: string): void {
    // check modal activities first
    const modalElement = this.modalActivities.get(id);
    if (modalElement) {
      modalElement.remove();
      this.modalActivities.delete(id);
      this.dispatchEvent(new CustomEvent(ActivityEvents.MODAL_CLOSED, { detail: { id } }));
      this.dispatchEvent(new CustomEvent(ActivityEvents.ACTIVITY_CLOSED, { detail: { id } }));
      return;
    }

    const targetIndex = this.activityStack.findIndex((entry) => entry.id === id);
    if (targetIndex === -1) return;

    const target = this.activityStack[targetIndex];

    // HomeActivity cannot be closed
    if (target.isHomeActivity) {
      console.warn("Cannot close HomeActivity");
      return;
    }

    const isActiveActivity = targetIndex === this.activityStack.length - 1;
    const contextService = this.serviceLayer.getContextService();

    // If closing the active activity, call onDropContext and uninstall part
    if (isActiveActivity) {
      if (this.isActivity(target.element)) {
        target.element.onDropContext();
      }
      contextService.uninstallPart(target.contextPart);
    }

    // Remove from stack
    this.activityStack.splice(targetIndex, 1);

    // Dispatch close event
    this.dispatchEvent(new CustomEvent(ActivityEvents.ACTIVITY_CLOSED, { detail: { id } }));

    // If we closed the active activity, switch to new top
    if (isActiveActivity && this.activityStack.length > 0) {
      const newTop = this.activityStack[this.activityStack.length - 1];
      contextService.installPart(newTop.contextPart);
      if (this.isActivity(newTop.element)) {
        newTop.element.onGetContext(newTop.contextPart);
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

  public getActiveContextPart(): IContextPart | null {
    if (this.activityStack.length === 0) return null;
    return this.activityStack[this.activityStack.length - 1].contextPart;
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

  public getHomeActivityId(): string | null {
    const entry = this.activityStack.find((e) => e.isHomeActivity);
    return entry ? entry.id : null;
  }

  public findActivitiesByTag(tag: string): { id: string; params: Record<string, unknown> }[] {
    return this.activityStack
      .filter((entry) => entry.element.tagName.toLowerCase() === tag)
      .map((entry) => ({
        id: entry.id,
        params: JSON.parse(entry.element.getAttribute("data-parameters") || "{}"),
      }));
  }

  public getTabActivities(): { id: string; label: string; isHomeActivity: boolean }[] {
    if (!this.activityContainer) return [];

    const result: { id: string; label: string; isHomeActivity: boolean }[] = [];
    for (const child of Array.from(this.activityContainer.children)) {
      const entry = this.activityStack.find((e) => e.id === child.id);
      if (!entry) continue;
      const label = child.getAttribute("tab-label") || "Untitled";
      result.push({ id: entry.id, label, isHomeActivity: entry.isHomeActivity });
    }
    return result;
  }

  public switchToNextActivity(): void {
    if (!this.activityContainer) return;
    const children = Array.from(this.activityContainer.children);
    if (children.length <= 1) return;

    const activeId = this.getActiveActivityId();
    const currentIndex = children.findIndex((el) => el.id === activeId);
    if (currentIndex === -1) return;

    const nextIndex = (currentIndex + 1) % children.length;
    this.switchToActivity(children[nextIndex].id);
  }

  public switchToPreviousActivity(): void {
    if (!this.activityContainer) return;
    const children = Array.from(this.activityContainer.children);
    if (children.length <= 1) return;

    const activeId = this.getActiveActivityId();
    const currentIndex = children.findIndex((el) => el.id === activeId);
    if (currentIndex === -1) return;

    const prevIndex = (currentIndex - 1 + children.length) % children.length;
    this.switchToActivity(children[prevIndex].id);
  }

  public openActivitySwitcher(): void {
    const tabs = this.getTabActivities();
    const activeId = this.getActiveActivityId();

    const items: PickerItem[] = tabs.map((tab) => ({
      id: tab.id,
      name: tab.label,
      detail: tab.id === activeId ? "(active)" : undefined,
    }));

    const picker = document.getElementById("search-picker") as SearchPicker;
    picker.configure(items);

    picker.onSelect = (item: PickerItem) => {
      picker.hide();
      this.switchToActivity(item.id);
    };

    picker.onCancel = () => {
      picker.hide();
    };

    picker.show();
  }

  public collectActivitySessions(): IActivitySession[] {
    if (!this.activityContainer) return [];

    const sessions: IActivitySession[] = [];
    for (const child of Array.from(this.activityContainer.children)) {
      const entry = this.activityStack.find((e) => e.id === child.id);
      if (!entry) continue;

      const params = JSON.parse(entry.element.getAttribute("data-parameters") || "{}");
      if (this.isActivity(entry.element) && entry.element.onPersistSession) {
        Object.assign(params, entry.element.onPersistSession());
      }
      sessions.push({
        elementName: entry.element.tagName.toLowerCase(),
        params,
        isHomeActivity: entry.isHomeActivity,
      });
    }
    return sessions;
  }
}
