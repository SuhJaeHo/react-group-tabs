import { createContext } from "react";
import { BoardLayoutContextType, BoardLayoutActionType } from "./types";

export const boardLayoutInitialState = {
  tabIndicate: { groupId: "", tabIdx: 0 },
};

export const BoardLayoutStateContext = createContext<BoardLayoutContextType>({
  tabIndicate: { groupId: "", tabIdx: 0 },
});

export const BoardLayoutDispatchContext = createContext<React.Dispatch<BoardLayoutActionType> | null>(null);

const boardLayoutReducer = (state: BoardLayoutContextType, action: BoardLayoutActionType) => {
  switch (action.type) {
    case "UPDATE_TAB_INDICATOR": {
      const { groupId, tabIdx } = action.payload;

      return { ...state, tabIndicate: { groupId, tabIdx } };
    }
    default:
      return state;
  }
};

export default boardLayoutReducer;
