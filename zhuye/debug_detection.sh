#!/bin/bash

# 服务器状态检测调试脚本
echo "========== 服务器检测调试 =========="
echo ""

# 1. 检查API服务器是否在运行
echo "1. 检查 API 服务器状态:"
ps aux | grep -E "node.*server.js" | grep -v grep || echo "   ❌ API 服务器未运行"
echo ""

# 2. 检查端口监听
echo "2. 检查端口监听状态:"
netstat -tlnp 2>/dev/null | grep :3000 || ss -tlnp 2>/dev/null | grep :3001 || echo "   ❌ 端口 3001 未监听"
echo ""

# 3. 测试本地连接
echo "3. 测试本地 API 连接:"
timeout 5 curl -s http://localhost:3000/api/server/status | head -c 500 || echo "   ❌ 无法连接到本地 API"
echo ""

# 4. 检查环境变量
echo "4. 检查 .env 文件:"
if [ -f "api/.env" ]; then
    echo "   ✅ .env 文件存在"
    echo "   密码配置状态:"
    grep -E "(ROUTER_PASSWORD|NAS_PASSWORD|CLOUD_PASSWORD|OPENCLAW_PASSWORD)" api/.env | while read line; do
        if echo "$line" | grep -q "^.*=.$" || echo "$line" | grep -q "^.*=$"; then
            echo "   ❌ $line (密码为空或未设置)"
        else
            value=$(echo "$line" | cut -d'=' -f2)
            if [ "$value" = "Yll@2468" ] || [ "$value" = "0621" ]; then
                echo "   ⚠️  $line (使用默认密码，可能不安全)"
            else
                echo "   ✅ $line (已配置)"
            fi
        fi
    done
else
    echo "   ❌ .env 文件不存在"
fi
echo ""

# 5. 测试目标服务器连接
echo "5. 测试目标服务器 SSH 端口连通性:"
echo "   testing router (home.xiaji.xin:22)..."
timeout 5 nc -zv home.xiaji.xin 22 2>&1
echo "   testing nas (home.xiaji.xin:7999)..."
timeout 5 nc -zv home.xiaji.xin 7999 2>&1
echo "   testing cloud (xiaji.xin:22)..."
timeout 5 nc -zv xiaji.xin 22 2>&1
echo "   testing openclaw (home.xiaji.xin:6999)..."
timeout 5 nc -zv home.xiaji.xin 6999 2>&1
echo ""

# 6. 检查 Node.js 依赖
echo "6. 检查 Node.js 依赖:"
if [ -d "api/node_modules/ssh2" ]; then
    echo "   ✅ ssh2 模块已安装"
else
    echo "   ❌ ssh2 模块未安装"
fi
echo ""

# 7. 查看最近的错误日志
echo "7. 查看 API 日志 (最近20行):"
if [ -f "logs/api.log" ]; then
    tail -20 logs/api.log
else
    echo "   未找到日志文件"
fi
echo ""

echo "========== 调试完成 =========="
