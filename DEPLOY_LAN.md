## 五之二、内网部署（无公网域名）

如果你的服务器只在局域网（LAN）中使用，不需要公网访问，可以跳过域名解析和 HTTPS 配置，部署流程大大简化。

### 适用场景

- 家庭实验室 / 内网开发环境
- 公司内部博客 / 知识库
- 测试环境
- 本地虚拟机 / 树莓派

### 5.1 环境准备

与公网部署相同，确保已安装 Node.js 和 Nginx：

```bash
sudo apt update && sudo apt install -y nginx curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 5.2 克隆仓库

```bash
sudo mkdir -p /var/www
cd /var/www
sudo git clone https://github.com/Xiaji-yu/lightblog.git .
sudo chown -R $USER:$USER /var/www
cd blog
```

### 5.3 部署 LightBlog

```bash
cd blog/api
npm install
cp .env.example .env
nano .env
```

`.env` 配置（内网环境不需要 `NODE_ENV=production`，避免强制 HTTPS）：

```env
SESSION_SECRET=<SECRET_2b96a1b5>m32
ADMIN_PASSWORD=your_admin_password
SUPERADMIN_PASSWORD=your_superadmin_password
PORT=3000
DISABLE_STATIC=true
```

### 5.4 配置 Nginx（内网模式）

复制 Nginx 配置：

```bash
sudo cp ../../nginx.conf /etc/nginx/sites-available/blog
sudo nano /etc/nginx/sites-available/blog
```

修改 `server_name` 为内网地址：

```nginx
server_name 192.168.1.100;  # 改为你的服务器内网 IP
```

内网部署的 Nginx 配置不需要 HTTPS，HTTP 即可：

```nginx
server {
    listen 80;
    server_name 192.168.1.100;  # 你的内网 IP
    root /var/www/zhuye/static;  # 指向 zhuye 静态文件
    index index.html;

    access_log /var/log/nginx/blog-access.log;
    error_log /var/log/nginx/blog-error.log;

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location ~* \.html$ {
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
    }

    # 个人主页
    location / {
        try_files $uri $uri/ @zhuye;
    }

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

启用 Nginx 站点：

```bash
sudo ln -sf /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 5.5 配置 zhuye

```bash
cd /var/www/blog/zhuye/api
npm install
cp .env.example .env
nano .env
```

`.env` 配置：

```env
ROUTER_PASSWORD=<SECRET_4a7b77a4>
NAS_PASSWORD=<SECRET_2b87cb9d>
CLOUD_PASSWORD=<SECRET_2b87cb9d>
OPENCLAW_PASSWORD=<SECRET_2b87cb9d>
PORT=3000
BLOG_SERVICE_URL=http://localhost:3000
```

### 5.6 配置 Systemd 服务

**zhuye 服务**（内网部署中 zhuye 使用 3000 端口，blog 不单独启动）：

```bash
sudo nano /etc/systemd/system/zhuye.service
```

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

### 5.7 内网访问

浏览器访问 `http://192.168.1.100`（替换为你的内网 IP）。

如果需要在同一台机器上本地开发测试，也可以直接启动 blog 服务：

```bash
# 终端 1：启动 blog（端口 3000）
cd /var/www/blog/api
node server.js

# 终端 2：启动 zhuye（端口 3001，通过环境变量区分）
cd /var/www/blog/zhuye/api
PORT=3001 BLOG_SERVICE_URL=http://localhost:3000 node server.js
```

然后访问：
- 博客主页：`http://localhost:3000`
- 个人主页：`http://localhost:3001`

> ⚠️ **注意**：生产内网部署中，blog 和 zhuye 不能同时运行在 3000 端口。推荐使用上面的 Nginx 反向代理方案，由 zhuye 统一处理所有请求。

### 5.8 内网防火墙配置

如果启用了 UFW 防火墙，只需放行 HTTP 端口：

```bash
sudo ufw allow 22/tcp      # SSH（可选，用于远程管理）
sudo ufw allow 80/tcp      # HTTP
sudo ufw enable
```

无需开放 443（HTTPS）或 3000（已被 Nginx 反向代理，外部无需直接访问）。

### 5.9 让局域网其他设备访问

确保服务器的防火墙允许 80 端口入站，然后在其他设备的浏览器中输入服务器内网 IP：

```
http://192.168.1.100
```

如果访问不了，检查以下几点：

1. **服务器防火墙**：`sudo ufw status` — 确认 80/tcp 已放行
2. **Nginx 状态**：`sudo systemctl status nginx` — 确认运行中
3. **zhuye 服务**：`sudo systemctl status zhuye` — 确认运行中
4. **本地防火墙**：客户端的防火墙是否允许访问外网
5. **路由器设置**：如果跨网段访问，确认路由器允许跨段通信

