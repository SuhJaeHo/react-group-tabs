export const RESIZE_DIRECTIONS = {
  Top: "Top",
  Bottom: "Bottom",
  Left: "Left",
  Right: "Right",
  TopLeft: "TopLeft",
  TopRight: "TopRight",
  BottomLeft: "BottomLeft",
  BottomRight: "BottomRight",
} as const;

export const TAB_MOVE_STATUS = {
  Default: "Default",
  Divided: "Divided",
  Combine: "Combine",
} as const;

export const TAB_TRANSLATE_STATUS = {
  Default: "Default",
  Left: "Left",
  Right: "Right",
} as const;

export const CUSTOM_ZINDEX = {
  Default: "initial",
  Foreground: "10",
  Top: "20",
} as const;

export const TAB_SIZE = {
  Width: 80,
  Height: 30,
} as const;

export const GROUP_MIN_SIZE = {
  WIDTH: 300,
  HEIGHT: 300,
} as const;
