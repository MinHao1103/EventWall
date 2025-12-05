/**
 * 活動互動牆 - 前端 JavaScript
 * 功能：彈幕、留言板、檔案上傳、輪播、即時更新
 */

// ============================================
// 全域變數
// ============================================
let ws = null;
let userName = "";
let mediaList = [];
let currentIndex = 0;

// ============================================
// 用戶體驗優化 - 工具函數
// ============================================

/**
 * 顯示載入動畫
 * @param {string} text - 載入文字
 */
function showLoading(text = "載入中...") {
  const overlay = document.getElementById("loadingOverlay");
  const loadingText = document.getElementById("loadingText");
  if (loadingText) loadingText.textContent = text;
  if (overlay) overlay.classList.add("active");
}

/**
 * 隱藏載入動畫
 */
function hideLoading() {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) overlay.classList.remove("active");
}

/**
 * 顯示 Toast 通知
 * @param {string} title - 標題
 * @param {string} message - 訊息內容
 * @param {string} type - 類型: success, error, info, warning
 * @param {number} duration - 顯示時間（毫秒）
 */
function showToast(title, message = "", type = "info", duration = 3000) {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  const icons = {
    success: "✓",
    error: "✗",
    info: "ℹ",
    warning: "⚠",
  };

  toast.innerHTML = `
        <div class="toast-icon">${icons[type] || icons.info}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            ${message ? `<div class="toast-message">${message}</div>` : ""}
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

  container.appendChild(toast);

  // 自動移除
  setTimeout(() => {
    toast.classList.add("removing");
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * 更新連線狀態顯示
 * @param {string} status - connected, disconnected, connecting
 * @param {string} text - 狀態文字
 */
function updateConnectionStatus(status, text) {
  const statusEl = document.getElementById("connectionStatus");
  const textEl = document.getElementById("connectionText");

  if (!statusEl || !textEl) return;

  statusEl.classList.remove("disconnected", "connecting");

  if (status === "connected") {
    statusEl.classList.remove("show");
    textEl.textContent = text || "已連線";
  } else if (status === "disconnected") {
    statusEl.classList.add("show", "disconnected");
    textEl.textContent = text || "連線已中斷";
  } else if (status === "connecting") {
    statusEl.classList.add("show", "connecting");
    textEl.textContent = text || "重新連線中...";
  }
}

/**
 * 防抖函數
 * @param {Function} func - 要執行的函數
 * @param {number} wait - 等待時間（毫秒）
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ============================================
// 初始化
// ============================================
window.addEventListener("DOMContentLoaded", async () => {
  // 檢查使用者登入狀態
  try {
    const response = await fetch("/api/user");
    const data = await response.json();

    if (!data.authenticated) {
      // 未登入，重定向到登入頁面
      window.location.href = "/pages/index.html";
      return;
    }

    // 已登入，取得使用者資訊
    userName = data.user.displayName;

    // 設定留言板的姓名欄位
    document.getElementById("messageName").value = userName;

    // 顯示使用者資訊（如果頁面有相關元素）
    const userProfileElement = document.getElementById("userProfile");
    if (userProfileElement && data.user.profilePicture) {
      userProfileElement.innerHTML = `
                <img src="${data.user.profilePicture}" alt="${userName}" style="width: 32px; height: 32px; border-radius: 50%; margin-right: 8px;">
                <span>${userName}</span>
            `;
    }

    // 初始化 WebSocket
    initWebSocket();

    // 載入網站設定
    loadSiteConfig();

    // 載入媒體檔案
    loadMedia();

    // 載入留言
    loadMessages();

    // 載入統計資料
    loadStatistics();

    // 設定拖放上傳
    setupDragDrop();

    // 彈幕輸入框 Enter 鍵送出
    document.getElementById("danmakuText").addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        sendDanmaku();
      }
    });

    // 留言輸入框 Ctrl+Enter 送出
    document.getElementById("messageText").addEventListener("keypress", (e) => {
      if (e.key === "Enter" && e.ctrlKey) {
        sendMessage();
      }
    });
  } catch (error) {
    console.error("檢查登入狀態失敗:", error);
    window.location.href = "/pages/index.html";
  }
});

// ============================================
// WebSocket 連線
// ============================================
function initWebSocket() {
  updateConnectionStatus("connecting", "連線中...");

  // 自動偵測 WebSocket URL (支援 ngrok、本地和外網環境)
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const hostname = window.location.hostname;

  // 使用相同的 host 和 port，與 HTTP 服務器相同
  // 如果 window.location.port 為空（標準端口），則不添加端口號
  let wsUrl;
  if (window.location.port) {
    wsUrl = `${protocol}//${hostname}:${window.location.port}`;
  } else {
    // HTTPS 使用 443，HTTP 使用 80（標準端口）
    wsUrl = `${protocol}//${hostname}`;
  }

  console.log("🌐 當前環境:", hostname);
  console.log("🔌 WebSocket URL:", wsUrl);

  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log("WebSocket 連線成功");
    updateConnectionStatus("connected");
    showToast("連線成功", "即時功能已啟用", "success", 2000);
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    } catch (error) {
      console.error("處理 WebSocket 訊息失敗:", error);
    }
  };

  ws.onerror = (error) => {
    console.error("WebSocket 錯誤:", error);
    updateConnectionStatus("disconnected", "連線錯誤");
  };

  ws.onclose = () => {
    console.log("WebSocket 連線關閉，5秒後重新連線...");
    updateConnectionStatus("disconnected", "連線已中斷");
    setTimeout(() => {
      updateConnectionStatus("connecting", "重新連線中...");
      initWebSocket();
    }, 5000);
  };
}

function handleWebSocketMessage(data) {
  switch (data.type) {
    case "initMedia":
      mediaList = data.data || [];
      renderGallery();
      break;
    case "newMedia":
      // 將新媒體插入到陣列開頭（與資料庫 DESC 排序一致）
      mediaList.unshift(data.data);

      // 如果用戶正在查看某個媒體，調整索引以保持查看的內容不變
      if (currentIndex >= 0) {
        currentIndex++;
      }

      // 重新渲染畫廊
      renderGallery();
      loadStatistics();

      // 顯示新上傳提示，並提供跳轉按鈕
      const mediaType = data.data.media_type === "photo" ? "照片" : "影片";
      const uploader = data.data.uploader;

      // 如果是自己上傳的，自動跳轉到新內容
      if (uploader === userName) {
        currentIndex = 0; // 跳到最新的（陣列開頭）
        showMediaAt(currentIndex);
        showToast("上傳成功", `您的${mediaType}已上傳`, "success", 3000);
      } else {
        showToast("新內容", `${uploader} 上傳了新${mediaType}`, "info", 3000);
      }
      break;
    case "newMessage":
      addMessageToBoard(data.data);
      loadStatistics();

      // 如果不是自己的留言，顯示提示
      const messageSender = data.data.user_name || data.data.userName;
      if (messageSender !== userName) {
        showToast("新留言", `${messageSender} 留言了`, "info", 2000);
      }
      break;
    case "newDanmaku":
      showDanmaku(data.data);
      break;
  }
}

// ============================================
// 網站設定
// ============================================
async function loadSiteConfig() {
  try {
    const response = await fetch("/api/config");
    const config = await response.json();

    if (config) {
      // 更新頁面標題
      if (config.site_title) {
        document.title = config.site_title;
      }

      // 更新嘉賓姓名
      const guestNameA = config.guest_name_a || "嘉賓A";
      const guestNameB = config.guest_name_b || "嘉賓B";
      document.getElementById(
        "guestsName"
      ).textContent = `${guestNameA} ❤️ ${guestNameB}`;

      // 更新活動日期 (使用客戶端時區顯示)
      if (config.event_date) {
        const date = new Date(config.event_date);
        // 使用客戶端本地時區格式化日期
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const formattedDate = `${year}-${month}-${day}`;
        document.getElementById("eventDate").textContent = formattedDate;
      }
    }
  } catch (error) {
    console.error("載入網站設定失敗:", error);
  }
}

// ============================================
// 畫廊展示
// ============================================
async function loadMedia() {
  try {
    const response = await fetch("/api/media");
    mediaList = await response.json();
    renderGallery();
  } catch (error) {
    console.error("載入媒體失敗:", error);
  }
}

// 渲染畫廊
function renderGallery() {
  if (mediaList.length === 0) {
    return; // 保持預設的 placeholder
  }

  // 顯示當前照片
  showMediaAt(currentIndex);

  // 渲染縮圖
  renderThumbnails();
}

// 判斷是否為 DNG 檔（Chrome 不支援原始顯示）
function isDngMedia(media) {
  const name = (media.original_name || media.file_name || "").toLowerCase();
  const url = (media.file_url || "").toLowerCase();
  const mime = (media.mime_type || "").toLowerCase();
  return (
    name.endsWith(".dng") ||
    url.endsWith(".dng") ||
    mime === "image/x-adobe-dng" ||
    mime === "image/dng"
  );
}

// 顯示指定索引的媒體
function showMediaAt(index) {
  if (index < 0 || index >= mediaList.length) return;

  currentIndex = index;
  const media = mediaList[index];
  const display = document.getElementById("gallery-display");

  display.innerHTML = "";

  if (media.media_type === "photo") {
    const isDng = isDngMedia(media);
    const img = document.createElement("img");
    // DNG 在瀏覽器不支援原圖，改用縮圖
    img.src = isDng ? media.thumbnail_url || media.file_url : media.file_url;
    img.alt = media.original_name;
    display.appendChild(img);
  } else if (media.media_type === "video") {
    const video = document.createElement("video");
    video.src = media.file_url;
    video.controls = true;
    video.autoplay = false;
    display.appendChild(video);
  }

  // 更新資訊
  const galleryInfo = document.getElementById("gallery-info");
  document.getElementById(
    "gallery-uploader"
  ).textContent = `上傳者：${media.uploader}`;
  document.getElementById("gallery-time").textContent = new Date(
    media.upload_time
  ).toLocaleString("zh-TW");
  document.getElementById("gallery-counter").textContent = `${index + 1} / ${
    mediaList.length
  }`;
  galleryInfo.classList.add("show");

  // 更新縮圖選中狀態
  updateThumbnailActive();
}

// 渲染縮圖列表
function renderThumbnails() {
  const container = document.getElementById("gallery-thumbnails");
  container.innerHTML = "";

  mediaList.forEach((media, index) => {
    const thumb = document.createElement("div");
    thumb.className = "thumbnail-item scale-in";
    if (index === currentIndex) {
      thumb.classList.add("active");
    }

    if (media.media_type === "photo") {
      const img = document.createElement("img");
      // 優先使用縮圖，如果不存在則使用原圖
      img.src = media.thumbnail_url || media.file_url;
      thumb.appendChild(img);
    } else {
      // 影片：使用 video 標籤顯示第一幀作為縮圖
      const video = document.createElement("video");
      video.src = media.file_url;
      video.preload = "metadata"; // 只加載元數據和第一幀
      video.muted = true; // 靜音
      video.playsInline = true; // iOS 支援

      // 加載完元數據後，跳到 0.1 秒處以顯示第一幀
      video.addEventListener("loadedmetadata", () => {
        video.currentTime = 0.1;
      });

      thumb.appendChild(video);
    }

    thumb.onclick = () => showMediaAt(index);
    container.appendChild(thumb);

    // 動畫結束後移除動畫類
    thumb.addEventListener(
      "animationend",
      () => {
        thumb.classList.remove("scale-in");
      },
      { once: true }
    );
  });
}

// 更新縮圖選中狀態
function updateThumbnailActive() {
  const thumbnails = document.querySelectorAll(".thumbnail-item");
  thumbnails.forEach((thumb, index) => {
    if (index === currentIndex) {
      thumb.classList.add("active");
      // 滾動到可見區域
      thumb.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    } else {
      thumb.classList.remove("active");
    }
  });
}

// 上一張
function previousMedia() {
  if (mediaList.length === 0) return;
  if (currentIndex > 0) {
    showMediaAt(currentIndex - 1);
  } else {
    showMediaAt(mediaList.length - 1); // 循環到最後一張
  }
}

// 下一張
function nextMedia() {
  if (mediaList.length === 0) return;
  if (currentIndex < mediaList.length - 1) {
    showMediaAt(currentIndex + 1);
  } else {
    showMediaAt(0); // 循環到第一張
  }
}

// 鍵盤控制
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    previousMedia();
  } else if (e.key === "ArrowRight") {
    nextMedia();
  }
});

// 觸控手勢支援（手機滑動）
let touchStartX = 0;
let touchEndX = 0;
let touchStartY = 0;
let touchEndY = 0;
let touchStartTime = 0;

window.addEventListener("DOMContentLoaded", () => {
  const galleryMain = document.getElementById("gallery-main");

  if (galleryMain) {
    galleryMain.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
        touchStartTime = Date.now();
      },
      { passive: true }
    );

    galleryMain.addEventListener(
      "touchend",
      (e) => {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        handleSwipe();
      },
      { passive: true }
    );
  }

  // 防止雙擊縮放（僅針對畫廊區域）
  if (galleryMain) {
    let lastTouchEnd = 0;
    galleryMain.addEventListener(
      "touchend",
      (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
          e.preventDefault();
        }
        lastTouchEnd = now;
      },
      false
    );
  }

  // 為所有按鈕添加觸控回饋
  document.querySelectorAll("button").forEach((button) => {
    button.addEventListener(
      "touchstart",
      function () {
        this.style.transform = "scale(0.95)";
      },
      { passive: true }
    );

    button.addEventListener(
      "touchend",
      function () {
        setTimeout(() => {
          this.style.transform = "";
        }, 100);
      },
      { passive: true }
    );
  });
});

function handleSwipe() {
  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;

  // 只有水平滑動距離大於垂直滑動距離才觸發切換
  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
    if (deltaX < -50) {
      nextMedia(); // 向左滑，下一張
    } else if (deltaX > 50) {
      previousMedia(); // 向右滑，上一張
    }
  }
}

// ============================================
// 彈幕功能
// ============================================
function sendDanmaku() {
  const input = document.getElementById("danmakuText");
  const text = input.value.trim();

  if (!text) {
    showToast("提示", "請輸入彈幕內容", "warning", 2000);
    input.focus();
    return;
  }

  if (text.length > 50) {
    showToast("提示", "彈幕內容不能超過 50 個字", "warning", 2000);
    return;
  }

  const danmakuData = {
    userName: userName,
    danmakuText: text,
    color: getRandomColor(),
    position: Math.random() * 80 + 10, // 10-90%
  };

  // 發送到伺服器
  fetch("/api/danmaku", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(danmakuData),
  })
    .then((response) => {
      if (!response.ok) throw new Error("發送失敗");
      return response.json();
    })
    .then(() => {
      input.value = "";
      showToast("發送成功", "彈幕已送出", "success", 1500);
    })
    .catch((error) => {
      console.error("發送彈幕失敗:", error);
      showToast("發送失敗", "請稍後再試", "error", 3000);
    });
}

function showDanmaku(data) {
  const container = document.getElementById("danmaku-container");

  if (!container) {
    console.error("❌ 找不到彈幕容器 #danmaku-container");
    return;
  }

  const danmaku = document.createElement("div");

  danmaku.className = "danmaku-item";
  danmaku.textContent = data.danmakuText || data.danmaku_text;
  danmaku.style.color = data.color || "#FFFFFF";
  danmaku.style.top = `${data.position || 50}%`;

  // 🔧 優化：確保容器有正確的寬度
  const galleryMain = document.getElementById("gallery-main");
  const containerWidth = galleryMain
    ? galleryMain.offsetWidth
    : container.offsetWidth || window.innerWidth;

  // 從右側外面開始（避免突然出現）
  danmaku.style.left = `${containerWidth + 20}px`;
  danmaku.style.willChange = "left";

  container.appendChild(danmaku);

  // 強制瀏覽器重繪以確保初始位置生效
  danmaku.offsetHeight;

  // 獲取彈幕寬度並計算結束位置（飛到左側外面）
  const danmakuWidth = danmaku.offsetWidth;
  const endPosition = -(danmakuWidth + 50);

  console.log(
    "🎬 彈幕:",
    danmaku.textContent,
    `| 容器寬度: ${containerWidth}px | 彈幕寬度: ${danmakuWidth}px | 路徑: ${
      containerWidth + 20
    }px → ${endPosition}px`
  );

  // 雙重 RAF 確保 Safari/所有瀏覽器執行動畫
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      danmaku.style.transition = "left 8s linear";
      danmaku.style.left = `${endPosition}px`;
    });
  });

  // 8.5秒後移除
  setTimeout(() => {
    if (danmaku.parentNode) {
      danmaku.remove();
      console.log("🗑️ 彈幕已移除:", danmaku.textContent);
    }
  }, 8500);
}

// 測試彈幕功能（可在控制台呼叫）
window.testDanmaku = function () {
  console.log("測試彈幕...");
  showDanmaku({
    danmakuText: "測試彈幕 " + Date.now(),
    color: "#FF6B6B",
    position: 30,
  });
  showDanmaku({
    danmakuText: "第二條測試 " + Date.now(),
    color: "#4ECDC4",
    position: 50,
  });
  showDanmaku({
    danmakuText: "第三條測試 " + Date.now(),
    color: "#FFA07A",
    position: 70,
  });
  console.log("已發送 3 條測試彈幕");
};

function getRandomColor() {
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#FFA07A",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E2",
    "#F8B739",
    "#52B788",
    "#FF99C9",
    "#A8E6CF",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// ============================================
// 留言板功能
// ============================================
async function loadMessages() {
  try {
    const response = await fetch("/api/messages");
    const messages = await response.json();

    const container = document.getElementById("messages");
    container.innerHTML = "";

    messages.forEach((msg) => {
      addMessageToBoard(msg);
    });

    // 捲動到最新留言
    container.scrollTop = 0;
  } catch (error) {
    console.error("載入留言失敗:", error);
  }
}

function sendMessage() {
  const input = document.getElementById("messageText");
  const text = input.value.trim();

  if (!text) {
    showToast("提示", "請輸入留言內容", "warning", 2000);
    input.focus();
    return;
  }

  if (text.length > 200) {
    showToast("提示", "留言內容不能超過 200 個字", "warning", 2000);
    return;
  }

  const messageData = {
    userName: userName,
    messageText: text,
  };

  // 防止重複提交
  const button =
    event.target || document.querySelector(".message-input button");
  if (button) button.disabled = true;

  fetch("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(messageData),
  })
    .then((response) => {
      if (!response.ok) throw new Error("發送失敗");
      return response.json();
    })
    .then(() => {
      input.value = "";
      showToast("留言成功", "您的祝福已送出", "success", 2000);
    })
    .catch((error) => {
      console.error("發送留言失敗:", error);
      showToast("發送失敗", "請稍後再試", "error", 3000);
    })
    .finally(() => {
      if (button) button.disabled = false;
    });
}

function addMessageToBoard(message) {
  const container = document.getElementById("messages");
  const messageDiv = document.createElement("div");
  messageDiv.className = "message-item slide-in-left";

  const userName = document.createElement("strong");
  userName.textContent = message.user_name || message.userName;

  const text = document.createElement("p");
  text.textContent = message.message_text || message.messageText;

  const time = document.createElement("small");
  const timeStr = message.created_at
    ? new Date(message.created_at).toLocaleString("zh-TW")
    : "剛剛";
  time.textContent = timeStr;

  messageDiv.appendChild(userName);
  messageDiv.appendChild(text);
  messageDiv.appendChild(time);

  // 插入到最前面，帶動畫效果
  container.insertBefore(messageDiv, container.firstChild);

  // 動畫結束後移除動畫類
  messageDiv.addEventListener(
    "animationend",
    () => {
      messageDiv.classList.remove("slide-in-left");
    },
    { once: true }
  );
}

// ============================================
// 檔案上傳功能
// ============================================
function setupDragDrop() {
  const dropZone = document.getElementById("dropZone");
  const fileInput = document.getElementById("fileInput");

  // 點擊上傳
  dropZone.addEventListener("click", () => {
    fileInput.click();
  });

  // 拖放上傳
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      uploadFile(files[0]);
    }
  });
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (file) {
    uploadFile(file);
  }
}

async function uploadFile(file) {
  // 驗證檔案大小 (200MB)
  if (file.size > 200 * 1024 * 1024) {
    showToast("檔案過大", "檔案大小不能超過 200MB", "error", 3000);
    return;
  }

  // 驗證檔案類型
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/heic",
    "image/heif",
    "image/x-adobe-dng",
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
    "video/mpeg",
  ];

  if (!allowedTypes.includes(file.type)) {
    showToast(
      "不支援此格式 (${file.type})。僅支援 JPG, PNG, GIF, HEIC/HEIF, DNG, MP4, MOV, AVI",
      "error",
      3000
    );
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  // Note: uploader name is now automatically set from authenticated user session on backend

  // 顯示上傳進度
  const progressContainer = document.getElementById("uploadProgress");
  progressContainer.innerHTML = `
        <div class="progress-bar">
            <div class="progress-fill" id="progressFill" style="width: 0%">0%</div>
        </div>
    `;

  try {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        const progressFill = document.getElementById("progressFill");
        if (progressFill) {
          progressFill.style.width = percent + "%";
          progressFill.textContent = percent + "%";
        }
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        setTimeout(() => {
          progressContainer.innerHTML =
            '<p style="color: #52B788; font-weight: bold;">上傳成功！</p>';
          showToast(
            "上傳成功",
            file.type.startsWith("image/") ? "照片已上傳" : "影片已上傳",
            "success",
            2000
          );
          setTimeout(() => {
            progressContainer.innerHTML = "";
          }, 2000);
        }, 500);
      } else {
        progressContainer.innerHTML =
          '<p style="color: #e74c3c;">✗ 上傳失敗，請重試</p>';
        showToast("上傳失敗", "請檢查網絡連線後重試", "error", 3000);
      }
    });

    xhr.addEventListener("error", () => {
      progressContainer.innerHTML =
        '<p style="color: #e74c3c;">✗ 上傳失敗，請重試</p>';
      showToast("上傳失敗", "網絡連線錯誤", "error", 3000);
    });

    xhr.open("POST", "/api/upload");
    xhr.send(formData);
  } catch (error) {
    console.error("上傳失敗:", error);
    progressContainer.innerHTML =
      '<p style="color: #e74c3c;">✗ 上傳失敗，請重試</p>';
  }
}

// ============================================
// 統計資料
// ============================================
async function loadStatistics() {
  try {
    const response = await fetch("/api/statistics");
    const stats = await response.json();

    document.getElementById("photoCount").textContent = stats.photoCount || 0;
    document.getElementById("videoCount").textContent = stats.videoCount || 0;
    document.getElementById("messageCount").textContent =
      stats.messageCount || 0;
  } catch (error) {
    console.error("載入統計失敗:", error);
  }
}

// ============================================
// 匯出資料
// ============================================
async function exportData() {
  try {
    // 取得所有資料
    const [mediaRes, messagesRes, statsRes] = await Promise.all([
      fetch("/api/media"),
      fetch("/api/messages"),
      fetch("/api/statistics"),
    ]);

    const media = await mediaRes.json();
    const messages = await messagesRes.json();
    const stats = await statsRes.json();

    const exportData = {
      exportTime: new Date().toISOString(),
      statistics: stats,
      media: media,
      messages: messages,
    };

    // 產生 JSON 檔案
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `event-data-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert("資料匯出成功！");
  } catch (error) {
    console.error("匯出資料失敗:", error);
    alert("匯出資料失敗，請稍後再試");
  }
}

// ============================================
// 登出功能
// ============================================
function logout() {
  if (confirm("確定要登出嗎？")) {
    // 關閉 WebSocket 連線
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }

    // 重定向到登出 API
    window.location.href = "/auth/logout";
  }
}
