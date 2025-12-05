/**
 * 檔案上傳中介軟體
 * 使用 Multer 處理 multipart/form-data
 */

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// 上傳目錄設定
const UPLOAD_DIRS = {
  photos: path.join(__dirname, "../../uploads/photos"),
  videos: path.join(__dirname, "../../uploads/videos"),
  thumbnails: path.join(__dirname, "../../uploads/thumbnails"),
};

// 確保上傳目錄存在
Object.values(UPLOAD_DIRS).forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Multer 儲存設定
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, UPLOAD_DIRS.photos);
    } else if (file.mimetype.startsWith("video/")) {
      cb(null, UPLOAD_DIRS.videos);
    } else {
      cb(new Error("不支援的檔案類型"), null);
    }
  },
  filename: (req, file, cb) => {
    // 檢查使用者是否已登入
    if (!req.user) {
      return cb(new Error("使用者未登入"), null);
    }

    // 取得使用者資訊
    const displayName = req.user.display_name || "訪客";
    const userId = req.user.id;

    // 生成時間戳：YYYYMMDDHHmmss
    const now = new Date();
    const timestamp =
      now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0');

    // 處理原始檔名
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);

    // 清理檔名：移除不合法字元（保留中文、英文、數字、底線、連字號）
    // Windows/macOS/Linux 不允許：< > : " / \ | ? *
    const cleanDisplayName = displayName.replace(/[<>:"/\\|?*\s]/g, '_');
    const cleanBasename = basename.replace(/[<>:"/\\|?*]/g, '_');

    // 格式：YYYYMMDDHHmmss_displayName_userId_原始檔名.副檔名
    const filename = `${timestamp}_${cleanDisplayName}_${userId}_${cleanBasename}${ext}`;

    cb(null, filename);
  },
});

// Multer 實例配置
const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /jpeg|jpg|png|gif|mp4|mov|avi/;
    const allowedMimeTypes =
      /^(image\/(jpeg|jpg|png|gif)|video\/(mp4|quicktime|x-msvideo))$/;

    const extname = allowedExtensions.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedMimeTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("只支援圖片 (jpg, png, gif) 和影片 (mp4, mov, avi)"));
    }
  },
});

module.exports = {
  upload,
  UPLOAD_DIRS
};
