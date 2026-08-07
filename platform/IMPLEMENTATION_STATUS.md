# 實作狀態

## 已完成程式實作

- [x] 保留舊 `main`，於 `platform-v1` 獨立建置
- [x] 整合式目錄架構
- [x] Puzzle JSON Schema 與執行期驗證
- [x] 明確的 `move`／`rotate` 分類與三位數題號
- [x] 結構化 BFS 解答
- [x] 繁中／日文／英文簡短 Formatter
- [x] 「走到／移至／旋轉」動詞區分
- [x] 「取得鑰匙／開啟寶箱」事件
- [x] 共用 SVG Theme 與 Renderer
- [x] 自動產生所有新題目 SVG
- [x] 自動產生 manifest 與單題玩家資料
- [x] 新版玩家網站
- [x] 新版管理網站
- [x] 指定模式與題號載入／新增／更新／下架
- [x] 管理端三語答案預覽
- [x] GitHub OAuth 登入流程
- [x] HMAC 簽章 HttpOnly Session
- [x] GitHub Token 僅存在伺服器 Secret
- [x] 伺服器端 Schema 與求解複驗
- [x] GitHub 題目檔案讀寫 API
- [x] 舊 14 題結構化答案
- [x] 舊題目 JSON／圖片自動探索匯入流程
- [x] Node 自動測試
- [x] GitHub Actions CI 與建置 Artifact
- [x] Cloudflare Pages 設定檔與安全標頭
- [x] 零網域、零自架設備部署文件

## 需要帳號擁有者在網站介面完成

以下動作涉及第三方帳號授權或 Secret，無法由 Repository 寫入工具代替：

- [ ] 建立新的私人 Repository `meow-maze-platform`
- [ ] 將 `platform/` 內容移入新 Repository 根目錄
- [ ] 建立 GitHub OAuth App
- [ ] 建立只授權該 Repository 的 Fine-grained Token
- [ ] 建立 Cloudflare Pages 玩家專案
- [ ] 建立 Cloudflare Pages 管理專案
- [ ] 填入 OAuth、Token 與 Session Secrets
- [ ] 確認最終 `pages.dev` 專案名稱
- [ ] 完成實際新增／更新一道題目的端對端驗收
- [ ] 正式印刷前產生並測試 QR Code

## 切換原則

上述外部設定與端對端驗收完成前：

- 舊玩家網站繼續服務。
- 舊題目生成器繼續可用。
- 不修改舊 QR Code 或正式印刷檔。
- 不將 `platform-v1` 合併至舊 `main`。
