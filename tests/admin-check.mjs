import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";

await import("../assets/puzzle-solver.js");
await import("../assets/puzzle-editor.js");

const editor=globalThis.MeowMazeEditor;
const state=editor.freshState();
const moved=editor.moveTile(state.positions,"G","0,0");
assert.equal(moved.G,"0,0");
assert.equal(moved.Y,"-1,1");
state.plateModes.R="rotate";
const svg=editor.buildSvg(state);
assert.match(svg,/data-face="rotate"/);
assert.match(svg,/fill="#ff777d"/);
assert.doesNotMatch(svg,/#f7b4b8|mode-legend/);
assert.deepEqual(editor.boardOffset(editor.freshState()),{x:17,y:83});
assert.equal(globalThis.MeowMazeSolver.solve(editor.puzzleData(editor.freshState()),6).optimalSteps,1);
assert.ok(existsSync("index.html"));
assert.doesNotMatch(readFileSync("index.html","utf8"),/puzzle_list\.html|game_explanation\.html/);
console.log("Admin generator checks passed.");
