@echo off
chcp 65001 >nul
title 知识图谱编辑器

echo ========================================
echo    🧠 知识图谱编辑器 - 启动中...
echo ========================================
echo.

cd /d "%~dp0"

:: 检查 node_modules 是否存在
if not exist "node_modules\" (
    echo [安装依赖] npm install...
    call npm install
    echo.
)

:: 检查 Python 是否可用
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Python，请安装 Python 3 并添加到 PATH
    echo.
    pause
    exit /b 1
)

echo [启动] Electron 桌面应用...
echo.
npm start

pause
