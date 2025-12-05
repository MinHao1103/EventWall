# 日誌系統說明

## 概述

本專案使用 **Winston** 作為日誌框架，支援跨平台（Windows / Ubuntu）運行，並提供時間戳、日誌分級、自動歸檔等功能。

## 功能特性

### 1. 時間戳格式

所有日誌都帶有精確到毫秒的時間戳：

```
[2025-12-05 14:21:17.469] INFO: 活動互動牆伺服器啟動中...
```

### 2. 日誌輸出位置

#### Console 輸出（即時）

- 開發環境：帶顏色的即時日誌
- 生產環境：純文字格式

#### 檔案輸出（自動歸檔）

- **一般日誌**: `logs/event-wall-YYYY-MM-DD.log`

  - 包含所有級別的日誌（info, warn, error, debug）
  - 按日期自動切分

- **錯誤日誌**: `logs/error-YYYY-MM-DD.log`
  - 僅包含 error 級別的日誌
  - 按日期自動切分

#### 日誌輪替設定

- **保留期限**: 30 天
- **單檔大小上限**: 20MB
- **壓縮**: 舊日誌自動壓縮為 .gz 格式

### 3. 日誌級別

| 級別  | 用途             | 範例                         |
| ----- | ---------------- | ---------------------------- |
| error | 錯誤訊息         | 資料庫連線失敗、API 請求失敗 |
| warn  | 警告訊息         | 功能未啟用、配置缺失         |
| info  | 一般資訊（預設） | 伺服器啟動、檔案上傳成功     |
| debug | 除錯訊息         | 詳細的變數值、執行流程追蹤   |

## 使用方式

### 基本用法

```javascript
const { info, warn, error, debug } = require("./utils/logger");

// 一般訊息
info("伺服器已啟動於 http://localhost:5001");

// 警告訊息
warn("Google Drive 雲端備份未啟用（僅本地存儲）");

// 錯誤訊息
error("資料庫連線失敗:", err.message);

// 除錯訊息（僅在 LOG_LEVEL=debug 時顯示）
debug(`上傳參數 - mediaType: ${mediaType}`);
```

### 環境變數控制

在 `.env` 檔案中設定日誌級別：

```bash
# 日誌級別: error | warn | info | debug
LOG_LEVEL=info  # 預設值
```

**級別說明**:

- `error`: 僅顯示錯誤訊息
- `warn`: 顯示警告 + 錯誤
- `info`: 顯示一般資訊 + 警告 + 錯誤（推薦）
- `debug`: 顯示所有訊息（開發除錯用）

## 檔案架構

```
src/utils/logger.js      # Winston 配置
logs/
├── event-wall-2025-12-05.log        # 當天的完整日誌
├── error-2025-12-05.log             # 當天的錯誤日誌
├── event-wall-2025-12-04.log.gz     # 前一天的壓縮日誌
└── .audit.json files                # Winston 內部管理檔案
```

## 已整合的檔案

以下檔案已使用 Winston logger：

### 主程式

- `src/server.js` - 伺服器啟動、WebSocket 連線
- `src/routes/media.js` - 檔案上傳、雲端同步
- `src/routes/api.js` - API 端點
- `src/config/database.js` - 資料庫操作
- `src/config/googleDrive.js` - Google Drive 雲端存儲

### 工具腳本

- `src/scripts/get-refresh-token.js` - OAuth Token 取得工具
- `src/scripts/generate-thumbnails.js` - 縮略圖批次生成工具

### 前端

- `public/js/main.js` - 保留原生 `console.log`（瀏覽器環境）

## 查看日誌

### 即時查看（開發環境）

```bash
npm start
# 或
npm run dev
```

### 查看歷史日誌

#### 查看完整日誌

```bash
cat logs/event-wall-2025-12-05.log
```

#### 查看錯誤日誌

```bash
cat logs/error-2025-12-05.log
```

#### 即時追蹤日誌（類似 tail -f）

```bash
# Windows (PowerShell)
Get-Content logs/event-wall-2025-12-05.log -Wait

# Linux / macOS
tail -f logs/event-wall-2025-12-05.log
```

#### 搜尋特定關鍵字

```bash
# Windows (PowerShell)
Select-String -Path "logs/*.log" -Pattern "錯誤"

# Linux / macOS
grep "錯誤" logs/*.log
```

## 生產環境建議

### 日誌級別設定

```bash
# .env (生產環境)
LOG_LEVEL=info  # 或 warn（減少日誌量）
```

### 日誌清理策略

Winston 會自動刪除 30 天前的日誌，但如果需要手動清理：

```bash
# 刪除 30 天前的日誌
find logs/ -name "*.log*" -mtime +30 -delete
```

### 監控日誌檔案大小

```bash
# 查看 logs 目錄總大小
du -sh logs/
```

## 相關資源

- [Winston 官方文件](https://github.com/winstonjs/winston)
- [Winston Daily Rotate File](https://github.com/winstonjs/winston-daily-rotate-file)
