-- 活動互動牆資料庫初始化腳本
-- 資料庫: event_wall

USE event_wall;

-- 1. 媒體檔案資料表
CREATE TABLE IF NOT EXISTS media_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    uploader VARCHAR(50) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    media_type ENUM('photo', 'video') NOT NULL,
    upload_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cloud_file_id VARCHAR(255) DEFAULT NULL COMMENT 'Google Drive 檔案 ID',
    cloud_url VARCHAR(500) DEFAULT NULL COMMENT '雲端直接預覽連結',
    cloud_view_link VARCHAR(500) DEFAULT NULL COMMENT 'Google Drive 查看連結',
    cloud_uploaded BOOLEAN DEFAULT FALSE COMMENT '是否已上傳到雲端',
    cloud_uploaded_at DATETIME DEFAULT NULL COMMENT '雲端上傳時間',
    INDEX idx_media_type (media_type),
    INDEX idx_upload_time (upload_time),
    INDEX idx_cloud_uploaded (cloud_uploaded)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 留言資料表
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_name VARCHAR(50) NOT NULL,
    message_text TEXT NOT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 彈幕資料表
CREATE TABLE IF NOT EXISTS danmaku (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_name VARCHAR(50) NOT NULL,
    danmaku_text VARCHAR(200) NOT NULL,
    color VARCHAR(7) DEFAULT '#FFFFFF',
    position DECIMAL(5,2) DEFAULT 50.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 網站設定資料表
CREATE TABLE IF NOT EXISTS site_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    guest_name_a VARCHAR(50) NOT NULL,
    guest_name_b VARCHAR(50) NOT NULL,
    event_date DATE NOT NULL,
    logo_url VARCHAR(255) DEFAULT NULL,
    background_url VARCHAR(255) DEFAULT NULL,
    site_title VARCHAR(100) DEFAULT '活動互動牆',
    welcome_message TEXT DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入預設網站設定
INSERT INTO site_config (guest_name_a, guest_name_b, event_date, site_title, welcome_message)
VALUES ('嘉賓A', '嘉賓B', '2024-12-31', '活動互動牆', '歡迎來到我們的活動互動牆，請留下您的祝福！')
ON DUPLICATE KEY UPDATE id=id;

SELECT '資料庫初始化完成！' AS Status;
