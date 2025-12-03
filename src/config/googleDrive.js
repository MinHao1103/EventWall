/**
 * Google Drive 雲端存儲服務
 * 使用 OAuth 2.0 授權，提供異步上傳功能
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Google Drive 設定
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

// OAuth 2.0 憑證（從環境變數讀取）
const OAUTH_CONFIG = {
    clientId: process.env.GDRIVE_CLIENT_ID,
    clientSecret: process.env.GDRIVE_CLIENT_SECRET,
    refreshToken: process.env.GDRIVE_REFRESH_TOKEN
};

// 資料夾 ID（從環境變數讀取）
const FOLDER_IDS = {
    photos: process.env.GDRIVE_PHOTOS_FOLDER_ID || null,
    videos: process.env.GDRIVE_VIDEOS_FOLDER_ID || null
};

let driveService = null;
let isEnabled = false;

/**
 * 初始化 Google Drive 服務（使用 OAuth 2.0）
 */
async function initialize() {
    try {
        // 檢查必要的環境變數
        if (!OAUTH_CONFIG.clientId || !OAUTH_CONFIG.clientSecret || !OAUTH_CONFIG.refreshToken) {
            console.log('Google Drive: 未設定 OAuth 憑證，雲端上傳功能已停用');
            console.log('   請在 .env 檔案中設定以下環境變數:');
            console.log('   - GDRIVE_CLIENT_ID');
            console.log('   - GDRIVE_CLIENT_SECRET');
            console.log('   - GDRIVE_REFRESH_TOKEN');
            isEnabled = false;
            return false;
        }

        // 建立 OAuth2 客戶端
        const oauth2Client = new google.auth.OAuth2(
            OAUTH_CONFIG.clientId,
            OAUTH_CONFIG.clientSecret,
            'http://localhost:3000/oauth2callback' // Redirect URI（僅用於取得 token 時）
        );

        // 設定 Refresh Token
        oauth2Client.setCredentials({
            refresh_token: OAUTH_CONFIG.refreshToken
        });

        // 建立 Drive 服務
        driveService = google.drive({ version: 'v3', auth: oauth2Client });

        // 測試連線
        await driveService.files.list({ pageSize: 1 });

        isEnabled = true;
        console.log('Google Drive 雲端存儲已啟用 (OAuth 2.0)');
        return true;
    } catch (error) {
        console.error('Google Drive 初始化失敗:', error.message);
        isEnabled = false;
        return false;
    }
}

/**
 * 上傳檔案到 Google Drive
 * @param {string} localFilePath - 本地檔案路徑
 * @param {string} fileName - 檔案名稱
 * @param {string} mimeType - 檔案 MIME 類型
 * @param {string} mediaType - 媒體類型: 'photo' 或 'video'
 * @returns {Promise<Object>} - { success, fileId, webViewLink, webContentLink }
 */
async function uploadFile(localFilePath, fileName, mimeType, mediaType) {
    if (!isEnabled) {
        return { success: false, error: 'Google Drive 未啟用' };
    }

    try {
        // Debug: 顯示資料夾 ID 設定
        console.log(`[DEBUG] 上傳參數 - mediaType: ${mediaType}, 查找: ${mediaType + 's'}`);
        console.log(`[DEBUG] FOLDER_IDS:`, FOLDER_IDS);
        console.log(`[DEBUG] 選擇的資料夾 ID: ${FOLDER_IDS[mediaType + 's']}`);

        // 準備上傳參數
        const folderKey = mediaType + 's';
        const folderId = FOLDER_IDS[folderKey];

        const fileMetadata = {
            name: fileName,
            parents: folderId ? [folderId] : []
        };

        console.log(`[DEBUG] 最終 parents:`, fileMetadata.parents);

        const media = {
            mimeType: mimeType,
            body: fs.createReadStream(localFilePath)
        };

        // 上傳檔案
        const response = await driveService.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, webViewLink, webContentLink'
        });

        const fileId = response.data.id;

        // 設定檔案為公開可讀（任何人都可以通過連結查看）
        await driveService.permissions.create({
            fileId: fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone'
            }
        });

        console.log(`已上傳到 Google Drive: ${fileName} (ID: ${fileId})`);

        return {
            success: true,
            fileId: fileId,
            webViewLink: response.data.webViewLink,
            webContentLink: response.data.webContentLink,
            // 生成直接預覽連結
            directLink: `https://drive.google.com/uc?export=view&id=${fileId}`
        };
    } catch (error) {
        console.error(`✗ Google Drive 上傳失敗: ${fileName}`, error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * 刪除 Google Drive 上的檔案
 * @param {string} fileId - Google Drive 檔案 ID
 * @returns {Promise<boolean>}
 */
async function deleteFile(fileId) {
    if (!isEnabled || !fileId) {
        return false;
    }

    try {
        await driveService.files.delete({ fileId });
        console.log(`已從 Google Drive 刪除檔案: ${fileId}`);
        return true;
    } catch (error) {
        console.error(`✗ Google Drive 刪除失敗: ${fileId}`, error.message);
        return false;
    }
}

/**
 * 檢查 Google Drive 是否已啟用
 * @returns {boolean}
 */
function isGoogleDriveEnabled() {
    return isEnabled;
}

/**
 * 取得 Google Drive 空間使用資訊
 * @returns {Promise<Object>}
 */
async function getStorageInfo() {
    if (!isEnabled) {
        return null;
    }

    try {
        const response = await driveService.about.get({
            fields: 'storageQuota'
        });
        return response.data.storageQuota;
    } catch (error) {
        console.error('取得 Google Drive 空間資訊失敗:', error.message);
        return null;
    }
}

module.exports = {
    initialize,
    uploadFile,
    deleteFile,
    isGoogleDriveEnabled,
    getStorageInfo
};
