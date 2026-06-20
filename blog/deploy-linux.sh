#!/bin/bash

# Blog 项目手动部署脚本（Linux）
# 此脚本辅助完成部署，但不是全自动
# 请按步骤操作，脚本会提示你需要做的事情

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Blog 项目 Linux 部署助手${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 检查是否为 root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}[错误] 部分操作需要 root 权限，请使用 sudo 运行${NC}"
   exit 1
fi

# 1. 检查 Node.js
echo -e "${YELLOW}[1/7] 检查 Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}[错误] 未安装 Node.js${NC}"
    echo "请先安装: https://nodejs.org/"
    exit 1
fi
echo "Node.js 版本: $(node --version)"
echo "✓ 检查通过"
echo ""

# 2. 检查 Nginx
echo -e "${YELLOW}[2/7] 检查 Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}[警告] 未安装 Nginx，请先安装${NC}"
    echo "Ubuntu/Debian: sudo apt install nginx"
    echo "CentOS/RHEL: sudo yum install nginx"
    exit 1
fi
echo "Nginx 版本: $(nginx -v 2>&1)"
echo "✓ 检查通过"
echo ""

# 3. 确认目录结构
echo -e "${YELLOW}[3/7] 检查目录结构...${NC}"
if [ ! -d "static" ] || [ ! -d "api" ]; then
    echo -e "${RED}[错误] 目录结构不正确${NC}"
    echo "确保以下目录存在："
    echo "  ./static/   (静态文件)"
    echo "  ./api/      (Node.js应用)"
    exit 1
fi
echo "✓ 目录结构正确"
echo ""

# 4. 安装依赖
echo -e "${YELLOW}[4/7] 安装 Node.js 依赖...${NC}"
cd api
if [ ! -d "node_modules" ]; then
    npm install --production
    echo "✓ 依赖安装完成"
else
    echo "✓ node_modules 已存在，跳过安装"
fi
cd ..
echo ""

# 5. 配置环境变量
echo -e "${YELLOW}[5/7] 检查环境变量配置...${NC}"
if [ ! -f "api/.env" ]; then
    echo -e "${YELLOW}[警告] 未找到 api/.env 文件${NC}"
    if [ -f "api/.env.example" ]; then
        echo "正在从示例创建..."
        cp api/.env.example api/.env
        echo -e "${YELLOW}[重要] 请编辑 api/.env 文件，至少设置 SESSION_SECRET${NC}"
        echo "     nano api/.env"
    else
        echo -e "${RED}[错误] 未找到 api/.env.example${NC}"
        exit 1
    fi
else
    echo "✓ .env 文件已存在"
fi
echo ""

# 6. 配置 Nginx
echo -e "${YELLOW}[6/7] 配置 Nginx...${NC}"
NGINX_CONF="/etc/nginx/sites-available/blog"

# 检查配置文件是否存在
if [ ! -f "nginx.conf" ]; then
    echo -e "${RED}[错误] 当前目录下未找到 nginx.conf${NC}"
    exit 1
fi

# 询问是否覆盖
if [ -f "$NGINX_CONF" ]; then
    echo -e "${YELLOW}[警告] $NGINX_CONF 已存在${NC}"
    read -p "是否覆盖? (yes/no): " -r
    if [[ ! $REPLY =~ ^yes$ ]]; then
        echo "跳过 Nginx 配置"
        echo ""
        SKIP_NGINX=true
    fi
fi

# 如果未跳过，则复制配置
if [ "$SKIP_NGINX" != "true" ]; then
    # 复制并更新路径
    echo "正在复制 nginx 配置..."
    cp nginx.conf "$NGINX_CONF"

    # 更新静态文件路径
    STATIC_PATH="$(pwd)/static"
    echo "静态文件路径: $STATIC_PATH"
    sed -i.bak "s|root /var/www/blog/static;|root $STATIC_PATH;|g" "$NGINX_CONF" 2>/dev/null || true

    # 启用站点
    ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/blog

    # 测试配置
    if nginx -t; then
        systemctl reload nginx || nginx -s reload
        echo "✓ Nginx 配置完成"
    else
        echo -e "${RED}[错误] Nginx 配置测试失败${NC}"
        exit 1
    fi
fi
echo ""

# 7. 配置 Systemd
echo -e "${YELLOW}[7/7] 配置 Systemd 服务...${NC}"
SERVICE_FILE="/etc/systemd/system/blog.service"

if [ -f "$SERVICE_FILE" ]; then
    echo -e "${YELLOW}[警告] $SERVICE_FILE 已存在${NC}"
    read -p "是否覆盖? (yes/no): " -r
    if [[ ! $REPLY =~ ^yes$ ]]; then
        echo "跳过 Systemd 配置"
        echo ""
    else
        cp blog.service "$SERVICE_FILE"
        systemctl daemon-reload
        echo "✓ Systemd 服务文件已更新"
    fi
else
    cp blog.service "$SERVICE_FILE"
    systemctl daemon-reload
    echo "✓ Systemd 服务文件已创建"
fi
echo ""

# 8. 设置权限
echo -e "${YELLOW}[8/8] 设置目录权限...${NC}"
chown -R www-data:www-data "$(pwd)/static" 2>/dev/null || true
chmod -R 755 "$(pwd)/static"
chown -R www-data:www-data "$(pwd)/api/app-data" 2>/dev/null || true
chmod -R 750 "$(pwd)/api/app-data"
echo "✓ 权限设置完成"
echo ""

# 9. 启动服务
echo -e "${YELLOW}[9/9] 启动服务...${NC}"
systemctl enable blog
systemctl start blog
sleep 2

if systemctl is-active --quiet blog; then
    echo -e "${GREEN}✓ 服务启动成功${NC}"
else
    echo -e "${RED}✗ 服务启动失败${NC}"
    echo "查看日志: journalctl -u blog -f"
    exit 1
fi
echo ""

# 完成
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "访问地址:"
echo "  主页: http://$(hostname -I | awk '{print $1}')/"
echo "  后台: http://$(hostname -I | awk '{print $1}')/admin.html"
echo "  API:  http://$(hostname -I | awk '{print $1}')/api/articles"
echo ""
echo "常用命令:"
echo "  查看状态: systemctl status blog"
echo "  查看日志: journalctl -u blog -f"
echo "  重启服务: systemctl restart blog"
echo "  重启Nginx: systemctl reload nginx"
echo ""
echo -e "${YELLOW}重要:${NC}"
echo "1. 确保已修改 nginx.conf 中的 server_name"
echo "2. 务必修改 api/.env 中的 SESSION_SECRET"
echo "3. 建议配置 HTTPS (sudo certbot --nginx)"
echo ""
