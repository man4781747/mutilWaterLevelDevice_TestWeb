#!/usr/bin/env bash
# 在 VM 上執行（由 .github/workflows/deploy.yml 呼叫）：把 build 產物換進 api-service 的 Nginx 資料夾。
# 用法：remote-deploy.sh <dist 壓縮檔> <api-service 資料夾>
#
# - Nginx/templates、Nginx/static 是 docker-compose 以 volume 掛載的資料夾，換檔案後 Nginx 直接生效，不用重啟。
#   不能把整個資料夾換掉（mv 新資料夾過去），容器仍會掛著舊的資料夾，只能換裡面的檔案。
# - 順序：先放新的 js/css（檔名有 hash，不會蓋到舊版在用的）→ 換 index.html → 刪掉舊的 js/css，
#   過程中網頁不會出現新舊檔案混用而壞掉的情況。
# - 資料夾的擁有者可能是 root，所以用 sudo（SUDO= 可以關掉）。
set -euo pipefail

ARCHIVE="$1"
DEPLOY_PATH="$2"
TEMPLATES="$DEPLOY_PATH/Nginx/templates"
STATIC="$DEPLOY_PATH/Nginx/static"
SUDO="${SUDO-sudo}"

# 不論成功或失敗，結束時都刪掉上傳的壓縮檔與解壓縮的暫存資料夾
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK" "$ARCHIVE"' EXIT

if [ ! -d "$TEMPLATES" ] || [ ! -d "$STATIC" ]; then
  echo "找不到 $TEMPLATES 或 $STATIC，請確認 DEPLOY_PATH" >&2
  exit 1
fi

tar -xzf "$ARCHIVE" -C "$WORK"

if [ ! -f "$WORK/index.html" ] || [ ! -d "$WORK/static/indexPath" ]; then
  echo "壓縮檔內容不對：沒有 index.html 或 static/indexPath" >&2
  exit 1
fi

# 1. 新的 js/css
$SUDO mkdir -p "$STATIC/indexPath"
$SUDO cp -r "$WORK/static/." "$STATIC/"

# 2. 根目錄的其他檔案（favicon.ico 等）放進 templates
for file in "$WORK"/*; do
  name="$(basename "$file")"
  if [ "$name" != "index.html" ] && [ "$name" != "static" ]; then
    $SUDO cp -r "$file" "$TEMPLATES/"
  fi
done

# 3. 換 index.html：先寫到同一個資料夾，再 mv 一次換過去
$SUDO cp "$WORK/index.html" "$TEMPLATES/.index.html.new"
$SUDO mv -f "$TEMPLATES/.index.html.new" "$TEMPLATES/index.html"

# 4. 刪掉新版沒有的舊 js/css（只動 cloud-web 自己的 static/indexPath）
removed=0
while IFS= read -r -d '' file; do
  relative="${file#"$STATIC/indexPath/"}"
  if [ ! -e "$WORK/static/indexPath/$relative" ]; then
    $SUDO rm -f "$file"
    removed=$((removed + 1))
  fi
done < <(find "$STATIC/indexPath" -type f -print0)

echo "部署完成：$(find "$WORK/static/indexPath" -type f | wc -l) 個 js/css，刪除舊檔 $removed 個"
