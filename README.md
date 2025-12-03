# 活動互動牆 Event Interactive Wall

一個功能完整的活動互動牆網站，支援照片/影片上傳、彈幕、留言板等功能，適用於婚禮、派對、企業活動等各種場合。

## 功能特色

- 照片/影片輪播展示
- 即時彈幕互動
- 訪客留言祝福
- 拖曳上傳檔案
- Google Drive 雲端備份（可選）
- WebSocket 即時同步
- 統計與資料匯出

## 環境需求

- **Node.js**: 16.0 或以上
- **MySQL**: 8.0 或以上
- **作業系統**: Windows / macOS / Linux

## 快速開始

### 1. 安裝 MySQL 資料庫

確保 MySQL 已安裝並啟動服務。

### 2. 初始化資料庫

**方法一：使用批次腳本（推薦）**

```bash
cd database
setup.bat
```

**方法二：手動執行 SQL**

```bash
# 建立資料庫
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS event_wall CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 初始化資料表
mysql -u root -p event_wall < database/init.sql
```

### 3. 設定資料庫連線

編輯 `src/config/database.js`，修改資料庫密碼：

```javascript
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "your_password", // 修改這裡
  database: "event_wall",
};
```

### 4. 安裝 Node.js 套件

```bash
npm install
```

### 5. 啟動伺服器

```bash
# 生產模式
npm start

# 開發模式（自動重啟）
npm run dev
```

### 6. 訪問網站

開啟瀏覽器，訪問：**`http://localhost:5001`**

## 服務端口

- **HTTP Server**: `http://localhost:5001` - 網站主要訪問端口
- **WebSocket**: `ws://localhost:8080` - 即時通訊端口（自動連線）

> 請確保這兩個端口未被其他程式佔用。

## 選用設定

### 啟用 Google Drive 雲端備份

如需自動備份照片/影片到**您的個人 Google Drive**：

1. 查看詳細設定指南：`docs/GOOGLE_DRIVE_SETUP.md`
2. 建立 Google Cloud 專案並啟用 Drive API
3. 設定 OAuth 2.0 同意畫面
4. 建立 OAuth 客戶端 ID
5. 取得 Refresh Token：`npm run get-token`
6. 設定環境變數（`.env` 檔案）
7. 重啟伺服器

> 使用 OAuth 2.0 授權，檔案會上傳到您的個人 Google Drive，使用您自己的儲存空間配額。
>
> 若不設定雲端備份，系統會自動使用純本地存儲模式。

### 修改網站設定

編輯資料庫中的 `site_config` 資料表：

```sql
UPDATE site_config
SET guest_name_a = '嘉賓A姓名',
    guest_name_b = '嘉賓B姓名',
    event_date = '2024-12-31',
    site_title = '活動互動牆'
WHERE id = 1;
```

## 專案結構

```
EventWall/
├── src/                       # 後端源碼
│   ├── server.js              # 主伺服器
│   ├── config/                # 配置檔案
│   │   ├── database.js        # 資料庫連線設定
│   │   └── googleDrive.js     # Google Drive 雲端服務
│   └── scripts/               # 後端工具腳本
│       └── generate-thumbnails.js # 縮圖生成工具
├── public/                    # 前端靜態資源
│   ├── pages/                 # HTML 頁面
│   │   ├── index.html         # 姓名輸入頁
│   │   └── main.html          # 主頁面
│   ├── js/                    # JavaScript
│   │   └── main.js            # 前端邏輯
│   └── css/                   # 樣式表
│       └── styles.css         # 樣式檔案
├── uploads/                   # 上傳檔案存儲
│   ├── photos/                # 照片
│   ├── videos/                # 影片
│   └── thumbnails/            # 縮圖
├── database/                  # 資料庫相關
│   ├── init.sql               # 初始化腳本
│   └── setup.bat              # Windows 設定腳本
├── docs/                      # 文檔
│   ├── API.md                 # API 文檔
│   └── GOOGLE_DRIVE_SETUP.md  # 雲端設定教學
├── .gitignore
├── package.json               # 專案配置
└── README.md                  # 本檔案
```

## 常用指令

```bash
# 安裝依賴
npm install

# 啟動伺服器（生產模式）
npm start

# 啟動伺服器（開發模式）
npm run dev

# 生成縮圖（為現有照片生成縮圖）
npm run generate-thumbnails

# 取得 Google Drive Refresh Token（首次設定雲端備份）
npm run get-token

# 初始化資料庫（Windows）
cd database && setup.bat
```

## 資料庫資訊

- **資料庫名稱**: event_wall
- **字元集**: utf8mb4
- **資料表**:
  - `media_files` - 媒體檔案資訊
  - `messages` - 留言資料
  - `danmaku` - 彈幕記錄
  - `site_config` - 網站設定

## 文檔

- **API 文檔**: 查看 `docs/API.md` 了解所有 API 端點
- **雲端設定**: 查看 `docs/GOOGLE_DRIVE_SETUP.md` 了解 Google Drive 設定步驟

## 安全性建議

1. 修改 MySQL root 預設密碼
2. 在生產環境中使用環境變數存儲敏感資訊
3. 啟用 HTTPS 加密傳輸
4. 實作使用者身份驗證
5. 加入 API 速率限制

## 備份

### 備份資料庫

```bash
mysqldump -u root -p event_wall > backup.sql
```

### 備份檔案

```bash
# Windows
xcopy uploads backup\uploads /E /I

# macOS/Linux
cp -r uploads backup/uploads
```

## Google Drive 雲端備份設定

本專案支援將上傳的照片和影片自動備份到 Google Drive（可選功能）。

### 功能特色

啟用後，系統會：

- ✅ **立即存儲到本地**：保證快速訪問和展示
- ✅ **異步上傳到雲端**：背景自動備份，不影響用戶體驗
- ✅ **雙重保障**：本地 + 雲端雙重存儲，資料更安全

### 快速設定步驟

1. 建立 Google Cloud 專案並啟用 Drive API
2. 設定 OAuth 2.0 同意畫面
3. 建立 OAuth 客戶端 ID
4. 執行 `npm run get-token` 取得 Refresh Token
5. 將憑證設定到 `.env` 檔案
6. 重新啟動伺服器

### 完整設定教學

詳細的設定步驟、進階配置和常見問題，請參考：

📖 **[Google Drive 雲端存儲設定指南 (OAuth 2.0)](docs/GOOGLE_DRIVE_SETUP.md)**

設定指南包含：

- 詳細的圖文步驟說明
- OAuth 2.0 授權流程
- Refresh Token 取得方法
- 進階設定（指定上傳資料夾）
- 常見問題解答（FAQ）
- 技術細節說明

> **提示**：如果不設定雲端備份，系統會自動使用純本地存儲模式，所有功能正常運作。

## 技術支援

如遇到問題，請檢查：

1. MySQL 服務是否正常運行
2. Node.js 版本是否符合需求
3. 端口 5001 是否被佔用
4. 資料庫密碼是否正確設定
5. 檔案上傳目錄權限是否正確

## 授權

本專案僅供學習和個人使用。
