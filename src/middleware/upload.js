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
    const timestamp = Date.now();
    const uploader = req.body.uploader || "anonymous";
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);

    // 清理檔名：移除空格、括號等特殊字符，只保留字母數字、中文、底線和連字號
    const cleanBasename = basename.replace(/[^\w\u4e00-\u9fa5-]/g, "_");
    const cleanUploader = uploader.replace(/[^\w\u4e00-\u9fa5-]/g, "_");

    cb(null, `${timestamp}-${cleanUploader}-${cleanBasename}${ext}`);
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
