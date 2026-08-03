# 迷路の貓題目生成器

《迷路の貓｜MEOW MAZE》的內部題目製作工具，與玩家網站分開管理。

直接開啟 `index.html` 即可使用，不需要安裝套件或啟動伺服器。

## 功能

- 拖曳五片六角板塊並交換位置
- 雙擊或快速點兩下板塊，切換平移／旋轉圖示
- 拖曳黑貓設定起始板塊
- 依《謎寶空間_程式》規則計算 6 步內最短解
- 輸出置中的 PNG、SVG、題目 JSON 與答案 JSON
- 超過 6 步時停止並顯示無法輸出

## 主要檔案

- `index.html`：生成器介面
- `assets/puzzle-editor.js`：編輯與輸出功能
- `assets/puzzle-solver.js`：6 步內 BFS 最短解
- `assets/puzzle-editor.css`：介面樣式
- `assets/cat-data.js`：匯出圖片使用的黑貓資料
- `assets/templates/puzzle-template.svg`：SVG 題目模板

執行 `npm test` 可驗證板塊交換、固定配色、匯出置中與 6 步求解上限。
