# 自動部署到 GCP VM

push 到 `main`（或在 GitHub Actions 頁面手動執行「部署到 GCP VM」）時，`.github/workflows/deploy.yml` 會：

1. `npm ci`、`npm run build`
2. 用 Workload Identity Federation 登入 GCP（不需要金鑰檔）
3. 開一條 IAP 通道到 VM 的 22 port（VM 的 22 port 不用對外開放）
4. 用部署專用的 SSH 金鑰，經通道把 `dist/` 的壓縮檔與 `deploy/remote-deploy.sh` 傳到 VM
5. 在 VM 上執行 `remote-deploy.sh`：
   - `dist/static/*` → `<api-service 資料夾>/Nginx/static/`
   - `dist/index.html`、`favicon.ico` → `<api-service 資料夾>/Nginx/templates/`
   - 這兩個資料夾由 api-service 的 docker-compose 掛進 Nginx，換完檔案就生效，不用重啟

VM 不需要開 OS Login；登入用的是放在 VM metadata 的 SSH 公鑰。

> 本 repo 是公開的。專案 ID、VM 名稱、路徑、金鑰都放在 GitHub Secrets，不要寫進這份文件或 workflow。

## 一次性設定

以下指令中 `<...>` 換成實際的值（bash 會把 `<` 當成讀檔，沒換掉會出錯）。可以在 Cloud Shell 執行；Cloud Shell 重新開啟後變數會消失，要重新執行第 1 步。

### 1. 變數

```bash
PROJECT_ID=<GCP 專案 ID，不是專案編號>
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
ZONE=<VM 所在 zone>
VM_NAME=<VM 名稱>
REPO=<GitHub 帳號>/<repo 名稱>
SA_NAME=github-deploy-cloud-web
SA=$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com
```

VM 名稱與 zone 可以用 `gcloud compute instances list --project $PROJECT_ID` 查。

### 2. 啟用 API

```bash
gcloud services enable iap.googleapis.com iamcredentials.googleapis.com sts.googleapis.com --project $PROJECT_ID
```

### 3. 部署用的服務帳號與權限

服務帳號只用來開 IAP 通道，不用來登入 VM。

```bash
gcloud iam service-accounts create $SA_NAME --project $PROJECT_ID --display-name "GitHub Actions 部署 cloud-web"

# 經 IAP 通道連 VM
gcloud projects add-iam-policy-binding $PROJECT_ID --member "serviceAccount:$SA" --role roles/iap.tunnelResourceAccessor
# 讀取 VM 資訊（開 IAP 通道需要）
gcloud projects add-iam-policy-binding $PROJECT_ID --member "serviceAccount:$SA" --role roles/compute.viewer
```

### 4. 部署專用的 SSH 金鑰

在 Cloud Shell 產生一把新的金鑰（不要用個人金鑰）。`-C` 後面是 VM 上的登入帳號名稱：

```bash
ssh-keygen -t ed25519 -N "" -C github-deploy -f ~/github-deploy-key
cat ~/github-deploy-key.pub   # 公鑰：放進 VM
cat ~/github-deploy-key       # 私鑰：放進 GitHub Secrets（第 7 步），之後刪掉
```

把**公鑰**加進 VM：GCP Console → Compute Engine → VM 執行個體 → 點 VM → 「編輯」→「安全殼層金鑰」→「新增項目」，貼上 `cat ~/github-deploy-key.pub` 印出的整行 → 儲存。

- VM 上會自動建立 `github-deploy` 帳號，並可免密碼使用 sudo（部署腳本需要，Nginx 資料夾的擁有者可能是 root）。
- 用 Console 的「新增項目」，不要用 `gcloud compute instances add-metadata --metadata ssh-keys=...`：後者會**覆蓋**掉 VM 上原本的所有金鑰。

私鑰放進 GitHub Secrets 之後，刪掉 Cloud Shell 上的檔案：

```bash
rm ~/github-deploy-key ~/github-deploy-key.pub
```

### 5. 防火牆：允許 IAP 的來源連 22 port

```bash
gcloud compute firewall-rules create allow-ssh-from-iap --project $PROJECT_ID \
  --network <VM 所在 network，通常是 default> --direction INGRESS --action allow \
  --rules tcp:22 --source-ranges 35.235.240.0/20
```

已經有規則允許 22 port（例如 `default-allow-ssh` 開放 `0.0.0.0/0`）時，這步可以略過。

### 6. Workload Identity Federation（GitHub 換 GCP 短期憑證）

先看專案裡是否已經有 pool 與 provider（其他 repo 的部署可能已經建立）：

```bash
gcloud iam workload-identity-pools providers list --project $PROJECT_ID --location global --workload-identity-pool github
```

**已經有 `github-repo`**：不要重建，也不要直接覆蓋條件，否則其他 repo 的部署會失效。先查目前的條件，再把這個 repo 加進清單：

```bash
gcloud iam workload-identity-pools providers describe github-repo --project $PROJECT_ID \
  --location global --workload-identity-pool github --format='value(attributeCondition)'

# 例：原本是 assertion.repository in ['帳號/A', '帳號/B'] && ...，改成加上這個 repo
gcloud iam workload-identity-pools providers update-oidc github-repo --project $PROJECT_ID \
  --location global --workload-identity-pool github \
  --attribute-condition "assertion.repository in ['帳號/A', '帳號/B', '$REPO'] && assertion.ref == 'refs/heads/main'"
```

**還沒有**：建立 pool 與 provider，只接受這個 repo 的 main 分支：

```bash
gcloud iam workload-identity-pools create github --project $PROJECT_ID --location global \
  --display-name "GitHub Actions"

gcloud iam workload-identity-pools providers create-oidc github-repo --project $PROJECT_ID \
  --location global --workload-identity-pool github \
  --issuer-uri "https://token.actions.githubusercontent.com" \
  --attribute-mapping "google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
  --attribute-condition "assertion.repository == '$REPO' && assertion.ref == 'refs/heads/main'"
```

兩種情況都要讓這個 repo 可以使用部署用的服務帳號：

```bash
gcloud iam service-accounts add-iam-policy-binding $SA --project $PROJECT_ID \
  --role roles/iam.workloadIdentityUser \
  --member "principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github/attribute.repository/$REPO"

# 下一步要填進 GitHub Secrets 的值
echo "GCP_WORKLOAD_IDENTITY_PROVIDER=projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github/providers/github-repo"
echo "GCP_SERVICE_ACCOUNT=$SA"
```

### 7. GitHub Secrets

repo 的 Settings → Secrets and variables → Actions → New repository secret：

| Secret | 值 |
|---|---|
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | 第 6 步印出的值 |
| `GCP_SERVICE_ACCOUNT` | 第 6 步印出的值 |
| `GCP_PROJECT_ID` | GCP 專案 ID |
| `GCP_ZONE` | VM 所在 zone |
| `GCP_VM_NAME` | VM 名稱 |
| `DEPLOY_PATH` | VM 上 api-service 的資料夾（底下有 `Nginx/templates`、`Nginx/static`），絕對路徑 |
| `DEPLOY_SSH_USER` | 第 4 步 `-C` 後面的帳號名稱（`github-deploy`） |
| `DEPLOY_SSH_KEY` | 第 4 步的**私鑰**，從 `-----BEGIN OPENSSH PRIVATE KEY-----` 到 `-----END OPENSSH PRIVATE KEY-----` 整段 |

### 8. 測試

GitHub → Actions → 「部署到 GCP VM」→ Run workflow（選 `main`）。成功時最後會印出「部署完成」。

## 常見錯誤

- **認證失敗（`unauthorized_client` / `rejected by the attribute condition`）**：provider 的條件沒有包含這個 repo，或 workflow 不是從 `main` 觸發（第 6 步）。
- **`IAP 通道 30 秒內沒有開啟`**：log 會附上 gcloud 的錯誤。通常是防火牆沒放行 `35.235.240.0/20`（第 5 步），或服務帳號沒有 `roles/iap.tunnelResourceAccessor`、`roles/compute.viewer`（第 3 步）。
- **`Permission denied (publickey)`**：公鑰沒加進 VM、`DEPLOY_SSH_USER` 與公鑰最後的名稱不一致，或 `DEPLOY_SSH_KEY` 沒有貼完整（第 4、7 步）。VM 若開了 OS Login，metadata 的金鑰會失效。
- **`sudo: a password is required`**：登入帳號不能免密碼 sudo。用 Console 加的 metadata 金鑰帳號預設可以；若是手動建立的帳號，要加進 sudo 群組。
- **`找不到 .../Nginx/templates`**：`DEPLOY_PATH` 不對。
