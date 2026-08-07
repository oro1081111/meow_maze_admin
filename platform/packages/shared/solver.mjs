import { COLORS, DIRECTIONS } from "./constants.mjs";

const OFFSETS = DIRECTIONS.map(item => item.offset);

const MOVE = {
  R: { edges: [[1,2],[2,6],[1,6],[3,4]], labels: {1:"Y",3:"P",5:"Treasure"}, boy: 2 },
  B: { edges: [[1,2],[3,4],[6,3],[4,6]], labels: {1:"G",5:"P"}, boy: 3 },
  G: { edges: [[1,5],[2,3]], labels: {2:"Y",4:"B",6:"Key"}, boy: 1 },
  Y: { edges: [[1,2],[3,2],[1,3],[4,5]], labels: {1:"R",6:"G"}, boy: 2 },
  P: { edges: [[1,6],[2,4]], labels: {3:"R",4:"B"}, boy: 1 }
};

const ROTATE = {
  R: { edges: [[2,3],[4,6]], labels: {1:"Treasure",2:"P",5:"Y"}, boy: 4 },
  B: { edges: [[1,2],[2,3],[1,3],[4,5]], labels: {4:"G",6:"P"}, boy: 1 },
  G: { edges: [[1,2],[3,6]], labels: {5:"Key",3:"Y",4:"B"}, boy: 1 },
  P: { edges: [[1,6],[3,4],[4,5],[3,5]], labels: {2:"R",3:"B"}, boy: 1 },
  Y: { edges: [[1,2],[2,4],[1,4],[5,6]], labels: {3:"G",5:"R"}, boy: 1 }
};

const worldSide = (side, rotation) => (side - 1 + 2 * rotation) % 6 + 1;
const positionKey = positions => COLORS.map(color => `${color}:${positions[color][0]},${positions[color][1]}`).join("|");
const stateKey = state => `${positionKey(state.positions)}/${state.rotations.join("")}/${state.catNode}/${state.hasKey ? 1 : 0}`;

function plateData(color, mode, rotation) {
  const plate = mode === "rotate" ? ROTATE[color] : MOVE[color];
  if (mode !== "rotate") return plate;
  return {
    edges: plate.edges.map(([a, b]) => [worldSide(a, rotation), worldSide(b, rotation)]),
    labels: Object.fromEntries(Object.entries(plate.labels).map(([side, value]) => [worldSide(Number(side), rotation), value]))
  };
}

function startNode(color, modes, rotations) {
  const plate = modes[color] === "rotate" ? ROTATE[color] : MOVE[color];
  const rotation = modes[color] === "rotate" ? rotations[COLORS.indexOf(color)] : 0;
  return color + worldSide(plate.boy, rotation);
}

function analyze(positions, rotations, modes, cache) {
  const key = `${positionKey(positions)}/${rotations.join("")}`;
  if (cache.has(key)) return cache.get(key);

  const adjacency = {};
  const labels = {};
  for (const color of COLORS) for (let side = 1; side <= 6; side += 1) adjacency[color + side] = [];

  COLORS.forEach((color, index) => {
    const plate = plateData(color, modes[color], rotations[index]);
    for (const [a, b] of plate.edges) {
      adjacency[color + a].push(color + b);
      adjacency[color + b].push(color + a);
    }
    for (const [side, label] of Object.entries(plate.labels)) labels[color + side] = label;
  });

  const occupied = new Map(COLORS.map(color => [positions[color].join(","), color]));
  for (const color of COLORS) {
    const [x, y] = positions[color];
    for (let side = 1; side <= 3; side += 1) {
      const [dx, dy] = OFFSETS[side - 1];
      const other = occupied.get(`${x + dx},${y + dy}`);
      if (!other) continue;
      adjacency[color + side].push(other + (side + 3));
      adjacency[other + (side + 3)].push(color + side);
    }
  }

  const componentIds = {};
  const components = [];
  for (const color of COLORS) {
    for (let side = 1; side <= 6; side += 1) {
      const first = color + side;
      if (first in componentIds) continue;
      const id = components.length;
      const nodes = [first];
      const stack = [first];
      componentIds[first] = id;
      while (stack.length) {
        const current = stack.pop();
        for (const next of adjacency[current]) {
          if (next in componentIds) continue;
          componentIds[next] = id;
          nodes.push(next);
          stack.push(next);
        }
      }
      const levers = {};
      const component = { nodes, levers, hasKey: false, hasTreasure: false };
      for (const node of nodes) {
        const label = labels[node];
        if (label === "Key") component.hasKey = true;
        else if (label === "Treasure") component.hasTreasure = true;
        else if (COLORS.includes(label)) levers[node] = label;
      }
      components.push(component);
    }
  }

  const result = { componentIds, components };
  cache.set(key, result);
  return result;
}

function normalMoves(positions, color) {
  const occupied = new Set(COLORS.map(item => positions[item].join(",")));
  const cells = new Map();
  for (const other of COLORS) {
    if (other === color) continue;
    const [x, y] = positions[other];
    for (const [dx, dy] of OFFSETS) {
      const cell = [x + dx, y + dy];
      const key = cell.join(",");
      if (!occupied.has(key)) cells.set(key, cell);
    }
  }
  return [...cells.values()];
}

function specialMoves(positions, nodes, color) {
  const occupied = new Set(COLORS.map(item => positions[item].join(",")));
  const cells = new Map();
  for (const node of nodes) {
    const referenceColor = node[0];
    if (referenceColor === color) continue;
    const [x, y] = positions[referenceColor];
    const [dx, dy] = OFFSETS[Number(node[1]) - 1];
    const cell = [x + dx, y + dy];
    const key = cell.join(",");
    if (!occupied.has(key)) cells.set(key, cell);
  }
  return [...cells.values()];
}

function relativePosition(positions, cell) {
  const occupied = new Map(COLORS.map(color => [positions[color].join(","), color]));
  for (let side = 1; side <= 6; side += 1) {
    const [dx, dy] = OFFSETS[side - 1];
    const reference = occupied.get(`${cell[0] - dx},${cell[1] - dy}`);
    if (reference) return { relativeTo: reference, direction: DIRECTIONS[side - 1].key };
  }
  throw new Error("Could not describe tile position relative to another tile.");
}

function structuredSolution(goalKey, parents, states, rootHasKey) {
  const chain = [];
  for (let key = goalKey; parents.get(key); key = parents.get(key).previous) chain.push({ state: states.get(key), ...parents.get(key) });
  chain.reverse();

  const steps = [];
  const moves = [];
  let hadKey = rootHasKey;
  if (hadKey) steps.push({ type: "event", event: "key" });

  for (const step of chain) {
    const walkTo = step.catNode[0];
    if (step.action.type === "rotate") {
      steps.push({
        type: "rotateTile",
        walkTo,
        tile: step.tile,
        rotation: step.action.delta === 1 ? "clockwise" : "counterclockwise",
        degrees: 120
      });
    } else {
      const relative = relativePosition(step.state.positions, step.action.cell);
      steps.push({ type: "moveTile", walkTo, tile: step.tile, ...relative });
    }
    moves.push({ catNode: step.catNode, tile: step.tile, ...step.action });
    if (step.state.hasKey && !hadKey) steps.push({ type: "event", event: "key" });
    hadKey = step.state.hasKey;
  }
  steps.push({ type: "event", event: "treasure" });
  return { status: "solved", optimalSteps: chain.length, solution: { steps }, moves };
}

export function solvePuzzle(input, maxDepth = 6) {
  const positions = Object.fromEntries(COLORS.map(color => [color, [...input.positions[color]]]));
  const modes = Object.fromEntries(COLORS.map(color => [color, input.plateModes[color] || "move"]));
  const rotations = COLORS.map(color => modes[color] === "rotate" ? (input.rotations?.[color] || 0) % 3 : 0);
  const cache = new Map();
  const catNode = startNode(input.start, modes, rotations);
  const rootAnalysis = analyze(positions, rotations, modes, cache);
  const rootComponent = rootAnalysis.components[rootAnalysis.componentIds[catNode]];
  const initial = { positions, rotations, catNode, hasKey: rootComponent.hasKey };

  if (initial.hasKey && rootComponent.hasTreasure) {
    return {
      status: "solved",
      optimalSteps: 0,
      solution: { steps: [{ type: "event", event: "key" }, { type: "event", event: "treasure" }] },
      moves: [],
      visited: 1
    };
  }

  const firstKey = stateKey(initial);
  const queue = [[initial, 0]];
  const parents = new Map([[firstKey, null]]);
  const states = new Map([[firstKey, initial]]);
  let head = 0;
  let depthLimited = false;

  while (head < queue.length) {
    const [state, depth] = queue[head++];
    if (depth >= maxDepth) {
      depthLimited = true;
      continue;
    }

    const analysis = analyze(state.positions, state.rotations, modes, cache);
    const component = analysis.components[analysis.componentIds[state.catNode]];
    const entries = Object.entries(component.levers);
    const onlyOneLever = entries.length === 1;

    for (const [leverNode, tile] of entries) {
      const tileIndex = COLORS.indexOf(tile);
      const actions = modes[tile] === "rotate"
        ? [{ type: "rotate", delta: 1 }, { type: "rotate", delta: -1 }]
        : (onlyOneLever ? specialMoves(state.positions, component.nodes, tile) : normalMoves(state.positions, tile)).map(cell => ({ type: "move", cell }));

      for (const action of actions) {
        const next = {
          positions: state.positions,
          rotations: state.rotations,
          catNode: leverNode,
          hasKey: state.hasKey
        };

        if (action.type === "rotate") {
          next.rotations = [...state.rotations];
          next.rotations[tileIndex] = (next.rotations[tileIndex] + action.delta + 3) % 3;
        } else {
          next.positions = { ...state.positions, [tile]: action.cell };
        }

        const nextAnalysis = analyze(next.positions, next.rotations, modes, cache);
        const nextComponent = nextAnalysis.components[nextAnalysis.componentIds[leverNode]];
        next.hasKey ||= nextComponent.hasKey;
        const key = stateKey(next);
        if (parents.has(key)) continue;
        parents.set(key, { previous: stateKey(state), catNode: leverNode, tile, action });
        states.set(key, next);

        if (next.hasKey && nextComponent.hasTreasure) {
          const result = structuredSolution(key, parents, states, initial.hasKey);
          result.visited = parents.size;
          return result;
        }
        queue.push([next, depth + 1]);
      }
    }
  }

  return {
    status: depthLimited ? "depth_limited" : "no_solution",
    optimalSteps: null,
    solution: { steps: [] },
    moves: [],
    visited: parents.size
  };
}

export { startNode, worldSide };
