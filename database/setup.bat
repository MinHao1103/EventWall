@echo off
echo ================================
echo Event Wall 資料庫設定程式
echo ================================
echo.

REM 檢查 MySQL 是否可用
where mysql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [錯誤] 找不到 MySQL 指令
    echo 請確認 MySQL 已安裝並加入 PATH 環境變數
    pause
    exit /b 1
)

echo 請輸入 MySQL root 密碼：
set /p MYSQL_PASSWORD=

echo.
echo 正在建立資料庫...
mysql -u root -p%MYSQL_PASSWORD% -e "CREATE DATABASE IF NOT EXISTS event_wall CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

if %ERRORLEVEL% NEQ 0 (
    echo [錯誤] 建立資料庫失敗
    pause
    exit /b 1
)

echo 正在初始化資料表...
mysql -u root -p%MYSQL_PASSWORD% event_wall < "%~dp0init.sql"

if %ERRORLEVEL% NEQ 0 (
    echo [錯誤] 初始化資料表失敗
    pause
    exit /b 1
)

echo.
echo ================================
echo 資料庫設定完成！
echo ================================
echo.
echo 資料庫名稱: event_wall
echo 字元集: utf8mb4
echo.
echo 下一步：
echo 1. 修改 src/config/database.js 中的資料庫密碼
echo 2. 執行 npm start 啟動伺服器
echo.
pause
