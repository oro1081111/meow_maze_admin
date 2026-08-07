import { errorResponse, json } from "../_lib/http.mjs";
import { listPuzzleFiles, readJsonFileOrNull } from "../_lib/github.mjs";
import { requireAdmin } from "../_lib/session.mjs";

export async function onRequestGet(context) {
  try {
    await requireAdmin(context);
    const map = new Map();
    const legacy = await readJsonFileOrNull(context.env, "data/legacy-puzzles.json");
    for (const puzzle of legacy?.value || []) map.set(puzzle.id, puzzle);

    for (const path of await listPuzzleFiles(context.env)) {
      const file = await readJsonFileOrNull(context.env, path);
      if (file?.value?.id) map.set(file.value.id, file.value);
    }

    const puzzles = [...map.values()]
      .map(puzzle => ({
        id: puzzle.id,
        mode: puzzle.mode,
        number: puzzle.number,
        status: puzzle.status,
        bestMoves: puzzle.bestMoves,
        legacy: puzzle.legacy === true,
        updatedAt: puzzle.updatedAt || null,
        updatedBy: puzzle.updatedBy || null
      }))
      .sort((a, b) => a.mode.localeCompare(b.mode) || a.number - b.number);
    return json({ puzzles });
  } catch (error) {
    return errorResponse(error, error.status || 500);
  }
}
