/**
 * 媒體檔案路由
 * 處理照片、影片上傳與查詢
 */

const express = require("express");
const router = express.Router();
const path = require("path");
const sharp = require("sharp");
const db = require("../config/database");
const googleDrive = require("../config/googleDrive");
const { upload, UPLOAD_DIRS } = require("../middleware/upload");
const { ensureAuthenticated } = require("../middleware/auth");
const { info, error } = require("../utils/logger");

/**
 * 生成圖片縮略圖
 */
async function generateThumbnail(imagePath, filename) {
  try {
    const thumbnailFilename = `thumb_${filename}`;
    const thumbnailPath = path.join(UPLOAD_DIRS.thumbnails, thumbnailFilename);

    await sharp(imagePath)
      .resize(300, 300, {
        fit: "cover",
        position: "center",
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);

    return `/uploads/thumbnails/${thumbnailFilename}`;
  } catch (err) {
    error("生成縮略圖失敗:", err);
    return null;
  }
}

/**
 * 異步上傳檔案到 Google Drive 並更新資料庫
 */
async function uploadToCloud(
  mediaId,
  localPath,
  filename,
  mimeType,
  mediaType,
  wss
) {
  try {
    // 使用與本地相同的檔名（已包含上傳者前綴）
    info(`開始上傳到雲端: ${filename}`);

    const cloudResult = await googleDrive.uploadFile(
      localPath,
      filename,
      mimeType,
      mediaType
    );

    if (cloudResult.success) {
      // 更新資料庫記錄雲端 URL
      await db.updateMediaCloudInfo(mediaId, {
        cloudFileId: cloudResult.fileId,
        cloudUrl: cloudResult.directLink,
        cloudViewLink: cloudResult.webViewLink,
        cloudUploaded: true,
      });

      // 通知所有客戶端雲端上傳完成
      const WebSocket = require("ws");
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              type: "cloudUploadComplete",
              data: { id: mediaId, cloudUrl: cloudResult.directLink },
            })
          );
        }
      });
    }
  } catch (err) {
    error(`雲端上傳失敗 (ID: ${mediaId}):`, err.message);
  }
}

/**
 * 上傳檔案 API（需要登入）
 */
router.post(
  "/upload",
  ensureAuthenticated,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "沒有檔案上傳" });
      }

      // 記錄上傳資訊
      info(`檔案上傳 | 使用者: ${req.user.display_name} (${req.user.email}) | 原始檔名: ${req.file.originalname}`);

      const isImage = req.file.mimetype.startsWith("image/");
      const mediaType = isImage ? "photo" : "video";

      // 為圖片生成縮略圖
      let thumbnailUrl = null;
      if (isImage) {
        thumbnailUrl = await generateThumbnail(
          req.file.path,
          req.file.filename
        );
      }

      // 使用登入使用者的名稱
      const uploader = req.user.display_name;

      const fileData = {
        filename: req.file.filename,
        original_name: req.file.originalname,
        uploader: uploader,
        file_type: req.file.mimetype,
        file_size: req.file.size,
        file_path: req.file.path,
        file_url: `/uploads/${isImage ? "photos" : "videos"}/${
          req.file.filename
        }`,
        thumbnail_url: thumbnailUrl,
        media_type: mediaType,
      };

      // 插入資料庫（本地存儲）
      const result = await db.insertMediaFile(fileData);

      // 立即回應客戶端（不等待雲端上傳）
      res.json(result);

      // 通知所有 WebSocket 客戶端（本地上傳完成）
      const WebSocket = require("ws");
      const wss = req.app.get("wss");
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: "newMedia", data: result }));
        }
      });

      // 異步上傳到 Google Drive（不阻塞響應）
      if (googleDrive.isGoogleDriveEnabled()) {
        uploadToCloud(
          result.id,
          req.file.path,
          req.file.filename, // 使用與本地相同的檔名（已包含上傳者前綴）
          req.file.mimetype,
          mediaType,
          wss
        ).catch((err) => error("雲端上傳背景任務失敗:", err));
      }
    } catch (err) {
      error("上傳失敗:", err);
      res.status(500).json({ error: "上傳失敗: " + err.message });
    }
  }
);

/**
 * 取得所有媒體檔案
 */
router.get("/", async (req, res) => {
  try {
    const media = await db.getAllMedia();
    res.json(media);
  } catch (err) {
    error("取得媒體失敗:", err);
    res.status(500).json({ error: "取得媒體失敗" });
  }
});

module.exports = router;
