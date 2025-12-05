# Google Drive 雲端存儲設定指南（OAuth 2.0）

本指南將幫助你設定 Google Drive API，啟用雲端雙重存儲功能，使用 OAuth 2.0 授權方式將檔案上傳到您的個人 Google Drive。

## 功能說明

啟用後，所有上傳的照片和影片會：

1. **立即存儲到本地** `uploads/` 資料夾（保證快速訪問）
2. **異步上傳到您的 Google Drive**（提供雲端備份和分享）
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

## 步驟 3: 設定 OAuth 2.0 同意畫面

### 3.1 前往 OAuth 同意畫面

1. 前往「API 和服務」→「OAuth 同意畫面」
2. 或直接訪問：https://console.cloud.google.com/apis/credentials/consent

### 3.2 設定同意畫面

1. 選擇「外部」（External）用戶類型
2. 點擊「建立」

### 3.3 填寫應用程式資訊

1. **應用程式名稱**：EventWall（或您喜歡的名稱）
2. **使用者支援電子郵件**：選擇您的 Gmail 信箱
3. **開發人員聯絡資訊**：填入您的電子郵件
4. 點擊「儲存並繼續」

### 3.4 設定範圍（Scopes）

1. 點擊「新增或移除範圍」
2. 搜尋並勾選：`https://www.googleapis.com/auth/drive.file`
3. 點擊「更新」
4. 點擊「儲存並繼續」

### 3.5 新增測試使用者（必要步驟）

**重要**：由於應用程式處於測試階段，只有加入「測試使用者」列表的 Gmail 帳號才能授權使用。

1. 向下捲動到「測試使用者」區域
2. 點擊「新增使用者」按鈕
3. 輸入您要使用的 Gmail 信箱（例如：yourname@gmail.com）
   - 這應該是您個人的 Gmail 帳號
   - 檔案會上傳到這個帳號的 Google Drive
4. 點擊「新增」
5. 點擊「儲存並繼續」

**為什麼需要這個步驟？**

- Google 要求測試階段的應用程式必須明確列出允許使用的帳號
- 如果不加入測試使用者，授權時會出現「access_denied」錯誤
- 測試階段最多可以加入 100 個測試使用者

---

## 步驟 4: 建立 OAuth 2.0 憑證

### 4.1 前往憑證頁面

1. 前往「API 和服務」→「憑證」
2. 或直接訪問：https://console.cloud.google.com/apis/credentials

### 4.2 建立 OAuth 客戶端 ID

**重要**：這個步驟會產生 Client ID 和 Client Secret，是授權的關鍵憑證。

1. 點擊頁面上方的「建立憑證」按鈕
2. 在下拉選單中選擇「OAuth 客戶端 ID」
3. **應用程式類型**選擇：**網路應用程式**（Web application）
4. **名稱**：輸入 `EventWall Web Client`（或您喜歡的名稱）

### 4.3 設定重新導向 URI

**重要**：必須精確設定 Redirect URI，否則授權時會出現「redirect_uri_mismatch」錯誤。

在「已授權的重新導向 URI」區域中：

1. 點擊「新增 URI」按鈕
2. 輸入以下 URI（一字不差）：
   ```
   http://localhost:3000/oauth2callback
   ```
3. 確認設定：
   - 使用 `http`（不是 `https`）
   - 使用 `localhost`（不是 `127.0.0.1`）
   - 端口是 `3000`
   - 路徑是 `/oauth2callback`
4. 點擊頁面下方的「建立」按鈕

### 4.4 記錄憑證

建立完成後會彈出視窗顯示：

- **OAuth 用戶端已建立**
- **用戶端 ID**（Client ID）- 以 `.apps.googleusercontent.com` 結尾
- **用戶端密碼**（Client Secret）- 一串隨機字元

**重要操作**：

1. 複製 **Client ID** 和 **Client Secret** 到記事本暫存
2. 這兩個值稍後需要填入 `.env` 檔案
3. 如果忘記複製，可以隨時回到憑證頁面查看
   - Client ID 會顯示
   - Client Secret 可以重新產生

**安全提醒**：

- 不要將這些憑證公開或上傳到 Git
- 不要分享給他人
- `.env` 檔案已被 `.gitignore` 排除，確保安全

---

## 步驟 5: 設定環境變數

### 5.1 編輯 .env 檔案

開啟專案根目錄的 `.env` 檔案（如果沒有，請複製 `.env.example` 為 `.env`）：

```bash
# Windows
copy .env.example .env

# macOS/Linux
cp .env.example .env
```

### 5.2 填入 OAuth 憑證

在 `.env` 檔案中填入您剛才取得的憑證：

```env
# OAuth 2.0 Client ID
GDRIVE_CLIENT_ID=您的-Client-ID.apps.googleusercontent.com

# OAuth 2.0 Client Secret
GDRIVE_CLIENT_SECRET=您的-Client-Secret

# Refresh Token（下一步取得）
GDRIVE_REFRESH_TOKEN=
```

---

## 步驟 6: 取得 Refresh Token

### 6.1 執行取得 Token 腳本

在專案根目錄執行：

```bash
npm run get-token
```

### 6.2 授權流程

1. 腳本會自動開啟瀏覽器（如果沒有自動開啟，請手動複製顯示的 URL）
2. 選擇您的 Google 帳號
3. 可能會看到「Google 尚未驗證這個應用程式」的警告：
   - 點擊「進階」
   - 點擊「前往 EventWall（不安全）」
   - 這是正常的，因為應用程式還在測試階段
4. 勾選授權範圍，點擊「繼續」
5. 授權完成後，終端機會顯示 **Refresh Token**

### 6.3 複製 Refresh Token

將終端機顯示的 Refresh Token 複製到 `.env` 檔案中：

```env
GDRIVE_REFRESH_TOKEN=1//0abcdefg...您的完整Token
```

---

## 步驟 7: 設定資料夾 ID（可選）

如果您想將照片和影片上傳到特定的資料夾：

### 7.1 在 Google Drive 建立資料夾

1. 前往 https://drive.google.com/
2. 建立資料夾結構：
   ```
   EventWall 備份/
   ├── 照片/
   └── 影片/
   ```

### 7.2 取得資料夾 ID

1. 開啟「照片」資料夾
2. 查看瀏覽器網址列：
   ```
   https://drive.google.com/drive/folders/1ABCdefGHI...
                                           ^^^^^^^^^^^
                                           這就是資料夾 ID
   ```
3. 複製資料夾 ID 到 `.env` 檔案

對「影片」資料夾重複相同步驟。

`.env` 檔案範例：

```env
GDRIVE_PHOTOS_FOLDER_ID=1BS_zBZKDx20YjBnyJC2nY0a0z2qWT2Bh
GDRIVE_VIDEOS_FOLDER_ID=1ytrbFA8uGWJEW3aNvlMK05M79nXdE-nx
```

如果不設定資料夾 ID，檔案會上傳到您的 Google Drive 根目錄。

---

## 步驟 8: 啟動並測試

### 8.1 重新啟動伺服器

```bash
npm start
```

### 8.2 查看啟動日誌

如果設定成功，你應該會看到：

```
============================================
活動互動牆伺服器啟動中...
============================================

環境變數設定:
   照片資料夾 ID: 1BS_zBZKDx20YjBnyJC2nY0a0z2qWT2Bh
   影片資料夾 ID: 1ytrbFA8uGWJEW3aNvlMK05M79nXdE-nx

MySQL 資料庫連線成功
Google Drive 雲端存儲已啟用 (OAuth 2.0)
HTTP 伺服器運行於: http://localhost:5001
WebSocket 伺服器運行於: ws://localhost:5001
============================================
```

如果看到以下訊息，表示雲端功能未啟用：

```
Google Drive: 未設定 OAuth 憑證，雲端上傳功能已停用
```

### 8.3 測試上傳功能

1. 訪問網站：http://localhost:5001
2. 輸入姓名進入主頁
3. 上傳一張照片或影片
4. 觀察伺服器日誌，應該會看到：
   ```
   開始上傳到雲端: 1234567890-username-photo.jpg
   [DEBUG] 上傳參數 - mediaType: photo, 查找: photos
   [DEBUG] 選擇的資料夾 ID: 1BS_zBZKDx20YjBnyJC2nY0a0z2qWT2Bh
   已上傳到 Google Drive: 1234567890-username-photo.jpg (ID: 1ABC...XYZ)
   ```
5. 前往您的 Google Drive 確認檔案是否成功上傳

---

## 常見問題

### Q1: 為什麼要使用 OAuth 2.0 而不是 Service Account？

**A:** Service Account 本身沒有 Google Drive 儲存空間配額，必須使用共用雲端硬碟（Shared Drives），但共用雲端硬碟需要 Google Workspace 帳號（付費）。個人 Google 帳號無法使用此功能。

使用 OAuth 2.0 可以：

- 使用您自己的個人 Google Drive 儲存空間
- 不需要 Google Workspace 付費帳號
- 檔案直接出現在您的 Google Drive 中

### Q2: Refresh Token 會過期嗎？

**A:** 只要符合以下條件，Refresh Token 通常不會過期：

1. 應用程式持續使用（每 6 個月至少使用一次）
2. 沒有被用戶手動撤銷授權
3. 沒有更改密碼或安全設定

如果 Refresh Token 過期，重新執行 `npm run get-token` 即可取得新的。

### Q3: 出現「Google 尚未驗證這個應用程式」警告怎麼辦？

**A:** 這是正常的，因為您的應用程式還在測試階段，沒有經過 Google 正式審核。點擊「進階」→「前往 EventWall（不安全）」即可繼續。

如果要移除警告，需要：

1. 提交應用程式給 Google 審核（複雜且耗時）
2. 或將 OAuth 同意畫面設為「內部」（僅限 Google Workspace 帳號）

對於個人使用，可以忽略此警告。

### Q4: 可以讓多個用戶使用嗎？

**A:** 目前的設定只授權一個 Google 帳號（您自己的）。所有上傳的檔案都會存到您的 Google Drive。

如果要讓每個用戶上傳到各自的 Drive，需要實作完整的 OAuth 流程（每次上傳前都要授權），複雜度會大幅增加。

### Q5: 如何撤銷授權？

**A:**

1. 前往 https://myaccount.google.com/permissions
2. 找到「EventWall」應用程式
3. 點擊「移除存取權」

撤銷後，系統將無法上傳到 Google Drive，需要重新執行 `npm run get-token`。

### Q6: Refresh Token 的安全性如何？

**A:**

- Refresh Token 非常重要，任何擁有它的人都能以您的名義訪問 Google Drive
- 請妥善保管 `.env` 檔案，不要上傳到 Git 或公開分享
- `.env` 已在 `.gitignore` 中排除，不會被提交到版本控制

生產環境建議：

- 使用環境變數或密鑰管理服務（如 AWS Secrets Manager）
- 定期輪換 Refresh Token
- 限制 OAuth 範圍（僅使用必要的權限）

### Q7: 上傳失敗怎麼辦？

**A:** 檢查以下項目：

1. 確認 `.env` 檔案中的三個 OAuth 變數都已正確填寫
2. 確認 Refresh Token 沒有過期或被撤銷
3. 檢查網路連線是否正常
4. 查看伺服器日誌中的詳細錯誤訊息
5. 確認您的 Google Drive 還有足夠空間

### Q8: 如何停用雲端功能？

**A:** 只需將 `.env` 檔案中的 OAuth 變數清空或刪除即可：

```env
GDRIVE_CLIENT_ID=
GDRIVE_CLIENT_SECRET=
GDRIVE_REFRESH_TOKEN=
```

然後重啟伺服器，系統會自動切換到純本地存儲模式。

---

## 技術細節

### 認證流程

系統使用 OAuth 2.0 授權碼流程（Authorization Code Flow）：

1. **初次授權**（執行 `npm run get-token`）：

   - 用戶訪問授權 URL
   - 登入 Google 並同意授權
   - Google 重新導向並返回授權碼（Code）
   - 用授權碼交換 Access Token 和 Refresh Token

2. **日常使用**（伺服器啟動後）：
   - 使用 Refresh Token 自動取得新的 Access Token
   - Access Token 用於呼叫 Google Drive API
   - Access Token 過期後自動使用 Refresh Token 更新

### 上傳流程

1. 用戶上傳檔案到伺服器
2. 檔案立即儲存到本地 `uploads/` 資料夾
3. 資料庫記錄建立（含本地路徑）
4. HTTP 回應立即返回給用戶
5. 背景任務啟動：
   - 讀取本地檔案
   - 使用 OAuth 2.0 認證上傳到 Google Drive
   - 設定公開讀取權限
   - 更新資料庫記錄（雲端資訊）
   - 透過 WebSocket 通知所有客戶端

### 權限範圍

目前使用的 OAuth 範圍：

- `https://www.googleapis.com/auth/drive.file`

此範圍僅允許：

- 存取由此應用程式建立或開啟的檔案
- 不能存取您 Google Drive 中的其他檔案

這是最小權限原則，確保安全性。

---

## 相關資源

- [Google Cloud Console](https://console.cloud.google.com/)
- [Google Drive API 文檔](https://developers.google.com/drive/api/v3/about-sdk)
- [OAuth 2.0 說明](https://developers.google.com/identity/protocols/oauth2)
- [googleapis Node.js 套件](https://github.com/googleapis/google-api-nodejs-client)

---

## 回到主文檔

詳見專案主要文檔：[README.md](../README.md)
