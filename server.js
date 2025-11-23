/**
 * 活動互動牆 - Node.js 後端伺服器
 * 使用 Express + MySQL + WebSocket
 */

const express = require('express');
const multer = require('multer');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const db = require('./config/database');
const googleDrive = require('./config/googleDrive');

const app = express();
const port = 5001;

// 確保上傳目錄存在
const UPLOAD_DIRS = {
    photos: 'uploads/photos',
    videos: 'uploads/videos',
    thumbnails: 'uploads/thumbnails'
};

Object.values(UPLOAD_DIRS).forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// 設定檔案上傳
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, UPLOAD_DIRS.photos);
        } else if (file.mimetype.startsWith('video/')) {
            cb(null, UPLOAD_DIRS.videos);
        } else {
            cb(new Error('不支援的檔案類型'), null);
        }
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const uploader = req.body.uploader || 'anonymous';
        const ext = path.extname(file.originalname);
        const basename = path.basename(file.originalname, ext);
        cb(null, `${timestamp}-${uploader}-${basename}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
    fileFilter: (req, file, cb) => {
        const allowedExtensions = /jpeg|jpg|png|gif|mp4|mov|avi/;
        const allowedMimeTypes = /^(image\/(jpeg|jpg|png|gif)|video\/(mp4|quicktime|x-msvideo))$/;

        const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedMimeTypes.test(file.mimetype);

        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('只支援圖片 (jpg, png, gif) 和影片 (mp4, mov, avi)'));
        }
    }
});

// 中介軟體
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// ============================================
// 雲端上傳輔助函數
// ============================================

/**
 * 異步上傳檔案到 Google Drive 並更新資料庫
 */
async function uploadToCloud(mediaId, localPath, filename, mimeType, mediaType) {
    try {
        console.log(`開始上傳到雲端: ${filename}`);

        const cloudResult = await googleDrive.uploadFile(localPath, filename, mimeType, mediaType);

        if (cloudResult.success) {
            // 更新資料庫記錄雲端 URL
            await db.updateMediaCloudInfo(mediaId, {
                cloudFileId: cloudResult.fileId,
                cloudUrl: cloudResult.directLink,
                cloudViewLink: cloudResult.webViewLink,
                cloudUploaded: true
            });

            // 通知所有客戶端雲端上傳完成
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'cloudUploadComplete',
                        data: { id: mediaId, cloudUrl: cloudResult.directLink }
                    }));
                }
            });
        }
    } catch (error) {
        console.error(`雲端上傳失敗 (ID: ${mediaId}):`, error.message);
    }
}

// ============================================
// API 路由
// ============================================

// 上傳檔案 API
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '沒有檔案上傳' });
        }

        const fileData = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            uploader: req.body.uploader || 'anonymous',
            fileType: req.file.mimetype,
            fileSize: req.file.size,
            filePath: req.file.path,
            fileUrl: `/uploads/${req.file.mimetype.startsWith('image/') ? 'photos' : 'videos'}/${req.file.filename}`,
            mediaType: req.file.mimetype.startsWith('image/') ? 'photo' : 'video'
        };

        // 插入資料庫（本地存儲）
        const result = await db.insertMediaFile(fileData);

        // 立即回應客戶端（不等待雲端上傳）
        res.json(result);

        // 通知所有 WebSocket 客戶端（本地上傳完成）
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'newMedia', data: result }));
            }
        });

        // 異步上傳到 Google Drive（不阻塞響應）
        if (googleDrive.isGoogleDriveEnabled()) {
            uploadToCloud(result.id, req.file.path, req.file.filename, req.file.mimetype, fileData.mediaType)
                .catch(err => console.error('雲端上傳背景任務失敗:', err));
        }

    } catch (error) {
        console.error('上傳失敗:', error);
        res.status(500).json({ error: '上傳失敗: ' + error.message });
    }
});

// 取得所有媒體檔案
app.get('/api/media', async (req, res) => {
    try {
        const media = await db.getAllMedia();
        res.json(media);
    } catch (error) {
        console.error('取得媒體失敗:', error);
        res.status(500).json({ error: '取得媒體失敗' });
    }
});

// 新增留言 API
app.post('/api/messages', async (req, res) => {
    try {
        const messageData = {
            userName: req.body.userName,
            messageText: req.body.messageText,
            ipAddress: req.ip
        };

        const result = await db.insertMessage(messageData);

        // 通知所有 WebSocket 客戶端
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'newMessage', data: result }));
            }
        });

        res.json({ success: true, id: result.id });
    } catch (error) {
        console.error('新增留言失敗:', error);
        res.status(500).json({ error: '新增留言失敗' });
    }
});

// 取得所有留言
app.get('/api/messages', async (req, res) => {
    try {
        const messages = await db.getAllMessages();
        res.json(messages);
    } catch (error) {
        console.error('取得留言失敗:', error);
        res.status(500).json({ error: '取得留言失敗' });
    }
});

// 新增彈幕 API
app.post('/api/danmaku', async (req, res) => {
    try {
        const danmakuData = {
            userName: req.body.userName,
            danmakuText: req.body.danmakuText,
            color: req.body.color,
            position: req.body.position
        };

        const result = await db.insertDanmaku(danmakuData);

        // 通知所有 WebSocket 客戶端
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'newDanmaku', data: result }));
            }
        });

        res.json({ success: true, id: result.id });
    } catch (error) {
        console.error('新增彈幕失敗:', error);
        res.status(500).json({ error: '新增彈幕失敗' });
    }
});

// 取得統計資料
app.get('/api/statistics', async (req, res) => {
    try {
        const stats = await db.getStatistics();
        res.json(stats);
    } catch (error) {
        console.error('取得統計失敗:', error);
        res.status(500).json({ error: '取得統計失敗' });
    }
});

// 取得網站設定
app.get('/api/config', async (req, res) => {
    try {
        const config = await db.getSiteConfig();
        res.json(config);
    } catch (error) {
        console.error('取得設定失敗:', error);
        res.status(500).json({ error: '取得設定失敗' });
    }
});

// ============================================
// WebSocket 伺服器
// ============================================
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', async (ws) => {
    console.log('新的 WebSocket 連線');

    // 發送現有的媒體檔案
    try {
        const media = await db.getAllMedia(10);
        ws.send(JSON.stringify({ type: 'initMedia', data: media }));
    } catch (error) {
        console.error('發送初始資料失敗:', error);
    }

    ws.on('message', (data) => {
        try {
            const parsed = JSON.parse(data);
            // 廣播給所有客戶端
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(data);
                }
            });
        } catch (error) {
            console.error('處理 WebSocket 訊息失敗:', error);
        }
    });

    ws.on('close', () => {
        console.log('WebSocket 連線關閉');
    });
});

// ============================================
// 啟動伺服器
// ============================================
app.listen(port, async () => {
    console.log('============================================');
    console.log('活動互動牆伺服器啟動中...');
    console.log('============================================');

    // 測試資料庫連線
    await db.testConnection();

    // 初始化 Google Drive 雲端存儲
    await googleDrive.initialize();

    console.log(`HTTP 伺服器運行於: http://localhost:${port}`);
    console.log(`WebSocket 伺服器運行於: ws://localhost:8080`);
    console.log('============================================');
});
