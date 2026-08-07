import { COLORS, COLOR_NAMES, DEFAULT_PLATE_MODES, DEFAULT_POSITIONS } from "./shared/constants.mjs";
import { formatAllLanguages } from "./shared/formatter.mjs";
import { renderPuzzleSvg } from "./shared/renderer.mjs";
import { puzzleId, validatePuzzle } from "./shared/schema.mjs";
import { solvePuzzle } from "./shared/solver.mjs";

const SLOT_POSITIONS = [
  { id: "0,0", axial: [0,0], x: 583, y: 667 },
  { id: "-1,0", axial: [-1,0], x: 297, y: 667 },
  { id: "1,0", axial: [1,0], x: 869, y: 667 },
  { id: "-1,1", axial: [-1,1], x: 440, y: 420 },
  { id: "0,1", axial: [0,1], x: 726, y: 420 },
  { id: "0,-1", axial: [0,-1], x: 440, y: 914 },
  { id: "1,-1", axial: [1,-1], x: 726, y: 914 }
];

const elements = {
  editor: document.querySelector("#editor"),
  loginRequired: document.querySelector("#loginRequired"),
  accountArea: document.querySelector("#accountArea"),
  boardHost: document.querySelector("#boardHost"),
  tileControls: document.querySelector("#tileControls"),
  mode: document.querySelector("#puzzleMode"),
  number: document.querySelector("#puzzleNumber"),
  status: document.querySelector("#puzzleStatus"),
  bestMoves: document.querySelector("#bestMoves"),
  answerText: document.querySelector("#answerText"),
  statusText: document.querySelector("#editorStatus"),
  dirtyBadge: document.querySelector("#dirtyBadge"),
  changeSummary: document.querySelector("#changeSummary"),
  changeList: document.querySelector("#changeList"),
  publishButton: document.querySelector("#publishPuzzle")
};

function freshState() {
  return {
    schemaVersion: 1,
    id: "move-001",
    mode: "move",
    number: 1,
    status: "draft",
    start: "Y",
    bestMoves: null,
    positions: structuredClone(DEFAULT_POSITIONS),
    plateModes: structuredClone(DEFAULT_PLATE_MODES),
    rotations: Object.fromEntries(COLORS.map(color => [color, 0])),
    solution: { steps: [] },
    updatedAt: null
  };
}

let state = freshState();
let original = null;
let answerLanguage = "zh";
let drag = null;

function setMessage(message, type = "") {
  elements.statusText.textContent = message;
  elements.statusText.className = `status ${type}`.trim();
}

function currentId() {
  return puzzleId(elements.mode.value, Math.max(1, Math.min(999, Number(elements.number.value) || 1)));
}

function syncIdentity() {
  state.mode = elements.mode.value;
  state.number = Math.max(1, Math.min(999, Number(elements.number.value) || 1));
  state.id = puzzleId(state.mode, state.number);
  state.status = elements.status.value;
}

function markDirty(message = "題目已變更，請重新計算最佳解。") {
  state.bestMoves = null;
  state.solution = { steps: [] };
  elements.bestMoves.value = "";
  elements.dirtyBadge.hidden = false;
  setMessage(message);
  render();
}

function point(svg, event) {
  const value = svg.createSVGPoint();
  value.x = event.clientX;
  value.y = event.clientY;
  return value.matrixTransform(svg.getScreenCTM().inverse());
}

function screenForAxial(axial) {
  const match = SLOT_POSITIONS.find(slot => slot.axial[0] === axial[0] && slot.axial[1] === axial[1]);
  if (match) return match;
  return { x: 583 + axial[0] * 286 + axial[1] * 143, y: 667 - axial[1] * 247 };
}

function addEditorSlots(svg) {
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.setAttribute("fill", "none");
  group.setAttribute("stroke", "#8f8772");
  group.setAttribute("stroke-width", "3");
  group.setAttribute("stroke-dasharray", "10 9");
  group.setAttribute("opacity", ".38");
  for (const slot of SLOT_POSITIONS) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", `M${slot.x} ${slot.y-165}l143 82.5v165L${slot.x} ${slot.y+165}l-143-82.5v-165Z`);
    group.append(path);
  }
  const board = svg.querySelector("#puzzle-board");
  svg.insertBefore(group, board);
}

function renderBoard() {
  elements.boardHost.innerHTML = renderPuzzleSvg(state);
  const svg = elements.boardHost.querySelector("svg");
  addEditorSlots(svg);
}

function renderTileControls() {
  elements.tileControls.replaceChildren();
  for (const color of COLORS) {
    const wrapper = document.createElement("div");
    wrapper.className = "tile-control";
    const name = COLOR_NAMES.zh[color];
    wrapper.innerHTML = `<b>${name}</b><button type="button" data-face="${color}">${state.plateModes[color] === "move" ? "平移面" : "旋轉面"}</button><button type="button" data-rotate="${color}" ${state.plateModes[color] === "rotate" ? "" : "disabled"}>↻</button>`;
    elements.tileControls.append(wrapper);
  }
  elements.tileControls.querySelectorAll("[data-face]").forEach(button => button.addEventListener("click", () => {
    const color = button.dataset.face;
    state.plateModes[color] = state.plateModes[color] === "move" ? "rotate" : "move";
    if (state.plateModes[color] === "move") state.rotations[color] = 0;
    markDirty(`${COLOR_NAMES.zh[color]}已切換為${state.plateModes[color] === "move" ? "平移面" : "旋轉面"}。`);
  }));
  elements.tileControls.querySelectorAll("[data-rotate]").forEach(button => button.addEventListener("click", () => {
    const color = button.dataset.rotate;
    state.rotations[color] = (state.rotations[color] + 1) % 3;
    markDirty(`${COLOR_NAMES.zh[color]}已順時針旋轉 120°。`);
  }));
}

function renderAnswer() {
  const translations = formatAllLanguages(state.solution);
  elements.answerText.textContent = translations[answerLanguage] || "排好板塊後，按下「計算最佳解」。";
}

function comparable(value) {
  if (!value) return null;
  const clone = structuredClone(value);
  delete clone.updatedAt;
  delete clone.translations;
  return clone;
}

function renderChanges() {
  const changes = [];
  if (!original) changes.push(`新增：${state.mode === "move" ? "貓跳台" : "貓拼布"}第 ${state.number} 題`);
  else {
    if (original.start !== state.start) changes.push(`起點：${COLOR_NAMES.zh[original.start]} → ${COLOR_NAMES.zh[state.start]}`);
    if (original.bestMoves !== state.bestMoves) changes.push(`最佳步數：${original.bestMoves ?? "—"} → ${state.bestMoves ?? "—"}`);
    if (JSON.stringify(original.positions) !== JSON.stringify(state.positions)) changes.push("板塊位置已變更");
    if (JSON.stringify(original.plateModes) !== JSON.stringify(state.plateModes)) changes.push("板塊面已變更");
    if (JSON.stringify(original.rotations) !== JSON.stringify(state.rotations)) changes.push("板塊角度已變更");
    if (JSON.stringify(original.solution) !== JSON.stringify(state.solution)) changes.push("最佳解已變更");
    if (original.status !== state.status) changes.push(`狀態：${original.status} → ${state.status}`);
  }
  elements.changeList.replaceChildren(...changes.map(text => {
    const item = document.createElement("li");
    item.textContent = text;
    return item;
  }));
  elements.changeSummary.hidden = changes.length === 0;
  elements.publishButton.textContent = original ? "更新現有題目" : "發布新題目";
}

function render() {
  syncIdentity();
  elements.bestMoves.value = state.bestMoves ?? "";
  renderBoard();
  renderTileControls();
  renderAnswer();
  renderChanges();
}

function resetPuzzle() {
  const mode = elements.mode.value;
  const number = Math.max(1, Math.min(999, Number(elements.number.value) || 1));
  state = freshState();
  state.mode = mode;
  state.number = number;
  state.id = puzzleId(mode, number);
  state.status = elements.status.value;
  original = null;
  elements.dirtyBadge.hidden = false;
  setMessage(`已建立${mode === "move" ? "貓跳台" : "貓拼布"}第 ${number} 題的空白草稿。`);
  render();
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { "content-type": "application/json", ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed: ${response.status}`);
  return data;
}

async function loadPuzzle() {
  syncIdentity();
  setMessage(`正在載入 ${state.id}…`);
  try {
    const data = await api(`/api/puzzles/${state.id}`);
    if (data.puzzle.legacy) {
      original = data.puzzle;
      elements.dirtyBadge.hidden = true;
      setMessage("此題為舊版相容資料，缺少完整板塊座標。可用目前版面重新建立並覆蓋此題。", "error");
      renderChanges();
      return;
    }
    state = data.puzzle;
    original = structuredClone(data.puzzle);
    elements.mode.value = state.mode;
    elements.number.value = state.number;
    elements.status.value = state.status;
    elements.dirtyBadge.hidden = true;
    setMessage(`已載入 ${state.id}。`, "success");
    render();
  } catch (error) {
    if (/not found/i.test(error.message)) {
      original = null;
      setMessage(`${currentId()} 尚不存在，可直接建立新題目。`);
      renderChanges();
    } else setMessage(error.message, "error");
  }
}

function solve() {
  syncIdentity();
  setMessage("正在搜尋 6 步內的最短解…");
  const result = solvePuzzle(state, 6);
  if (result.status !== "solved") {
    state.bestMoves = null;
    state.solution = { steps: [] };
    setMessage(result.status === "depth_limited" ? "超過 6 步，無法發布。" : "此題無解，無法發布。", "error");
  } else {
    state.bestMoves = result.optimalSteps;
    state.solution = result.solution;
    setMessage(`已找到 ${result.optimalSteps} 步最佳解（檢查 ${result.visited} 個狀態）。`, "success");
  }
  elements.dirtyBadge.hidden = false;
  render();
}

function payloadFor(status) {
  syncIdentity();
  state.status = status;
  elements.status.value = status;
  state.updatedAt = new Date().toISOString();
  const payload = structuredClone(state);
  const result = validatePuzzle(payload);
  if (!result.valid) throw new Error(result.errors.join("\n"));
  return payload;
}

async function save(status) {
  try {
    if (status === "published" && state.bestMoves === null) solve();
    const payload = payloadFor(status);
    setMessage(`正在${status === "published" ? "發布" : status === "archived" ? "下架" : "儲存"} ${payload.id}…`);
    const data = await api(`/api/puzzles/${payload.id}`, { method: "PUT", body: JSON.stringify(payload) });
    state = data.puzzle;
    original = structuredClone(data.puzzle);
    elements.dirtyBadge.hidden = true;
    setMessage(`已建立 Git commit ${data.commit?.slice(0, 7) || ""}；Cloudflare Pages 將自動重新建置。`, "success");
    render();
  } catch (error) {
    setMessage(error.message, "error");
  }
}

function download(filename, type, content) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function beginDrag(event) {
  const tile = event.target.closest("[data-color]");
  const cat = event.target.closest("#cat-start");
  if (!tile && !cat) return;
  const svg = elements.boardHost.querySelector("svg");
  const group = cat || tile;
  const kind = cat ? "cat" : "tile";
  const color = cat ? state.start : tile.dataset.color;
  const home = screenForAxial(state.positions[color]);
  const cursor = point(svg, event);
  drag = {
    svg, group, kind, color,
    offsetX: cursor.x - home.x,
    offsetY: cursor.y - home.y,
    startX: event.clientX,
    startY: event.clientY,
    pointerId: event.pointerId
  };
  group.setPointerCapture?.(event.pointerId);
}

function moveDrag(event) {
  if (!drag || drag.pointerId !== event.pointerId) return;
  const cursor = point(drag.svg, event);
  drag.group.setAttribute("transform", `translate(${cursor.x - drag.offsetX} ${cursor.y - drag.offsetY})`);
}

function endDrag(event) {
  if (!drag || drag.pointerId !== event.pointerId) return;
  const current = drag;
  drag = null;
  const cursor = point(current.svg, event);
  const x = cursor.x - current.offsetX;
  const y = cursor.y - current.offsetY;
  const nearest = SLOT_POSITIONS.reduce((best, slot) => Math.hypot(slot.x - x, slot.y - y) < Math.hypot(best.x - x, best.y - y) ? slot : best);

  if (Math.hypot(nearest.x - x, nearest.y - y) > 200) {
    render();
    return;
  }

  if (current.kind === "cat") {
    const occupied = COLORS.map(color => ({ color, ...screenForAxial(state.positions[color]) }));
    const target = occupied.reduce((best, item) => Math.hypot(item.x - x, item.y - y) < Math.hypot(best.x - x, best.y - y) ? item : best);
    if (Math.hypot(target.x - x, target.y - y) < 200 && target.color !== state.start) {
      state.start = target.color;
      markDirty(`貓咪起點已改為${COLOR_NAMES.zh[target.color]}。`);
    } else render();
    return;
  }

  const targetKey = nearest.axial.join(",");
  const currentKey = state.positions[current.color].join(",");
  if (targetKey === currentKey) {
    render();
    return;
  }
  const other = COLORS.find(color => color !== current.color && state.positions[color].join(",") === targetKey);
  const oldPosition = state.positions[current.color];
  state.positions[current.color] = [...nearest.axial];
  if (other) state.positions[other] = [...oldPosition];
  markDirty();
}

async function loadSession() {
  try {
    const session = await api("/api/session", { headers: {} });
    if (!session.authenticated) return;
    elements.loginRequired.hidden = true;
    elements.editor.hidden = false;
    elements.accountArea.innerHTML = `<div class="account"><img src="${session.user.avatarUrl}" alt=""><b>${session.user.login}</b><a class="button" href="/api/auth/logout">登出</a></div>`;
    render();
  } catch (error) {
    setMessage(error.message, "error");
  }
}

elements.boardHost.addEventListener("pointerdown", beginDrag);
elements.boardHost.addEventListener("pointermove", moveDrag);
elements.boardHost.addEventListener("pointerup", endDrag);
elements.boardHost.addEventListener("pointercancel", () => { drag = null; render(); });

elements.mode.addEventListener("change", () => { syncIdentity(); markDirty("遊戲模式已變更。"); });
elements.number.addEventListener("change", () => { syncIdentity(); renderChanges(); });
elements.status.addEventListener("change", () => { state.status = elements.status.value; elements.dirtyBadge.hidden = false; renderChanges(); });
document.querySelector("#loadPuzzle").addEventListener("click", loadPuzzle);
document.querySelector("#newPuzzle").addEventListener("click", resetPuzzle);
document.querySelector("#solvePuzzle").addEventListener("click", solve);
document.querySelector("#saveDraft").addEventListener("click", () => save("draft"));
document.querySelector("#publishPuzzle").addEventListener("click", () => save("published"));
document.querySelector("#archivePuzzle").addEventListener("click", () => save("archived"));
document.querySelectorAll("[data-answer-language]").forEach(button => button.addEventListener("click", () => {
  answerLanguage = button.dataset.answerLanguage;
  document.querySelectorAll("[data-answer-language]").forEach(item => item.classList.toggle("active", item === button));
  renderAnswer();
}));
document.querySelector("#downloadSvg").addEventListener("click", () => download(`${state.id}.svg`, "image/svg+xml", renderPuzzleSvg(state)));
document.querySelector("#downloadJson").addEventListener("click", () => download(`${state.id}.json`, "application/json", JSON.stringify(state, null, 2)));

await loadSession();
