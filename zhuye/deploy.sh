#!/bin/bash

# 个人主页部署脚本

set -e

echo "========================================"
echo "  个人主页 - 部署脚本"
echo "========================================"
echo ""

# 脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
STATIC_SOURCE="$SCRIPT_DIR/static"
API_SOURCE="$SCRIPT_DIR/api"

# 检查是否以root权限运行（nginx需要）
if [[ $EUID -ne 0 ]]; then
   echo "⚠️  警告: 建议使用sudo运行此脚本以安装nginx"
   SUDO=""
else
   SUDO="sudo"
fi

# 1. 创建静态文件目录
echo "📁 创建静态文件目录..."
$SUDO mkdir -p /var/www/static

# 2. 复制静态文件
echo "📋 复制静态文件..."
if [ ! -d "$STATIC_SOURCE" ]; then
    echo "❌ 错误: 找不到 static 目录"
    exit 1
fi
$SUDO cp -r $STATIC_SOURCE/* /var/www/static/

# 3. 设置权限
echo "🔒 设置文件权限..."
$SUDO chown -R www-data:www-data /var/www/static 2>/dev/null || $SUDO chown -R nginx:nginx /var/www/static 2>/dev/null
$SUDO chmod -R 644 /var/www/static

# 4. 检测nginx配置目录
NGINX_CONF_DIR=""
if [ -d "/etc/nginx/sites-available" ]; then
    NGINX_CONF_DIR="/etc/nginx/sites-available"
elif [ -d "/etc/nginx/conf.d" ]; then
    NGINX_CONF_DIR="/etc/nginx/conf.d"
else
    echo "❌ 无法检测到nginx配置目录"
    exit 1
fi

# 5. 复制nginx配置
echo "⚙️  配置nginx..."
if [ "$NGINX_CONF_DIR" = "/etc/nginx/sites-available" ]; then
    $SUDO cp "$SCRIPT_DIR/nginx.conf" /etc/nginx/sites-available/personal-page
    $SUDO ln -sf /etc/nginx/sites-available/personal-page /etc/nginx/sites-enabled/
else
    $SUDO cp "$SCRIPT_DIR/nginx.conf" /etc/nginx/conf.d/personal-page.conf
fi

# 6. 测试nginx配置
echo "🧪 测试nginx配置..."
if ! $SUDO nginx -t; then
    echo "❌ nginx配置测试失败，请检查配置文件"
    exit 1
fi

# 7. 安装API依赖（如果还没有安装）
echo "📦 检查API依赖..."
if [ -d "$API_SOURCE/node_modules" ]; then
    echo "   依赖已安装"
else
    echo "📥 安装API依赖..."
    cd "$API_SOURCE"
    npm install --production
    cd "$SCRIPT_DIR"
fi

# 8. 启动Node.js API服务器
echo "🚀 启动Node.js API服务器..."
cd "$API_SOURCE"
nohup node server.js > api-server.log 2>&1 &
API_PID=$!
echo $API_PID > "$SCRIPT_DIR/api-server.pid"
echo "   API服务器PID: $API_PID"
echo "   日志文件: $API_SOURCE/api-server.log"

# 9. 重启nginx
echo "🔄 重启nginx..."
$SUDO systemctl restart nginx 2>/dev/null || $SUDO service nginx restart 2>/dev/null

echo ""
echo "========================================"
echo "✅ 部署完成！"
echo "========================================"
echo ""
echo "📁 目录结构:"
echo "   /var/www/static          # 静态文件"
echo "   $API_SOURCE             # API 服务器"
echo ""
echo "🌐 访问地址: http://localhost"
echo "📡 API地址: http://localhost:3000 (内部)"
echo ""
echo "📝 后续操作:"
echo "   1. 修改 nginx 配置文件中的 server_name 为你的域名"
echo "   2. 配置 SSL 证书（如果使用 HTTPS）"
echo "   3. 设置开机自启（可选）"
echo ""
echo "🛑 停止服务:"
echo "   kill \$(cat $SCRIPT_DIR/api-server.pid) && sudo systemctl stop nginx"
echo ""
