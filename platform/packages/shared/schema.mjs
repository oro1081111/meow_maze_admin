import { COLORS, MODES, STATUSES } from "./constants.mjs";

const ID_PATTERN = /^(move|rotate)-(\d{3})$/;
const DIRECTIONS = new Set(["right", "upperRight", "upperLeft", "left", "lowerLeft", "lowerRight"]);

function fail(message, errors) {
  errors.push(message);
}

export function puzzleId(mode, number) {
  if (!MODES.includes(mode)) throw new Error(`Invalid puzzle mode: ${mode}`);
  if (!Number.isInteger(number) || number < 1 || number > 999) throw new Error("Puzzle number must be between 1 and 999.");
  return `${mode}-${String(number).padStart(3, "0")}`;
}

export function validatePuzzle(input, { allowLegacy = false } = {}) {
  const errors = [];
  if (!input || typeof input !== "object" || Array.isArray(input)) return { valid: false, errors: ["Puzzle must be an object."] };

  if (input.schemaVersion !== 1) fail("schemaVersion must be 1.", errors);
  if (!MODES.includes(input.mode)) fail("mode must be move or rotate.", errors);
  if (!Number.isInteger(input.number) || input.number < 1 || input.number > 999) fail("number must be an integer from 1 to 999.", errors);

  const match = typeof input.id === "string" ? input.id.match(ID_PATTERN) : null;
  if (!match) fail("id must use move-001 or rotate-001 format.", errors);
  else if (input.mode && input.number && input.id !== puzzleId(input.mode, input.number)) fail("id does not match mode and number.", errors);

  if (!STATUSES.includes(input.status)) fail("status must be draft, published, or archived.", errors);
  if (!COLORS.includes(input.start)) fail("start must be a valid color.", errors);
  if (input.bestMoves !== null && (!Number.isInteger(input.bestMoves) || input.bestMoves < 0 || input.bestMoves > 6)) fail("bestMoves must be null or an integer from 0 to 6.", errors);

  const legacy = input.legacy === true;
  if (legacy && allowLegacy) {
    if (typeof input.legacyImage !== "string" || !input.legacyImage) fail("A legacy puzzle needs legacyImage.", errors);
  } else {
    if (!input.positions || typeof input.positions !== "object") fail("positions is required.", errors);
    else {
      const occupied = new Set();
      for (const color of COLORS) {
        const position = input.positions[color];
        if (!Array.isArray(position) || position.length !== 2 || !position.every(Number.isInteger)) {
          fail(`positions.${color} must contain two integers.`, errors);
          continue;
        }
        const key = position.join(",");
        if (occupied.has(key)) fail(`Two tiles occupy ${key}.`, errors);
        occupied.add(key);
      }
    }

    if (!input.plateModes || typeof input.plateModes !== "object") fail("plateModes is required.", errors);
    else for (const color of COLORS) if (!MODES.includes(input.plateModes[color])) fail(`plateModes.${color} must be move or rotate.`, errors);

    if (!input.rotations || typeof input.rotations !== "object") fail("rotations is required.", errors);
    else for (const color of COLORS) if (![0, 1, 2].includes(input.rotations[color])) fail(`rotations.${color} must be 0, 1, or 2.`, errors);
  }

  const steps = input.solution?.steps;
  if (!Array.isArray(steps)) fail("solution.steps must be an array.", errors);
  else {
    for (const [index, step] of steps.entries()) {
      if (!step || typeof step !== "object") {
        fail(`solution.steps[${index}] must be an object.`, errors);
        continue;
      }
      if (step.type === "event") {
        if (!["key", "treasure"].includes(step.event)) fail(`solution.steps[${index}] has an invalid event.`, errors);
      } else if (step.type === "moveTile") {
        if (!COLORS.includes(step.walkTo) || !COLORS.includes(step.tile) || !COLORS.includes(step.relativeTo)) fail(`solution.steps[${index}] has an invalid color.`, errors);
        if (!DIRECTIONS.has(step.direction)) fail(`solution.steps[${index}] has an invalid direction.`, errors);
      } else if (step.type === "rotateTile") {
        if (!COLORS.includes(step.walkTo) || !COLORS.includes(step.tile)) fail(`solution.steps[${index}] has an invalid color.`, errors);
        if (!["clockwise", "counterclockwise"].includes(step.rotation)) fail(`solution.steps[${index}] has an invalid rotation.`, errors);
        if (step.degrees !== 120) fail(`solution.steps[${index}] degrees must be 120.`, errors);
      } else fail(`solution.steps[${index}] has an invalid type.`, errors);
    }
  }

  if (input.status === "published") {
    if (input.bestMoves === null) fail("Published puzzles need bestMoves.", errors);
    if (!Array.isArray(steps) || !steps.some(step => step.type === "event" && step.event === "treasure")) fail("Published puzzles must end by opening the treasure chest.", errors);
  }

  return { valid: errors.length === 0, errors };
}

export function assertPuzzle(input, options) {
  const result = validatePuzzle(input, options);
  if (!result.valid) throw new Error(result.errors.join("\n"));
  return input;
}
