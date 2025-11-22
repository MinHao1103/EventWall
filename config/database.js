/**
 * MySQL 資料庫連線配置
 * 使用 mysql2 套件建立連線池
 */

const mysql = require('mysql2');

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
        console.log('✓ MySQL 資料庫連線成功');
        console.log(`✓ 資料庫: ${dbConfig.database}`);
        connection.release();
        return true;
    } catch (error) {
        console.error('✗ MySQL 資料庫連線失敗:', error.message);
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
    } catch (error) {
        console.error('取得統計資料失敗:', error);
        return null;
    }
}

// 新增媒體檔案
async function insertMediaFile(fileData) {
    const query = `
        INSERT INTO media_files (filename, original_name, uploader, file_type, file_size, file_path, file_url, media_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
        fileData.filename,
        fileData.originalName,
        fileData.uploader,
        fileData.fileType,
        fileData.fileSize,
        fileData.filePath,
        fileData.fileUrl,
        fileData.mediaType
    ];

    try {
        const [result] = await promisePool.query(query, values);
        return { id: result.insertId, ...fileData };
    } catch (error) {
        console.error('新增媒體檔案失敗:', error);
        throw error;
    }
}

// 取得所有媒體檔案
async function getAllMedia(limit = 100) {
    try {
        const query = 'SELECT * FROM media_files ORDER BY upload_time DESC LIMIT ?';
        const [rows] = await promisePool.query(query, [limit]);
        return rows;
    } catch (error) {
        console.error('取得媒體檔案失敗:', error);
        throw error;
    }
}

// 新增留言
async function insertMessage(messageData) {
    const query = 'INSERT INTO messages (user_name, message_text, ip_address) VALUES (?, ?, ?)';
    const values = [messageData.userName, messageData.messageText, messageData.ipAddress || null];

    try {
        const [result] = await promisePool.query(query, values);
        return { id: result.insertId, ...messageData };
    } catch (error) {
        console.error('新增留言失敗:', error);
        throw error;
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
    } catch (error) {
        console.error('取得留言失敗:', error);
        throw error;
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
    } catch (error) {
        console.error('新增彈幕失敗:', error);
        throw error;
    }
}

// 取得網站設定
async function getSiteConfig() {
    try {
        const [rows] = await promisePool.query('SELECT * FROM site_config LIMIT 1');
        return rows[0] || null;
    } catch (error) {
        console.error('取得網站設定失敗:', error);
        throw error;
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
    getSiteConfig
};
