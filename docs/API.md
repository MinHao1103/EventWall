# Event Wall API 文檔

本文檔說明活動互動牆後端 API 的所有端點、請求格式和回應格式。

## 基本資訊

- **Base URL**: `http://localhost:5001`
- **WebSocket URL**: `ws://localhost:8080`
- **Content-Type**: `application/json` (除檔案上傳外)

## API 端點

### 1. 上傳媒體檔案

上傳照片或影片到伺服器。

**端點**: `POST /api/upload`

**Content-Type**: `multipart/form-data`

**請求參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| file | File | 是 | 照片或影片檔案 |
| uploader | String | 否 | 上傳者名稱（預設: anonymous） |

**支援格式**:
- 圖片: JPG, PNG, GIF
- 影片: MP4, MOV, AVI
- 檔案大小限制: 100MB

**成功回應** (200):
```json
{
  "message": "檔案上傳成功",
  "data": {
    "id": 123,
    "filename": "1234567890-username-photo.jpg",
    "originalName": "photo.jpg",
    "uploader": "username",
    "fileType": "image/jpeg",
    "fileSize": 1024000,
    "filePath": "/uploads/photos/1234567890-username-photo.jpg",
    "fileUrl": "/uploads/photos/1234567890-username-photo.jpg",
    "thumbnailUrl": "/uploads/thumbnails/thumb_1234567890-username-photo.jpg",
    "mediaType": "photo",
    "uploadTime": "2024-12-31T12:00:00.000Z"
  }
}
```

**錯誤回應**:
- `400`: 未上傳檔案或檔案類型不支援
- `500`: 伺服器錯誤

**說明**:
- 上傳成功後會自動廣播給所有 WebSocket 連線的客戶端
- 圖片會自動生成 300x300 的縮略圖
- 若啟用 Google Drive，會在背景非同步上傳到雲端

---

### 2. 取得所有媒體檔案

取得所有已上傳的照片和影片列表。

**端點**: `GET /api/media`

**請求參數**: 無

**成功回應** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "filename": "1234567890-username-photo.jpg",
      "originalName": "photo.jpg",
      "uploader": "username",
      "fileType": "image/jpeg",
      "fileSize": 1024000,
      "filePath": "/uploads/photos/1234567890-username-photo.jpg",
      "fileUrl": "/uploads/photos/1234567890-username-photo.jpg",
      "thumbnailUrl": "/uploads/thumbnails/thumb_1234567890-username-photo.jpg",
      "mediaType": "photo",
      "uploadTime": "2024-12-31T12:00:00.000Z",
      "cloudFileId": "1ABC...XYZ",
      "cloudUrl": "https://drive.google.com/uc?id=...",
      "cloudViewLink": "https://drive.google.com/file/d/.../view",
      "cloudUploaded": true,
      "cloudUploadedAt": "2024-12-31T12:00:05.000Z"
    }
  ]
}
```

**說明**:
- 依上傳時間降序排列（最新的在前）
- `cloudUrl` 等欄位僅在啟用 Google Drive 且上傳完成時才有值

---

### 3. 發送留言

發送一則新的留言或祝福。

**端點**: `POST /api/messages`

**Content-Type**: `application/json`

**請求參數**:
```json
{
  "userName": "使用者名稱",
  "messageText": "留言內容"
}
```

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| userName | String | 是 | 使用者名稱 |
| messageText | String | 是 | 留言內容 |

**成功回應** (201):
```json
{
  "success": true,
  "message": "留言發送成功",
  "data": {
    "id": 456,
    "userName": "使用者名稱",
    "messageText": "留言內容",
    "createdAt": "2024-12-31T12:00:00.000Z"
  }
}
```

**錯誤回應**:
- `400`: 缺少必要參數
- `500`: 伺服器錯誤

**說明**:
- 留言成功後會廣播給所有 WebSocket 連線的客戶端

---

### 4. 取得所有留言

取得所有留言列表。

**端點**: `GET /api/messages`

**請求參數**: 無

**成功回應** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": 456,
      "userName": "使用者名稱",
      "messageText": "留言內容",
      "ipAddress": "127.0.0.1",
      "createdAt": "2024-12-31T12:00:00.000Z"
    }
  ]
}
```

**說明**:
- 依建立時間排序

---

### 5. 發送彈幕

發送一則彈幕（飛過螢幕的文字）。

**端點**: `POST /api/danmaku`

**Content-Type**: `application/json`

**請求參數**:
```json
{
  "userName": "使用者名稱",
  "danmakuText": "彈幕內容",
  "color": "#FFFFFF",
  "position": 50.00
}
```

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| userName | String | 是 | 使用者名稱 |
| danmakuText | String | 是 | 彈幕內容（最多 200 字） |
| color | String | 否 | 顏色代碼（預設: #FFFFFF） |
| position | Number | 否 | 垂直位置百分比 0-100（預設: 50） |

**成功回應** (201):
```json
{
  "success": true,
  "message": "彈幕發送成功",
  "data": {
    "id": 789,
    "userName": "使用者名稱",
    "danmakuText": "彈幕內容",
    "color": "#FFFFFF",
    "position": 50.00,
    "createdAt": "2024-12-31T12:00:00.000Z"
  }
}
```

**錯誤回應**:
- `400`: 缺少必要參數
- `500`: 伺服器錯誤

**說明**:
- 彈幕成功後會廣播給所有 WebSocket 連線的客戶端

---

### 6. 取得統計資料

取得系統統計資料（照片、影片、留言數量）。

**端點**: `GET /api/statistics`

**請求參數**: 無

**成功回應** (200):
```json
{
  "success": true,
  "data": {
    "photos": 125,
    "videos": 18,
    "messages": 342
  }
}
```

**說明**:
- 即時統計各類資料的數量

---

### 7. 取得網站設定

取得活動相關的網站設定資訊。

**端點**: `GET /api/config`

**請求參數**: 無

**成功回應** (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "guestNameA": "新郎名字",
    "guestNameB": "新娘名字",
    "eventDate": "2024-12-31",
    "logoUrl": null,
    "backgroundUrl": null,
    "siteTitle": "活動互動牆",
    "welcomeMessage": "歡迎來到我們的活動互動牆，請留下您的祝福！",
    "updatedAt": "2024-12-31T12:00:00.000Z"
  }
}
```

**說明**:
- 用於在前端顯示活動主題和歡迎訊息

---

## WebSocket 即時通訊

伺服器使用 WebSocket 廣播即時更新。

**連線 URL**: `ws://localhost:8080`

### 接收的訊息類型

#### 1. 初始化媒體列表
連線成功時會收到現有的所有媒體檔案。

```json
{
  "type": "initMedia",
  "data": [
    {
      "id": 123,
      "filename": "...",
      ...
    }
  ]
}
```

#### 2. 新媒體上傳
有新的照片或影片上傳時。

```json
{
  "type": "newMedia",
  "data": {
    "id": 123,
    "filename": "...",
    ...
  }
}
```

#### 3. 新留言
有新的留言發送時。

```json
{
  "type": "newMessage",
  "data": {
    "id": 456,
    "userName": "...",
    "messageText": "...",
    ...
  }
}
```

#### 4. 新彈幕
有新的彈幕發送時。

```json
{
  "type": "newDanmaku",
  "data": {
    "id": 789,
    "userName": "...",
    "danmakuText": "...",
    "color": "#FFFFFF",
    "position": 50.00,
    ...
  }
}
```

#### 5. 雲端上傳完成
檔案上傳到 Google Drive 完成時（僅在啟用雲端功能時）。

```json
{
  "type": "cloudUploadComplete",
  "data": {
    "id": 123,
    "cloudUrl": "https://drive.google.com/uc?id=...",
    "cloudViewLink": "https://drive.google.com/file/d/.../view"
  }
}
```

---

## 錯誤碼說明

| HTTP 狀態碼 | 說明 |
|------------|------|
| 200 | 請求成功 |
| 201 | 資源建立成功 |
| 400 | 請求參數錯誤 |
| 500 | 伺服器內部錯誤 |

---

## 範例程式碼

### 使用 JavaScript Fetch 上傳照片

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('uploader', '使用者名稱');

fetch('http://localhost:5001/api/upload', {
  method: 'POST',
  body: formData
})
  .then(response => response.json())
  .then(data => console.log('上傳成功', data))
  .catch(error => console.error('上傳失敗', error));
```

### 使用 JavaScript 連接 WebSocket

```javascript
const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
  console.log('WebSocket 已連線');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('收到訊息', message);

  switch(message.type) {
    case 'newMedia':
      // 處理新媒體
      break;
    case 'newMessage':
      // 處理新留言
      break;
    case 'newDanmaku':
      // 處理新彈幕
      break;
  }
};

ws.onerror = (error) => {
  console.error('WebSocket 錯誤', error);
};

ws.onclose = () => {
  console.log('WebSocket 已斷線');
};
```

### 發送留言

```javascript
fetch('http://localhost:5001/api/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userName: '使用者名稱',
    messageText: '這是一則留言'
  })
})
  .then(response => response.json())
  .then(data => console.log('留言成功', data))
  .catch(error => console.error('留言失敗', error));
```

---

## 附註

- 所有時間戳記皆使用 ISO 8601 格式（UTC）
- 檔案路徑皆為相對於伺服器根目錄的路徑
- WebSocket 連線會在伺服器重啟或網路問題時斷線，建議實作自動重連機制
- 生產環境建議加入身份驗證和速率限制
