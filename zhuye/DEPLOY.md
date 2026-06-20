# 部署指南

## 方案概述

采用 **Nginx + Node.js** 分离架构：
- **Nginx**: 提供静态文件服务，反向代理 API 请求
- **Node.js**: 仅提供 API 接口（服务器状态检测）

## 目录结构

```
zhuye/
├── static/              # 静态文件（由 nginx 提供）
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── avatar.svg
├── api/                 # API 服务器（Node.js）
│   ├── server.js
│   ├── package.json
│   ├── node_modules/
│   └── .env (需自行创建)
├── nginx.conf           # Linux nginx 配置
├── nginx-windows.conf   # Windows nginx 配置
├── deploy.sh            # Linux 部署脚本
├── deploy.bat           # Windows 部署脚本
└── DEPLOY.md            # 本文件
```

---

## Linux 部署（Ubuntu/Debian/CentOS）

### 前置要求
- 已安装 Node.js (v14+)
- 已安装 Nginx

### 1. 上传文件到服务器

```bash
# 上传整个项目目录到服务器
scp -r /path/to/zhuye user@server:/home/user/
```

### 2. 配置 Nginx

```bash
# 复制配置文件
sudo cp nginx.conf /etc/nginx/sites-available/personal-page

# 编辑配置文件，修改 server_name
sudo nano /etc/nginx/sites-available/personal-page
# 将 "localhost 你的域名" 改为你的实际域名或IP

# 启用站点
sudo ln -sf /etc/nginx/sites-available/personal-page /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 nginx
sudo systemctl restart nginx
```

### 3. 准备静态文件

```bash
# 创建静态文件目录
sudo mkdir -p /var/www/static

# 复制静态文件（从项目目录的 static 文件夹）
sudo cp -r static/* /var/www/static/

# 设置权限
sudo chown -R www-data:www-data /var/www/static
sudo chmod -R 644 /var/www/static
```

### 4. 启动 Node.js API 服务器

```bash
# 进入 API 目录
cd api

# 安装依赖
npm install --production

# 启动服务器（后台运行）
nohup node server.js > api-server.log 2>&1 &

# 查看进程
ps aux | grep server.js

# 查看日志
tail -f api-server.log
```

### 5. 设置开机自启（可选）

创建 systemd 服务文件 `/etc/systemd/system/personal-page-api.service`：

```ini
[Unit]
Description=Personal Page API Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/zhuye/api
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启用并启动：
```bash
sudo systemctl daemon-reload
sudo systemctl enable personal-page-api
sudo systemctl start personal-page-api
sudo systemctl status personal-page-api
```

### 6. 配置防火墙

```bash
# 允许 HTTP
sudo ufw allow 80/tcp

# 如果需要 HTTPS
sudo ufw allow 443/tcp
```

---

## Windows 部署

### 前置要求
- 已安装 Node.js
- 已安装 Nginx for Windows

### 1. 复制文件

```powershell
# 创建静态文件目录
mkdir C:\nginx\html\static

# 复制静态文件（从项目的 static 文件夹）
copy static\* C:\nginx\html\static\
```

### 2. 配置 Nginx

编辑 `C:\nginx\conf\nginx.conf`，在 `http {}` 块末尾添加：

```nginx
server {
    listen 80;
    server_name localhost;
    root C:/nginx/html/static;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

或直接使用 `nginx-windows.conf` 的内容替换。

### 3. 启动 Nginx

```powershell
# 启动 nginx（如果尚未运行）
start nginx

# 或重启
nginx -s reload
```

### 4. 启动 Node.js API 服务器

```powershell
# 进入 API 目录
cd api

# 安装依赖
npm install --production

# 启动服务器
node server.js

# 或后台运行（使用 PowerShell）
Start-Process node -ArgumentList "server.js" -WindowStyle Hidden
```

### 5. 使用部署脚本（推荐）

```powershell
# 以管理员身份运行 PowerShell，然后执行：
.\deploy.bat
```

---

## HTTPS 配置（可选）

### 使用 Let's Encrypt（Linux）

```bash
# 安装 certbot
sudo apt install certbot python3-certbot-nginx  # Ubuntu/Debian
sudo yum install certbot python3-certbot-nginx  # CentOS/RHEL

# 获取证书
sudo certbot --nginx -d yourdomain.com

# 自动续期测试
sudo certbot renew --dry-run
```

### 手动配置 SSL（Windows/Linux）

在 nginx 配置中添加：

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    root /var/www/static;  # 或 C:/nginx/html/static
    index index.html;

    # ... 其他配置与 HTTP 相同

    # 强制 HTTPS
    if ($scheme != "https") {
        return 301 https://$host$request_uri;
    }
}
```

---

## 验证部署

1. **访问主页**: `http://yourdomain.com`
2. **检查 API**: `http://yourdomain.com/api/server/status`
3. **查看日志**:
   - Nginx: `sudo tail -f /var/log/nginx/access.log`
   - Node.js: `tail -f api/api-server.log` 或 `tail -f api-server.log`（取决于启动位置）

---

## 故障排查

### 1. 静态文件 404
- 检查 nginx `root` 路径是否正确：应为 `/var/www/static` (Linux) 或 `C:/nginx/html/static` (Windows)
- 检查文件是否存在：`ls -la /var/www/static/`
- 检查文件权限：`sudo chown -R www-data:www-data /var/www/static`
- 重启 nginx：`sudo systemctl restart nginx`

### 2. API 请求失败
- 确认 Node.js 服务器正在运行：`ps aux | grep server.js` 或 `cd api && ps aux | grep server.js`
- 检查 API 日志：`cd api && tail -f api-server.log`
- 测试本地 API：`curl http://localhost:3000/api/server/status`
- 检查 nginx 代理配置：`location /api/ { proxy_pass http://localhost:3000; }`
- 确认 API 运行在 3000 端口

### 3. 端口冲突
- 检查端口占用：`sudo netstat -tlnp | grep :80` 或 `netstat -ano | findstr :80` (Windows)
- 修改 nginx 监听端口或停止占用端口的服务

### 4. 目录结构不正确
确保项目结构如下：
```
zhuye/
├── static/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── avatar.svg
├── api/
│   ├── server.js
│   ├── package.json
│   └── node_modules/
└── deploy.sh / deploy.bat
```

---

## 文件清单

部署时需要以下文件：

### 静态文件（部署到 /var/www/static 或 C:\nginx\html\static）
- ✅ `static/index.html` - 主页
- ✅ `static/style.css` - 样式
- ✅ `static/script.js` - 前端脚本
- ✅ `static/avatar.svg` - 头像图片

### API 服务器（运行在 api/ 目录）
- ✅ `api/server.js` - API 服务器
- ✅ `api/package.json` - 依赖定义
- ✅ `api/node_modules/` - 依赖包（运行 npm install 后生成）

### 配置文件
- ✅ `nginx.conf` 或 `nginx-windows.conf` - nginx 配置
- ✅ `deploy.sh` / `deploy.bat` - 部署脚本

---

## 更新部署

1. **更新静态文件**: 替换 `/var/www/static/` 或 `C:\nginx\html\static\` 中的文件
2. **重启 nginx**: `sudo systemctl restart nginx`
3. **如需更新 API**:
   ```bash
   cd api
   git pull  # 或替换文件
   npm install --production
   kill $(cat ../api-server.pid)
   nohup node server.js > api-server.log 2>&1 &
   ```

---

## 联系支持

如有问题，请检查：
1. 防火墙是否开放 80/443 端口
2. 域名是否指向服务器 IP
3. 服务器安全组/防火墙规则
4. SELinux/AppArmor 是否阻止访问（Linux）
