@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo   ═══════════════════════════════
echo   日记库 · Diary Vault
echo   ═══════════════════════════════
echo.

:: 首次运行自动安装依赖
if not exist "node_modules\" (
    echo   [1/2] 安装依赖...
    call npm install
    echo.
)

:: 构建前端（如果还没构建过）
if not exist "dist\index.html" (
    echo   [2/2] 构建前端...
    call npm run build
    echo.
)

echo   ▶ 启动中...
echo.
echo   浏览器打开: http://localhost:5678
echo   按 Ctrl+C 停止
echo.

start http://localhost:5678
node server.js
pause
