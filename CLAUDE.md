# cloud-web（mutilWaterLevelDevice_TestWeb）

雲端管理頁面：查看所有機台目前的狀況，以及搜尋歷史資料。Vue 3 + Vite。

> **這是 GitHub 公開 repo。** 寫進這裡的內容（包含 CLAUDE.md、註解、設定）都會公開。不要加入密碼、金鑰或內部資訊。

本 repo 通常位於 meta repo `multiWaterLevel-workspace` 的 `repos/cloud-web/`。系統總覽與跨 repo 規格在 `../../CLAUDE.md`、`../../specs/`。

## 在系統中的位置

- 呼叫 `repos/api-service` 的 HTTP API（⑤，`specs/cloud-api.md`）：
  - `/api/device_info`、`/api/last3data`、`/api/device_waring_in_onehour`
  - `/api/data`、`/api/device_warning/<device>`
- API 的伺服器位址目前寫死在 `src/pages/HomePage/HomePage.vue`。
- 介面以 `../../specs/cloud-api.md` 為準。
- ErrorCode 位元只在 `HomePage.vue` 的 `ERROR_CODE_BITS` 定義一次，名稱採韌體擴充提案的新名稱（D-128，位元定義在 `../../specs/error-code.md`）。韌體 0.1.0 起 ErrorCode 是 7 bytes，API 回傳 `errorcode_0..6`，畫面列出 byte 12～17 有寫入點的位元（B-04）；API 沒有回傳的 byte 當作 0。label 要同時符合韌體 0.0.x 與 0.1.0 的條件。不要在其他地方重複定義位元。

## 建置

- `npm install`、`npm run dev`、`npm run build`（Node 18，見 README）。
- build 的輸出路徑為 `static/indexPath/...`（`vite.config.js`）。
- 部署：手動。跑在 GCP VM 上，與 api-service 在同一台（R-12）。
  - 推測：build 的產物放進 `repos/api-service` 的 `Nginx/static/` 與 `Nginx/templates/`，由同一個 Nginx 提供（路徑與 `static/indexPath/` 相符）。這點尚未確認。

## 結構

- 主要畫面幾乎都在 `src/pages/HomePage/HomePage.vue`；狀態在 `src/store/`（vuex）。
