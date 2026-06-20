@echo off
chcp 65001 >nul
echo ==================================
echo   个人主页安装向导
echo ==================================
echo.

REM 检查Node.js
where node >nul 2>nul
if errorlevel 1 (
    echo ❌ Node.js 未安装，请先安装 Node.js (https://nodejs.org/)
    pause
    exit /b 1
)

echo ✅ Node.js 已安装
node --version
echo.

REM 安装依赖
echo 📦 正在安装依赖...
call npm install

if errorlevel 1 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)

echo ✅ 依赖安装完成
echo.

REM 检查.env文件
if not exist .env (
    echo ⚠️  未找到 .env 文件
    echo 正在从示例创建...
    copy .env.example .env
    echo ✅ 已创建 .env 文件
    echo.
    echo 📝 请编辑 .env 文件，填入服务器密码：
    echo    ROUTER_PASSWORD=<SECRET_7a4a56f8>
    echo    NAS_PASSWORD=<SECRET_33167e60>
    echo    CLOUD_PASSWORD=<SECRET_33167e60>
    echo    OPENCLAW_PASSWORD=<SECRET_33167e60>
    echo.
) else (
    echo ✅ 找到 .env 文件
)

echo.
echo ==================================
echo   安装完成！
echo ==================================
echo.
echo 下一步：
echo 1. 编辑 .env 文件，填入服务器密码
echo 2. 运行 "npm start" 启动服务器
echo 3. 访问 http://localhost:3000
echo.
pause
