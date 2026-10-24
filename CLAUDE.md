# cloud-web（mutilWaterLevelDevice_TestWeb）

雲端管理頁面：查看所有機台目前的狀況，以及搜尋歷史資料。Vue 3 + Vite。

> **這是 GitHub 公開 repo。** 寫進這裡的內容（包含 CLAUDE.md、註解、設定）都會公開。不要加入密碼、金鑰或內部資訊。

本 repo 通常位於 meta repo `multiWaterLevel-workspace` 的 `repos/cloud-web/`。系統總覽與跨 repo 規格在 `../../CLAUDE.md`、`../../specs/`。

## 在系統中的位置

- 呼叫 `repos/api-service` 的 HTTP API（⑤，`specs/cloud-api.md`）：
  - `/api/device_info`、`/api/last3data`、`/api/device_waring_in_onehour`
  - `/api/data`、`/api/device_warning/<device>`
- API 以同網域的相對路徑 `/api/...` 呼叫（網頁與 API 由同一個 Nginx 以 https 提供），不寫死伺服器位址。
- 介面以 `../../specs/cloud-api.md` 為準。
- ErrorCode 位元只在 `HomePage.vue` 的 `ERROR_CODE_BITS` 定義一次，名稱採韌體擴充提案的新名稱（D-128，位元定義在 `../../specs/error-code.md`）。韌體 0.1.0 起 ErrorCode 是 7 bytes，API 回傳 `errorcode_0..6`，畫面列出 byte 12～17 有寫入點的位元（B-04）；API 沒有回傳的 byte 當作 0。label 要同時符合韌體 0.0.x 與 0.1.0 的條件。不要在其他地方重複定義位元。

## 建置

- `npm install`、`npm run dev`、`npm run build`（Node 18，見 README）。
- `npm run dev` 的 `/api` proxy 目標讀 `API_PROXY_TARGET`（`vite.config.js`）：預設值在 `.env.development`（進版控），個人覆寫寫在 `.env.local`（不進版控）。
- build 的輸出路徑為 `static/indexPath/...`（`vite.config.js`）。
- 部署：跑在 GCP VM 上，與 api-service 在同一台（R-12）。
  - build 的產物放進 api-service 的 `Nginx/templates/`（`index.html`、`favicon.ico`）與 `Nginx/static/`（`indexPath/`），由同一個 Nginx 提供；兩個資料夾由 api-service 的 docker-compose 掛進 Nginx 容器，換檔案不用重啟（對照 `repos/api-service/docker-compose.yml`、`Nginx/nginx/conf.d/default.conf`）。
  - 自動部署：`.github/workflows/deploy.yml`，push 到 `main` 時 build，以 Workload Identity Federation 登入 GCP 開 IAP 通道，再用部署專用的 SSH 金鑰（VM metadata，不使用 OS Login）傳到 VM，VM 上執行 `deploy/remote-deploy.sh`。一次性設定（GCP 服務帳號、Workload Identity Federation、GitHub Secrets）見 `deploy/README.md`。專案、VM、路徑只放在 GitHub Secrets，不要寫進 repo。

## 結構

- 主要畫面幾乎都在 `src/pages/HomePage/HomePage.vue`；狀態在 `src/store/`（vuex）。
