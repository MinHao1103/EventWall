# Google Drive 雲端存儲設定指南

本指南將幫助你設定 Google Drive API，啟用雲端雙重存儲功能。

## 功能說明

啟用後，所有上傳的照片和影片會：

1. **立即存儲到本地** `uploads/` 資料夾（保證快速訪問）
2. **異步上傳到 Google Drive**（提供雲端備份和分享）
3. **不影響用戶體驗**（上傳過程在背景執行）

---

## 步驟 1: 建立 Google Cloud 專案

### 1.1 前往 Google Cloud Console

訪問：https://console.cloud.google.com/

### 1.2 建立新專案

1. 點擊頂部的專案選擇器
2. 點擊「新增專案」
3. 輸入專案名稱（例如：`EventWall-Storage`）
4. 點擊「建立」

---

## 步驟 2: 啟用 Google Drive API

### 2.1 前往 API 庫

1. 在 Google Cloud Console 中，前往「API 和服務」→「資料庫」
2. 或直接訪問：https://console.cloud.google.com/apis/library

### 2.2 搜尋並啟用

1. 搜尋「Google Drive API」
2. 點擊進入
3. 點擊「啟用」按鈕

---

## 步驟 3: 建立服務帳號（Service Account）

### 3.1 前往服務帳號頁面

1. 前往「API 和服務」→「憑證」
2. 或直接訪問：https://console.cloud.google.com/apis/credentials

### 3.2 建立服務帳號

1. 點擊「建立憑證」→「服務帳號」
2. 輸入服務帳號名稱（例如：`eventwall-uploader`）
3. 輸入描述（例如：`用於自動上傳活動照片到 Google Drive`）
4. 點擊「建立並繼續」

### 3.3 授予權限（可選）

1. 在「角色」下拉選單中，可以選擇「基本」→「擁有者」
2. 或跳過此步驟（不需要專案層級權限）
3. 點擊「繼續」→「完成」

---

## 步驟 4: 建立金鑰檔案

### 4.1 下載 JSON 金鑰

1. 在「服務帳號」列表中，點擊剛建立的帳號
2. 前往「金鑰」標籤
3. 點擊「新增金鑰」→「建立新金鑰」
4. 選擇「JSON」格式
5. 點擊「建立」
6. 金鑰檔案會自動下載（檔名類似：`eventwall-storage-abc123.json`）

### 4.2 重要提醒

⚠️ **安全注意事項**：
- **妥善保管此檔案**：它包含敏感憑證
- **不要上傳到 Git**：已在 `.gitignore` 中排除
- **不要分享給他人**：任何擁有此檔案的人都能訪問你的 Google Drive

---

## 步驟 5: 配置應用程式

### 5.1 放置憑證檔案

將下載的 JSON 檔案重新命名為 `google-credentials.json`，並放置在：

```
EventWall/src/config/google-credentials.json
```

### 5.2 驗證檔案位置

確保檔案路徑正確：

```
EventWall/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   ├── googleDrive.js
│   │   └── google-credentials.json  ← 這裡
│   └── server.js
└── ...
```

---

## 步驟 6: 啟動並測試

### 6.1 重新啟動伺服器

```bash
# 停止現有的伺服器（如果正在運行）
# 然後重新啟動
npm start
```

### 6.2 查看啟動日誌

如果設定成功，你應該會看到：

```
============================================
活動互動牆伺服器啟動中...
============================================
✓ MySQL 資料庫連線成功
資料庫: event_wall
✓ Google Drive 雲端存儲已啟用
HTTP 伺服器運行於: http://localhost:5001
WebSocket 伺服器運行於: ws://localhost:5001
============================================
```

如果看到以下訊息，表示雲端功能未啟用（使用純本地模式）：

```
⚠ Google Drive: 未找到憑證檔案，雲端上傳功能已停用
   請將 Google Service Account 金鑰放置於: src/config/google-credentials.json
```

### 6.3 測試上傳功能

1. 訪問網站：http://localhost:5001
2. 輸入姓名進入主頁
3. 上傳一張照片
4. 觀察伺服器日誌，應該會看到：
   ```
   開始上傳到雲端: 1234567890-username-photo.jpg
   已上傳到 Google Drive: 1234567890-username-photo.jpg (ID: 1ABC...XYZ)
   ```

---

## 進階設定（可選）

### 指定 Google Drive 資料夾

如果想將檔案上傳到特定的 Google Drive 資料夾：

1. 在 Google Drive 中建立資料夾（例如：`EventWall Photos`、`EventWall Videos`）
2. 取得資料夾 ID（從資料夾 URL 中複製，格式：`https://drive.google.com/drive/folders/{FOLDER_ID}`）
3. 設定環境變數：

```bash
# Windows (命令提示字元)
set GDRIVE_PHOTOS_FOLDER_ID=你的照片資料夾ID
set GDRIVE_VIDEOS_FOLDER_ID=你的影片資料夾ID
npm start

# Windows (PowerShell)
$env:GDRIVE_PHOTOS_FOLDER_ID="你的照片資料夾ID"
$env:GDRIVE_VIDEOS_FOLDER_ID="你的影片資料夾ID"
npm start

# macOS/Linux
export GDRIVE_PHOTOS_FOLDER_ID="你的照片資料夾ID"
export GDRIVE_VIDEOS_FOLDER_ID="你的影片資料夾ID"
npm start
```

### 資料庫欄位說明

啟用雲端存儲後，`media_files` 資料表中的以下欄位會被填入：

- `cloud_file_id` - Google Drive 檔案 ID
- `cloud_url` - 雲端直接預覽連結（可用於嵌入顯示）
- `cloud_view_link` - Google Drive 網頁查看連結
- `cloud_uploaded` - 是否已上傳到雲端（布林值）
- `cloud_uploaded_at` - 雲端上傳完成時間

---

## 常見問題

### Q1: 為什麼上傳後沒有立即看到雲端連結？

**A:** 雲端上傳是異步進行的，不會阻塞用戶操作。通常需要幾秒到幾分鐘（取決於檔案大小和網路速度）。上傳完成後，WebSocket 會通知前端更新。

### Q2: 如何查看已上傳的檔案？

**A:** 登入你的 Google Drive（使用建立 Service Account 的 Google 帳號），檔案會出現在「我的雲端硬碟」中。

### Q3: 如何停用雲端功能？

**A:** 只需刪除或重新命名 `src/config/google-credentials.json` 檔案，然後重啟伺服器即可。系統會自動切換到純本地存儲模式。

### Q4: 上傳到 Google Drive 會佔用我的空間嗎？

**A:** 是的，檔案會佔用你的 Google Drive 儲存空間配額。建議定期清理或使用 Google Workspace 以獲得更大的空間。

### Q5: 如何刪除雲端上的檔案？

**A:** 目前系統不會自動刪除雲端檔案。你可以：
1. 手動在 Google Drive 中刪除
2. 或使用 `src/config/googleDrive.js` 中的 `deleteFile(fileId)` 函數

### Q6: Service Account 和一般 Google 帳號有什麼不同？

**A:** Service Account 是專為應用程式設計的特殊帳號，不需要人工登入授權，適合伺服器端自動化操作。它有自己的 Google Drive 空間，與你的個人 Google Drive 分開。

### Q7: 如何分享雲端上的檔案？

**A:** 系統已自動將上傳的檔案設為「任何人都可透過連結查看」。你可以直接使用資料庫中的 `cloud_url` 或 `cloud_view_link` 分享給他人。

### Q8: 上傳失敗怎麼辦？

**A:** 檢查以下項目：
1. 確認 `google-credentials.json` 檔案路徑正確
2. 確認 Google Drive API 已啟用
3. 檢查網路連線是否正常
4. 查看伺服器日誌中的詳細錯誤訊息
5. 確認 Service Account 有足夠的 Drive 空間

---

## 技術細節

### 認證流程

系統使用 Google Service Account 進行認證：

1. 讀取 `google-credentials.json` 憑證檔案
2. 使用 `googleapis` 套件建立 OAuth2 認證
3. 建立 Drive API v3 服務實例
4. 透過 API 上傳檔案並設定權限

### 上傳流程

1. 用戶上傳檔案到伺服器
2. 檔案立即儲存到本地 `uploads/` 資料夾
3. 資料庫記錄建立（含本地路徑）
4. HTTP 回應立即返回給用戶
5. 背景任務啟動：
   - 讀取本地檔案
   - 上傳到 Google Drive
   - 設定公開讀取權限
   - 更新資料庫記錄（雲端資訊）
   - 透過 WebSocket 通知所有客戶端

### 錯誤處理

- 雲端上傳失敗不會影響本地存儲
- 所有錯誤都會記錄在伺服器日誌中
- 系統會自動重試一次（可在程式碼中調整）
- 即使雲端功能故障，系統仍可正常運作

---

## 相關資源

- [Google Cloud Console](https://console.cloud.google.com/)
- [Google Drive API 文檔](https://developers.google.com/drive/api/v3/about-sdk)
- [Service Account 說明](https://cloud.google.com/iam/docs/service-accounts)
- [googleapis Node.js 套件](https://github.com/googleapis/google-api-nodejs-client)

---

## 回到主文檔

詳見專案主要文檔：[README.md](../README.md)
