/**
 * Google Drive 雲端存儲服務
 * 提供異步上傳功能，不影響本地存儲
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Google Drive 設定
const CREDENTIALS_PATH = path.join(__dirname, 'google-credentials.json');
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

// 資料夾 ID（可選：預先在 Google Drive 建立資料夾並填入 ID）
const FOLDER_IDS = {
    photos: process.env.GDRIVE_PHOTOS_FOLDER_ID || null,
    videos: process.env.GDRIVE_VIDEOS_FOLDER_ID || null
};

let driveService = null;
let isEnabled = false;

/**
 * 初始化 Google Drive 服務
 */
async function initialize() {
    try {
        // 檢查憑證檔案是否存在
        if (!fs.existsSync(CREDENTIALS_PATH)) {
            console.log('⚠ Google Drive: 未找到憑證檔案，雲端上傳功能已停用');
            console.log(`   請將 Google Service Account 金鑰放置於: ${CREDENTIALS_PATH}`);
            isEnabled = false;
            return false;
        }

        // 讀取憑證
        const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));

        // 建立認證
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: SCOPES,
        });

        // 建立 Drive 服務
        driveService = google.drive({ version: 'v3', auth });

        // 測試連線
        await driveService.files.list({ pageSize: 1 });

        isEnabled = true;
        console.log('Google Drive 雲端存儲已啟用');
        return true;
    } catch (error) {
        console.error('✗ Google Drive 初始化失敗:', error.message);
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
        // 準備上傳參數
        const fileMetadata = {
            name: fileName,
            parents: FOLDER_IDS[mediaType + 's'] ? [FOLDER_IDS[mediaType + 's']] : []
        };

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
