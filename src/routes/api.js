/**
 * API 路由
 * 處理留言、彈幕、統計資料與網站設定
 */

const express = require("express");
const router = express.Router();
const db = require("../config/database");

/**
 * 新增留言 API
 */
router.post("/messages", async (req, res) => {
  try {
    const messageData = {
      userName: req.body.userName,
      messageText: req.body.messageText,
      ipAddress: req.ip,
    };

    const result = await db.insertMessage(messageData);

    // 通知所有 WebSocket 客戶端
    const WebSocket = require("ws");
    const wss = req.app.get("wss");
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: "newMessage", data: result }));
      }
    });

    res.json({ success: true, id: result.id });
  } catch (error) {
    console.error("新增留言失敗:", error);
    res.status(500).json({ error: "新增留言失敗" });
  }
});

/**
 * 取得所有留言
 */
router.get("/messages", async (req, res) => {
  try {
    const messages = await db.getAllMessages();
    res.json(messages);
  } catch (error) {
    console.error("取得留言失敗:", error);
    res.status(500).json({ error: "取得留言失敗" });
  }
});

/**
 * 新增彈幕 API
 */
router.post("/danmaku", async (req, res) => {
  try {
    const danmakuData = {
      userName: req.body.userName,
      danmakuText: req.body.danmakuText,
      color: req.body.color,
      position: req.body.position,
    };

    const result = await db.insertDanmaku(danmakuData);

    // 通知所有 WebSocket 客戶端
    const WebSocket = require("ws");
    const wss = req.app.get("wss");
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: "newDanmaku", data: result }));
      }
    });

    res.json({ success: true, id: result.id });
  } catch (error) {
    console.error("新增彈幕失敗:", error);
    res.status(500).json({ error: "新增彈幕失敗" });
  }
});

/**
 * 取得統計資料
 */
router.get("/statistics", async (req, res) => {
  try {
    const stats = await db.getStatistics();
    res.json(stats);
  } catch (error) {
    console.error("取得統計失敗:", error);
    res.status(500).json({ error: "取得統計失敗" });
  }
});

/**
 * 取得網站設定
 */
router.get("/config", async (req, res) => {
  try {
    const config = await db.getSiteConfig();
    res.json(config);
  } catch (error) {
    console.error("取得設定失敗:", error);
    res.status(500).json({ error: "取得設定失敗" });
  }
});

module.exports = router;
