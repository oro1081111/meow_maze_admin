import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertPuzzle } from "../packages/shared/schema.mjs";
import { formatAllLanguages } from "../packages/shared/formatter.mjs";
import { renderPuzzleSvg } from "../packages/shared/renderer.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const playerDist = path.join(dist, "player");
const adminDist = path.join(dist, "admin");
const buildVersion = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);

await rm(dist, { recursive: true, force: true });
await mkdir(playerDist, { recursive: true });
await mkdir(adminDist, { recursive: true });

await cp(path.join(root, "apps/player/public"), playerDist, { recursive: true });
await cp(path.join(root, "apps/admin/public"), adminDist, { recursive: true });
await cp(path.join(root, "packages/shared"), path.join(playerDist, "shared"), { recursive: true });
await cp(path.join(root, "packages/shared"), path.join(adminDist, "shared"), { recursive: true });

const puzzles = JSON.parse(await readFile(path.join(root, "data/legacy-puzzles.json"), "utf8"));
for (const mode of ["move", "rotate"]) {
  const sourceDirectory = path.join(root, "data/puzzles", mode);
  try {
    for (const filename of await readdir(sourceDirectory)) {
      if (!filename.endsWith(".json")) continue;
      puzzles.push(JSON.parse(await readFile(path.join(sourceDirectory, filename), "utf8")));
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

const manifest = {
  schemaVersion: 1,
  buildVersion,
  generatedAt: new Date().toISOString(),
  puzzles: []
};

for (const puzzle of puzzles) {
  assertPuzzle(puzzle, { allowLegacy: true });
  const modeDirectory = path.join(playerDist, "data/puzzles", puzzle.mode);
  await mkdir(modeDirectory, { recursive: true });

  const publicPuzzle = {
    ...puzzle,
    translations: formatAllLanguages(puzzle.solution)
  };
  const dataPath = `data/puzzles/${puzzle.mode}/${String(puzzle.number).padStart(3, "0")}.json`;
  await writeFile(path.join(playerDist, dataPath), JSON.stringify(publicPuzzle, null, 2));

  let image;
  if (puzzle.legacy) {
    image = puzzle.legacyImage;
  } else {
    image = `assets/puzzles/${puzzle.id}.svg`;
    await mkdir(path.join(playerDist, "assets/puzzles"), { recursive: true });
    await writeFile(path.join(playerDist, image), renderPuzzleSvg(puzzle));
  }

  if (puzzle.status === "published") {
    manifest.puzzles.push({
      id: puzzle.id,
      mode: puzzle.mode,
      number: puzzle.number,
      bestMoves: puzzle.bestMoves,
      image,
      data: dataPath,
      legacy: puzzle.legacy === true,
      version: buildVersion
    });
  }
}

manifest.puzzles.sort((a, b) => a.mode.localeCompare(b.mode) || a.number - b.number);
await mkdir(path.join(playerDist, "data"), { recursive: true });
await writeFile(path.join(playerDist, "data/manifest.json"), JSON.stringify(manifest, null, 2));
await writeFile(path.join(playerDist, "build.json"), JSON.stringify({ buildVersion }, null, 2));
await writeFile(path.join(adminDist, "build.json"), JSON.stringify({ buildVersion }, null, 2));

console.log(`Built player and admin sites with ${manifest.puzzles.length} published puzzles.`);
