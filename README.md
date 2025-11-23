# 活動互動牆 Event Interactive Wall

一個功能完整的活動互動牆網站，支援照片/影片上傳、彈幕、留言板等功能，適用於婚禮、派對、企業活動等各種場合。

## 功能特色

- **姓名輸入頁** - 訪客輸入姓名後進入網站
- **輪播展示** - 自動播放上傳的照片和影片
- **彈幕系統** - 即時彈幕互動，隨機顏色和位置
- **留言板** - 訪客留言祝福，即時顯示
- **檔案上傳** - 支援拖曳上傳照片和影片
- **雲端備份** - 自動備份到 Google Drive（可選）
- **統計資料** - 即時顯示照片、影片、留言數量
- **資料匯出** - 一鍵匯出所有資料為 JSON 格式
- **即時同步** - 使用 WebSocket 實現多人即時互動

## 快速開始

### 環境需求

- Node.js 16.0 或以上
- MySQL 8.0 或以上
- Windows 作業系統

### 安裝步驟

#### 1. 安裝 MySQL 資料庫

確保 MySQL 已安裝並啟動服務。

#### 2. 初始化資料庫

```bash
# 方法一：執行批次腳本（推薦）
cd database
setup.bat

# 方法二：手動執行 SQL
mysql -u root -ppassword < database/init.sql
```

#### 3. 安裝 Node.js 套件

```bash
npm install
```

#### 4. 啟動伺服器

```bash
# 生產模式
npm start

# 開發模式（自動重啟）
npm run dev
```

#### 5. 訪問：`http://localhost:5001`

### 服務器端口

啟動後，系統將使用以下端口：

- **HTTP Server**: `http://localhost:5001` - 網站主要訪問端口
- **WebSocket**: `ws://localhost:8080` - 即時通訊端口（自動連線）

> 注意：請確保這兩個端口未被其他程式佔用。如需修改端口，請編輯 `server.js` 中的 `port` 變數（HTTP）和 WebSocket.Server 配置（WebSocket）。

#### 6. （可選）啟用 Google Drive 雲端備份

如果想要自動備份照片/影片到 Google Drive：

```bash
# 查看詳細設定指南
cat config/GOOGLE_DRIVE_SETUP.md

# 簡要步驟：
# 1. 建立 Google Cloud 專案並啟用 Drive API
# 2. 建立 Service Account 並下載 JSON 金鑰
# 3. 將金鑰重新命名為 google-credentials.json
# 4. 放置於 config/google-credentials.json
# 5. 重啟伺服器

# 不設定也沒關係，系統會自動使用純本地存儲模式
```

## 專案結構

```
EventWall/
├── public/                    # 前端靜態檔案
│   ├── index.html             # 姓名輸入頁
│   ├── main.html              # 主頁面
│   ├── styles.css             # 樣式檔案
│   └── main.js                # 前端 JavaScript
├── uploads/                   # 上傳檔案存儲目錄
│   ├── photos/                # 照片存放位置
│   ├── videos/                # 影片存放位置
│   └── thumbnails/            # 縮圖存放位置
├── config/                    # 設定檔
│   ├── database.js            # 資料庫連線設定
│   ├── googleDrive.js         # Google Drive 雲端服務（可選）
│   └── GOOGLE_DRIVE_SETUP.md  # 雲端設定指南
├── database/                  # 資料庫相關檔案
│   └── init.sql               # 資料庫初始化腳本（已包含雲端欄位）
├── server.js                  # Node.js 後端伺服器
└── README.md                  # 本檔案
```

## 資料庫設定

### 連線資訊

- **主機**: localhost
- **埠號**: 3306
- **資料庫**: event_wall
- **帳號**: root
- **密碼**: password

### 資料表結構

1. **media_files** - 媒體檔案資訊
2. **messages** - 留言資料
3. **danmaku** - 彈幕記錄
4. **site_config** - 網站設定

## 設定說明

### 修改資料庫密碼

編輯 `config/database.js`：

```javascript
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'your_password',  // 修改這裡
    database: 'event_wall'
};
```

### 修改網站設定

方法一：直接修改資料庫

```sql
UPDATE site_config
SET guest_name_a = '嘉賓A姓名',
    guest_name_b = '嘉賓B姓名',
    event_date = '2024-12-31',
    site_title = '活動互動牆'
WHERE id = 1;
```

方法二：使用 Node.js API

```javascript
const db = require('./config/database');

db.updateSiteConfig({
    guestNameA: '嘉賓A姓名',
    guestNameB: '嘉賓B姓名',
    eventDate: '2024-12-31',
    siteTitle: '活動互動牆'
});
```

## 使用說明

### 前端操作

1. **姓名輸入**：訪客進入網站時輸入姓名
2. **上傳媒體**：點擊或拖曳檔案到上傳區
3. **發送彈幕**：在輪播下方輸入彈幕內容
4. **留言祝福**：在右側留言板輸入留言
5. **匯出資料**：點擊 Footer 的匯出按鈕

### 後端 API

- `POST /api/upload` - 上傳檔案
- `GET /api/media` - 取得所有媒體檔案
- `POST /api/messages` - 新增留言
- `GET /api/messages` - 取得所有留言

## 安全性建議

1. **修改預設密碼**：請務必修改 MySQL root 密碼
2. **檔案類型限制**：只允許圖片和影片格式
3. **檔案大小限制**：預設 100MB，可調整
4. **SQL 注入防護**：使用參數化查詢
5. **輸入驗證**：前後端都要驗證使用者輸入

## 效能優化

1. **資料庫索引**：已為常用欄位建立索引
2. **連線池**：使用連線池管理資料庫連線
3. **快取機制**：可加入 Redis 快取熱門查詢
4. **CDN 加速**：生產環境建議使用 CDN
5. **圖片壓縮**：上傳前建議壓縮大圖片

## 備份與還原

### 備份資料庫

```bash
mysqldump -u root -ppassword event_wall > backup.sql
```

### 備份檔案

```bash
# 複製 uploads 目錄
xcopy uploads backup\uploads /E /I
```

### 還原資料庫

```bash
mysql -u root -ppassword event_wall < backup.sql
```