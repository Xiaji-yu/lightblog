---
title: LightBlog 部署指南
date: 2026-06-15
category: 运维
cover: article3.jpg
excerpt: 从购买服务器到上线运行，完整记录 LightBlog 在 Linux 生产环境的部署流程。
---

# LightBlog 部署指南

本文介绍如何在 Linux 服务器上部署 LightBlog，使用 Nginx + Systemd 实现生产级运行。

## 环境要求

- **操作系统**：Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- **Node.js**：v14+
- **Nginx**：任意稳定版本

## 第一步：安装 Node.js

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 验证
node --version
```

## 第二步：克隆项目

```bash
sudo mkdir -p /var/www
cd /var/www
git clone https://github.com/Xiaji-yu/lightblog.git blog
cd blog/api
npm install --production
```

## 第三步：配置环境变量

```bash
cp .env.example .env
nano .env
```

关键配置：

```ini
PORT=3000
DISABLE_STATIC=true
SESSION_SECRET=你的随机密钥
NODE_ENV=production
```

## 第四步：配置 Nginx

```bash
sudo cp ../nginx.conf /etc/nginx/sites-available/blog
sudo ln -s /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 第五步：配置 Systemd

```bash
sudo cp ../blog.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now blog
```

## 验证

```bash
sudo systemctl status blog
curl http://localhost:3000/api/articles
```

## 启用 HTTPS

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 日常维护

```bash
# 查看日志
sudo journalctl -u blog -f

# 重启服务
sudo systemctl restart blog

# 备份数据
tar -czf backup-$(date +%Y%m%d).tar.gz app-data/
```

---

部署完成后访问 `https://your-domain.com` 即可看到你的博客！