# Google Login 設定指南

本專案已整合 Google OAuth 2.0 登入功能，**完全取代原本的手動姓名輸入**。使用者必須透過 Google 帳號登入才能使用活動互動牆。

## 快速開始

### 步驟 1: 取得 Google OAuth 憑證

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立或選擇專案
3. 啟用「OAuth 同意畫面」（選擇「用戶端」）
4. 建立「用戶端 ID」（網頁應用程式）
5. 設定已授權的重新導向 URI：
   ```
   http://localhost:5001/auth/google/callback
   ```
6. 複製 **Client ID** 和 **Client Secret**

### 步驟 2: 設定環境變數

編輯 `.env` 檔案：

```bash
# 貼上您的 Google OAuth 憑證
GOOGLE_AUTH_CLIENT_ID=貼上-您的-client-id.apps.googleusercontent.com
GOOGLE_AUTH_CLIENT_SECRET=貼上-您的-client-secret

# 設定一個隨機字串（至少 32 字元）
SESSION_SECRET=請改成一個隨機的超長字串例如kj3h4k2j3h4kjh23k4jh23k4jh23k4jh2

# 保持預設值
APP_URL=http://localhost:5001
```

### 步驟 3: 啟動並測試

```bash
npm start
```

訪問 http://localhost:5001 → 使用 Google 登入 → 上傳檔案測試

---

## 與 Google Drive 整合

本專案同時支援：

1. **Google OAuth（使用者登入）** - 使用本文件的設定
2. **Google Drive API（雲端備份）** - 使用 `docs/GOOGLE_DRIVE_SETUP.md` 的設定

兩者可以使用相同的 Google Cloud 專案，但需要分別設定：

- Google OAuth: 用於使用者身份驗證
- Google Drive API: 用於檔案上傳到雲端

## 參考資料

- [Google OAuth 2.0 文檔](https://developers.google.com/identity/protocols/oauth2)
- [Passport.js 文檔](http://www.passportjs.org/docs/)
- [Express Session 文檔](https://github.com/expressjs/session)
