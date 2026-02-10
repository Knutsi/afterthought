import { defineComponent } from "../../gui/core/BaseComponent";
import { ActivityType } from "../../service/ActivityService";
import type { Uri } from "../../core-model/uri";
import type { IContextPart } from "../../service/context/types";
import { ActivityElementBase } from "../../gui/activity/runtime/ActivityElementBase";
import type { IActivityDefinition } from "../../gui/activity/runtime/types";
import { BOARD_ACTIVITY_TAG, type IBoardActivityParams } from "./types";
import type { BoardSyncAdapter } from "./BoardSyncAdapter";
import type { Diagram } from "./editor/diagram-core/Diagram";
import { BoardActivityController } from "./BoardActivityController";
import { BoardActivityView } from "./BoardActivityView";

export interface IBoardActivityData {
  name: string;
}

const BOARD_ACTIVITY_DEFINITION: IActivityDefinition<
  IBoardActivityParams,
  BoardActivityView,
  BoardActivityController
> = {
  activityType: ActivityType.TAB,
  parseParams: (rawParameters: string | null): IBoardActivityParams => {
    if (!rawParameters) {
      throw new Error("Board activity requires data-parameters");
    }

    const parsed = JSON.parse(rawParameters) as Partial<IBoardActivityParams>;
    if (typeof parsed.name !== "string" || parsed.name.trim().length === 0) {
      throw new Error("Board activity requires a non-empty 'name' parameter");
    }

    const parsedOpenBoardId = parsed.openBoardId;
    const openBoardId = typeof parsedOpenBoardId === "string" ? parsedOpenBoardId : null;

    return {
      name: parsed.name,
      openBoardId,
    };
  },
  createView: (): BoardActivityView => {
    return new BoardActivityView();
  },
  createController: (serviceLayer): BoardActivityController => {
    return new BoardActivityController(serviceLayer);
  },
  getTabMeta: (params): { label: string; closeable: boolean } => {
    return {
      label: params.name,
      closeable: true,
    };
  },
};

export class BoardActivity extends ActivityElementBase<
  IBoardActivityParams,
  BoardActivityView,
  BoardActivityController
> {
  constructor() {
    super(BOARD_ACTIVITY_DEFINITION);
  }

  getDiagram(): Diagram | null {
    return this.getActivityController()?.getDiagram() ?? null;
  }

  getBoardUri(): Uri | null {
    return this.getActivityController()?.getBoardUri() ?? null;
  }

  getContextPart(): IContextPart | null {
    return this.getActivityContextPart();
  }

  getSyncAdapter(): BoardSyncAdapter | null {
    return this.getActivityController()?.getSyncAdapter() ?? null;
  }
}

defineComponent(BOARD_ACTIVITY_TAG, BoardActivity);

declare global {
  interface HTMLElementTagNameMap {
    [BOARD_ACTIVITY_TAG]: BoardActivity;
  }
}
