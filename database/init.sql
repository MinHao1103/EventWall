-- 活動互動牆資料庫初始化腳本
-- 資料庫: event_wall

USE event_wall;

-- 1. 媒體檔案資料表
CREATE TABLE IF NOT EXISTS media_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL COMMENT '存儲檔案名稱 (含時間戳記)',
    original_name VARCHAR(255) NOT NULL COMMENT '原始檔案名稱',
    uploader VARCHAR(50) NOT NULL COMMENT '上傳者名稱',
    file_type VARCHAR(50) NOT NULL COMMENT '檔案 MIME 類型',
    file_size BIGINT NOT NULL COMMENT '檔案大小 (bytes)',
    file_path VARCHAR(500) NOT NULL COMMENT '本地檔案路徑',
    file_url VARCHAR(500) NOT NULL COMMENT '本地檔案 URL',
    thumbnail_url VARCHAR(500) DEFAULT NULL COMMENT '縮圖 URL',
    media_type ENUM('photo', 'video') NOT NULL COMMENT '媒體類型',
    upload_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '上傳時間',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    cloud_file_id VARCHAR(255) DEFAULT NULL COMMENT 'Google Drive 檔案 ID',
    cloud_url VARCHAR(500) DEFAULT NULL COMMENT '雲端直接預覽連結',
    cloud_view_link VARCHAR(500) DEFAULT NULL COMMENT 'Google Drive 查看連結',
    cloud_uploaded BOOLEAN DEFAULT FALSE COMMENT '是否已上傳到雲端',
    cloud_uploaded_at DATETIME DEFAULT NULL COMMENT '雲端上傳時間',
    INDEX idx_media_type (media_type),
    INDEX idx_upload_time (upload_time),
    INDEX idx_cloud_uploaded (cloud_uploaded)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='媒體檔案資料表';

-- 2. 留言資料表
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_name VARCHAR(50) NOT NULL COMMENT '使用者名稱',
    message_text TEXT NOT NULL COMMENT '留言內容',
    ip_address VARCHAR(45) DEFAULT NULL COMMENT '來源 IP 位址',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='留言資料表';

-- 3. 彈幕資料表
CREATE TABLE IF NOT EXISTS danmaku (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_name VARCHAR(50) NOT NULL COMMENT '使用者名稱',
    danmaku_text VARCHAR(200) NOT NULL COMMENT '彈幕內容',
    color VARCHAR(7) DEFAULT '#FFFFFF' COMMENT '彈幕顏色 (HEX)',
    position DECIMAL(5,2) DEFAULT 50.00 COMMENT '垂直位置百分比 (0-100)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='彈幕資料表';

-- 4. 網站設定資料表
CREATE TABLE IF NOT EXISTS site_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    guest_name_a VARCHAR(50) NOT NULL COMMENT '嘉賓A名稱',
    guest_name_b VARCHAR(50) NOT NULL COMMENT '嘉賓B名稱',
    event_date DATE NOT NULL COMMENT '活動日期',
    site_title VARCHAR(100) DEFAULT '活動互動牆' COMMENT '網站標題',
    welcome_message TEXT DEFAULT NULL COMMENT '歡迎訊息',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最後更新時間'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='網站設定資料表';

-- 5. 使用者資料表 (Google OAuth)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    google_id VARCHAR(255) UNIQUE NOT NULL COMMENT 'Google 帳號 ID',
    email VARCHAR(255) NOT NULL COMMENT 'Email 信箱',
    display_name VARCHAR(100) NOT NULL COMMENT '顯示名稱',
    profile_picture VARCHAR(500) DEFAULT NULL COMMENT 'Google 個人照片 URL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最後登入時間',
    INDEX idx_google_id (google_id),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='使用者資料表 (Google OAuth)';

SELECT '資料庫初始化完成！' AS Status;
