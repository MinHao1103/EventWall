/**
 * 為現有照片批量生成縮略圖
 */

const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const db = require("../config/database");
const { info, error } = require("../utils/logger");

const UPLOAD_DIRS = {
  photos: path.join(__dirname, "../../uploads/photos"),
  thumbnails: path.join(__dirname, "../../uploads/thumbnails"),
};

// 確保縮略圖目錄存在
if (!fs.existsSync(UPLOAD_DIRS.thumbnails)) {
  fs.mkdirSync(UPLOAD_DIRS.thumbnails, { recursive: true });
}

/**
 * 為圖片生成縮略圖
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
    error(`生成縮略圖失敗 (${filename}):`, err.message);
    return null;
  }
}

/**
 * 更新資料庫中的縮略圖 URL
 */
async function updateThumbnailUrl(mediaId, thumbnailUrl) {
  const query = "UPDATE media_files SET thumbnail_url = ? WHERE id = ?";
  try {
    await db.promisePool.query(query, [thumbnailUrl, mediaId]);
    return true;
  } catch (err) {
    error(`更新資料庫失敗 (ID: ${mediaId}):`, err.message);
    return false;
  }
}

/**
 * 主函數
 */
async function main() {
  info("開始為現有照片生成縮略圖...");

  try {
    // 測試資料庫連線
    await db.testConnection();

    // 取得所有沒有縮略圖的照片
    const query =
      'SELECT id, filename, file_path, media_type FROM media_files WHERE media_type = "photo" AND thumbnail_url IS NULL';
    const [photos] = await db.promisePool.query(query);

    info(`找到 ${photos.length} 張需要生成縮略圖的照片`);

    if (photos.length === 0) {
      info("所有照片都已有縮略圖！");
      process.exit(0);
    }

    let successCount = 0;
    let failCount = 0;

    for (const photo of photos) {
      info(`處理: ${photo.filename}`);

      // 生成縮略圖
      const thumbnailUrl = await generateThumbnail(
        photo.file_path,
        photo.filename
      );

      if (thumbnailUrl) {
        // 更新資料庫
        const updated = await updateThumbnailUrl(photo.id, thumbnailUrl);
        if (updated) {
          info(`成功生成縮略圖: ${thumbnailUrl}`);
          successCount++;
        } else {
          info(`資料庫更新失敗`);
          failCount++;
        }
      } else {
        info(`縮略圖生成失敗`);
        failCount++;
      }
    }

    info("========================================");
    info(`處理完成！`);
    info(`成功: ${successCount} 張`);
    info(`失敗: ${failCount} 張`);
    info("========================================");

    process.exit(0);
  } catch (err) {
    error("處理過程發生錯誤:", err);
    process.exit(1);
  }
}

// 執行主函數
main();
