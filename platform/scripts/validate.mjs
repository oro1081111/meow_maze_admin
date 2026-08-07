import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validatePuzzle } from "../packages/shared/schema.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const puzzles = [];
const legacy = JSON.parse(await readFile(path.join(root, "data/legacy-puzzles.json"), "utf8"));
puzzles.push(...legacy);

for (const mode of ["move", "rotate"]) {
  const directory = path.join(root, "data/puzzles", mode);
  try {
    for (const file of await readdir(directory)) {
      if (!file.endsWith(".json")) continue;
      puzzles.push(JSON.parse(await readFile(path.join(directory, file), "utf8")));
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

const ids = new Set();
const errors = [];
for (const puzzle of puzzles) {
  const result = validatePuzzle(puzzle, { allowLegacy: true });
  if (!result.valid) errors.push(...result.errors.map(message => `${puzzle.id || "unknown"}: ${message}`));
  if (ids.has(puzzle.id)) errors.push(`${puzzle.id}: duplicate puzzle id.`);
  ids.add(puzzle.id);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated ${puzzles.length} puzzles.`);
}
