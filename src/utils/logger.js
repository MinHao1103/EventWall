/**
 * Winston Logger 配置
 * 支援 Console 和 Daily Rotate File 輸出
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// 建立 logs 目錄（如果不存在）
const fs = require('fs');
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// 統一格式（Console 和檔案都使用相同格式，無顏色代碼）
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.printf(({ timestamp, level, message }) => {
        return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    })
);

// Winston Logger 實例
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info', // 可透過環境變數調整日誌級別
    format: logFormat,
    transports: [
        // Console 輸出（純文字，無顏色）
        new winston.transports.Console(),
        // 按日期自動切分的檔案輸出
        new DailyRotateFile({
            filename: path.join(logsDir, 'event-wall-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxFiles: '30d',  // 保留 30 天
            maxSize: '20m',   // 單檔最大 20MB
            zippedArchive: true // 壓縮舊日誌
        }),
        // 錯誤日誌單獨存檔
        new DailyRotateFile({
            filename: path.join(logsDir, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxFiles: '30d',
            maxSize: '20m',
            zippedArchive: true
        })
    ]
});

// 提供簡化的介面（相容原本的 console.log 用法）
const log = {
    info: (...args) => logger.info(args.join(' ')),
    warn: (...args) => logger.warn(args.join(' ')),
    error: (...args) => logger.error(args.join(' ')),
    debug: (...args) => logger.debug(args.join(' ')),
    // 預設使用 info 級別（相容原本的 log() 用法）
    log: (...args) => logger.info(args.join(' '))
};

module.exports = {
    logger,  // Winston 原始實例（進階使用）
    log,     // 簡化介面（推薦使用）
    info: log.info,
    warn: log.warn,
    error: log.error,
    debug: log.debug
};
