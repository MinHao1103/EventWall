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

const app = express();
const port = 5001;

// ============================================
// 中介軟體設定
// ============================================

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Session 設定（必須在 passport 之前）
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // 開發環境設為 false，生產環境若使用 HTTPS 則設為 true
      maxAge: 24 * 60 * 60 * 1000, // 24 小時
    },
  })
);

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
  console.log("============================================");
  console.log("活動互動牆伺服器啟動中...");
  console.log("============================================");

  // 顯示環境變數設定
  console.log("\n環境變數設定:");
  console.log(
    `- Google OAuth Client ID: ${
      process.env.GOOGLE_AUTH_CLIENT_ID ? "已設定" : "未設定"
    }`
  );
  console.log(
    `- Google Drive Client ID: ${
      process.env.GDRIVE_CLIENT_ID ? "已設定" : "未設定"
    }`
  );
  console.log(`- Session Secret: ${process.env.SESSION_SECRET ? "已設定" : "未設定"}`);
  console.log(`- 應用程式 URL: ${process.env.APP_URL || "http://localhost:5001"}`);

  // 測試資料庫連線
  try {
    await db.testConnection();
    console.log("\n[成功] 資料庫連線成功");
  } catch (error) {
    console.error("\n[錯誤] 資料庫連線失敗:", error.message);
    process.exit(1);
  }

  // 初始化並檢查 Google Drive 設定
  const googleDrive = require("./config/googleDrive");
  await googleDrive.initialize();

  if (googleDrive.isGoogleDriveEnabled()) {
    console.log("\n[成功] Google Drive 雲端備份已啟用");
  } else {
    console.log("\n[警告] Google Drive 雲端備份未啟用（僅本地存儲）");
  }

  console.log("\n============================================");
  console.log(`[啟動] 伺服器已啟動於: http://localhost:${port}`);
  console.log("============================================\n");
});

// ============================================
// WebSocket 伺服器設定
// ============================================

const wss = new WebSocket.Server({ server });

// 儲存 wss 到 app 供路由使用
app.set("wss", wss);

wss.on("connection", async (ws) => {
  console.log("新的 WebSocket 連線已建立");

  try {
    // 發送初始媒體列表給新連接的客戶端
    const media = await db.getAllMedia();
    ws.send(JSON.stringify({ type: "initMedia", data: media }));
  } catch (error) {
    console.error("發送初始媒體列表失敗:", error);
  }

  ws.on("close", () => {
    console.log("WebSocket 連線已關閉");
  });

  ws.on("error", (error) => {
    console.error("WebSocket 錯誤:", error);
  });
});

// ============================================
// 優雅關閉處理
// ============================================

process.on("SIGTERM", () => {
  console.log("\n收到 SIGTERM 信號，正在優雅關閉伺服器...");
  server.close(() => {
    console.log("HTTP 伺服器已關閉");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("\n收到 SIGINT 信號，正在優雅關閉伺服器...");
  server.close(() => {
    console.log("HTTP 伺服器已關閉");
    process.exit(0);
  });
});
