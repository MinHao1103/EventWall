/**
 * 認證路由
 * 處理 Google OAuth 登入、登出與使用者資訊查詢
 */

const express = require("express");
const router = express.Router();
const passport = require("../config/passport");

// 開始 Google 登入
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google 登入回調
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/pages/index.html" }),
  (req, res) => {
    // 登入成功，重定向到主頁面
    res.redirect("/pages/main.html");
  }
);

// 登出
router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: "登出失敗" });
    }
    res.redirect("/pages/index.html");
  });
});

// 取得當前使用者資訊
router.get("/user", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      authenticated: true,
      user: {
        id: req.user.id,
        displayName: req.user.display_name,
        email: req.user.email,
        profilePicture: req.user.profile_picture,
      },
    });
  } else {
    res.json({ authenticated: false });
  }
});

module.exports = router;
