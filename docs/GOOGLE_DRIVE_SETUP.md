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

### 💡 方案選擇：檔案要存在哪裡？

#### 方案 A：Service Account 的獨立空間（預設）

**特點**：
- 檔案存儲在 Service Account 自己的 Google Drive
- 透過 `cloud_url` 連結即可直接存取檔案
- 不佔用您的個人 Google Drive 空間

**適合**：想要簡單設定、不需要在自己 Drive 中管理檔案

**設定**：完成上方步驟 1-6 即可，無需額外設定

---

#### 方案 B：您的個人 Google Drive（推薦）⭐

**特點**：
- ✅ 檔案直接出現在您的個人 Google Drive 中
- ✅ 可以使用 Google Drive 的所有功能（分享、下載、整理）
- ✅ 設定一次即可長期使用，不需要每次授權

**適合**：想要完全掌控檔案、在自己的 Drive 中統一管理

**設定步驟**：請參考下方「設定共享資料夾」

---

### 設定共享資料夾（方案 B）

如果您選擇方案 B，請依照以下步驟設定：

#### 步驟 1：建立資料夾結構

在**您的個人 Google Drive** (https://drive.google.com/) 建立：

```
EventWall 備份/
├── 照片/
└── 影片/
```

**操作方式**：
1. 點擊「新增」→「資料夾」
2. 輸入資料夾名稱：`EventWall 備份`
3. 進入該資料夾，再建立兩個子資料夾：`照片` 和 `影片`

---

#### 步驟 2：取得 Service Account Email

**方法 A：從憑證檔案讀取（快速）**

```bash
# Windows / macOS / Linux
node -p "require('./src/config/google-credentials.json').client_email"
```

**方法 B：從 Google Cloud Console 查看**

1. 前往 https://console.cloud.google.com/
2. 選擇您的專案
3. 前往「IAM 和管理」→「服務帳號」
4. 找到您的服務帳號（如 `eventwall-uploader`）
5. 複製 Email（格式：`xxxxx@project-id.iam.gserviceaccount.com`）

**範例輸出**：
```
eventwall-uploader@eventwall-storage-123456.iam.gserviceaccount.com
```

> 💡 複製這個完整的 email 地址，下一步會用到！

---

#### 步驟 3：共享資料夾給 Service Account

**共享「照片」資料夾**：
1. 在 Google Drive 中，右鍵點擊「照片」資料夾
2. 點擊「共用」
3. 在「新增使用者或群組」欄位中，貼上 Service Account 的 email
4. 權限設定為「編輯者」
5. **取消勾選**「通知使用者」
6. 點擊「完成」

**共享「影片」資料夾**：重複上述步驟

**驗證**：在資料夾上點擊右鍵 → 「管理存取權」，應該會看到：
- 您自己的帳號（擁有者）
- Service Account 的 email（編輯者）

---

#### 步驟 4：取得資料夾 ID

**取得「照片」資料夾 ID**：
1. 在 Google Drive 中，開啟「照片」資料夾
2. 查看瀏覽器網址列：
   ```
   https://drive.google.com/drive/folders/1ABC...XYZ
   ```
3. 複製 `1ABC...XYZ` 這段（資料夾 ID）

**取得「影片」資料夾 ID**：重複上述步驟

**範例**：
```
照片資料夾 ID: 1ABCdefGHIjklMNOpqrSTUvwxYZ123456
影片資料夾 ID: 1XYZwvuTSRqpONMlkjIHGfedCBA654321
```

---

#### 步驟 5：設定環境變數

**方法 A：使用 .env 檔案（推薦）**

1. 複製 `.env.example` 為 `.env`：
   ```bash
   # Windows
   copy .env.example .env

   # macOS/Linux
   cp .env.example .env
   ```

2. 編輯 `.env` 檔案，填入您的資料夾 ID：
   ```env
   GDRIVE_PHOTOS_FOLDER_ID=1ABCdefGHIjklMNOpqrSTUvwxYZ123456
   GDRIVE_VIDEOS_FOLDER_ID=1XYZwvuTSRqpONMlkjIHGfedCBA654321
   ```

3. 儲存檔案並重新啟動伺服器

**方法 B：每次啟動時設定環境變數**

```bash
# Windows (PowerShell)
$env:GDRIVE_PHOTOS_FOLDER_ID="1ABCdefGHIjklMNOpqrSTUvwxYZ123456"
$env:GDRIVE_VIDEOS_FOLDER_ID="1XYZwvuTSRqpONMlkjIHGfedCBA654321"
npm start

# Windows (命令提示字元)
set GDRIVE_PHOTOS_FOLDER_ID=1ABCdefGHIjklMNOpqrSTUvwxYZ123456
set GDRIVE_VIDEOS_FOLDER_ID=1XYZwvuTSRqpONMlkjIHGfedCBA654321
npm start

# macOS/Linux
export GDRIVE_PHOTOS_FOLDER_ID="1ABCdefGHIjklMNOpqrSTUvwxYZ123456"
export GDRIVE_VIDEOS_FOLDER_ID="1XYZwvuTSRqpONMlkjIHGfedCBA654321"
npm start
```

---

#### 步驟 6：測試共享資料夾設定

1. 重新啟動伺服器：`npm start`

2. 上傳測試照片：
   - 訪問 http://localhost:5001
   - 輸入姓名進入主頁
   - 上傳一張照片

3. **驗證成功**：
   - 前往您的 Google Drive
   - 開啟「EventWall 備份」→「照片」資料夾
   - ✅ 應該會看到剛上傳的照片出現！

4. **伺服器日誌應顯示**：
   ```
   開始上傳到雲端: 1234567890-username-photo.jpg
   已上傳到 Google Drive: 1234567890-username-photo.jpg (ID: 1ABC...XYZ)
   ```

---

### 疑難排解（共享資料夾）

#### 問題：上傳後檔案沒出現在我的 Drive 中

**可能原因**：
- 資料夾 ID 設定錯誤
- 沒有共享資料夾給 Service Account
- 環境變數沒有正確載入

**解決方法**：
1. 確認資料夾 ID 正確（從 URL 複製）
2. 確認「共用」設定中有 Service Account 的 email
3. 檢查環境變數是否載入（在 server.js 中加入測試程式碼）：
   ```javascript
   console.log('Photos Folder ID:', process.env.GDRIVE_PHOTOS_FOLDER_ID);
   console.log('Videos Folder ID:', process.env.GDRIVE_VIDEOS_FOLDER_ID);
   ```

#### 問題：錯誤訊息 "Folder not found" 或 "Insufficient permissions"

**原因**：Service Account 沒有資料夾的存取權限

**解決方法**：
1. 檢查是否已共享資料夾
2. 確認共享時給予「編輯者」權限（不是「檢視者」）
3. 等待 1-2 分鐘讓 Google 同步權限

---

### 方案比較總結

| 項目 | 方案 A（預設） | 方案 B（共享資料夾）⭐ |
|------|--------------|-------------------|
| 設定難度 | ⭐⭐⭐⭐⭐ 簡單 | ⭐⭐⭐ 中等 |
| 檔案位置 | Service Account 的 Drive | 您的個人 Drive |
| 空間佔用 | Service Account 配額 | 您的個人配額 |
| 檔案管理 | 僅透過連結存取 | 完整 Drive 功能 |
| 推薦場景 | 簡單備份 | 需要管理檔案 |

---

### 其他進階設定

如果想將檔案上傳到特定的 Google Drive 資料夾：

1. 在 Google Drive 中建立資料夾（例如：`EventWall Photos`、`EventWall Videos`）
2. **（重要）** 將資料夾共享給 Service Account（參考上方的共享資料夾設置指南）
3. 取得資料夾 ID（從資料夾 URL 中複製，格式：`https://drive.google.com/drive/folders/{FOLDER_ID}`）
4. 設定環境變數：

#### 方法 A：使用 .env 檔案（推薦）

1. 複製 `.env.example` 為 `.env`：
   ```bash
   # Windows
   copy .env.example .env

   # macOS/Linux
   cp .env.example .env
   ```

2. 編輯 `.env` 檔案：
   ```env
   GDRIVE_PHOTOS_FOLDER_ID=你的照片資料夾ID
   GDRIVE_VIDEOS_FOLDER_ID=你的影片資料夾ID
   ```

3. 重新啟動伺服器

#### 方法 B：每次啟動時設定環境變數

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

**A:** 有兩種方式查看已上傳的檔案：

1. **透過連結直接存取**（推薦）：
   - 使用資料庫中的 `cloud_url` 或 `cloud_view_link` 直接開啟檔案
   - 由於檔案已設為公開，任何人都可以透過連結查看

2. **在 Google Drive 中查看**：
   - 檔案存儲在 Service Account 的獨立 Google Drive 空間中
   - Service Account 的 email 格式為 `xxxxx@project-id.iam.gserviceaccount.com`
   - 此 email 無法直接登入 Google Drive 查看
   - 如需在個人 Drive 中管理，可以透過 Drive API 將檔案分享給你的個人 Google 帳號

> **注意**：Service Account 有自己獨立的 Google Drive 空間，與你的個人 Google Drive 是分開的。上傳的檔案不會自動出現在你的個人 Google Drive 中。

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

### Q9: 出現 "Error: The caller does not have permission" 錯誤

**A:** 這表示 Service Account 權限不足或 API 未正確啟用。請檢查：
1. **確認 Google Drive API 已啟用**：
   - 前往 [API 庫](https://console.cloud.google.com/apis/library)
   - 搜尋 "Google Drive API" 並確認顯示「已啟用」
2. **確認使用正確的專案**：
   - 檢查 `google-credentials.json` 中的 `project_id` 是否與 GCP Console 中的專案一致
3. **確認 Service Account 已建立**：
   - 前往「IAM 和管理」→「服務帳號」
   - 確認服務帳號存在且狀態正常
4. **如果使用資料夾 ID**：
   - 確認 Service Account 有該資料夾的存取權限
   - 在 Google Drive 中右鍵點擊資料夾 → 共用 → 新增 Service Account 的 email

### Q10: 憑證檔案的安全性建議

**A:** 保護 `google-credentials.json` 的最佳實踐：
1. **絕不要提交到版本控制**：已在 `.gitignore` 中排除
2. **限制檔案權限**（Linux/macOS）：
   ```bash
   chmod 600 src/config/google-credentials.json
   ```
3. **生產環境建議**：
   - 使用環境變數或密鑰管理服務（如 AWS Secrets Manager、Azure Key Vault）
   - 定期輪換 Service Account 金鑰
4. **監控使用情況**：
   - 在 GCP Console 定期檢查 API 使用量和異常活動

---

## 技術細節

### 認證流程

系統使用 Google Service Account 進行認證：

1. 讀取 `google-credentials.json` 憑證檔案
2. 使用 `googleapis` 套件建立 GoogleAuth 認證
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
