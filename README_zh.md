# LightBlog 中文文档

一个轻量级、零数据库的博客系统，基于 Node.js 和 Markdown 构建。

## ✨ 功能特性

- 📝 **Markdown 优先** — 所有文章均为 `.md` 文件，附带 YAML Front Matter
- 🔐 **安全认证** — Session + Bearer Token 双认证，bcrypt 密码哈希
- 🎨 **暗色模式** — 系统感知的主题切换，支持手动切换
- 📱 **响应式设计** — 适配桌面、平板和手机
- ⚡ **生产就绪** — 内置 Nginx 反向代理 + Systemd 服务配置
- 🏷️ **分类与标签** — 灵活的文章组织方式
- 📖 **时间线视图** — 按时间顺序浏览所有文章
- 🔧 **管理后台** — 完整 CRUD、Markdown 导入、Token 管理
- 🛡️ **XSS 防护** — 服务端 DOMPurify HTML 清洗

## 🚀 快速开始

```bash
# 克隆仓库
git clone https://github.com/Xiaji-yu/lightblog.git
cd lightblog/blog/api

# 安装依赖
npm install

# 启动服务器
node server.js
```

浏览器访问 `http://localhost:3000`。

> **首次运行**：会自动导入 3 篇示例文章。管理员凭据会打印在控制台 — 请务必保存！

## 📁 项目结构

```
lightblog/
├── LICENSE
├── README.md                        # 英文文档
├── README_zh.md                     # 中文文档（本文件）
├── .gitignore
├── cleanup-logs.sh                  # 日志清理脚本
│
├── blog/                            # 博客核心
│   ├── api/
│   │   ├── server.js                # Express 应用（所有路由）
│   │   ├── package.json
│   │   ├── .env.example             # 环境变量模板
│   │   ├── API_DOCUMENTATION.md     # 完整 API 文档
│   │   ├── seed/                    # 示例文章（首次运行自动导入）
│   │   │   ├── welcome-to-lightblog.md
│   │   │   ├── markdown-guide.md
│   │   │   └── deployment-guide.md
│   │   └── app-data/                # 运行数据（gitignore）
│   │       ├── md/                  # Markdown 文章
│   │       ├── users.json           # 用户账户
│   │       └── article-id-map.json  # 文章 ID 映射
│   ├── static/                      # 前端页面（生产环境由 Nginx 提供）
│   │   ├── index.html               # 首页
│   │   ├── admin.html               # 管理后台
│   │   ├── login.html               # 登录页
│   │   ├── article.html             # 文章详情页
│   │   ├── timeline.html            # 时间线视图
│   │   ├── css/
│   │   │   ├── style.css            # 主页样式（毛玻璃效果、暗色模式）
│   │   │   ├── admin.css            # 后台样式
│   │   │   └── login.css            # 登录页样式
│   │   ├── js/
│   │   │   ├── script.js            # 首页逻辑
│   │   │   ├── admin.js             # 后台 CRUD 与 Token 管理
│   │   │   ├── login.js             # 认证逻辑
│   │   │   └── article.js           # 文章渲染
│   │   └── images/                  # 封面图片
│   ├── deploy-linux.sh              # Linux 自动部署脚本
│   ├── nginx.conf                   # Nginx 配置
│   └── blog.service                 # Systemd 服务文件
│
└── zhuye/                           # 个人主页
    ├── api/
    │   ├── server.js                # 个人主页后端（服务器监控、博客代理）
    │   └── package.json
    ├── static/
    │   ├── index.html               # 个人主页
    │   ├── script.js                # 前端逻辑（时钟、日历、天气等）
    │   └── style.css                # 样式
    └── .env.example                 # 环境变量示例
```

## 🔧 配置说明

将 `blog/api/.env.example` 复制为 `.env` 并修改：

```ini
# 服务器端口
PORT=3000

# 禁用 Express 静态文件服务（使用 Nginx 时设为 true）
DISABLE_STATIC=true

# Session 密钥（使用 openssl rand -hex 32 生成）
SESSION_SECRET=your-random-secret-here

# 管理员密码（仅在首次运行时使用，留空则自动生成）
# ADMIN_PASSWORD=
# SUPERADMIN_PASSWORD=

# 设为 production 启用 HTTPS-only Cookie
NODE_ENV=production
```

## 📡 API 接口

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| `GET` | `/api/articles` | 无需 | 获取所有文章 |
| `GET` | `/api/public/articles` | 无需 | 获取最新 5 篇文章 |
| `GET` | `/api/articles/:id` | 无需 | 获取单篇文章（加 `?html=true` 返回 HTML） |
| `POST` | `/api/articles` | Token | 创建文章 |
| `PUT` | `/api/articles/:id` | Token | 更新文章 |
| `DELETE` | `/api/articles/:id` | Token | 删除文章 |
| `POST` | `/api/login` | 无需 | 登录 |
| `POST` | `/api/logout` | Session | 登出 |
| `GET` | `/api/session` | 无需 | 当前会话信息 |
| `POST` | `/api/change-password` | Token | 修改密码 |
| `GET` | `/api/token` | Token | 获取 API Token 状态 |
| `POST` | `/api/token/reset` | Token | 重置 Token |
| `DELETE` | `/api/token` | Token | 删除 Token |

完整 API 文档：[API_DOCUMENTATION.md](blog/api/API_DOCUMENTATION.md)

## 🖥️ 生产环境部署

详细步骤见 [deploy-linux.sh](blog/deploy-linux.sh) 或按以下步骤操作：

### 1. 服务器准备

```bash
# Ubuntu/Debian
sudo apt update && sudo apt install -y nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. 部署代码

```bash
sudo mkdir -p /var/www
cd /var/www
git clone https://github.com/Xiaji-yu/lightblog.git blog
cd blog/blog/api
npm install --production
cp .env.example .env
# 编辑 .env 配置
nano .env
```

### 3. 配置 Nginx

```bash
sudo cp ../../nginx.conf /etc/nginx/sites-available/blog
sudo ln -s /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 4. 启动服务

```bash
sudo cp ../../blog.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now blog
sudo systemctl status blog
```

### 5. 启用 HTTPS

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 🔐 认证方式

LightBlog 使用双重认证机制：

- **Session 认证** — 浏览器端访问管理后台
- **Token 认证** — API / 程序化访问（请求头 `Authorization: Bearer <token>`）

Token 使用示例：

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/articles
```

## 📝 写作格式

文章为 Markdown 文件，使用 YAML Front Matter：

```markdown
---
title: 我的第一篇文章
date: 2026-06-20
category: 技术
cover: article1.jpg
excerpt: 这篇文章的简短描述。
---

# 我的第一篇文章

正文内容使用 **Markdown** 语法...
```

## 🧹 维护

```bash
# 清理 7 天前的日志
./cleanup-logs.sh

# 备份数据
tar -czf backup-$(date +%Y%m%d).tar.gz blog/api/app-data/

# 更新依赖
cd blog/api && npm update
```

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Node.js + Express 4 |
| Markdown | marked 9 |
| 认证 | express-session + bcryptjs |
| HTML 清洗 | DOMPurify + jsdom |
| 前端 | 原生 HTML/CSS/JavaScript |
| 部署 | Nginx + Systemd |

## 📄 开源协议

MIT — 详见 [LICENSE](LICENSE) 文件
