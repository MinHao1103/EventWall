# Google Drive 雲端存儲設定指南

本指南將幫助你設定 Google Drive API，啟用雲端雙重存儲功能。

## 功能說明

啟用後，所有上傳的照片和影片會：

1. **立即存儲到本地** `uploads/` 資料夾（保證快速訪問）
2. **異步上傳到 Google Drive**（提供雲端備份和分享）
3. **不影響用戶體驗**（上傳過程在背景執行）

## 步驟 1: 建立 Google Cloud 專案

### 1.1 前往 Google Cloud Console

訪問：https://console.cloud.google.com/

### 1.2 建立新專案

1. 點擊頂部的專案選擇器
2. 點擊「新增專案」
3. 輸入專案名稱（例如：`EventWall-Storage`）
4. 點擊「建立」

## 步驟 2: 啟用 Google Drive API

### 2.1 前往 API 庫

1. 在 Google Cloud Console 中，前往「API 和服務」→「資料庫」
2. 或直接訪問：https://console.cloud.google.com/apis/library

### 2.2 搜尋並啟用

1. 搜尋「Google Drive API」
2. 點擊進入
3. 點擊「啟用」按鈕

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

## 步驟 4: 建立金鑰檔案

### 4.1 下載 JSON 金鑰

1. 在「服務帳號」列表中，點擊剛建立的帳號
2. 前往「金鑰」標籤
3. 點擊「新增金鑰」→「建立新金鑰」
4. 選擇「JSON」格式
5. 點擊「建立」
6. 金鑰檔案會自動下載（檔名類似：`eventwall-storage-abc123.json`）

### 4.2 重要提醒

- **妥善保管此檔案**：它包含敏感憑證
- **不要上傳到 Git**：已在 `.gitignore` 中排除
- **不要分享給他人**：任何擁有此檔案的人都能訪問你的 Google Drive

## 步驟 5: 配置應用程式

### 5.1 放置憑證檔案

將下載的 JSON 檔案重新命名為 `google-credentials.json`，並放置在：

```
EventWall/config/google-credentials.json
```

### 5.2 驗證檔案位置

確保檔案路徑正確：

```
EventWall/
├── config/
│   ├── database.js
│   ├── googleDrive.js
│   └── google-credentials.json  ← 這裡
├── server.js
└── ...
```
