/**
 * 活動互動牆 - Node.js 後端伺服器
 * 使用 Express + MySQL + WebSocket
 */

// 載入環境變數（.env 檔案）
require("dotenv").config();

const express = require("express");
const session = require("express-session");
const passport = require("./config/passport");
const WebSocket = require("ws");
const path = require("path");
const db = require("./config/database");
const { info, warn, error } = require("./utils/logger");

const app = express();
const port = 5001;

// ============================================
// 中介軟體設定
// ============================================

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Session 設定（必須在 passport 之前）
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "your-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // 開發環境設為 false，生產環境若使用 HTTPS 則設為 true
    maxAge: 24 * 60 * 60 * 1000, // 24 小時
  },
});

app.use(sessionMiddleware);

// 初始化 Passport
app.use(passport.initialize());
app.use(passport.session());

// ============================================
// 路由設定
// ============================================

// 根路徑重定向到首頁
app.get("/", (req, res) => {
  res.redirect("/pages/index.html");
});

// 認證路由
const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes);
app.use("/api", authRoutes); // /api/user 端點

// 媒體路由
const mediaRoutes = require("./routes/media");
app.use("/api/media", mediaRoutes);
app.use("/api", mediaRoutes); // /api/upload 端點

// API 路由
const apiRoutes = require("./routes/api");
app.use("/api", apiRoutes);

// ============================================
// 啟動伺服器（先啟動 HTTP，再掛載 WebSocket）
// ============================================

const server = app.listen(port, async () => {
  info("============================================");
  info("活動互動牆伺服器啟動中...");
  info("============================================");

  // 顯示環境變數設定
  info("環境變數設定:");
  info(
    `- Google OAuth Client ID: ${
      process.env.GOOGLE_AUTH_CLIENT_ID ? "已設定" : "未設定"
    }`
  );
  info(
    `- Google Drive Client ID: ${
      process.env.GDRIVE_CLIENT_ID ? "已設定" : "未設定"
    }`
  );
  info(`- Session Secret: ${process.env.SESSION_SECRET ? "已設定" : "未設定"}`);
  info(`- 應用程式 URL: ${process.env.APP_URL || "http://localhost:5001"}`);

  // 測試資料庫連線
  try {
    await db.testConnection();
    info("[成功] 資料庫連線成功");
  } catch (err) {
    error("[錯誤] 資料庫連線失敗:", err.message);
    process.exit(1);
  }

  // 初始化並檢查 Google Drive 設定
  const googleDrive = require("./config/googleDrive");
  await googleDrive.initialize();

  if (googleDrive.isGoogleDriveEnabled()) {
    info("[成功] Google Drive 雲端備份已啟用");
  } else {
    warn("[警告] Google Drive 雲端備份未啟用（僅本地存儲）");
  }

  info("============================================");
  info(`[啟動] 伺服器已啟動於: http://localhost:${port}`);
  info("============================================");
});

// ============================================
// WebSocket 伺服器設定
// ============================================

const wss = new WebSocket.Server({ server });

// 儲存 wss 到 app 供路由使用
app.set("wss", wss);

wss.on("connection", async (ws, req) => {
  // 取得客戶端資訊
  const clientIp =
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.socket.remoteAddress ||
    "unknown";

  // 解析 session 來取得使用者資訊
  let userInfo = "訪客";

  // 使用 sessionMiddleware 來解析 session
  sessionMiddleware(req, {}, async () => {
    if (req.session && req.session.passport && req.session.passport.user) {
      try {
        const userId = req.session.passport.user;
        const user = await db.findUserById(userId);

        if (user) {
          userInfo = `${user.display_name} (${user.email})`;
        }
      } catch (err) {
        // 如果查詢失敗，保持顯示訪客
        userInfo = "訪客 (session 解析失敗)";
      }
    }

    info(`WebSocket 連線已建立 | IP: ${clientIp} | 使用者: ${userInfo}`);
  });

  try {
    // 發送初始媒體列表給新連接的客戶端
    const media = await db.getAllMedia();
    ws.send(JSON.stringify({ type: "initMedia", data: media }));
  } catch (err) {
    error("發送初始媒體列表失敗:", err);
  }

  ws.on("close", () => {
    info(`WebSocket 連線已關閉 | IP: ${clientIp} | 使用者: ${userInfo}`);
  });

  ws.on("error", (err) => {
    error(`WebSocket 錯誤 | IP: ${clientIp}:`, err);
  });
});

// ============================================
// 優雅關閉處理
// ============================================

process.on("SIGTERM", () => {
  info("收到 SIGTERM 信號，正在優雅關閉伺服器...");
  server.close(() => {
    info("HTTP 伺服器已關閉");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  info("收到 SIGINT 信號，正在優雅關閉伺服器...");
  server.close(() => {
    info("HTTP 伺服器已關閉");
    process.exit(0);
  });
});
