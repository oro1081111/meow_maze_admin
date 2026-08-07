import test from "node:test";
import assert from "node:assert/strict";
import { formatAllLanguages, formatSolution } from "../packages/shared/formatter.mjs";
import { renderPuzzleSvg } from "../packages/shared/renderer.mjs";
import { puzzleId, validatePuzzle } from "../packages/shared/schema.mjs";

const puzzle = {
  schemaVersion: 1,
  id: "move-015",
  mode: "move",
  number: 15,
  status: "published",
  start: "Y",
  bestMoves: 2,
  positions: { G: [-1,1], B: [-1,0], Y: [0,0], P: [1,0], R: [1,-1] },
  plateModes: { R: "move", B: "move", G: "move", Y: "move", P: "rotate" },
  rotations: { R: 0, B: 0, G: 0, Y: 0, P: 0 },
  solution: {
    steps: [
      { type: "event", event: "key" },
      { type: "moveTile", walkTo: "R", tile: "Y", relativeTo: "B", direction: "left" },
      { type: "rotateTile", walkTo: "Y", tile: "R", rotation: "counterclockwise", degrees: 120 },
      { type: "event", event: "treasure" }
    ]
  }
};

test("puzzle id uses mode and three digits", () => {
  assert.equal(puzzleId("move", 1), "move-001");
  assert.equal(puzzleId("rotate", 40), "rotate-040");
});

test("valid puzzle passes schema validation", () => {
  assert.deepEqual(validatePuzzle(puzzle), { valid: true, errors: [] });
});

test("overlapping tiles fail validation", () => {
  const invalid = structuredClone(puzzle);
  invalid.positions.R = [...invalid.positions.Y];
  const result = validatePuzzle(invalid);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(message => message.includes("Two tiles occupy")));
});

test("Traditional Chinese answer is concise and distinguishes walk from tile operations", () => {
  assert.equal(formatSolution(puzzle.solution, "zh"), [
    "• 取得鑰匙",
    "1. 走到紅色，黃色移至藍色左方。",
    "2. 走到黃色，紅色逆時針旋轉 120°。",
    "• 開啟寶箱"
  ].join("\n"));
});

test("Japanese and English answers preserve the same operations", () => {
  const translations = formatAllLanguages(puzzle.solution);
  assert.match(translations.ja, /赤へ進み、黄を青の左へ移動。/);
  assert.match(translations.en, /Go to red; move yellow left of blue\./);
  assert.match(translations.en, /Open the treasure chest/);
});

test("SVG theme changes apply globally through one renderer", () => {
  const svg = renderPuzzleSvg(puzzle, {
    theme: {
      number: { fontSize: 222 },
      palettes: { R: { light: "#111111", dark: "#222222" } }
    }
  });
  assert.match(svg, /font-size="222"/);
  assert.match(svg, /#111111/);
  assert.match(svg, /#222222/);
  assert.match(svg, /move-015|題目 15/);
});
