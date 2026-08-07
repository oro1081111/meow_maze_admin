export const COLORS = ["R", "B", "G", "Y", "P"];
export const MODES = ["move", "rotate"];
export const STATUSES = ["draft", "published", "archived"];

export const COLOR_NAMES = {
  zh: { R: "紅色", B: "藍色", G: "綠色", Y: "黃色", P: "紫色" },
  ja: { R: "赤", B: "青", G: "緑", Y: "黄", P: "紫" },
  en: { R: "red", B: "blue", G: "green", Y: "yellow", P: "purple" }
};

export const DIRECTION_NAMES = {
  zh: {
    right: "右方",
    upperRight: "右上方",
    upperLeft: "左上方",
    left: "左方",
    lowerLeft: "左下方",
    lowerRight: "右下方"
  },
  ja: {
    right: "右",
    upperRight: "右上",
    upperLeft: "左上",
    left: "左",
    lowerLeft: "左下",
    lowerRight: "右下"
  },
  en: {
    right: "right",
    upperRight: "upper right",
    upperLeft: "upper left",
    left: "left",
    lowerLeft: "lower left",
    lowerRight: "lower right"
  }
};

export const DIRECTIONS = [
  { key: "right", offset: [1, 0] },
  { key: "upperRight", offset: [0, 1] },
  { key: "upperLeft", offset: [-1, 1] },
  { key: "left", offset: [-1, 0] },
  { key: "lowerLeft", offset: [0, -1] },
  { key: "lowerRight", offset: [1, -1] }
];

export const DEFAULT_POSITIONS = {
  G: [-1, 1],
  B: [-1, 0],
  Y: [0, 0],
  P: [1, 0],
  R: [1, -1]
};

export const DEFAULT_PLATE_MODES = {
  R: "move",
  B: "move",
  G: "move",
  Y: "move",
  P: "rotate"
};
