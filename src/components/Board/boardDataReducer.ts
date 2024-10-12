import { createContext } from "react";
import { v4 as uuidv4 } from "uuid";

import { BoardDataContextType, BoardDataActionType } from "./types";

export const BoardDataStateContext = createContext<BoardDataContextType>({
  group: {},
  tab: {},
});

export const BoardDataDispatchContext = createContext<React.Dispatch<BoardDataActionType> | null>(null);

const boardDataReducer = (state: BoardDataContextType, action: BoardDataActionType) => {
  switch (action.type) {
    case "UPDATE_GROUP_POSITION": {
      const { groupId, x, y } = action.payload;
      if (!state.group[groupId]) return state;

      const updatedGroup = {
        ...state.group[groupId],
        position: { x, y },
      };

      return {
        ...state,
        group: {
          ...state.group,
          [groupId]: updatedGroup,
        },
      };
    }
    case "UPDATE_GROUP_SIZE": {
      const { groupId, x, y, width, height } = action.payload;
      if (!state.group[groupId]) return state;

      const updatedGroup = {
        ...state.group[groupId],
        position: { x, y },
        size: { width, height },
      };

      return {
        ...state,
        group: {
          ...state.group,
          [groupId]: updatedGroup,
        },
      };
    }
    case "UPDATE_GROUP_FULL_SCREEN": {
      const { groupId, x, y, width, height, isFullScreen } = action.payload;
      if (!state.group[groupId]) return state;

      const currentGroup = state.group[groupId];
      let updatedGroup;

      if (isFullScreen) {
        updatedGroup = {
          ...currentGroup,
          size: currentGroup.prevSize,
          position: currentGroup.prevPosition,
        };
      } else {
        updatedGroup = {
          ...currentGroup,
          prevSize: currentGroup.size,
          size: { width, height },
          prevPosition: currentGroup.position,
          position: { x, y },
        };
      }

      return {
        ...state,
        group: {
          ...state.group,
          [groupId]: updatedGroup,
        },
      };
    }
    case "UPDATE_GROUP_TABS_ID_LIST": {
      const { groupId, tabIds } = action.payload;
      if (!state.group[groupId]) return state;

      const updatedGroup = {
        ...state.group[groupId],
        tabIds,
      };

      return {
        ...state,
        group: {
          ...state.group,
          [groupId]: updatedGroup,
        },
      };
    }
    case "DIVIDE_GROUP": {
      const { groupId, tabId, position, size } = action.payload;
      if (!state.group[groupId]) return state;

      const newGroup = { ...state.group };

      if (newGroup[groupId].tabIds.length === 1) {
        delete newGroup[groupId];
      } else {
        const tabIds = newGroup[groupId].tabIds.filter((id) => id !== tabId);
        newGroup[groupId] = {
          ...newGroup[groupId],
          tabIds,
          selectedTabId: tabIds[0],
        };
      }

      const newGroupId = uuidv4();
      newGroup[newGroupId] = {
        id: newGroupId,
        tabIds: [tabId],
        selectedTabId: tabId,
        position,
        prevPosition: position,
        size,
        prevSize: size,
      };

      return {
        ...state,
        group: newGroup,
      };
    }
    case "COMBINE_GROUP": {
      const { currGroupId, combGroupId, currTabId, combTabIds } = action.payload;
      if (!state.group[currGroupId]) return state;

      const newGroup = { ...state.group };

      if (newGroup[currGroupId].tabIds.length === 1) {
        delete newGroup[currGroupId];
      } else {
        const tabIds = newGroup[currGroupId].tabIds.filter((id) => id !== currTabId);
        newGroup[currGroupId] = {
          ...newGroup[currGroupId],
          tabIds,
          selectedTabId: tabIds[0],
        };
      }

      newGroup[combGroupId] = {
        ...newGroup[combGroupId],
        tabIds: combTabIds,
        selectedTabId: currTabId,
      };

      return {
        ...state,
        group: newGroup,
      };
    }
    case "SELECT_TAB": {
      const { groupId, tabId } = action.payload;
      if (!state.group[groupId]) return state;

      const updatedGroup = {
        ...state.group[groupId],
        selectedTabId: tabId,
      };

      return {
        ...state,
        group: {
          ...state.group,
          [groupId]: updatedGroup,
        },
      };
    }
    default:
      return state;
  }
};

export default boardDataReducer;
