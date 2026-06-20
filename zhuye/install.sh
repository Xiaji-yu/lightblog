#!/bin/bash

# 个人主页安装脚本

echo "=================================="
echo "  个人主页安装向导"
echo "=================================="
echo ""

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js (https://nodejs.org/)"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"
echo ""

# 安装依赖
echo "📦 正在安装依赖..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ 依赖安装完成"
else
    echo "❌ 依赖安装失败"
    exit 1
fi

echo ""

# 检查.env文件
if [ ! -f .env ]; then
    echo "⚠️  未找到 .env 文件"
    echo "正在从示例创建..."
    cp .env.example .env
    echo "✅ 已创建 .env 文件"
    echo ""
    echo "📝 请编辑 .env 文件，填入服务器密码："
    echo "   ROUTER_PASSWORD=0621"
    echo "   NAS_PASSWORD=Yll@2468"
    echo "   CLOUD_PASSWORD=Yll@2468"
    echo "   OPENCLAW_PASSWORD=Yll@2468"
    echo ""
else
    echo "✅ 找到 .env 文件"
fi

echo ""
echo "=================================="
echo "  安装完成！"
echo "=================================="
echo ""
echo "下一步："
echo "1. 编辑 .env 文件，填入服务器密码"
echo "2. 运行 'npm start' 启动服务器"
echo "3. 访问 http://localhost:3000"
echo ""
