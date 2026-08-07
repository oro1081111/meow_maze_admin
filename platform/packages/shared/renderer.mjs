import { COLORS } from "./constants.mjs";
import { mergeTheme } from "./theme.mjs";

const SLOT_SCREEN = {
  "0,0": [583, 667],
  "-1,0": [297, 667],
  "1,0": [869, 667],
  "-1,1": [440, 420],
  "0,1": [726, 420],
  "0,-1": [440, 914],
  "1,-1": [726, 914]
};

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function screenPosition(position) {
  const key = position.join(",");
  const direct = SLOT_SCREEN[key];
  if (direct) return { x: direct[0], y: direct[1] };
  const [q, r] = position;
  return {
    x: 583 + q * 286 + r * 143,
    y: 667 - r * 247
  };
}

function movementIcon(theme) {
  return `<g transform="translate(0 -125)"><rect x="-21" y="-18" width="42" height="36" rx="12" fill="${theme.tile.iconBackground}" stroke="${theme.tile.outline}" stroke-width="3"/><path d="M-14 0H14M-14 0l6-6M-14 0l6 6M14 0l-6-6M14 0l-6 6" fill="none" stroke="${theme.tile.outline}" stroke-width="${theme.tile.iconStroke}" stroke-linecap="round" stroke-linejoin="round"/></g>`;
}

function rotationIcon(theme) {
  return `<g transform="translate(0 -125)"><circle r="19" fill="${theme.tile.iconBackground}" stroke="${theme.tile.outline}" stroke-width="3"/><path d="M11-8A14 14 0 1 0 11 9M11 9 5 5M11 9 7 15" fill="none" stroke="${theme.tile.outline}" stroke-width="${theme.tile.iconStroke}" stroke-linecap="round" stroke-linejoin="round"/></g>`;
}

function tileSvg(color, puzzle, theme) {
  const { x, y } = screenPosition(puzzle.positions[color]);
  const palette = theme.palettes[color];
  const mode = puzzle.plateModes[color];
  const rotation = (puzzle.rotations[color] || 0) * 120;
  const icon = mode === "rotate" ? rotationIcon(theme) : movementIcon(theme);
  const h = theme.tile.halfHeight;
  const w = theme.tile.halfWidth;
  return `<g id="tile-${color}" data-color="${color}" data-face="${mode}" transform="translate(${x} ${y}) rotate(${rotation})"><path d="M0-${h}-${w}-${h / 2}V${h / 2}L0 ${h}Z" fill="${palette.light}"/><path d="M0-${h} ${w}-${h / 2}V${h / 2}L0 ${h}Z" fill="${palette.dark}"/>${icon}<circle cx="0" cy="140" r="${theme.tile.dotRadius}" fill="${theme.tile.outline}"/></g>`;
}

function catSvg(puzzle, theme, catDataUrl) {
  const { x, y } = screenPosition(puzzle.positions[puzzle.start]);
  const size = theme.cat.size;
  const half = size / 2;
  if (catDataUrl) return `<g id="cat-start" transform="translate(${x} ${y})"><image href="${escapeXml(catDataUrl)}" x="-${half}" y="-${half}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/></g>`;
  return `<g id="cat-start" transform="translate(${x} ${y})" fill="#171612"><circle cy="15" r="55"/><path d="M-48-18-68-72-20-43ZM48-18 68-72 20-43Z"/><circle cx="-18" cy="6" r="5" fill="#fbfaf2"/><circle cx="18" cy="6" r="5" fill="#fbfaf2"/><path d="M-9 25Q0 34 9 25" fill="none" stroke="#fbfaf2" stroke-width="4" stroke-linecap="round"/></g>`;
}

export function renderPuzzleSvg(puzzle, options = {}) {
  if (puzzle.legacy && puzzle.legacyImage) throw new Error("Legacy puzzles use their original image and cannot be rendered without full positions.");
  const theme = mergeTheme(options.theme);
  const number = String(puzzle.number).padStart(2, "0");
  const best = puzzle.bestMoves ?? "—";
  const tiles = COLORS.map(color => tileSvg(color, puzzle, theme)).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${theme.canvas.width}" height="${theme.canvas.height}" viewBox="0 0 ${theme.canvas.width} ${theme.canvas.height}" role="img"><title>迷路の貓題目 ${number}</title><rect width="100%" height="100%" fill="${theme.canvas.background}"/><g fill="${theme.number.color}" font-family="Arial Black,Arial,sans-serif" font-weight="900"><text x="${theme.number.x + 8}" y="${theme.number.labelY}" font-size="${theme.number.labelSize}" letter-spacing="4">PUZZLE</text><text x="${theme.number.x}" y="${theme.number.numberY}" font-size="${theme.number.fontSize}">${number}</text></g><g><path d="M1010 82 1120 276 1010 326 900 276Z" fill="${theme.best.background}"/><text x="${theme.best.centerX}" y="${theme.best.numberY}" fill="${theme.best.foreground}" font-family="Arial Black,Arial,sans-serif" font-size="${theme.best.numberSize}" font-weight="900" text-anchor="middle">${best}</text><text x="${theme.best.centerX}" y="${theme.best.labelY}" fill="${theme.best.foreground}" font-family="Arial,sans-serif" font-size="18" font-weight="700" letter-spacing="2" text-anchor="middle">BEST</text></g><g id="puzzle-board">${tiles}${catSvg(puzzle, theme, options.catDataUrl)}</g></svg>`;
}

export function renderPuzzleDataUrl(puzzle, options = {}) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderPuzzleSvg(puzzle, options))}`;
}
