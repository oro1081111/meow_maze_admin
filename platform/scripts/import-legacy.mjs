import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validatePuzzle } from "../packages/shared/schema.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceOwner = process.env.LEGACY_OWNER || "oro1081111";
const sourceRepo = process.env.LEGACY_REPOSITORY || "Meow_Maze_test";
const sourceBranch = process.env.LEGACY_BRANCH || "main";
const headers = {
  accept: "application/vnd.github+json",
  "user-agent": "meow-maze-legacy-import"
};
if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

async function fetchJson(url) {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.text();
}

function publicPagesUrl(filePath) {
  return `https://${sourceOwner}.github.io/${sourceRepo}/${filePath.split("/").map(encodeURIComponent).join("/")}`;
}

function numberFromPath(filePath) {
  const basename = path.posix.basename(filePath);
  const matches = [...basename.matchAll(/(?:^|\D)(\d{1,3})(?=\D|$)/g)];
  return matches.length ? Number(matches.at(-1)[1]) : null;
}

const tree = await fetchJson(`https://api.github.com/repos/${sourceOwner}/${sourceRepo}/git/trees/${encodeURIComponent(sourceBranch)}?recursive=1`);
const files = tree.tree.filter(item => item.type === "blob").map(item => item.path);
const legacyPath = path.join(root, "data/legacy-puzzles.json");
const legacy = JSON.parse(await readFile(legacyPath, "utf8"));
const remaining = [];
let fullImports = 0;
let imageUpdates = 0;

for (const metadata of legacy) {
  const shortNumber = String(metadata.number).padStart(2, "0");
  const jsonCandidates = files.filter(file => {
    const lower = file.toLowerCase();
    return lower.endsWith(".json") && lower.includes("puzzle") && (lower.includes(`move-${shortNumber}`) || numberFromPath(file) === metadata.number);
  });

  let imported = false;
  for (const candidate of jsonCandidates) {
    try {
      const rawUrl = `https://raw.githubusercontent.com/${sourceOwner}/${sourceRepo}/${encodeURIComponent(sourceBranch)}/${candidate.split("/").map(encodeURIComponent).join("/")}`;
      const value = JSON.parse(await fetchText(rawUrl));
      const puzzle = {
        ...value,
        schemaVersion: 1,
        id: metadata.id,
        mode: metadata.mode,
        number: metadata.number,
        status: metadata.status,
        start: value.start || metadata.start,
        bestMoves: metadata.bestMoves,
        solution: metadata.solution,
        updatedAt: value.updatedAt || null
      };
      delete puzzle.legacy;
      delete puzzle.legacyImage;
      const validation = validatePuzzle(puzzle);
      if (!validation.valid) continue;
      const targetDirectory = path.join(root, "data/puzzles", puzzle.mode);
      await mkdir(targetDirectory, { recursive: true });
      await writeFile(path.join(targetDirectory, `${String(puzzle.number).padStart(3, "0")}.json`), `${JSON.stringify(puzzle, null, 2)}\n`);
      imported = true;
      fullImports += 1;
      console.log(`Imported full data for ${puzzle.id} from ${candidate}`);
      break;
    } catch (error) {
      console.warn(`Skipped ${candidate}: ${error.message}`);
    }
  }

  if (imported) continue;

  const image = files.find(file => {
    const lower = file.toLowerCase();
    return /\.(png|svg|webp|jpe?g)$/.test(lower) && numberFromPath(file) === metadata.number && (lower.includes("space_puzzle") || lower.includes("puzzle"));
  });
  if (image) {
    metadata.legacyImage = publicPagesUrl(image);
    imageUpdates += 1;
    console.log(`Matched ${metadata.id} image: ${image}`);
  }
  remaining.push(metadata);
}

await writeFile(legacyPath, `${JSON.stringify(remaining, null, 2)}\n`);
console.log(`Legacy import complete: ${fullImports} full puzzles, ${imageUpdates} image paths, ${remaining.length} compatibility entries remain.`);
