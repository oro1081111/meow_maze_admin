const COPY = {
  zh: {
    label: "繁中", home: "首頁", puzzles: "題目一覽", how: "遊戲方式", physicalDigital: "實體桌遊 × 數位題庫",
    homeLead: "選擇題目、擺好五片六角板塊，取得鑰匙並開啟寶箱。", moveMode: "貓跳台", rotateMode: "貓拼布",
    moveDescription: "板塊只能平移", rotateDescription: "板塊只能旋轉", learn: "了解玩法", challenge: "挑戰清單",
    choosePuzzle: "今天想挑戰哪一題？", completed: "已完成", allStatus: "所有狀態", notPlayed: "未遊玩", noPuzzles: "目前沒有已發布題目。",
    back: "返回題庫", viewAnswer: "查看解答", hideAnswer: "隱藏解答", previous: "上一題", next: "下一題",
    howTitle: "題目在手機，解謎在手上", step1: "選擇模式與題目", step1Text: "依照想玩的規則挑一題。",
    step2: "照畫面擺好板塊", step2Text: "確認顏色、面別、位置、角度與貓咪起點。",
    step3: "取得鑰匙並開啟寶箱", step3Text: "「走到」代表貓咪移動；「移至／旋轉」代表操作板塊。", start: "開始挑戰",
    puzzle: "題", imageUnavailable: "題目圖片載入失敗"
  },
  ja: {
    label: "日本語", home: "ホーム", puzzles: "問題一覧", how: "遊び方", physicalDigital: "ボードゲーム × デジタル問題集",
    homeLead: "問題を選び、5枚の六角タイルを並べ、鍵を入手して宝箱を開けよう。", moveMode: "キャットタワー", rotateMode: "キャットパッチ",
    moveDescription: "タイルを移動", rotateDescription: "タイルを回転", learn: "遊び方を見る", challenge: "チャレンジ一覧",
    choosePuzzle: "今日はどの問題に挑戦する？", completed: "クリア済み", allStatus: "すべて", notPlayed: "未プレイ", noPuzzles: "公開中の問題はありません。",
    back: "問題一覧へ", viewAnswer: "解答を見る", hideAnswer: "解答を隠す", previous: "前の問題", next: "次の問題",
    howTitle: "問題はスマホ、謎解きは手元で", step1: "モードと問題を選ぶ", step1Text: "遊びたいルールの問題を選びます。",
    step2: "画面どおりにタイルを並べる", step2Text: "色、面、位置、角度、ネコの開始位置を確認します。",
    step3: "鍵を入手して宝箱を開ける", step3Text: "「進む」はネコの移動、「移動／回転」はタイルの操作です。", start: "挑戦する",
    puzzle: "問", imageUnavailable: "問題画像を読み込めません"
  },
  en: {
    label: "English", home: "Home", puzzles: "Puzzles", how: "How to play", physicalDigital: "PHYSICAL GAME × DIGITAL PUZZLES",
    homeLead: "Choose a puzzle, arrange the five hex tiles, obtain the key, and open the treasure chest.", moveMode: "Cat Tower", rotateMode: "Cat Patch",
    moveDescription: "Move tiles only", rotateDescription: "Rotate tiles only", learn: "Learn to play", challenge: "CHALLENGE LIST",
    choosePuzzle: "Which puzzle will you try today?", completed: "Completed", allStatus: "All statuses", notPlayed: "Not played", noPuzzles: "No published puzzles yet.",
    back: "Back to puzzles", viewAnswer: "View answer", hideAnswer: "Hide answer", previous: "Previous", next: "Next",
    howTitle: "The puzzle is on your phone; the solving is in your hands", step1: "Choose a mode and puzzle", step1Text: "Pick a puzzle for the rules you want to play.",
    step2: "Arrange the tiles as shown", step2Text: "Check each color, face, position, angle, and the cat's starting tile.",
    step3: "Obtain the key and open the treasure chest", step3Text: "“Go to” moves the cat; “move/rotate” operates a tile.", start: "Start",
    puzzle: "Puzzle", imageUnavailable: "Puzzle image unavailable"
  }
};

const STORAGE = {
  language: "meowMazeLanguage",
  ratings: "meowMazeRatings"
};

const app = document.querySelector("#app");
const languageButton = document.querySelector("#languageButton");
const languageMenu = document.querySelector("#languageMenu");
const languageLabel = document.querySelector("#languageLabel");
let language = localStorage.getItem(STORAGE.language) || "zh";
let manifest = { puzzles: [], buildVersion: "" };
let ratings = JSON.parse(localStorage.getItem(STORAGE.ratings) || "{}");

async function loadManifest() {
  const response = await fetch("data/manifest.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`Failed to load puzzle manifest: ${response.status}`);
  manifest = await response.json();
}

function copy(key) {
  return COPY[language]?.[key] ?? COPY.zh[key] ?? key;
}

function applyCopy(root = document) {
  languageLabel.textContent = copy("label");
  root.querySelectorAll("[data-copy]").forEach(element => {
    const value = copy(element.dataset.copy);
    if (value) element.textContent = value;
  });
  document.documentElement.lang = language === "zh" ? "zh-Hant" : language;
}

function saveRatings() {
  localStorage.setItem(STORAGE.ratings, JSON.stringify(ratings));
}

function parseRoute() {
  const raw = location.hash.slice(1) || "/";
  const [pathname, search = ""] = raw.split("?");
  return { pathname, params: new URLSearchParams(search) };
}

function renderTemplate(id) {
  app.replaceChildren(document.querySelector(id).content.cloneNode(true));
  applyCopy(app);
}

function puzzleTitle(puzzle) {
  if (language === "zh") return `${puzzle.mode === "move" ? "貓跳台" : "貓拼布"} ${String(puzzle.number).padStart(2, "0")}`;
  if (language === "ja") return `${puzzle.mode === "move" ? "キャットタワー" : "キャットパッチ"} ${String(puzzle.number).padStart(2, "0")}`;
  return `${puzzle.mode === "move" ? "Cat Tower" : "Cat Patch"} ${String(puzzle.number).padStart(2, "0")}`;
}

function setImageWithLegacyFallback(image, puzzle) {
  const number = String(puzzle.number).padStart(2, "0");
  const oldBase = "https://oro1081111.github.io/Meow_Maze_test/";
  const candidates = [
    puzzle.image,
    `${oldBase}assets/space_puzzle/${number}.png`,
    `${oldBase}space_puzzle/${number}.png`,
    `${oldBase}assets/images/space_puzzle/${number}.png`,
    `${oldBase}assets/questions/move-${number}.png`,
    `${oldBase}assets/puzzles/move-${number}.png`
  ].filter(Boolean);
  let index = 0;
  image.src = candidates[index];
  image.onerror = () => {
    index += 1;
    if (index < candidates.length) image.src = candidates[index];
    else {
      image.onerror = null;
      image.alt = copy("imageUnavailable");
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><rect width="600" height="600" fill="#fbfaf2"/><text x="300" y="280" text-anchor="middle" font-family="sans-serif" font-size="38" font-weight="700">${puzzle.id}</text><text x="300" y="335" text-anchor="middle" font-family="sans-serif" font-size="24">${copy("imageUnavailable")}</text></svg>`)}`;
    }
  };
}

function renderHome() {
  renderTemplate("#homeTemplate");
}

function renderHow() {
  renderTemplate("#howTemplate");
}

function renderList(params) {
  renderTemplate("#listTemplate");
  const availableModes = new Set(manifest.puzzles.map(puzzle => puzzle.mode));
  let mode = params.get("mode") || (availableModes.has("move") ? "move" : "rotate");
  if (!availableModes.has(mode) && availableModes.size) mode = [...availableModes][0];
  const grid = document.querySelector("#puzzleGrid");
  const empty = document.querySelector("#emptyState");
  const statusFilter = document.querySelector("#statusFilter");
  const tabs = [...document.querySelectorAll("[data-mode]")];

  function draw() {
    tabs.forEach(button => button.classList.toggle("active", button.dataset.mode === mode));
    const modePuzzles = manifest.puzzles.filter(puzzle => puzzle.mode === mode);
    const filtered = modePuzzles.filter(puzzle => {
      const rating = Number(ratings[puzzle.id] || 0);
      return statusFilter.value === "all" || (statusFilter.value === "done" ? rating > 0 : rating === 0);
    });
    grid.replaceChildren();
    empty.hidden = filtered.length > 0;

    for (const puzzle of filtered) {
      const rating = Number(ratings[puzzle.id] || 0);
      const link = document.createElement("a");
      link.className = "puzzle-card";
      link.href = `#/puzzle/${puzzle.id}`;
      link.innerHTML = `<div class="image"><img loading="lazy" alt=""></div><div class="meta"><b>${puzzleTitle(puzzle)}</b><span>BEST ${puzzle.bestMoves ?? "—"}</span></div><div class="stars" aria-label="${copy("completed")}">${[1,2,3].map(star => `<span class="${star <= rating ? "filled" : ""}">★</span>`).join("")}</div>`;
      setImageWithLegacyFallback(link.querySelector("img"), puzzle);
      grid.append(link);
    }

    const completed = modePuzzles.filter(puzzle => Number(ratings[puzzle.id] || 0) > 0).length;
    document.querySelector("#progressText").textContent = `${completed} / ${modePuzzles.length}`;
    document.querySelector("#progressBar").style.width = modePuzzles.length ? `${completed / modePuzzles.length * 100}%` : "0%";
  }

  tabs.forEach(button => button.addEventListener("click", () => {
    mode = button.dataset.mode;
    history.replaceState(null, "", `#/puzzles?mode=${mode}`);
    draw();
  }));
  statusFilter.addEventListener("change", draw);
  draw();
}

async function renderDetail(id) {
  const manifestPuzzle = manifest.puzzles.find(puzzle => puzzle.id === id);
  if (!manifestPuzzle) {
    location.hash = "#/puzzles";
    return;
  }
  renderTemplate("#detailTemplate");
  const response = await fetch(`${manifestPuzzle.data}?v=${manifestPuzzle.version || manifest.buildVersion}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Failed to load ${id}`);
  const puzzle = await response.json();
  const image = document.querySelector("#detailImage");
  image.alt = puzzleTitle(puzzle);
  setImageWithLegacyFallback(image, manifestPuzzle);

  const starButtons = [...document.querySelectorAll("[data-star]")];
  function drawStars() {
    const rating = Number(ratings[id] || 0);
    starButtons.forEach(button => {
      button.classList.toggle("active", Number(button.dataset.star) <= rating);
      button.setAttribute("aria-pressed", String(Number(button.dataset.star) === rating));
    });
  }
  starButtons.forEach(button => button.addEventListener("click", () => {
    const selected = Number(button.dataset.star);
    ratings[id] = Number(ratings[id] || 0) === selected ? 0 : selected;
    saveRatings();
    drawStars();
  }));
  drawStars();

  const answerButton = document.querySelector("#answerButton");
  const answerText = document.querySelector("#answerText");
  answerText.textContent = puzzle.translations?.[language] || puzzle.translations?.zh || "";
  answerButton.addEventListener("click", () => {
    answerText.hidden = !answerText.hidden;
    answerButton.setAttribute("aria-expanded", String(!answerText.hidden));
    answerButton.querySelector("span").textContent = answerText.hidden ? copy("viewAnswer") : copy("hideAnswer");
    answerButton.querySelector("b").textContent = answerText.hidden ? "＋" : "−";
  });

  const sameMode = manifest.puzzles.filter(item => item.mode === puzzle.mode);
  const index = sameMode.findIndex(item => item.id === id);
  const previous = sameMode[(index - 1 + sameMode.length) % sameMode.length];
  const next = sameMode[(index + 1) % sameMode.length];
  document.querySelector("#previousPuzzle").href = `#/puzzle/${previous.id}`;
  document.querySelector("#nextPuzzle").href = `#/puzzle/${next.id}`;
  document.querySelector(".back").href = `#/puzzles?mode=${puzzle.mode}`;
}

async function route() {
  const { pathname, params } = parseRoute();
  window.scrollTo({ top: 0, behavior: "instant" });
  try {
    if (pathname === "/" || pathname === "") renderHome();
    else if (pathname === "/puzzles") renderList(params);
    else if (pathname === "/how") renderHow();
    else if (pathname.startsWith("/puzzle/")) await renderDetail(pathname.split("/").pop());
    else renderHome();
  } catch (error) {
    console.error(error);
    app.innerHTML = `<section class="shell list"><h1>載入失敗</h1><p>${error.message}</p></section>`;
  }
}

languageButton.addEventListener("click", () => {
  languageMenu.hidden = !languageMenu.hidden;
});
document.addEventListener("click", event => {
  if (!event.target.closest(".language")) languageMenu.hidden = true;
});
document.querySelectorAll("[data-language]").forEach(button => button.addEventListener("click", () => {
  language = button.dataset.language;
  localStorage.setItem(STORAGE.language, language);
  languageMenu.hidden = true;
  route();
}));
window.addEventListener("hashchange", route);

await loadManifest();
applyCopy();
await route();
