# 迷路の貓整合平台

將玩家題庫、題目生成器、求解器、三語答案、SVG Renderer 與發布 API 集中管理。

目前整合平台位於 `oro1081111/meow_maze_admin` 的 `platform-v1` 分支、`platform/` 目錄。舊 `main` 分支與兩個既有 GitHub Pages 網站不受影響。完成驗收後，建議將 `platform/` 內容移至新的私人 Repository `oro1081111/meow-maze-platform`。

## 架構

```text
platform/
├─ apps/
│  ├─ player/                  玩家網站
│  └─ admin/                   題庫管理網站與 Pages Functions
├─ packages/shared/
│  ├─ constants.mjs           顏色、方向、模式
│  ├─ formatter.mjs           繁中／日文／英文簡短答案
│  ├─ renderer.mjs            共用 SVG Renderer
│  ├─ schema.mjs              題目資料驗證
│  ├─ solver.mjs              6 步 BFS 求解器
│  └─ theme.mjs               SVG 全域樣式
├─ data/
│  ├─ legacy-puzzles.json     舊 14 題相容資料
│  └─ puzzles/
│     ├─ move/
│     └─ rotate/
├─ scripts/
│  ├─ build.mjs               自動產生 manifest、單題資料與 SVG
│  ├─ import-legacy.mjs       從舊玩家 repo 匯入原始 JSON／圖片
│  └─ validate.mjs            全題庫驗證
└─ tests/
```

## 解答用詞

解答只保存結構化動作，顯示時才轉成三種語言。

繁中：

```text
• 取得鑰匙
1. 走到紅色，黃色移至藍色左方。
2. 走到黃色，紅色逆時針旋轉 120°。
• 開啟寶箱
```

- 「走到」只表示貓咪移動。
- 「移至」只表示平移板塊。
- 「旋轉」只表示旋轉板塊。
- 顏色直接代表該色板塊，避免重複主詞。

## 題目 ID

- 貓跳台：`move-001`～`move-999`
- 貓拼布：`rotate-001`～`rotate-999`

同一題號可以分別存在於兩種模式。

## 本機檢查

需要 Node.js 20 以上：

```bash
cd platform
npm run check
```

此命令會：

1. 驗證全部題目資料。
2. 執行三語、Schema 與 SVG 測試。
3. 建立 `dist/player` 與 `dist/admin`。

## 玩家網站

玩家網站從 `data/manifest.json` 取得已發布題目，具有：

- 貓跳台／貓拼布分類
- 已完成／未遊玩篩選
- 手機本機星等進度
- 三語切換
- 查看解答／隱藏解答
- 上一題／下一題
- 建置版本快取更新

## 題庫管理網站

管理者可以：

- 明確選擇貓跳台或貓拼布
- 指定題號
- 載入現有題目
- 拖曳板塊與貓咪
- 切換板塊面與旋轉角度
- 計算 6 步內最佳解
- 預覽三語解答
- 儲存草稿
- 新增或更新指定題目
- 下架題目
- 下載 SVG／JSON 備份

發布時，伺服器端會再次執行 Schema 與求解驗證。前端不能自行偽造最佳解。

## GitHub OAuth

建立 GitHub OAuth App：

- Homepage URL：`https://meow-maze-admin.pages.dev`
- Authorization callback URL：`https://meow-maze-admin.pages.dev/api/auth/callback`

若 Cloudflare 實際提供不同的 `pages.dev` 專案名稱，必須使用實際網址。

管理網站 Pages 專案需設定以下 Secrets／Variables：

```text
GITHUB_OAUTH_CLIENT_ID
GITHUB_OAUTH_CLIENT_SECRET
GITHUB_TOKEN
SESSION_SECRET
ALLOWED_GITHUB_USERS=oro1081111
GITHUB_REPOSITORY=oro1081111/meow-maze-platform
GITHUB_BRANCH=main
PLATFORM_ROOT=
```

目前若直接從 `meow_maze_admin/platform-v1` 測試，改為：

```text
GITHUB_REPOSITORY=oro1081111/meow_maze_admin
GITHUB_BRANCH=platform-v1
PLATFORM_ROOT=platform
```

`GITHUB_TOKEN` 使用 Fine-grained personal access token，只授權目標 Repository：

- Contents：Read and write
- Metadata：Read-only

不要把 Token 或 OAuth Client Secret 寫入前端、GitHub 原始碼或 `localStorage`。

`SESSION_SECRET` 應為至少 32 bytes 的隨機字串。

## Cloudflare Pages：玩家網站

建立 Pages 專案，連接整合 Repository。

建議設定：

```text
Project name: meow-maze
Production branch: main
Root directory: platform
Build command: npm run build
Build output directory: dist/player
Node version: 22
```

目前直接測試 `platform-v1` 分支時，Production branch 可暫設為 `platform-v1`。

免費網址預計為：

```text
https://meow-maze.pages.dev
```

實際名稱必須以 Cloudflare 尚未被占用的專案名稱為準。

## Cloudflare Pages：管理網站

建立另一個 Pages 專案，連接同一 Repository。

建議設定：

```text
Project name: meow-maze-admin
Production branch: main
Root directory: platform/apps/admin
Build command: cd ../.. && npm run build
Build output directory: ../../dist/admin
Node version: 22
```

Pages Functions 會從 `platform/apps/admin/functions` 部署。

免費網址預計為：

```text
https://meow-maze-admin.pages.dev
```

## 不購買網域

可以直接使用兩個 `pages.dev` 網址：

```text
玩家：https://meow-maze.pages.dev
管理：https://meow-maze-admin.pages.dev
```

不需要：

- 付費主機
- VPS
- NAS
- 樹莓派
- 全天開機的電腦
- 固定 IP
- 自訂網域

實際費用可維持每月 0 元、每年 0 元；但正式印刷 QR Code 前，應確認 Cloudflare 專案名稱不再更動。

## SVG 全域修改

所有新題目 SVG 都由 `packages/shared/theme.mjs` 與 `renderer.mjs` 產生。

例如統一放大題號：

```js
number: {
  fontSize: 210
}
```

例如統一修改紅色：

```js
R: {
  light: "#新的亮色",
  dark: "#新的暗色"
}
```

提交後重新建置，所有具有完整資料的題目 SVG 會同步更新，不必逐題修改。

## 舊 14 題遷移

`.github/workflows/platform-import-legacy.yml` 會掃描舊玩家 Repository：

1. 優先尋找 `move-XX-puzzle.json` 原始資料。
2. 找到後轉成新格式並放入 `data/puzzles/move/`。
3. 若沒有完整 JSON，則自動尋找原題圖的正確路徑。
4. 保留結構化三語答案。

舊相容題目一旦由新版管理器重新發布，就會具備完整座標並改由共用 SVG Renderer 產生。

## 發布流程

```text
管理者登入
→ 選擇模式與題號
→ 載入或建立題目
→ 排列板塊
→ 計算最佳解
→ 檢查三語答案
→ 發布
→ Pages Function 再驗證與求解
→ GitHub 建立 commit
→ Cloudflare Pages 自動建置
→ 玩家網站更新
```

整個流程不再需要下載、手動上傳或修改 `puzzles-data.js`。
