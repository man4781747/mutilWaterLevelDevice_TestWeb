# 自動部署到 GCP VM

push 到 `main`（或在 GitHub Actions 頁面手動執行「部署到 GCP VM」）時，`.github/workflows/deploy.yml` 會：

1. `npm ci`、`npm run build`
2. 用 Workload Identity Federation 登入 GCP（不需要金鑰檔）
3. 經 IAP 通道把 `dist/` 的壓縮檔與 `deploy/remote-deploy.sh` 傳到 VM（VM 的 22 port 不用對外開放）
4. 在 VM 上執行 `remote-deploy.sh`：
   - `dist/static/*` → `<api-service 資料夾>/Nginx/static/`
   - `dist/index.html`、`favicon.ico` → `<api-service 資料夾>/Nginx/templates/`
   - 這兩個資料夾由 api-service 的 docker-compose 掛進 Nginx，換完檔案就生效，不用重啟

> 本 repo 是公開的。專案 ID、VM 名稱、路徑都放在 GitHub Secrets，不要寫進這份文件或 workflow。

## 一次性設定

以下指令中 `<...>` 換成實際的值。可以在 Cloud Shell 執行。

### 1. 變數

```bash
PROJECT_ID=<GCP 專案 ID>
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
ZONE=<VM 所在 zone>
VM_NAME=<VM 名稱>
REPO=<GitHub 帳號>/<repo 名稱>
SA_NAME=github-deploy-cloud-web
SA=$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com
```

### 2. 啟用 API

```bash
gcloud services enable iap.googleapis.com iamcredentials.googleapis.com sts.googleapis.com --project $PROJECT_ID
```

### 3. 部署用的服務帳號與權限

```bash
gcloud iam service-accounts create $SA_NAME --project $PROJECT_ID --display-name "GitHub Actions 部署 cloud-web"

# 經 IAP 通道連 VM
gcloud projects add-iam-policy-binding $PROJECT_ID --member "serviceAccount:$SA" --role roles/iap.tunnelResourceAccessor
# 讀取 VM 資訊（gcloud compute ssh/scp 需要）
gcloud projects add-iam-policy-binding $PROJECT_ID --member "serviceAccount:$SA" --role roles/compute.viewer
# 以 OS Login 登入 VM 並可使用 sudo（Nginx 資料夾的擁有者可能是 root），只授權這一台 VM
gcloud compute instances add-iam-policy-binding $VM_NAME --zone $ZONE --project $PROJECT_ID \
  --member "serviceAccount:$SA" --role roles/compute.osAdminLogin
```

如果 VM 有掛服務帳號（大部分 VM 預設會掛），還要讓部署帳號可以「以該服務帳號身分」登入：

```bash
VM_SA=$(gcloud compute instances describe $VM_NAME --zone $ZONE --project $PROJECT_ID --format='value(serviceAccounts[0].email)')
gcloud iam service-accounts add-iam-policy-binding $VM_SA --project $PROJECT_ID \
  --member "serviceAccount:$SA" --role roles/iam.serviceAccountUser
```

### 4. VM 開啟 OS Login

```bash
gcloud compute instances add-metadata $VM_NAME --zone $ZONE --project $PROJECT_ID --metadata enable-oslogin=TRUE
```

> 開啟後，原本用 metadata SSH 金鑰登入的帳號會無法登入，改用 OS Login（`gcloud compute ssh` 或 Console 的 SSH 按鈕仍可使用）。如果有其他人或程式用固定金鑰登入，先確認再開。

### 5. 防火牆：只允許 IAP 的來源連 22 port

```bash
gcloud compute firewall-rules create allow-ssh-from-iap --project $PROJECT_ID \
  --network <VM 所在 network，通常是 default> --direction INGRESS --action allow \
  --rules tcp:22 --source-ranges 35.235.240.0/20
```

### 6. Workload Identity Federation（GitHub 換 GCP 短期憑證）

```bash
gcloud iam workload-identity-pools create github --project $PROJECT_ID --location global \
  --display-name "GitHub Actions"

# 只接受這個 repo 的 main 分支
gcloud iam workload-identity-pools providers create-oidc github-repo --project $PROJECT_ID \
  --location global --workload-identity-pool github \
  --issuer-uri "https://token.actions.githubusercontent.com" \
  --attribute-mapping "google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
  --attribute-condition "assertion.repository == '$REPO' && assertion.ref == 'refs/heads/main'"

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

### 8. 測試

GitHub → Actions → 「部署到 GCP VM」→ Run workflow（選 `main`）。成功時最後一步會印出「部署完成」。

## 常見錯誤

- **`Permission denied (publickey)`**：VM 沒開 OS Login（第 4 步），或服務帳號沒有 `roles/compute.osAdminLogin`（第 3 步）。
- **`failed to connect to backend` / IAP 錯誤**：防火牆沒放行 `35.235.240.0/20`（第 5 步），或沒有 `roles/iap.tunnelResourceAccessor`。
- **`找不到 .../Nginx/templates`**：`DEPLOY_PATH` 不對。
- **認證失敗（`unauthorized_client`）**：workflow 不是從 `main` 觸發，或 `REPO` 名稱與 attribute condition 不符（第 6 步）。
