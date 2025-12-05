/**
 * MySQL 資料庫連線配置
 * 使用 mysql2 套件建立連線池
 */

const mysql = require('mysql2');
const { info, error } = require('../utils/logger');

// 資料庫連線設定
const dbConfig = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'password',
    database: 'event_wall',
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// 建立連線池
const pool = mysql.createPool(dbConfig);
const promisePool = pool.promise();

// 測試資料庫連線
async function testConnection() {
    try {
        const connection = await promisePool.getConnection();
        info('MySQL 資料庫連線成功');
        info(`資料庫: ${dbConfig.database}`);
        connection.release();
        return true;
    } catch (err) {
        error('✗ MySQL 資料庫連線失敗:', err.message);
        return false;
    }
}

// 取得統計資料
async function getStatistics() {
    try {
        const [photos] = await promisePool.query('SELECT COUNT(*) as count FROM media_files WHERE media_type = "photo"');
        const [videos] = await promisePool.query('SELECT COUNT(*) as count FROM media_files WHERE media_type = "video"');
        const [messages] = await promisePool.query('SELECT COUNT(*) as count FROM messages');

        return {
            photoCount: photos[0].count,
            videoCount: videos[0].count,
            messageCount: messages[0].count
        };
    } catch (err) {
        error('取得統計資料失敗:', err);
        return null;
    }
}

// 新增媒體檔案
async function insertMediaFile(fileData) {
    const query = `
        INSERT INTO media_files (filename, original_name, uploader, file_type, file_size, file_path, file_url, thumbnail_url, media_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
        fileData.filename,
        fileData.original_name,
        fileData.uploader,
        fileData.file_type,
        fileData.file_size,
        fileData.file_path,
        fileData.file_url,
        fileData.thumbnail_url || null,
        fileData.media_type
    ];

    try {
        const [result] = await promisePool.query(query, values);
        return { id: result.insertId, ...fileData };
    } catch (err) {
        error('新增媒體檔案失敗:', err);
        throw err;
    }
}

// 取得所有媒體檔案
async function getAllMedia(limit = 100) {
    try {
        const query = 'SELECT * FROM media_files ORDER BY upload_time DESC LIMIT ?';
        const [rows] = await promisePool.query(query, [limit]);
        return rows;
    } catch (err) {
        error('取得媒體檔案失敗:', err);
        throw err;
    }
}

// 新增留言
async function insertMessage(messageData) {
    const query = 'INSERT INTO messages (user_name, message_text, ip_address) VALUES (?, ?, ?)';
    const values = [messageData.userName, messageData.messageText, messageData.ipAddress || null];

    try {
        const [result] = await promisePool.query(query, values);
        return { id: result.insertId, ...messageData };
    } catch (err) {
        error('新增留言失敗:', err);
        throw err;
    }
}

// 取得所有留言
async function getAllMessages(limit = 100) {
    try {
        const [rows] = await promisePool.query(
            'SELECT * FROM messages ORDER BY created_at DESC LIMIT ?',
            [limit]
        );
        return rows;
    } catch (err) {
        error('取得留言失敗:', err);
        throw err;
    }
}

// 新增彈幕
async function insertDanmaku(danmakuData) {
    const query = 'INSERT INTO danmaku (user_name, danmaku_text, color, position) VALUES (?, ?, ?, ?)';
    const values = [
        danmakuData.userName,
        danmakuData.danmakuText,
        danmakuData.color || '#FFFFFF',
        danmakuData.position || 50.00
    ];

    try {
        const [result] = await promisePool.query(query, values);
        return { id: result.insertId, ...danmakuData };
    } catch (err) {
        error('新增彈幕失敗:', err);
        throw err;
    }
}

// 取得網站設定
async function getSiteConfig() {
    try {
        const [rows] = await promisePool.query('SELECT * FROM site_config LIMIT 1');
        return rows[0] || null;
    } catch (err) {
        error('取得網站設定失敗:', err);
        throw err;
    }
}

// 更新媒體檔案的雲端資訊
async function updateMediaCloudInfo(mediaId, cloudInfo) {
    const query = `
        UPDATE media_files
        SET cloud_file_id = ?,
            cloud_url = ?,
            cloud_view_link = ?,
            cloud_uploaded = ?,
            cloud_uploaded_at = NOW()
        WHERE id = ?
    `;
    const values = [
        cloudInfo.cloudFileId,
        cloudInfo.cloudUrl,
        cloudInfo.cloudViewLink,
        cloudInfo.cloudUploaded ? 1 : 0,
        mediaId
    ];

    try {
        await promisePool.query(query, values);
        info(`已更新媒體檔案 ${mediaId} 的雲端資訊`);
        return true;
    } catch (err) {
        error('更新雲端資訊失敗:', err);
        throw err;
    }
}

// ============================================
// 使用者管理功能（Google OAuth）
// ============================================

// 根據 Google ID 查找或建立使用者
async function findOrCreateUser(profile) {
    try {
        // 先查找使用者
        const [rows] = await promisePool.query(
            'SELECT * FROM users WHERE google_id = ?',
            [profile.id]
        );

        if (rows.length > 0) {
            // 使用者已存在，更新最後登入時間
            await promisePool.query(
                'UPDATE users SET last_login = NOW(), display_name = ?, profile_picture = ? WHERE google_id = ?',
                [profile.displayName, profile.photos?.[0]?.value || null, profile.id]
            );
            return rows[0];
        } else {
            // 建立新使用者
            const [result] = await promisePool.query(
                'INSERT INTO users (google_id, email, display_name, profile_picture) VALUES (?, ?, ?, ?)',
                [
                    profile.id,
                    profile.emails?.[0]?.value || '',
                    profile.displayName,
                    profile.photos?.[0]?.value || null
                ]
            );

            // 回傳新建立的使用者資料
            const [newUser] = await promisePool.query(
                'SELECT * FROM users WHERE id = ?',
                [result.insertId]
            );
            return newUser[0];
        }
    } catch (err) {
        error('查找或建立使用者失敗:', err);
        throw err;
    }
}

// 根據 ID 查找使用者
async function findUserById(userId) {
    try {
        const [rows] = await promisePool.query(
            'SELECT * FROM users WHERE id = ?',
            [userId]
        );
        return rows[0] || null;
    } catch (err) {
        error('查找使用者失敗:', err);
        throw err;
    }
}

// 匯出模組
module.exports = {
    pool,
    promisePool,
    testConnection,
    getStatistics,
    insertMediaFile,
    getAllMedia,
    insertMessage,
    getAllMessages,
    insertDanmaku,
    getSiteConfig,
    updateMediaCloudInfo,
    findOrCreateUser,
    findUserById
};
