/**
 * 取得 Google Drive OAuth 2.0 Refresh Token
 *
 * 使用方式：
 * 1. 在 .env 中設定 GDRIVE_CLIENT_ID 和 GDRIVE_CLIENT_SECRET
 * 2. 執行：node src/scripts/get-refresh-token.js
 * 3. 在瀏覽器中開啟顯示的 URL 並授權
 * 4. 複製取得的 Refresh Token 到 .env 檔案
 */

require('dotenv').config();
const { google } = require('googleapis');
const http = require('http');
const url = require('url');

// OAuth 2.0 設定
const CLIENT_ID = process.env.GDRIVE_CLIENT_ID;
const CLIENT_SECRET = process.env.GDRIVE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

// 檢查必要的環境變數
if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('錯誤: 請先在 .env 檔案中設定以下環境變數:');
    console.error('  GDRIVE_CLIENT_ID');
    console.error('  GDRIVE_CLIENT_SECRET');
    process.exit(1);
}

// 建立 OAuth2 客戶端
const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

// 產生授權 URL
const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent' // 強制顯示同意畫面，確保取得 refresh token
});

console.log('============================================');
console.log('取得 Google Drive Refresh Token');
console.log('============================================\n');

// 啟動本地伺服器接收授權回調
const server = http.createServer(async (req, res) => {
    try {
        if (req.url.indexOf('/oauth2callback') > -1) {
            // 解析 URL 取得授權碼
            const qs = new url.URL(req.url, REDIRECT_URI).searchParams;
            const code = qs.get('code');

            if (!code) {
                res.end('授權失敗：未取得授權碼');
                return;
            }

            console.log('已收到授權碼，正在取得 Refresh Token...\n');

            // 用授權碼交換 tokens
            const { tokens } = await oauth2Client.getToken(code);

            console.log('============================================');
            console.log('成功！請將以下 Refresh Token 複製到 .env 檔案中：');
            console.log('============================================\n');
            console.log(`GDRIVE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
            console.log('============================================\n');

            // 回應瀏覽器
            res.end('授權成功！Refresh Token 已顯示在終端機中，您可以關閉此視窗。');

            // 關閉伺服器
            server.close();
        }
    } catch (error) {
        console.error('取得 token 時發生錯誤:', error.message);
        res.end('發生錯誤，請查看終端機訊息');
        server.close();
    }
});

server.listen(3000, async () => {
    console.log('本地伺服器已啟動於 http://localhost:3000\n');
    console.log('請在瀏覽器中開啟以下 URL 進行授權：\n');
    console.log(authUrl);
    console.log('\n正在自動開啟瀏覽器...\n');

    // 自動開啟瀏覽器（使用動態 import）
    try {
        const open = (await import('open')).default;
        await open(authUrl);
    } catch (error) {
        console.log('無法自動開啟瀏覽器，請手動複製上方 URL 到瀏覽器中開啟。\n');
    }
});
