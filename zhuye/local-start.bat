@echo off
chcp 65001 >nul
echo ========================================
echo   本地开发服务器启动
echo ========================================
echo.

REM 检查 Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo ❌ 未找到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

REM 安装全局 http-server（用于静态文件）
echo 📦 检查并安装 http-server...
call npm list -g http-server >nul 2>&1
if errorlevel 1 (
    echo 正在安装 http-server...
    call npm install -g http-server
)

REM 安装 API 依赖
echo 📦 安装 API 依赖...
cd api
if exist "package.json" (
    call npm install
) else (
    echo ❌ 错误: api/package.json 不存在
    pause
    exit /b 1
)

REM 启动静态文件服务器（新窗口）
echo 📁 启动静态文件服务器...
start "静态文件服务器 (http://localhost:8080)" cmd /k "npx http-server static -p 8080 -c-1"

REM 等待2秒
timeout /t 2 /nobreak >nul

REM 启动 API 服务器（新窗口）
echo 🔌 启动 API 服务器...
start "API 服务器 (http://localhost:3000)" cmd /k "cd /d %cd% && node server.js"

echo.
echo ========================================
echo ✅ 服务启动完成！
echo ========================================
echo.
echo 🌐 主页地址: http://localhost:8080
echo 📡 API 地址: http://localhost:3000/api/server/status
echo.
echo 💡 说明:
echo   - 静态文件由 http-server 在端口 8080 提供
echo   - API 服务在端口 3000 运行
echo   - 两个窗口分别显示服务日志
echo   - 关闭窗口即停止对应服务
echo.
pause
