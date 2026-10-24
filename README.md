**Vite + Vue3 模板**
===
*請先安裝 node 與 npm*

執行步驟
1.  npm install
2.  npm run dev

本機開發時，網頁以相對路徑呼叫 `/api/...`，dev server 會把 `/api` 轉到 `.env.development` 的 `API_PROXY_TARGET`。要連別的伺服器時，在專案根目錄建立 `.env.local`（已被 .gitignore 排除）覆寫：

```
API_PROXY_TARGET=https://<API 伺服器網域>
```


**NVM使用**
nvm install 18
nvm use 18
npm install vite@latest --save-dev
npm install @vitejs/plugin-vue@latest --save-dev
npm install vue@latest
npm install vue-router@latest
npm install vuex@latest