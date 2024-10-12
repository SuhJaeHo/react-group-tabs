export interface IPosition {
  x: number;
  y: number;
}

export interface ISize {
  width: number;
  height: number;
}

export interface IGroupIndicate {
  position: IPosition;
  size: ISize;
}

export interface ITabIndicate {
  groupId: string;
  tabIdx: number;
}

export interface IGroup {
  [key: string]: {
    id: string;
    tabIds: string[];
    selectedTabId: string;
    position: IPosition;
    prevPosition: IPosition;
    size: ISize;
    prevSize: ISize;
  };
}

export interface ITab {
  [key: string]: {
    id: string;
    groupId: string;
    name: string;
  };
}

export type BoardDataContextType = {
  group: IGroup;
  tab: ITab;
};

export type BoardDataActionType =
  | {
      type: "UPDATE_GROUP_SIZE";
      payload: {
        groupId: string;
        x: number;
        y: number;
        width: number;
        height: number;
      };
    }
  | {
      type: "UPDATE_GROUP_POSITION";
      payload: {
        groupId: string;
        x: number;
        y: number;
      };
    }
  | {
      type: "UPDATE_GROUP_FULL_SCREEN";
      payload: {
        groupId: string;
        x: number;
        y: number;
        width: number;
        height: number;
        isFullScreen: boolean;
      };
    }
  | {
      type: "UPDATE_GROUP_TABS_ID_LIST";
      payload: {
        groupId: string;
        tabIds: string[];
      };
    }
  | {
      type: "DIVIDE_GROUP";
      payload: {
        groupId: string;
        tabId: string;
        position: IPosition;
        size: ISize;
      };
    }
  | {
      type: "COMBINE_GROUP";
      payload: {
        currGroupId: string;
        combGroupId: string;
        currTabId: string;
        combTabIds: string[];
      };
    }
  | {
      type: "SELECT_TAB";
      payload: {
        groupId: string;
        tabId: string;
      };
    };

export type BoardLayoutContextType = {
  tabIndicate: ITabIndicate;
};

export type BoardLayoutActionType = {
  type: "UPDATE_TAB_INDICATOR";
  payload: {
    groupId: string;
    tabIdx: number;
  };
};

export interface IGroupHeaderProps extends Required<IGroup[keyof IGroup]> {
  groupElementPosition: IPosition;
}

export interface ITabProps extends Required<IGroup[keyof IGroup]> {
  tabId: string;
  tabIdx: number;
}
