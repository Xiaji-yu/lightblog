# 部署教程

本教程指导你从零开始将 LightBlog 和个人主页（zhuye）部署到 Linux 服务器上，实现公网访问。

## 📋 目录

- [一、环境要求](#一环境要求)
- [二、服务器准备](#二服务器准备)
- [三、部署 LightBlog](#三部署-lightblog)
- [四、部署个人主页（zhuye）](#四部署个人主页zhuye)
- [五、配置域名和 HTTPS](#五配置域名和-https)
- [五之二、内网部署（无公网域名）](./DEPLOY_LAN.md)
- [六、日常维护](#六日常维护)
- [七、故障排查](#七故障排查)

---

## 一、环境要求

| 组件 | 最低版本 | 说明 |
|------|----------|------|
| Ubuntu/Debian | 20.04+ | 推荐 Ubuntu 22.04 LTS |
| Node.js | 18.x+ | 建议使用 Node.js 20.x LTS |
| Nginx | 1.18+ | 反向代理和静态文件服务 |
| npm | 9+ | 随 Node.js 一起安装 |
| 域名 | — | 已解析到服务器 IP |

### 推荐的云服务器配置

- **CPU**：1核
- **内存**：1GB
- **硬盘**：20GB
- **带宽**：3Mbps+

> 对于个人博客和主页，最低配置即可流畅运行。

---

## 二、服务器准备

### 2.1 更新系统

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git ufw
```

### 2.2 安装 Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node --version   # 应显示 v20.x.x
npm --version    # 应显示 10.x.x
```

### 2.3 安装 Nginx

```bash
sudo apt install -y nginx

# 验证安装
nginx -v
sudo systemctl enable --now nginx
```

### 2.4 配置防火墙

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 2.5 克隆仓库

```bash
sudo mkdir -p /var/www
cd /var/www
sudo git clone https://github.com/Xiaji-yu/lightblog.git .
sudo chown -R $USER:$USER /var/www
```

---

## 三、部署 LightBlog

### 3.1 安装依赖

```bash
cd /var/www/blog/api
npm install
```

### 3.2 配置环境变量

```bash
cp .env.example .env
nano .env
```

编辑 `.env` 文件，**必须修改以下内容**：

```env
# ===== 必须修改 =====
SESSION_SECRET=<SECRET_2b96a1b5>m32  # 运行: openssl rand -hex 32
ADMIN_PASSWORD=your_secure_password      # 设置管理员密码
SUPERADMIN_PASSWORD=your_secure_password # 设置超级管理员密码
NODE_ENV=production

# ===== 按需修改 =====
PORT=3000
DISABLE_STATIC=true
```

> ⚠️ **安全提醒**：`SESSION_SECRET` 必须设置，生产环境禁用时 Express 不会生成随机密钥，服务会直接拒绝启动。

### 3.3 配置 Nginx

```bash
sudo cp ../../nginx.conf /etc/nginx/sites-available/blog
```

编辑 Nginx 配置，修改 `server_name`：

```bash
sudo nano /etc/nginx/sites-available/blog
```

找到这一行并修改为你的域名：

```nginx
server_name your-domain.com www.your-domain.com;  # 改为你的域名
```

启用站点并测试配置：

```bash
sudo ln -sf /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/
sudo nginx -t
```

如果显示 `test is successful`，则重载 Nginx：

```bash
sudo systemctl reload nginx
```

### 3.4 配置 Systemd 服务

```bash
sudo cp ../../blog.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now blog
```

验证服务是否正常运行：

```bash
sudo systemctl status blog
```

应该看到 `active (running)` 状态。

### 3.5 查看日志

```bash
# 实时查看日志
sudo journalctl -u blog -f

# 查看最近的日志
sudo journalctl -u blog --since "10 minutes ago"
```

### 3.6 首次访问

1. 浏览器访问 `http://your-domain.com`
2. 点击「登录」
3. 使用你设置的 `ADMIN_PASSWORD` 登录
4. 登录后访问后台 `http://your-domain.com/admin.html`

> 💡 如果你没有设置 `ADMIN_PASSWORD`，系统会自动生成一个随机密码，查看日志获取：
> ```bash
> sudo journalctl -u blog --since "5 minutes ago" | grep "初始密码"
> ```

---

## 四、部署个人主页（zhuye）

个人主页和博客部署在同一台服务器上，共用 Nginx 做反向代理。

### 4.1 安装依赖

```bash
cd /var/www/blog/zhuye/api
npm install
```

### 4.2 配置环境变量

```bash
cp .env.example .env
nano .env
```

编辑 `.env`：

```env
# 服务器密码（用于 SSH 检测服务器状态）
ROUTER_PASSWORD=<SECRET_7a4a56f8>
NAS_PASSWORD=<SECRET_33167e60>
CLOUD_PASSWORD=<SECRET_33167e60>
OPENCLAW_PASSWORD=<SECRET_33167e60>

# 服务端口
PORT=3000

# 博客服务地址（zhuye 通过代理转发请求到 blog）
BLOG_SERVICE_URL=http://localhost:3000
```

> 📝 关于 `BLOG_SERVICE_URL`：
> - 同一台服务器上部署：`http://localhost:3000`
> - blog 在其他服务器上：`http://blog-server-ip:3000`（确保网络可达）

### 4.3 配置 Nginx

在同一个 Nginx 配置文件中添加 zhuye 的反向代理规则。编辑 `/etc/nginx/sites-available/blog`：

```nginx
# 在 blog 配置的 /api/ 代理后面，添加：

# zhuye 个人主页代理
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

或者，如果你想用子路径访问个人主页，可以配置为：

```nginx
location /home/ {
    rewrite ^/home/(.*)$ /$1 break;
    proxy_pass http://localhost:3000;
    ...
}
```

> ⚠️ **注意**：如果 blog 和 zhuye 都运行在 3000 端口，不能同时启动。生产环境中，zhuye 通过 Nginx 的反向代理将 `/` 路径转发到个人主页，将 `/api/` 路径转发到 blog。

完整的 Nginx 配置方案（blog + zhuye 合一）：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/zhuye/static;
    index index.html;

    access_log /var/log/nginx/blog-access.log;
    error_log /var/log/nginx/blog-error.log;

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # HTML 文件
    location ~* \.html$ {
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
    }

    # 个人主页（根路径由 zhuye 的 Nginx root 提供）
    location / {
        try_files $uri $uri/ @zhuye;
    }

    # 转发到 zhuye
    location @zhuye {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Blog API 代理
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_pass_header Set-Cookie;
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### 4.4 配置 Systemd 服务

```bash
# 停止 blog 服务（如果正在运行），让 zhuye 接管 3000 端口
sudo systemctl stop blog

# 创建 zhuye 服务文件
sudo nano /etc/systemd/system/zhuye.service
```

写入以下内容：

```ini
[Unit]
Description=Personal Homepage (zhuye)
After=network.target
Wants=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/blog/zhuye/api
EnvironmentFile=/var/www/blog/zhuye/api/.env
ExecStart=/usr/bin/node /var/www/blog/zhuye/api/server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=zhuye

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now zhuye
sudo systemctl status zhuye
```

### 4.5 博客文章联动验证

zhuye 通过代理请求 blog API 获取文章列表：

```
浏览器 → Nginx → zhuye:3000/api/articles → blog:3000/api/articles
```

验证文章加载：

```bash
# 检查 zhuye 代理是否正常
curl http://localhost:3000/api/articles

# 应该返回 JSON 格式的文章列表
```

在浏览器中访问主页，确认「最新文章」模块正常显示文章。

---

## 五、配置域名和 HTTPS

### 5.1 DNS 解析

在你的域名服务商处添加 A 记录：

```
类型: A
名称: @
值: 你的服务器 IP
TTL: 600
```

添加 `www` 子域名（可选）：

```
类型: A
名称: www
值: 你的服务器 IP
TTL: 600
```

### 5.2 验证域名解析

```bash
dig your-domain.com
# 或
ping your-domain.com
```

确认返回的 IP 与你的服务器一致。

### 5.3 配置 HTTPS

使用 Let's Encrypt 免费证书：

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

按照提示输入邮箱，同意服务条款。Certbot 会自动：

1. 申请并安装 SSL 证书
2. 修改 Nginx 配置启用 HTTPS
3. 设置 HTTP 到 HTTPS 的自动跳转
4. 配置证书自动续期

### 5.4 验证 HTTPS

```bash
# 测试 HTTPS 连接
curl -I https://your-domain.com

# 应看到 200 状态码和证书信息
```

浏览器访问 `https://your-domain.com`，确认地址栏有锁形标志。

### 5.5 强制 HTTPS（可选）

确保 Nginx 配置中有 HTTP 到 HTTPS 的跳转。Certbot 会自动添加，手动配置如下：

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$host$request_uri;
}
```

---

## 六、日常维护

### 6.1 服务管理

```bash
# 查看服务状态
sudo systemctl status blog
sudo systemctl status zhuye
sudo systemctl status nginx

# 重启服务
sudo systemctl restart blog
sudo systemctl restart zhuye
sudo systemctl restart nginx

# 查看日志
sudo journalctl -u blog -f          # blog 实时日志
sudo journalctl -u zhuye -f         # zhuye 实时日志
sudo tail -f /var/log/nginx/error.log  # Nginx 错误日志
```

### 6.2 文章管理

```bash
# 在服务器上直接创建文章（示例）
cd /var/www/blog/api/app-data/md

# 写入 Markdown 文件
cat > my-new-post.md << 'EOF'
---
title: 我的新文章
date: 2026-06-20
category: 生活
cover: article1.jpg
excerpt: 这是一篇新文章的描述。
---

# 我的新文章

正文内容...
EOF

# 重启 blog 服务以加载新文章
sudo systemctl restart blog
```

> 更推荐的方式是通过 Web 管理后台 (`/admin.html`) 创建和管理文章。

### 6.3 数据备份

```bash
# 备份文章和用户数据
sudo tar -czf /root/backup-$(date +%Y%m%d).tar.gz \
  /var/www/blog/api/app-data/

# 定期自动备份（添加 crontab）
sudo crontab -e

# 每天凌晨 3 点自动备份
0 3 * * * tar -czf /root/backup-$(date +\%Y\%m\%d).tar.gz /var/www/blog/api/app-data/ && find /root/backup-*.tar.gz -mtime +7 -delete
```

### 6.4 更新代码

```bash
cd /var/www
sudo git pull origin master
cd blog/api
npm install --production
sudo systemctl restart blog
```

如果 zhuye 也有更新：

```bash
cd /var/www/blog/zhuye/api
npm install
sudo systemctl restart zhuye
```

### 6.5 日志清理

```bash
# 清理 7 天前的应用日志
cd /var/www
bash cleanup-logs.sh

# 清理 Nginx 旧日志
sudo truncate -s 0 /var/log/nginx/blog-access.log
sudo truncate -s 0 /var/log/nginx/blog-error.log
```

---

## 七、故障排查

### 问题：博客访问显示 502 Bad Gateway

**原因**：blog 服务未运行或 Nginx 无法连接到后端。

**解决**：
```bash
# 检查 blog 服务
sudo systemctl status blog

# 如果未运行，启动服务
sudo systemctl start blog

# 检查 3000 端口是否在监听
curl http://localhost:3000/api/articles
```

### 问题：文章列表不显示 / 显示加载失败

**可能原因**：

1. **zhuye 的 `BLOG_SERVICE_URL` 配置错误**
   ```bash
   # 检查 zhuye 的 .env
   cat /var/www/blog/zhuye/api/.env | grep BLOG_SERVICE_URL
   # 应为: BLOG_SERVICE_URL=http://localhost:3000
   ```

2. **blog 的 `/api/articles` 接口异常**
   ```bash
   curl -s http://localhost:3000/api/articles | head
   ```

3. **防火墙未放行端口**
   ```bash
   sudo ufw status
   sudo ufw allow 3000/tcp  # 仅开发时需要，生产环境用 Nginx 代理
   ```

### 问题：Nginx 显示 404

**原因**：静态文件路径配置错误。

**解决**：
```bash
# 检查 Nginx 配置中的 root 路径
sudo nginx -T | grep root

# 确保路径指向 zhuye/static 或 blog/static
```

### 问题：登录后立即被踢出

**原因**：`SESSION_SECRET` 在每次重启时重新生成。

**解决**：在 `.env` 中设置固定的 `SESSION_SECRET`：

```bash
openssl rand -hex 32
# 复制输出结果到 .env 的 SESSION_SECRET
sudo systemctl restart blog
```

### 问题：HTTPS 证书过期

**解决**：
```bash
# 手动续期
sudo certbot renew

# Certbot 会自动设置定时任务续期，检查状态
sudo certbot certificates
```

### 问题：Systemd 服务启动失败

**查看详细错误**：
```bash
sudo journalctl -u blog -n 50 --no-pager
# 或
sudo journalctl -u zhuye -n 50 --no-pager
```

常见原因：
- 端口被占用 → `sudo ss -tlnp | grep 3000`
- 权限不足 → `sudo chown -R www-data:www-data /var/www/blog/api/app-data`
- `.env` 文件不存在或格式错误 → `cat /var/www/blog/api/.env`

### 问题：SSH 服务器检测显示"检测失败"

**可能原因**：
1. 目标服务器未开机或断网
2. SSH 服务未运行（`systemctl status sshd`）
3. 密码错误（检查 `.env` 中的 `*_PASSWORD`）
4. 防火墙阻止了 SSH 端口（默认 22，NAS 是 2222，OpenClaw 是 3333）

---

## 📚 相关文档

- [LightBlog API 文档](../blog/api/API_DOCUMENTATION.md)
- [部署脚本](../blog/deploy-linux.sh)
- [项目说明](../README_zh.md)
- [个人主页文档](../zhuye/README.md)
