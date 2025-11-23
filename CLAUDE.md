# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Event Interactive Wall (活動互動牆) is a real-time interactive web application for events like weddings, parties, and corporate gatherings. It supports photo/video uploads, danmaku (bullet comments), message boards, and real-time synchronization across clients.

**Tech Stack:**
- Backend: Node.js + Express
- Database: MySQL 8.0+ (event_wall)
- Real-time: WebSocket (ws library)
- File Upload: Multer
- Cloud Storage: Google Drive API (googleapis)
- Frontend: Vanilla JavaScript (no framework)

## Common Commands

### Development
```bash
# Install dependencies (note: no package.json in repo currently)
npm install express multer ws mysql2 googleapis nodemon

# Start production server
npm start
# OR
node server.js

# Start development server with auto-reload
npm run dev
# OR
nodemon server.js
```

### Database Setup
```bash
# Windows batch setup (recommended)
cd database
setup.bat

# Manual setup
mysql -u root -ppassword < database/init.sql
```

### Cloud Storage Setup (Optional)
```bash
# See detailed guide in config/GOOGLE_DRIVE_SETUP.md
# Quick steps:
# 1. Create Google Cloud Project
# 2. Enable Google Drive API
# 3. Create Service Account
# 4. Download credentials as config/google-credentials.json
# 5. Restart server
```

### Server Ports
- HTTP Server: `http://localhost:5001`
- WebSocket: `ws://localhost:8080`

## Architecture

### Backend Structure

**server.js** - Main server entry point
- Express HTTP server (port 5001)
- WebSocket server (port 8080)
- File upload handling with Multer
- Real-time broadcasting to all connected clients
- Static file serving for uploads and public assets

**config/database.js** - Database layer
- MySQL connection pool management
- All database operations (insertMediaFile, getAllMedia, insertMessage, getAllMessages, insertDanmaku, getStatistics, getSiteConfig, updateMediaCloudInfo)
- Uses mysql2 with promises for async/await support
- Default credentials: root/password (must be changed for production)

**config/googleDrive.js** - Cloud storage service (optional)
- Google Drive API integration for dual storage
- Handles authentication via Service Account
- Asynchronous upload without blocking local storage
- File sharing and direct link generation
- Gracefully disables if credentials not found

### Database Schema (database/init.sql)

**Tables:**
1. **media_files** - Stores photo/video metadata with file paths
   - Local storage: `file_path`, `file_url`
   - Cloud storage: `cloud_file_id`, `cloud_url`, `cloud_view_link`, `cloud_uploaded`, `cloud_uploaded_at`
2. **messages** - User messages/blessings with timestamps
3. **danmaku** - Bullet comments with color and position data
4. **site_config** - Event configuration (guest names, dates, titles)

All tables use utf8mb4 charset for emoji/multilingual support.

### Frontend Architecture

**public/index.html** - Name entry page (访客输入姓名)
**public/main.html** - Main interactive wall interface
**public/main.js** - Frontend logic
- WebSocket client connection with auto-reconnect
- Media carousel/gallery with navigation
- Danmaku animation system
- Real-time message board updates
- File upload with drag-and-drop
- Toast notifications and loading states

**public/styles.css** - Responsive styles with mobile optimization

### Real-time Synchronization Flow

1. Client uploads file → Server saves to disk → Server inserts to DB → Server broadcasts via WebSocket → All clients update UI → **[Async] Server uploads to Google Drive → Updates DB → Broadcasts cloud complete**
2. Client sends message/danmaku → Server inserts to DB → Server broadcasts via WebSocket → All clients display new content
3. WebSocket message types: `newMedia`, `newMessage`, `newDanmaku`, `initMedia`, `cloudUploadComplete`

### Dual Storage Architecture

**Upload Flow:**
1. **Local Storage (Immediate)**: File saved to `uploads/` directory, instant response to client
2. **Cloud Storage (Async)**: Background upload to Google Drive without blocking user experience
3. **Database Updates**: Both local path and cloud URL stored in `media_files` table

**Benefits:**
- Fast user response (local storage completes in milliseconds)
- Cloud backup for disaster recovery
- Shareable Google Drive links for external access
- Continues working if cloud service is unavailable

### File Upload System

**Storage Structure:**
```
uploads/
├── photos/        # Images: jpg, png, gif
├── videos/        # Videos: mp4, mov, avi
└── thumbnails/    # Auto-generated thumbnails (future feature)
```

**Naming Convention:** `{timestamp}-{uploader}-{originalName}`
**File Size Limit:** 100MB
**Allowed Types:** image/* and video/* with extension validation

### API Endpoints

```
POST /api/upload        - Upload photo/video (multipart/form-data)
GET  /api/media         - Get all media files (desc by upload_time)
POST /api/messages      - Post new message
GET  /api/messages      - Get all messages
POST /api/danmaku       - Post danmaku
GET  /api/statistics    - Get counts (photos, videos, messages)
GET  /api/config        - Get site configuration
```

## Development Notes

### Database Configuration
- Connection settings in `config/database.js`
- Default database: `event_wall`
- Change password before deployment: edit `dbConfig.password`

### Cloud Storage Configuration (Optional)
- **Setup Guide**: See `config/GOOGLE_DRIVE_SETUP.md` for detailed instructions
- **Credentials File**: Place Service Account JSON at `config/google-credentials.json`
- **Folder IDs**: Optional environment variables `GDRIVE_PHOTOS_FOLDER_ID` and `GDRIVE_VIDEOS_FOLDER_ID`
- **Graceful Degradation**: System works without cloud storage if credentials not found
- **Security**: Never commit `google-credentials.json` to git (already in .gitignore)

### WebSocket Considerations
- Server broadcasts to all connected clients on any data change
- No authentication currently implemented
- Connection status indicator on frontend with auto-reconnect logic

### Security Notes
- SQL injection protection: Uses parameterized queries
- File type validation: Both MIME type and extension checks
- No XSS protection on message content (should be added)
- No rate limiting implemented
- No user authentication system


### Customization
To customize event settings, update `site_config` table:
```sql
UPDATE site_config SET
  guest_name_a = 'Name A',
  guest_name_b = 'Name B',
  event_date = 'YYYY-MM-DD',
  site_title = 'Event Title'
WHERE id = 1;
```

## Key Implementation Details

### Multer Storage Strategy
Files are routed to different directories based on MIME type in the `destination` callback (server.js:31-39).

### Database Connection Pool
Uses mysql2 connection pool with 10 max connections. Pool is exported as both callback (`pool`) and promise (`promisePool`) interfaces.

### WebSocket Initialization
On connection, server sends existing media files via `initMedia` message (server.js:216).

### Carousel System
Frontend maintains `mediaList` array and `currentIndex`. Navigation updates gallery display and syncs thumbnail highlighting.

## Common Tasks

### Adding New Database Fields
1. Modify `database/init.sql` table schema
2. Update corresponding function in `config/database.js`
3. Update API endpoint in `server.js`
4. Update frontend to display/submit new field

### Adding New API Endpoints
1. Define route in `server.js` API section (after line 74)
2. Call appropriate `db.*` function from `config/database.js`
3. Broadcast via WebSocket if real-time sync needed
4. Add corresponding fetch call in `public/main.js`

### Modifying Upload Restrictions
Edit `upload` multer configuration in `server.js`:
- `limits.fileSize` for size limit (line 51)
- `fileFilter` callback for type restrictions (line 52-64)

### Enabling/Disabling Cloud Storage
**To Enable:**
1. Follow setup guide in `config/GOOGLE_DRIVE_SETUP.md`
2. Place credentials at `config/google-credentials.json`
3. Restart server
4. Check logs for "Google Drive 雲端存儲已啟用"

**To Disable:**
1. Remove or rename `config/google-credentials.json`
2. Restart server
3. System continues with local-only storage

### Cloud Storage Implementation Details
**Upload Function** (`server.js:80-108`): After local save, calls `uploadToCloud()` asynchronously
**Cloud Module** (`config/googleDrive.js`): Handles Google Drive authentication, upload, and file sharing
**Database Update** (`config/database.js:154-180`): `updateMediaCloudInfo()` stores cloud URLs after successful upload
