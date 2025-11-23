-- 添加缩略图字段迁移脚本
-- 为现有的 media_files 表添加 thumbnail_url 字段

USE event_wall;

-- 添加缩略图 URL 字段
ALTER TABLE media_files
ADD COLUMN thumbnail_url VARCHAR(500) DEFAULT NULL COMMENT '縮圖 URL'
AFTER file_url;

SELECT '缩略图字段添加完成！' AS Status;
