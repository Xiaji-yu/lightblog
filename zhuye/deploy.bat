@echo off
chcp 65001 >nul
echo ========================================
echo   个人主页 - Windows部署脚本
echo ========================================
echo.

REM 检查是否以管理员身份运行
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ⚠️  警告: 建议以管理员身份运行此脚本
    pause
)

REM 设置路径
set SCRIPT_DIR=%~dp0
set STATIC_DIR=%SCRIPT_DIR%static
set API_DIR=%SCRIPT_DIR%api

REM 1. 创建静态文件目录
echo 📁 创建静态文件目录...
if not exist "C:\nginx\html\static" mkdir "C:\nginx\html\static"

REM 2. 复制静态文件
echo 📋 复制静态文件...
if not exist "%STATIC_DIR%\index.html" (
    echo ❌ 错误: 找不到 static 目录
    pause
    exit /b 1
)
xcopy /Y "%STATIC_DIR%\*" "C:\nginx\html\static\"

REM 3. 复制nginx配置
echo ⚙️  配置nginx...
if exist "C:\nginx\conf\nginx.conf" (
    echo 📝 请手动编辑 C:\nginx\conf\nginx.conf，添加以下配置:
    echo.
    echo server {
    echo     listen 80;
    echo     server_name localhost;
    echo     root C:/nginx/html/static;
    echo     index index.html;
    echo.
    echo     location /api/ {
    echo         proxy_pass http://localhost:3000;
    echo         proxy_set_header Host $host;
    echo     }
    echo }
    echo.
    echo 或直接复制 nginx-windows.conf 到 C:\nginx\conf\nginx.conf 末尾
) else (
    echo ❌ 无法检测到nginx安装目录
)

REM 4. 安装API依赖
echo 📦 安装API依赖...
cd /d "%API_DIR%"
if exist "package.json" (
    call npm install --production
) else (
    echo ❌ 错误: 找不到 api/package.json
    pause
    exit /b 1
)

REM 5. 启动Node.js API服务器
echo 🚀 启动Node.js API服务器...
start /B node server.js
echo    API服务器已启动 (后台运行)
echo    API目录: %API_DIR%

REM 6. 重启nginx
echo 🔄 重启nginx...
if exist "C:\nginx\nginx.exe" (
    C:\nginx\nginx.exe -s reload
) else (
    echo ⚠️  请手动重启nginx
)

echo.
echo ========================================
echo ✅ 部署完成！
echo ========================================
echo.
echo 📁 目录结构:
echo    C:\nginx\html\static    # 静态文件
echo    %API_DIR%              # API 服务器
echo.
echo 🌐 访问地址: http://localhost
echo 📡 API地址: http://localhost:3000 (内部)
echo.
echo 📝 后续操作:
echo   1. 修改 nginx 配置中的 server_name 为你的域名
echo   2. 如果需要 HTTPS，配置 SSL 证书
echo.
pause
