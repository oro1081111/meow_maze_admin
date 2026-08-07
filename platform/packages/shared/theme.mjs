export const PUZZLE_THEME = {
  canvas: {
    width: 1200,
    height: 1200,
    background: "#fbfaf2"
  },
  number: {
    x: 78,
    labelY: 126,
    numberY: 285,
    labelSize: 22,
    fontSize: 178,
    color: "#171612"
  },
  best: {
    centerX: 1010,
    numberY: 234,
    labelY: 274,
    numberSize: 110,
    background: "#8f9190",
    foreground: "#ffffff"
  },
  tile: {
    halfWidth: 143,
    halfHeight: 165,
    dotRadius: 13,
    iconStroke: 3.5,
    outline: "#171612",
    iconBackground: "#fbfaf2"
  },
  cat: {
    size: 210
  },
  palettes: {
    R: { light: "#ff777d", dark: "#9c3d43" },
    B: { light: "#7398f0", dark: "#2c56b6" },
    G: { light: "#5debae", dark: "#008c55" },
    Y: { light: "#ffe36d", dark: "#c9aa12" },
    P: { light: "#f09af0", dark: "#a842a6" }
  }
};

export function mergeTheme(overrides = {}) {
  return {
    ...PUZZLE_THEME,
    ...overrides,
    canvas: { ...PUZZLE_THEME.canvas, ...overrides.canvas },
    number: { ...PUZZLE_THEME.number, ...overrides.number },
    best: { ...PUZZLE_THEME.best, ...overrides.best },
    tile: { ...PUZZLE_THEME.tile, ...overrides.tile },
    cat: { ...PUZZLE_THEME.cat, ...overrides.cat },
    palettes: {
      ...PUZZLE_THEME.palettes,
      ...overrides.palettes
    }
  };
}
