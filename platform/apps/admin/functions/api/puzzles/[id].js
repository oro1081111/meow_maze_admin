import { errorResponse, json } from "../_lib/http.mjs";
import { readJsonFileOrNull, writeJsonFile } from "../_lib/github.mjs";
import { requireAdmin } from "../_lib/session.mjs";
import { puzzleId, validatePuzzle } from "../../../../../packages/shared/schema.mjs";
import { solvePuzzle } from "../../../../../packages/shared/solver.mjs";

function parseId(value) {
  const match = String(value || "").match(/^(move|rotate)-(\d{3})$/);
  if (!match) throw Object.assign(new Error("Puzzle id must use move-001 or rotate-001 format."), { status: 400 });
  return { id: value, mode: match[1], number: Number(match[2]) };
}

async function findPuzzle(env, id) {
  const { mode, number } = parseId(id);
  const relativePath = `data/puzzles/${mode}/${String(number).padStart(3, "0")}.json`;
  const individual = await readJsonFileOrNull(env, relativePath);
  if (individual) return { puzzle: individual.value, source: "individual", file: individual, relativePath };

  const legacy = await readJsonFileOrNull(env, "data/legacy-puzzles.json");
  const index = legacy?.value?.findIndex(item => item.id === id) ?? -1;
  if (index >= 0) return { puzzle: legacy.value[index], source: "legacy", file: legacy, index, relativePath: "data/legacy-puzzles.json" };
  return null;
}

export async function onRequestGet(context) {
  try {
    await requireAdmin(context);
    const { id } = parseId(context.params.id);
    const found = await findPuzzle(context.env, id);
    if (!found) return json({ error: "Puzzle not found." }, { status: 404 });
    return json({ puzzle: found.puzzle, source: found.source });
  } catch (error) {
    return errorResponse(error, error.status || 500);
  }
}

export async function onRequestPut(context) {
  try {
    const user = await requireAdmin(context);
    const route = parseId(context.params.id);
    const input = await context.request.json();
    if (input.id !== route.id || input.mode !== route.mode || input.number !== route.number) throw Object.assign(new Error("Route id does not match the submitted puzzle."), { status: 400 });
    if (input.legacy) delete input.legacy;
    delete input.legacyImage;

    const structural = validatePuzzle(input);
    if (!structural.valid && input.status !== "draft") throw Object.assign(new Error(structural.errors.join("\n")), { status: 400 });

    if (input.positions && input.plateModes && input.rotations) {
      const solved = solvePuzzle(input, 6);
      if (input.status === "published" && solved.status !== "solved") throw Object.assign(new Error(solved.status === "depth_limited" ? "Puzzle needs more than 6 moves and cannot be published." : "Puzzle has no solution and cannot be published."), { status: 400 });
      if (solved.status === "solved") {
        input.bestMoves = solved.optimalSteps;
        input.solution = solved.solution;
      } else {
        input.bestMoves = null;
        input.solution = { steps: [] };
      }
    }

    input.schemaVersion = 1;
    input.updatedAt = new Date().toISOString();
    input.updatedBy = user.login;
    const canonical = validatePuzzle(input);
    if (!canonical.valid && input.status !== "draft") throw Object.assign(new Error(canonical.errors.join("\n")), { status: 400 });

    const existing = await findPuzzle(context.env, route.id);
    let result;
    if (existing?.source === "legacy") {
      const list = existing.file.value;
      list[existing.index] = input;
      result = await writeJsonFile(
        context.env,
        "data/legacy-puzzles.json",
        list,
        `${input.status === "archived" ? "Archive" : "Update"} ${input.id}`,
        existing.file.sha
      );
    } else {
      const relativePath = `data/puzzles/${input.mode}/${String(input.number).padStart(3, "0")}.json`;
      result = await writeJsonFile(
        context.env,
        relativePath,
        input,
        `${existing ? "Update" : "Add"} ${input.id}`,
        existing?.file?.sha || null
      );
    }

    return json({ puzzle: input, commit: result.commit, path: result.path });
  } catch (error) {
    return errorResponse(error, error.status || 500);
  }
}
