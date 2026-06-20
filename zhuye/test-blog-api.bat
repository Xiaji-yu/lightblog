@echo off
chcp 65001 >nul
title Blog-Box 测试脚本
color 0E

echo ========================================
echo    Zhuye Blog-Box 功能测试
echo ========================================
echo.

:: 检查zhuye服务
echo [1/3] 检查zhuye服务 (端口3000)...
curl -s http://localhost:3000/api/articles >nul 2>nul
if errorlevel 1 (
    echo   ❌ zhuye服务未运行或无法访问
    echo   请先启动zhuye服务: cd D:\code\www\zhuye\api && node server.js
    goto :error
) else (
    echo   ✓ zhuye服务运行正常
)

:: 测试代理API
echo.
echo [2/3] 测试代理API响应...
curl -s http://localhost:3000/api/articles >temp_response.json 2>nul
if errorlevel 1 (
    echo   ❌ API请求失败
    goto :error
) else (
    echo   ✓ API响应已保存到 temp_response.json
)

:: 检查响应数据
echo.
echo [3/3] 检查响应数据...
type temp_response.json | findstr "id" >nul
if errorlevel 1 (
    echo   ⚠️ 响应中未找到文章数据
    echo   响应内容:
    type temp_response.json
) else (
    echo   ✓ 响应包含文章数据
    for /f %%i in ('type temp_response.json ^| findstr /c:"id" /c:"title" /c:"date"') do echo   %%i
)

:: 清理
if exist "temp_response.json" del temp_response.json

echo.
echo ========================================
echo    测试完成！
echo ========================================
echo.
echo 下一步：
echo   1. 确保blog服务运行在端口3000
echo   2. 访问 http://localhost:3000
echo   3. 查看页面下方的blog-box是否显示文章
echo.
echo 代理架构：
echo   zhuye:3000/api/articles → blog:3000/api/articles (公开接口，无需Token)
echo.
pause
exit /b 0

:error
echo.
if exist "temp_response.json" del temp_response.json
echo ========================================
echo    测试失败
echo ========================================
echo.
pause
exit /b 1
